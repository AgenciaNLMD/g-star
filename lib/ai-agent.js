/**
 * Motor de agentes IA para WhatsApp.
 *
 * Flujo:
 *   1. Si el contacto tiene areaActiva → continúa con ese agente de área
 *   2. Si no → el orquestador detecta intención y deriva al área correcta
 *   3. El agente de área conversa, recopila datos y ejecuta herramientas
 *   4. Cualquier agente puede registrar consultas sin cobertura
 */

import { prisma } from "@/lib/prisma"

// ── Herramientas del orquestador ──────────────────────────────────────────────

const TOOLS_ORQUESTADOR = [
  {
    name: "derivar_a_area",
    description: "Deriva al vecino al agente especializado en el área que necesita",
    input_schema: {
      type: "object",
      properties: {
        areaId:  { type: "string", description: "ID del agente/área a activar" },
        mensaje: { type: "string", description: "Mensaje de bienvenida al área para el vecino" },
      },
      required: ["areaId", "mensaje"],
    },
  },
  {
    name: "responder",
    description: "Responde directamente al vecino cuando la consulta es general o no requiere derivación a un área específica",
    input_schema: {
      type: "object",
      properties: { mensaje: { type: "string" } },
      required: ["mensaje"],
    },
  },
  {
    name: "sin_cobertura",
    description: "Usá esta herramienta cuando el vecino pregunta algo para lo que el municipio no tiene información ni agente disponible. NO inventes respuestas. Registra la consulta para que el equipo municipal sepa qué temas agregar, y respondé al vecino que no tenés información sobre ese tema.",
    input_schema: {
      type: "object",
      properties: {
        pregunta:      { type: "string", description: "La pregunta o tema exacto del vecino" },
        areaDetectada: { type: "string", description: "Categoría o área aproximada del tema (ej: tasas, obras, transporte)" },
        mensaje:       { type: "string", description: "Mensaje para el vecino explicando que no hay cobertura y cómo puede contactar al municipio" },
      },
      required: ["pregunta", "mensaje"],
    },
  },
]

// ── Geocodificación (Nominatim / OpenStreetMap) ───────────────────────────────

