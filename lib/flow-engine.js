/**
 * Motor de ejecución de flows de automatización.
 *
 * Estado por contacto (campos en EapiContacto):
 *   flujoActual  → ID del Flow activo en DB  (null = sin flow)
 *   flujoPaso    → ID del nodo actual         (o "nodeId:esperando" cuando aguarda respuesta)
 */

import { prisma } from "@/lib/prisma"
import { procesarConAgente } from "@/lib/ai-agent"

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Primer edge de salida de un nodo, opcionalmente filtrado por handle */
function edgeSalida(edges, sourceId, handleId) {
  if (handleId) {
    return edges.find((e) => e.source === sourceId && e.sourceHandle === handleId)?.target ?? null
  }
  // Edge genérico: sin handle o con handle "handle-siguiente"
  return (
    edges.find((e) => e.source === sourceId && (!e.sourceHandle || e.sourceHandle === "handle-siguiente"))
      ?.target ?? null
  )
}

/** Persistir estado del contacto */
async function setEstado(telefono, flujoId, nodoId) {
  await prisma.eapiContacto.update({
    where:  { telefono },
    data:   { flujoActual: flujoId ?? null, flujoPaso: nodoId ?? null },
  })
}

/** Guardar el valor de la respuesta en un campo personalizado */
async function guardarCampo(telefono, campoNombre, valor) {
  if (!campoNombre || !valor) return
  const campo = await prisma.flowCampo.findUnique({ where: { nombre: campoNombre } }).catch(() => null)
  if (!campo) return
  await prisma.flowContactoData.upsert({
    where:  { contactoTel_campoId: { contactoTel: telefono, campoId: campo.id } },
    update: { valor, updatedAt: new Date() },
    create: { contactoTel: telefono, campoId: campo.id, valor, updatedAt: new Date() },
  }).catch((e) => console.error("[flow-engine] error guardando campo:", e))
}

// ── Trigger matching ──────────────────────────────────────────────────────────

/**
 * Busca el primer Flow activo cuyo nodo INICIO tenga un trigger que coincida
 * con el mensaje recibido. Retorna el Flow o null.
 */
async function encontrarFlow(texto, esNuevo) {
  const flows = await prisma.flow.findMany({ where: { activo: true } })
  console.log(`[flow-engine] flows activos: ${flows.length}`, flows.map(f => f.nombre))

  for (const flow of flows) {
    const nodos = flow.nodos
    if (!nodos || typeof nodos !== "object") continue
    const nodes = nodos.nodes ?? []
    const inicio = nodes.find((n) => n.data?.tipo === "inicio")
    if (!inicio) { console.log(`[flow-engine] flow "${flow.nombre}" sin nodo INICIO`); continue }
    console.log(`[flow-engine] flow "${flow.nombre}" triggers:`, inicio.data?.triggers)

    for (const trigger of inicio.data?.triggers ?? []) {
      if (trigger.canal === "flujo") continue // se activa solo desde subflow, no directo

      // Primer mensaje del contacto
      if (trigger.evento === "primer_mensaje" && esNuevo) return flow

      // Cualquier mensaje entrante
      if (["mensaje_entrante", "dm", "chat_iniciado", "email_recibido"].includes(trigger.evento)) return flow

      // Keyword
      if (trigger.evento === "keyword") {
        const kws = (trigger.keywords ?? "")
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean)
        if (kws.some((k) => texto.toLowerCase().includes(k))) return flow
      }
    }
  }
  return null
}

// ── Ejecutar nodos ────────────────────────────────────────────────────────────

/**
 * Ejecuta el flow desde el nodoId dado.
 * Retorna true si el flow tomó el control del mensaje, false si no.
 */
