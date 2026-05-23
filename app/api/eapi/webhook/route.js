import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { procesarMensaje } from "@/lib/flow-engine"
import { procesarConAgente, descargarImagen } from "@/lib/ai-agent"

export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { event, data } = body ?? {}

  if (event !== "messages.upsert" || !data?.key || data.key.fromMe) {
    return NextResponse.json({ ok: true })
  }

  const telefono   = data.key.remoteJid?.replace("@s.whatsapp.net", "")
  const texto      = data.message?.conversation
                  ?? data.message?.extendedTextMessage?.text
                  ?? data.message?.listResponseMessage?.singleSelectReply?.selectedRowId
                  ?? data.message?.buttonsResponseMessage?.selectedButtonId
                  ?? data.message?.imageMessage?.caption
                  ?? ""
  const instanceId  = data.instance ?? process.env.EVOLUTION_INSTANCE ?? ""
  const nombre      = data.pushName ?? null
  const tieneImagen = !!data.message?.imageMessage

  if (!telefono || (!texto && !tieneImagen)) return NextResponse.json({ ok: true })

  console.log(`[eapi webhook] ${telefono} (${nombre}): "${texto}"`)

  // Buscar o crear contacto (fuente de verdad del estado)
  let contacto = await prisma.eapiContacto.findUnique({
    where: { telefono },
  })

  const esNuevo = !contacto

  if (!contacto) {
    contacto = await prisma.eapiContacto.create({
      data: { telefono, nombre },
    })
  } else if (nombre && !contacto.nombre) {
    await prisma.eapiContacto.update({
      where: { telefono },
      data: { nombre },
    })
  }

  // Registrar timestamp del mensaje y resetear recordatorio de inactividad
  await prisma.eapiContacto.update({
    where: { telefono },
    data:  { ultimoMensajeAt: new Date(), recordatorioAt: null },
  }).catch(() => {})

  // Buscar o crear conversación para historial
  let conv = await prisma.eapiConversacion.findUnique({
    where: { contactoTel: telefono },
  })

  if (!conv) {
    conv = await prisma.eapiConversacion.create({
      data: { contactoTel: telefono, contactoNombre: nombre, noLeidos: 1 },
    })
  } else {
    await prisma.eapiConversacion.update({
      where: { id: conv.id },
      data: { noLeidos: { increment: 1 }, updatedAt: new Date() },
    })
  }

  // Guardar mensaje entrante
  await prisma.eapiMensaje.create({
    data: {
      conversacionId: conv.id,
      texto,
      direccion: "entrante",
      estado: "recibido",
    },
  })

  // Función para enviar y guardar mensaje saliente
  const eapiUrl = process.env.EVOLUTION_API_URL
  const eapiKey = process.env.EVOLUTION_API_KEY

  async function enviar(msg) {
    if (eapiUrl && eapiKey && instanceId) {
      await fetch(`${eapiUrl}/message/sendText/${instanceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": eapiKey },
        body: JSON.stringify({ number: telefono, text: msg }),
      }).catch((e) => console.error("[eapi] error enviando:", e))
    }
    await prisma.eapiMensaje.create({
      data: { conversacionId: conv.id, texto: msg, direccion: "saliente", estado: "enviado" },
    })
  }

  async function enviarLista(titulo, botones) {
    console.log(`[eapi] enviarLista → botones=${botones.length}`)
    let enviado = false

    if (eapiUrl && eapiKey && instanceId) {
      if (botones.length <= 3) {
        // sendButtons: hasta 3 opciones, botones clickeables nativos
        const status = await fetch(`${eapiUrl}/message/sendButtons/${instanceId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": eapiKey },
          body: JSON.stringify({
            number:     telefono,
            title:      titulo,
            description: " ",
            footer:     " ",
            buttons: botones.map((b, i) => ({
              buttonId:   String(i + 1),
              buttonText: { displayText: b.texto || `Opción ${i + 1}` },
              type:       "reply",
            })),
            headerType: 1,
          }),
        }).then(async (r) => {
          const txt = await r.text().catch(() => "")
          console.log(`[eapi] sendButtons status=${r.status} body=${txt.slice(0, 200)}`)
          return r.status
        }).catch((e) => { console.error("[eapi] error sendButtons:", e); return 0 })

        if (status >= 200 && status < 300) enviado = true
      }

      if (!enviado) {
        // sendList: para >3 opciones o si sendButtons falló
        const status = await fetch(`${eapiUrl}/message/sendList/${instanceId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": eapiKey },
          body: JSON.stringify({
            number:      telefono,
            title:       titulo,
            description: " ",
            footerText:  " ",
            buttonText:  "Ver opciones",
            sections: [{
              title: "Opciones",
              rows:  botones.map((b, i) => ({
                title:       b.texto || `Opción ${i + 1}`,
                description: " ",
                rowId:       String(i + 1),
              })),
            }],
          }),
        }).then(async (r) => {
          const txt = await r.text().catch(() => "")
          console.log(`[eapi] sendList status=${r.status} body=${txt.slice(0, 200)}`)
          return r.status
        }).catch((e) => { console.error("[eapi] error sendList:", e); return 0 })

        if (status >= 200 && status < 300) enviado = true
      }
    }

    if (!enviado) {
      // Fallback texto plano
      console.log("[eapi] botones fallback → texto plano")
      const lista = botones.map((b, i) => `${i + 1}. ${b.texto || `Opción ${i + 1}`}`).join("\n")
      await enviar(`${titulo}\n\n${lista}`)
      return
    }

    const textoLog = titulo + "\n" + botones.map((b, i) => `${i + 1}. ${b.texto}`).join("\n")
    await prisma.eapiMensaje.create({
      data: { conversacionId: conv.id, texto: textoLog, direccion: "saliente", estado: "enviado" },
    })
  }

  async function actualizarEstado(flujoActual, flujoPaso) {
    await prisma.eapiContacto.update({
      where: { telefono },
      data: { flujoActual, flujoPaso },
    })
  }

  // Si un agente tomó control manual, no responder automáticamente
  if (!esNuevo && contacto.modoBot === false) {
    return NextResponse.json({ ok: true })
  }

  // Descargar imagen si viene adjunta
  let imagenBase64 = null
  if (tieneImagen) {
    imagenBase64 = await descargarImagen({
      eapiUrl: eapiUrl, eapiKey, instanceId, messageKey: data.key,
    })
    console.log(`[eapi webhook] imagen recibida → base64=${imagenBase64 ? "ok" : "error"}`)
  }

  // ── AGENTES IA (orquestador + agentes por área) ──────────
  const manejadoPorAgente = await procesarConAgente({
    telefono, texto, contacto, conv, enviar, imagenBase64,
  }).catch((e) => { console.error("[ai-agent] error:", e); return false })

  if (manejadoPorAgente) {
    return NextResponse.json({ ok: true })
  }

  // ── MOTOR DE FLOWS (visual builder, fallback) ─────────────
  const manejadoPorEngine = await procesarMensaje({
    telefono, texto, contacto, conv, enviar, enviarLista, esNuevo,
  }).catch((e) => { console.error("[flow-engine] error:", e); return false })

  if (manejadoPorEngine) {
    return NextResponse.json({ ok: true })
  }

  // ── FLUJO HARDCODEADO (fallback si no hay flow configurado) ──
  if (esNuevo) {
    await enviar("¡Hola! 😊 Bienvenido/a al Canal de Atención Automatizada para Vecinos de Ezeiza.")
    await enviar(
      "🗒️ *Este es tu menú de consultas*\n\n" +
      "Podés realizar consultas sobre ANSES, RENAPER y MIGRACIONES.\n" +
      "También podés hacer reclamos o denuncias vecinales.\n\n" +
      "Seleccioná una opción:\n\n" +
      "1️⃣ ANSES\n" +
      "2️⃣ RENAPER\n" +
      "3️⃣ MIGRACIONES\n" +
      "4️⃣ Turnos\n" +
      "5️⃣ Reclamos / Denuncia\n" +
      "6️⃣ Próximo Operativo"
    )
    await actualizarEstado("menu", "esperando_opcion")
    return NextResponse.json({ ok: true })
  }

  // ── MENÚ PRINCIPAL ────────────────────────────────────────
  const opc = texto.trim().toLowerCase()

  if (opc === "1" || opc.includes("anses")) {
    await actualizarEstado("anses", "activo")
    await enviar("Estás consultando sobre *ANSES* 🔷\n\nContame, ¿qué necesitás saber? (requisitos, trámites, turnos, etc.)")
  } else if (opc === "2" || opc.includes("renaper")) {
    await actualizarEstado("renaper", "activo")
    await enviar("Estás consultando sobre *RENAPER* 🟢\n\nContame, ¿qué necesitás saber?")
  } else if (opc === "3" || opc.includes("migrac")) {
    await actualizarEstado("migraciones", "activo")
    await enviar("Estás consultando sobre *MIGRACIONES* 🟪\n\nContame, ¿qué necesitás saber?")
  } else if (opc === "4" || opc.includes("turno")) {
    await actualizarEstado("turnos", "activo")
    await enviar("Para solicitar un turno necesito algunos datos.\n\n¿Cuál es tu nombre completo?")
  } else if (opc === "5" || opc.includes("reclamo") || opc.includes("denuncia")) {
    await actualizarEstado("reclamos", "activo")
    await enviar("Para registrar tu reclamo o denuncia, describí brevemente el problema y tu dirección.")
  } else if (opc === "6" || opc.includes("operativo")) {
    await actualizarEstado("operativo", "activo")
    await enviar("🚐 *Próximo Operativo*\n\nPróximamente vas a poder consultar la agenda de operativos aquí.")
  } else if (opc === "menu" || opc === "0" || opc.includes("volver")) {
    await actualizarEstado("menu", "esperando_opcion")
    await enviar(
      "🗒️ *Menú principal*\n\n" +
      "1️⃣ ANSES\n2️⃣ RENAPER\n3️⃣ MIGRACIONES\n4️⃣ Turnos\n5️⃣ Reclamos / Denuncia\n6️⃣ Próximo Operativo"
    )
  } else {
    await enviar(
      "No entendí tu respuesta 😅\n\n" +
      "Respondé con un número:\n" +
      "1 - ANSES\n2 - RENAPER\n3 - MIGRACIONES\n4 - Turnos\n5 - Reclamos\n6 - Próximo Operativo\n\n" +
      "O escribí *menu* para ver las opciones."
    )
  }

  return NextResponse.json({ ok: true })
}