async function geocodificarDireccion(direccion) {
  try {
    const q   = encodeURIComponent(`${direccion}, Buenos Aires, Argentina`)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ar`,
      { headers: { "User-Agent": "g-start-municipal/1.0 (municipio@gstart.com.ar)" } }
    )
    const data = await res.json()
    if (!data[0]) return { lat: null, lng: null }
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch (e) {
    console.error("[ai-agent] geocoding error:", e.message)
    return { lat: null, lng: null }
  }
}

// ── Herramientas de agentes de área ──────────────────────────────────────────

const TOOLS_AREA = [
  {
    name: "obtener_categorias",
    description: "Devuelve la lista de categorías de reclamos disponibles. Llamá a esta herramienta ANTES de crear_reclamo para elegir el slug correcto según el problema del vecino.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "solicitar_turno",
    description: "Registra una solicitud de turno. Antes de llamar necesitás TODOS estos datos: nombre completo, DNI, trámite a realizar y sucursal. El teléfono se toma automáticamente. Si falta algún dato, preguntalo primero. Podés pedirlos todos juntos o de a uno según la conversación.",
    input_schema: {
      type: "object",
      properties: {
        nombre:          { type: "string", description: "Nombre completo del vecino" },
        dni:             { type: "string", description: "Número de DNI" },
        tramite:         { type: "string", description: "Tipo de trámite que quiere realizar" },
        sucursal:        { type: "string", description: "Sucursal o sede donde quiere el turno" },
        fechaSolicitada: { type: "string", description: "Fecha preferida en formato YYYY-MM-DD. Null si no especificó." },
        area:            { type: "string", description: "Área del servicio (ANSES, PAMI, RENAPER, etc.)" },
      },
      required: ["nombre", "dni", "tramite", "sucursal"],
    },
  },
  {
    name: "crear_reclamo",
    description: "Registra un reclamo vecinal en el sistema. Antes de llamar necesitás: asunto, descripción completa, dirección y categoriaSlug (obtenido con obtener_categorias). El sistema geocodifica la dirección automáticamente.",
    input_schema: {
      type: "object",
      properties: {
        asunto:         { type: "string", description: "Título breve del problema (máx 100 chars)" },
        descripcion:    { type: "string", description: "Descripción completa del problema tal como lo contó el vecino" },
        direccion:      { type: "string", description: "Dirección o lugar exacto donde ocurre el problema" },
        categoriaSlug:  { type: "string", description: "Slug de la categoría elegida con obtener_categorias (ej: 'alumbrado', 'cloaca', 'vialidad')" },
        contactoNombre: { type: "string", description: "Nombre del vecino si lo proporcionó" },
      },
      required: ["asunto", "descripcion", "direccion"],
    },
  },
  {
    name: "transferir_a_area",
    description: "Transfiere al vecino a otro agente de área cuando quiere consultar sobre un tema diferente al actual",
    input_schema: {
      type: "object",
      properties: {
        areaId:  { type: "string", description: "ID del agente/área de destino" },
        mensaje: { type: "string", description: "Mensaje de transición para el vecino" },
      },
      required: ["areaId", "mensaje"],
    },
  },
  {
    name: "transferir_a_humano",
    description: "Transfiere la conversación a un agente humano del municipio cuando el vecino lo pide o la situación lo requiere",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "sin_cobertura",
    description: "Usá esta herramienta cuando el vecino pregunta algo fuera del alcance de este agente y no hay otro agente que lo cubra. NO inventes. Registra la consulta para el equipo municipal.",
    input_schema: {
      type: "object",
      properties: {
        pregunta:      { type: "string", description: "La pregunta o tema exacto del vecino" },
        areaDetectada: { type: "string", description: "Categoría o área aproximada del tema" },
        mensaje:       { type: "string", description: "Mensaje al vecino explicando que no hay cobertura" },
      },
      required: ["pregunta", "mensaje"],
    },
  },
  {
    name: "fin_conversacion",
    description: "Cierra la conversación actual cuando el vecino se despidió o el tema quedó resuelto",
    input_schema: {
      type: "object",
      properties: {
        mensaje: { type: "string", description: "Mensaje de cierre (opcional)" },
      },
    },
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildMessages(historial, imagenBase64) {
  const raw = historial.map((m) => ({
    role: m.direccion === "entrante" ? "user" : "assistant",
    text: m.texto,
  }))

  const merged = []
  for (const m of raw) {
    const last = merged[merged.length - 1]
    if (last && last.role === m.role) {
      last.text += "\n" + m.text
    } else {
      merged.push({ ...m })
    }
  }

  while (merged.length > 0 && merged[0].role !== "user") merged.shift()
  if (merged.length === 0) return null

  return merged.map((m, i) => {
    const esUltimoUser = m.role === "user" && i === merged.length - 1
    if (esUltimoUser && imagenBase64) {
      return {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imagenBase64 } },
          { type: "text", text: m.text },
        ],
      }
    }
    return { role: m.role, content: m.text }
  })
}

async function llamarLLM({ proveedor, apiKey, modelo, systemPrompt, messages, tools }) {
  if (proveedor === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method:  "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model:       modelo ?? "gpt-4o-mini",
        messages:    [{ role: "system", content: systemPrompt }, ...messages],
        tools:       tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } })),
        tool_choice: "auto",
        max_tokens:  1024,
      }),
    })
    const json = await res.json()
    const choice = json.choices?.[0]
    if (!choice) return { stop_reason: "error", content: [] }
    if (choice.finish_reason === "tool_calls") {
      return {
        stop_reason: "tool_use",
        content: (choice.message?.tool_calls ?? []).map((tc) => ({
          type: "tool_use", id: tc.id, name: tc.function.name,
          input: JSON.parse(tc.function.arguments ?? "{}"),
        })),
      }
    }
    return { stop_reason: "end_turn", content: [{ type: "text", text: choice.message?.content ?? "" }] }
  }

  // Anthropic (default)
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: {
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json",
    },
    body: JSON.stringify({
      model:      modelo ?? "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system:     systemPrompt,
      tools,
      messages,
    }),
  })
  const json = await res.json()
  if (!res.ok) console.error("[ai-agent] API error:", JSON.stringify(json))
  return json
}

// ── Acción compartida: registrar sin cobertura ────────────────────────────────

async function accionSinCobertura({ telefono, pregunta, areaDetectada, mensaje, enviar }) {
  await prisma.consultaSinCobertura.create({
    data: {
      telefono,
      pregunta,
      areaDetectada: areaDetectada ?? null,
      respondidoCon: mensaje,
    },
  }).catch((e) => console.error("[ai-agent] error sin_cobertura:", e))

  if (mensaje) await enviar(mensaje)
}

// ── Acciones de herramientas de área ─────────────────────────────────────────

async function accionSolicitarTurno({ telefono, nombre, dni, tramite, area, sucursal, fechaSolicitada, enviar }) {
  // Buscar entidad por nombre exacto primero, luego por contains, luego la primera activa
  const entidad = await prisma.entidad
    .findFirst({ where: { activo: true, nombre: area ?? undefined } })
    .catch(() => null)
    ?? await prisma.entidad
    .findFirst({ where: { activo: true, nombre: { contains: area ?? "" } } })
    .catch(() => null)
    ?? await prisma.entidad.findFirst({ where: { activo: true } }).catch(() => null)

  if (!entidad) {
    await enviar("✅ Tu solicitud fue recibida. El municipio te va a contactar para confirmar fecha y hora.")
    return
  }

  let fechaParsed = null
  if (fechaSolicitada) {
    try { fechaParsed = new Date(fechaSolicitada) } catch {}
  }

  await prisma.turno.create({
    data: {
      entidadId:       entidad.id,
      nombre:          nombre ?? "Sin nombre",
      dni:             dni ?? "",
      telefono,
      tramite:         tramite ?? "Trámite general",
      sucursal:        sucursal ?? "",
      estado:          "pedido",
      fechaSolicitada: fechaParsed,
    },
  }).catch((e) => console.error("[ai-agent] error turno:", e))

  await enviar(
    `✅ Solicitud de turno registrada.\n\n` +
    `🏢 Organismo: ${entidad.nombre}\n` +
    `📍 Sucursal: ${sucursal}\n` +
    `📋 Trámite: ${tramite}\n` +
    `👤 Nombre: ${nombre}\n` +
    `🪪 DNI: ${dni}\n` +
    (fechaParsed ? `📅 Fecha preferida: ${fechaParsed.toLocaleDateString("es-AR")}\n` : "") +
    `\nUn agente del municipio te va a confirmar la fecha y hora por este medio. 🙏`
  )
}

async function accionCrearReclamo({ telefono, asunto, descripcion, direccion, categoriaSlug, contactoNombre, enviar }) {
  // Geocodificar dirección
  const { lat, lng } = direccion ? await geocodificarDireccion(direccion) : { lat: null, lng: null }

  // Resolver categoría desde la DB
  let categoriaId = null
  let categoriaNombre = "General"
  if (categoriaSlug) {
    const cat = await prisma.categoriaReclamo
      .findUnique({ where: { slug: categoriaSlug } })
      .catch(() => null)
    if (cat) { categoriaId = cat.id; categoriaNombre = cat.nombre }
  }

  // Número correlativo año-secuencia
  const count  = await prisma.reclamo.count().catch(() => 0)
  const numero = `${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`

  // Obtener nombre del contacto si no viene del agente
  const nombreContacto = contactoNombre?.trim() || ""

  await prisma.reclamo.create({
    data: {
      numero,
      asunto:           (asunto ?? "Reclamo vecinal").slice(0, 200),
      texto:            descripcion ?? "",
      estado:           "pendiente",
      categoriaId,
      direccion:        direccion ?? "",
      lat,
      lng,
      contactoNombre:   nombreContacto,
      contactoTelefono: telefono,
    },
  }).catch((e) => console.error("[ai-agent] error reclamo:", e))

  const georef = lat && lng ? `📌 Geolocalizado en el mapa\n` : ""

  await enviar(
    `✅ Reclamo registrado con el número *${numero}*.\n\n` +
    `📋 ${categoriaNombre}\n` +
    `📍 ${direccion ?? "Sin dirección"}\n` +
    `📝 ${asunto}\n` +
    georef +
    `\nEl área correspondiente lo va a tomar a la brevedad. 🙏`
  )
}

// ── Agente de área ────────────────────────────────────────────────────────────

async function ejecutarAgente({ agente, agentesArea, apiKey, modelo, proveedor, historial, imagenBase64, telefono, conv, enviar, contextoMunicipal }) {
  const messages = buildMessages(historial, imagenBase64)
  if (!messages) return false

  let systemPrompt = contextoMunicipal ? `${contextoMunicipal}\n\n---\n\n` : ""
  systemPrompt += agente.sistemaPrompt
  if (agente.conocimiento) {
    systemPrompt += `\n\n## Información del área\n${agente.conocimiento}`
  }

  // Indicar al agente qué otras áreas existen para poder derivar
  if (agentesArea?.length > 1) {
    const otrasAreas = agentesArea
      .filter((a) => a.id !== agente.id)
      .map((a) => `- ID: ${a.id} | Área: ${a.nombre}${a.keywords ? ` | Keywords: ${a.keywords}` : ""}`)
      .join("\n")
    if (otrasAreas) {
      systemPrompt += `\n\n## Otras áreas disponibles para derivar\n${otrasAreas}`
    }
  }

  const herramientasHabilitadas = Array.isArray(agente.herramientas) && agente.herramientas.length > 0
    ? agente.herramientas
    : null
  const tools = herramientasHabilitadas
    ? TOOLS_AREA.filter((t) => herramientasHabilitadas.includes(t.name))
    : TOOLS_AREA

  let msgs       = messages
  let iteraciones = 0

  while (iteraciones < 6) {
    iteraciones++

    const data = await llamarLLM({ proveedor: proveedor ?? "anthropic", apiKey, modelo, systemPrompt, messages: msgs, tools })
    if (data.error) return false

    for (const block of data.content ?? []) {
      if (block.type === "text" && block.text?.trim()) await enviar(block.text.trim())
    }

    if (data.stop_reason === "end_turn") break

    if (data.stop_reason === "tool_use") {
      const toolResults = []

      for (const block of data.content ?? []) {
        if (block.type !== "tool_use") continue

        if (block.name === "obtener_categorias") {
          const cats = await prisma.categoriaReclamo.findMany({
            where:   { activo: true },
            select:  { slug: true, nombre: true, descripcion: true },
            orderBy: { orden: "asc" },
          }).catch(() => [])
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(cats) })
          continue

        } else if (block.name === "solicitar_turno") {
          await accionSolicitarTurno({ telefono, enviar, ...block.input })

        } else if (block.name === "crear_reclamo") {
          await accionCrearReclamo({ telefono, enviar, ...block.input })

        } else if (block.name === "transferir_a_area") {
          const destino = agentesArea?.find((a) => a.id === block.input.areaId)
          if (destino) {
            await prisma.eapiContacto.update({ where: { telefono }, data: { areaActiva: destino.id } })
            if (block.input.mensaje) await enviar(block.input.mensaje)
            // Ejecutar el agente destino en la misma vuelta
            return await ejecutarAgente({
              agente: destino, agentesArea, apiKey, modelo, proveedor,
              historial, imagenBase64, telefono, conv, enviar, contextoMunicipal,
            })
          }

        } else if (block.name === "transferir_a_humano") {
          await prisma.eapiContacto.update({
            where: { telefono },
            data:  { modoBot: false, flujoActual: null, flujoPaso: null, areaActiva: null },
          })
          await enviar("Te estoy comunicando con un agente del municipio. Pronto te van a atender. 🙏")
          return true

        } else if (block.name === "sin_cobertura") {
          await accionSinCobertura({ telefono, enviar, ...block.input })

        } else if (block.name === "fin_conversacion") {
          if (block.input?.mensaje) await enviar(block.input.mensaje)
          await prisma.eapiContacto.update({
            where: { telefono },
            data:  { areaActiva: null },
          })
          return true
        }

        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: "ok" })
      }

      if (toolResults.length === 0) break
      msgs = [
        ...msgs,
        { role: "assistant", content: data.content },
        { role: "user",      content: toolResults },
      ]
    } else {
      break
    }
  }

  return true
}