async function ejecutarDesdeNodo({ flow, nodoId, texto, telefono, conv, enviar, enviarLista, esRespuesta }) {
  const { nodes, edges } = flow.nodos ?? {}
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return false

  let currentId = nodoId
  let iteraciones = 0

  while (currentId && iteraciones < 30) {
    iteraciones++
    const nodo = nodes.find((n) => n.id === currentId)
    if (!nodo) { console.log(`[flow-engine] nodo ${currentId} no encontrado → fin`); await setEstado(telefono, null, null); return true }

    const tipo = nodo.data?.tipo
    console.log(`[flow-engine] ejecutando nodo tipo=${tipo} id=${currentId}`)

    // ── INICIO ──────────────────────────────────────────────────────────────
    if (tipo === "inicio") {
      currentId = edgeSalida(edges, currentId)
      continue
    }

    // ── MENSAJE ─────────────────────────────────────────────────────────────
    if (tipo === "mensaje") {
      // Armar texto del mensaje
      let msg = (nodo.data.contenido ?? "").trim()

      // Anexar botones como opciones numeradas si hay
      const botones = nodo.data.botones ?? []
      if (botones.length > 0) {
        const lista = botones.map((b, i) => `${i + 1}. ${b.texto || `Opción ${i + 1}`}`).join("\n")
        msg = msg ? `${msg}\n\n${lista}` : lista
      }

      if (msg) await enviar(msg)

      // El nodo siempre aguarda respuesta del contacto → pausar
      await setEstado(telefono, flow.id, `${currentId}:esperando`)
      return true
    }

    // ── CONDICION ───────────────────────────────────────────────────────────
    if (tipo === "condicion") {
      const kws = (nodo.data.keywords ?? "")
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
      const coincide = kws.length > 0 && kws.some((k) => texto.toLowerCase().includes(k))
      const ramas = nodo.data.botones ?? []

      if (coincide && ramas.length > 0) {
        // Seguir la primer rama configurada
        currentId = edgeSalida(edges, currentId, ramas[0].id)
      } else {
        // Camino por defecto
        currentId = edgeSalida(edges, currentId)
      }
      continue
    }

    // ── DELAY ────────────────────────────────────────────────────────────────
    if (tipo === "delay") {
      // No podemos hacer delay real en webhook síncrono; continúa inmediatamente
      currentId = edgeSalida(edges, currentId)
      continue
    }

    // ── ESPERA ────────────────────────────────────────────────────────────────
    if (tipo === "espera") {
      // Guardar timestamp de inicio de espera y pausar el flow
      await prisma.eapiContacto.update({
        where: { telefono },
        data:  { timeoutEsperaAt: new Date() },
      })
      await setEstado(telefono, flow.id, `${currentId}:esperando_timeout`)
      return true
    }

    // ── ACCION ───────────────────────────────────────────────────────────────
    if (tipo === "accion") {
      const accion = nodo.data.accion

      if (accion === "notificar_agente") {
        await prisma.eapiContacto.update({
          where: { telefono },
          data:  { modoBot: false },
        })
        await enviar("Te estoy comunicando con un agente humano. Pronto te van a atender. 🙏")
      }

      if (accion === "guardar_campo" && nodo.data.campoNombre) {
        await guardarCampo(telefono, nodo.data.campoNombre, texto)
      }

      if (accion === "crear_reclamo") {
        // Crear reclamo básico con los datos del contacto
        const datosExtra = await prisma.flowContactoData.findMany({
          where:   { contactoTel: telefono },
          include: { campo: true },
        })
        const vals = Object.fromEntries(datosExtra.map((d) => [d.campo.nombre, d.valor]))
        await prisma.reclamo.create({
          data: {
            descripcion: vals.descripcion ?? vals.mensaje ?? texto ?? "(sin descripción)",
            direccion:   vals.direccion ?? null,
            estado:      "pendiente",
            origen:      "whatsapp",
          },
        }).catch(() => {}) // no falla el flow si falla el reclamo
        await enviar("✅ Tu reclamo fue registrado. Te notificaremos cuando haya novedades.")
      }

      if (accion === "crear_turno") {
        await enviar("✅ Tu solicitud de turno fue recibida. Pronto te confirmaremos la fecha y hora.")
      }

      currentId = edgeSalida(edges, currentId)
      continue
    }

    // ── IA ────────────────────────────────────────────────────────────────────
    if (tipo === "ia") {
      const config = await prisma.flowConfig.findFirst({ where: { activo: true } }).catch(() => null)
      if (config && nodo.data.pregunta) {
        try {
          const respuestaIA = await llamarIA(config, nodo.data.pregunta, texto)
          if (respuestaIA) {
            await enviar(respuestaIA)
            if (nodo.data.campoRespuesta) await guardarCampo(telefono, nodo.data.campoRespuesta, respuestaIA)
          }
        } catch (e) {
          console.error("[flow-engine] error IA:", e)
          await enviar("No pude procesar tu consulta en este momento. 😕")
        }
      }
      currentId = edgeSalida(edges, currentId)
      continue
    }

    // ── AGENTE IA ─────────────────────────────────────────────────────────────
    if (tipo === "agente") {
      const { accion } = await procesarConAgente(nodo.data, { telefono, texto, conv, enviar })

      if (accion === "siguiente") {
        currentId = edgeSalida(edges, currentId)
        continue
      }

      // "stay" o "transferir": pausar el flow en este nodo
      await setEstado(telefono, flow.id, `${currentId}:agente_activo`)
      return true
    }

    // ── MEMORIA ───────────────────────────────────────────────────────────────
    if (tipo === "memoria") {
      const { memOp, memKey, storageType } = nodo.data ?? {}
      if (memOp === "escribir" && memKey) {
        await guardarCampo(telefono, memKey, texto)
      }
      // leer / limpiar: implementar según necesidad futura
      currentId = edgeSalida(edges, currentId)
      continue
    }

    // ── SUBFLOW ───────────────────────────────────────────────────────────────
    if (tipo === "subflow") {
      const destinoId = nodo.data.flujoId
      if (destinoId) {
        const destino = await prisma.flow.findUnique({ where: { id: destinoId } }).catch(() => null)
        if (destino?.activo) {
          const destinoNodes = destino.nodos?.nodes ?? []
          const destinoInicio = destinoNodes.find((n) => n.data?.tipo === "inicio")
          if (destinoInicio) {
            return await ejecutarDesdeNodo({
              flow: destino, nodoId: destinoInicio.id,
              texto, telefono, conv, enviar, enviarLista, esRespuesta: false,
            })
          }
        }
      }
      // Si el subflow falló, continuar en el flow actual
      currentId = edgeSalida(edges, currentId)
      continue
    }

    // ── BOTÓN (lista WhatsApp interactiva) ────────────────────────────────────
    if (tipo === "boton") {
      const titulo  = (nodo.data.contenido ?? "Seleccioná una opción").trim() || "Seleccioná una opción"
      const botones = nodo.data.botones ?? []
      if (botones.length > 0 && typeof enviarLista === "function") {
        await enviarLista(titulo, botones, conv.id)
      } else if (botones.length > 0) {
        // Fallback texto plano si enviarLista no está disponible
        const lista = botones.map((b, i) => `${i + 1}. ${b.texto || `Opción ${i + 1}`}`).join("\n")
        await enviar(`${titulo}\n\n${lista}`)
      }
      await setEstado(telefono, flow.id, `${currentId}:esperando`)
      return true
    }

    // ── FIN ───────────────────────────────────────────────────────────────────
    if (tipo === "fin") {
      await setEstado(telefono, null, null)
      return true
    }

    // Nodo desconocido: avanzar
    currentId = edgeSalida(edges, currentId)
  }

  // Flow completado sin nodo FIN explícito
  await setEstado(telefono, null, null)
  return true
}

// ── Entry point ───────────────────────────────────────────────────────────────

/**
 * Punto de entrada desde el webhook.
 * Retorna true si el engine manejó el mensaje, false para usar el flujo hardcodeado.
 */
export async function procesarMensaje({ telefono, texto, contacto, conv, enviar, enviarLista, esNuevo }) {
  const { flujoActual, flujoPaso } = contacto
  console.log(`[flow-engine] procesarMensaje tel=${telefono} esNuevo=${esNuevo} flujoActual=${flujoActual} flujoPaso=${flujoPaso} texto="${texto}"`)

  // ── Caso 1: contacto esperando respuesta a un nodo mensaje ────────────────
  if (flujoActual && flujoPaso?.endsWith(":esperando")) {
    const nodoEsperaId = flujoPaso.replace(":esperando", "")
    const flow = await prisma.flow.findUnique({ where: { id: flujoActual } }).catch(() => null)
    if (!flow?.activo) {
      await setEstado(telefono, null, null)
      return false
    }

    const nodes = flow.nodos?.nodes ?? []
    const edges = flow.nodos?.edges ?? []
    const nodoEspera = nodes.find((n) => n.id === nodoEsperaId)
    const nodoEsperaTipo = nodoEspera?.data?.tipo

    // ── Nodo BOTÓN: enrutar por el ID del botón seleccionado ─────────────────
    if (nodoEsperaTipo === "boton") {
      const botones = nodoEspera?.data?.botones ?? []

      // Evolution API devuelve el rowId numérico ("1", "2"...) → convertir al id real del botón
      let targetHandle = texto
      const idx = parseInt(texto, 10)
      if (!isNaN(idx) && idx >= 1 && idx <= botones.length) {
        targetHandle = botones[idx - 1].id
      }

      const matchedEdge = edges.find(
        (e) => e.source === nodoEsperaId && e.sourceHandle === targetHandle,
      )
      const siguienteId = matchedEdge?.target
        ?? edges.find((e) => e.source === nodoEsperaId && e.sourceHandle === "handle-sin-resp")?.target
        ?? null
      if (!siguienteId) { await setEstado(telefono, null, null); return true }
      return await ejecutarDesdeNodo({ flow, nodoId: siguienteId, texto, telefono, conv, enviar, enviarLista, esRespuesta: true })
    }

    // ── Nodo MENSAJE: guardar campo y seguir por handle-respuesta ─────────────
    if (nodoEspera?.data?.respuestaCampo) {
      await guardarCampo(telefono, nodoEspera.data.respuestaCampo, texto)
    }

    const siguienteId = edges.find(
      (e) => e.source === nodoEsperaId && e.sourceHandle === "handle-respuesta",
    )?.target ?? null

    if (!siguienteId) {
      const altId = edges.find(
        (e) => e.source === nodoEsperaId && e.sourceHandle === "handle-siguiente",
      )?.target ?? null
      if (!altId) { await setEstado(telefono, null, null); return true }
      return await ejecutarDesdeNodo({ flow, nodoId: altId, texto, telefono, conv, enviar, enviarLista, esRespuesta: true })
    }

    return await ejecutarDesdeNodo({ flow, nodoId: siguienteId, texto, telefono, conv, enviar, enviarLista, esRespuesta: true })
  }

  // ── Caso 2: contacto en nodo ESPERA aguardando timeout ───────────────────
  if (flujoActual && flujoPaso?.endsWith(":esperando_timeout")) {
    const nodoEsperaId = flujoPaso.replace(":esperando_timeout", "")
    const flow = await prisma.flow.findUnique({ where: { id: flujoActual } }).catch(() => null)
    if (!flow?.activo) { await setEstado(telefono, null, null); return false }

    // El contacto respondió antes del timeout — limpiar timer y seguir por "Respondió"
    await prisma.eapiContacto.update({ where: { telefono }, data: { timeoutEsperaAt: null } })

    const edges = flow.nodos?.edges ?? []
    const siguienteId = edges.find((e) => e.source === nodoEsperaId && e.sourceHandle === "handle-respondio")?.target ?? null
    if (!siguienteId) { await setEstado(telefono, null, null); return true }
    return await ejecutarDesdeNodo({ flow, nodoId: siguienteId, texto, telefono, conv, enviar, enviarLista, esRespuesta: true })
  }

  // ── Caso 3: agente IA activo en un nodo ──────────────────────────────────
  if (flujoActual && flujoPaso?.endsWith(":agente_activo")) {
    const nodoId = flujoPaso.replace(":agente_activo", "")
    const flow = await prisma.flow.findUnique({ where: { id: flujoActual } }).catch(() => null)
    if (!flow?.activo) { await setEstado(telefono, null, null); return false }

    const nodes = flow.nodos?.nodes ?? []
    const edges = flow.nodos?.edges ?? []
    const nodo  = nodes.find((n) => n.id === nodoId)
    if (!nodo) { await setEstado(telefono, null, null); return false }

    const { accion } = await procesarConAgente(nodo.data, { telefono, texto, conv, enviar })

    if (accion === "siguiente") {
      const siguienteId = edgeSalida(edges, nodoId)
      if (!siguienteId) { await setEstado(telefono, null, null); return true }
      return await ejecutarDesdeNodo({ flow, nodoId: siguienteId, texto, telefono, conv, enviar, enviarLista, esRespuesta: true })
    }

    // "stay" o "transferir": no avanzar en el flow
    return true
  }

  // ── Caso 4: contacto en flow pero sin estar esperando (raro) ─────────────
  if (flujoActual && flujoPaso && !flujoPaso.includes(":")) {
    const flow = await prisma.flow.findUnique({ where: { id: flujoActual } }).catch(() => null)
    if (flow?.activo) {
      return await ejecutarDesdeNodo({ flow, nodoId: flujoPaso, texto, telefono, conv, enviar, enviarLista, esRespuesta: false })
    }
    await setEstado(telefono, null, null)
  }

  // ── Caso 3: sin flow activo → buscar por trigger ───────────────────────────
  const flow = await encontrarFlow(texto, esNuevo)
  if (!flow) return false // ningún flow coincide → usar lógica hardcodeada

  const nodes = flow.nodos?.nodes ?? []
  const inicio = nodes.find((n) => n.data?.tipo === "inicio")
  if (!inicio) return false

  return await ejecutarDesdeNodo({ flow, nodoId: inicio.id, texto, telefono, conv, enviar, enviarLista, esRespuesta: false })
}