// ── Orquestador ───────────────────────────────────────────────────────────────

async function orquestar({ apiKey, modelo, proveedor, agentes, configPrompt, historial, imagenBase64, telefono, conv, enviar, contextoMunicipal, telefonoMunicipio }) {
  const messages = buildMessages(historial, imagenBase64)
  if (!messages) return false

  const areasDesc = agentes
    .map((a) => `- ID: ${a.id} | Área: ${a.nombre}${a.keywords ? ` | Keywords: ${a.keywords}` : ""}`)
    .join("\n")

  const contacto = `Teléfono del municipio para consultas sin cobertura: ${telefonoMunicipio ?? "el municipio"}`

  const base = contextoMunicipal ? `${contextoMunicipal}\n\n---\n\n` : ""
  const defaultPrompt =
    `Sos la recepcionista virtual del municipio. Entendé qué necesita el vecino y derivalo al área correcta usando 'derivar_a_area'. ` +
    `Si la consulta es general respondé con 'responder'. ` +
    `Si el vecino pregunta algo para lo que no hay agente ni información disponible, usá 'sin_cobertura': NO inventes, registrá la consulta y decile al vecino que puede ${telefonoMunicipio ? `llamar al ${telefonoMunicipio}` : "contactar al municipio directamente"}. ` +
    `Hablá en español, de forma amigable y breve.\n\nÁreas disponibles:\n${areasDesc}`

  const systemPrompt = configPrompt
    ? `${base}${configPrompt}\n\nÁreas disponibles:\n${areasDesc}\n\n${contacto}`
    : `${base}${defaultPrompt}`

  const data = await llamarLLM({
    proveedor: proveedor ?? "anthropic",
    apiKey, modelo,
    systemPrompt,
    messages,
    tools: TOOLS_ORQUESTADOR,
  })

  if (data.error) return false

  for (const block of data.content ?? []) {
    if (block.type === "text" && block.text?.trim()) await enviar(block.text.trim())
  }

  for (const block of data.content ?? []) {
    if (block.type !== "tool_use") continue

    if (block.name === "responder") {
      if (block.input?.mensaje) await enviar(block.input.mensaje)

    } else if (block.name === "sin_cobertura") {
      await accionSinCobertura({ telefono, enviar, ...block.input })

    } else if (block.name === "derivar_a_area") {
      const { areaId, mensaje } = block.input
      const agente = agentes.find((a) => a.id === areaId)

      if (!agente) {
        await enviar("No encontré el área solicitada. ¿En qué más puedo ayudarte?")
        continue
      }

      await prisma.eapiContacto.update({ where: { telefono }, data: { areaActiva: areaId } })
      if (mensaje) await enviar(mensaje)

      const creds = await getApiKey(agente.proveedor)
      if (!creds) return true

      return await ejecutarAgente({
        agente,
        agentesArea: agentes,
        apiKey:      creds.apiKey,
        modelo:      agente.modelo ?? creds.modelo,
        proveedor:   agente.proveedor,
        historial, imagenBase64, telefono, conv, enviar, contextoMunicipal,
      })
    }
  }

  return true
}