// ── Punto de entrada para el cron de timeout ─────────────────────────────────

/**
 * Ejecuta la rama "handle-timeout" de un nodo ESPERA vencido.
 * Llamado exclusivamente desde el cron de inactividad.
 */
export async function procesarTimeoutVencido({ contacto, flow, nodoId, conv, enviar, enviarLista }) {
  const edges = flow.nodos?.edges ?? []
  const siguienteId = edges.find((e) => e.source === nodoId && e.sourceHandle === "handle-timeout")?.target ?? null

  await prisma.eapiContacto.update({ where: { telefono: contacto.telefono }, data: { timeoutEsperaAt: null } })

  if (!siguienteId) {
    await setEstado(contacto.telefono, null, null)
    return
  }
  await ejecutarDesdeNodo({
    flow, nodoId: siguienteId, texto: "", telefono: contacto.telefono,
    conv, enviar, enviarLista, esRespuesta: false,
  })
}

// ── Llamada a IA (Anthropic / OpenAI) ────────────────────────────────────────

async function llamarIA(config, sistemaPrompt, mensajeUsuario) {
  if (config.proveedor === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "x-api-key":         config.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model:      config.modelo ?? "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system:     sistemaPrompt,
        messages:   [{ role: "user", content: mensajeUsuario }],
      }),
    })
    const json = await res.json()
    return json.content?.[0]?.text ?? null
  }

  if (config.proveedor === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method:  "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model:    config.modelo ?? "gpt-4o-mini",
        messages: [
          { role: "system",  content: sistemaPrompt },
          { role: "user",    content: mensajeUsuario },
        ],
        max_tokens: 512,
      }),
    })
    const json = await res.json()
    return json.choices?.[0]?.message?.content ?? null
  }

  return null
}