// ── Contexto municipal ────────────────────────────────────────────────────────

async function getContextoMunicipal() {
  const config = await prisma.configMunicipio.findFirst().catch(() => null)
  if (!config?.nombre) return { texto: "", telefono: null }

  const lineas = [`## Contexto del municipio`, `Municipio: ${config.nombre}`]
  if (config.localidad) lineas.push(`Localidad: ${config.localidad}${config.provincia ? `, ${config.provincia}` : ""}${config.pais ? `, ${config.pais}` : ""}`)
  if (config.intendente) lineas.push(`Intendente: ${config.intendente}`)
  if (config.cuit)       lineas.push(`CUIT: ${config.cuit}`)
  if (config.direccion)  lineas.push(`Dirección: ${config.direccion}`)
  if (config.telefono)   lineas.push(`Teléfono: ${config.telefono}`)
  if (config.email)      lineas.push(`Email: ${config.email}`)
  if (config.web)        lineas.push(`Web: ${config.web}`)
  if (config.descripcion) lineas.push(config.descripcion)

  return { texto: lineas.join("\n"), telefono: config.telefono ?? null }
}

// ── Credenciales de API ───────────────────────────────────────────────────────

async function getApiKey(proveedor) {
  const config = await prisma.flowConfig
    .findFirst({ where: { proveedor, activo: true } })
    .catch(() => null)
  if (config?.apiKey) return { apiKey: config.apiKey, modelo: config.modelo, sistemaPrompt: config.sistemaPrompt }
  const envKey = proveedor === "anthropic" ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY
  return envKey ? { apiKey: envKey, modelo: null, sistemaPrompt: null } : null
}

// ── Descarga imagen desde Evolution API ──────────────────────────────────────

export async function descargarImagen({ eapiUrl, eapiKey, instanceId, messageKey }) {
  if (!eapiUrl || !eapiKey || !instanceId) return null
  try {
    const res = await fetch(`${eapiUrl}/chat/getBase64FromMediaMessage/${instanceId}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "apikey": eapiKey },
      body: JSON.stringify({ message: { key: messageKey, messageType: "imageMessage" } }),
    })
    const json = await res.json()
    return json.base64 ?? null
  } catch (e) {
    console.error("[ai-agent] error descargando imagen:", e)
    return null
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function procesarConAgente({ telefono, texto, contacto, conv, enviar, imagenBase64 }) {
  const todosAgentes = await prisma.flowAgente.findMany({ where: { activo: true } }).catch(() => [])
  const agentesArea  = todosAgentes.filter((a) => !a.esOrquestador)
  const orq          = todosAgentes.find((a) => a.esOrquestador) ?? null

  if (todosAgentes.length === 0) return false

  const historial = await prisma.eapiMensaje.findMany({
    where:   { conversacionId: conv.id },
    orderBy: { createdAt: "asc" },
    take:    20,
  })

  const { areaActiva }    = contacto
  const { texto: contextoMunicipal, telefono: telMunicipio } = await getContextoMunicipal()

  // ── Contacto ya en un área específica ──────────────────────────────────────
  if (areaActiva) {
    const agente = agentesArea.find((a) => a.id === areaActiva)
    if (agente) {
      const creds = await getApiKey(agente.proveedor)
      if (!creds) return false
      return await ejecutarAgente({
        agente,
        agentesArea,
        apiKey:    creds.apiKey,
        modelo:    agente.modelo ?? creds.modelo,
        proveedor: agente.proveedor,
        historial, imagenBase64, telefono, conv, enviar, contextoMunicipal,
      })
    }
    // Área inválida → limpiar y pasar al orquestador
    await prisma.eapiContacto.update({ where: { telefono }, data: { areaActiva: null } })
  }

  // ── Orquestador ────────────────────────────────────────────────────────────
  const proveedorOrq = orq?.proveedor ?? agentesArea[0]?.proveedor ?? "anthropic"
  const creds        = await getApiKey(proveedorOrq)
  if (!creds) return false

  return await orquestar({
    apiKey:            creds.apiKey,
    modelo:            orq?.modelo ?? creds.modelo ?? "claude-haiku-4-5-20251001",
    proveedor:         proveedorOrq,
    agentes:           agentesArea,
    configPrompt:      orq?.sistemaPrompt ?? creds.sistemaPrompt ?? null,
    telefonoMunicipio: telMunicipio,
    historial, imagenBase64, telefono, conv, enviar, contextoMunicipal,
  })
}
