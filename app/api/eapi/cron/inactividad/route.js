/**
 * Cron de inactividad — se llama cada 5 minutos.
 *
 * Fase 1: si el contacto no responde en timeoutRecordatorioMin minutos
 *   → envía mensaje de recordatorio vía el agente activo
 *   → setea recordatorioAt = now
 *
 * Fase 2: si tras el recordatorio pasan timeoutCierreMin minutos sin respuesta
 *   → envía mensaje de cierre
 *   → resetea estado del contacto (areaActiva = null)
 *
 * Los tiempos y mensajes se leen del FlowAgente activo del contacto.
 * Si el contacto no tiene areaActiva se usan los valores del orquestador.
 */

import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const DEFAULT_MSG_RECORDATORIO = "¿Seguís ahí? 😊 Tu consulta sigue abierta, avisame cuando quieras continuar."
const DEFAULT_MSG_CIERRE       = "Cerramos tu consulta por inactividad. ¡Cuando quieras volvé a escribirnos! 👋"

export async function POST(req) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ahora = new Date()

  // Todos los contactos con bot activo que tuvieron al menos un mensaje
  const contactos = await prisma.eapiContacto.findMany({
    where: {
      modoBot:         true,
      ultimoMensajeAt: { not: null },
    },
  })

  console.log(`[cron/inactividad] revisando ${contactos.length} contactos`)

  const todosAgentes = await prisma.flowAgente.findMany({ where: { activo: true } }).catch(() => [])
  const orquestador  = todosAgentes.find((a) => a.esOrquestador) ?? null

  const eapiUrl    = process.env.EVOLUTION_API_URL
  const eapiKey    = process.env.EVOLUTION_API_KEY
  const instanceId = process.env.EVOLUTION_INSTANCE ?? ""

  let recordatoriosEnviados = 0
  let cierresEjecutados     = 0

  for (const contacto of contactos) {
    // Obtener configuración de timeout del agente activo
    const agente = contacto.areaActiva
      ? todosAgentes.find((a) => a.id === contacto.areaActiva)
      : orquestador

    // Sin agente configurado: no aplicar timeout
    if (!agente) continue

    const minRecordatorio = agente.timeoutRecordatorioMin ?? 10
    const minCierre       = agente.timeoutCierreMin ?? 20
    const msgRecordatorio = agente.mensajeRecordatorio || DEFAULT_MSG_RECORDATORIO
    const msgCierre       = agente.mensajeCierre       || DEFAULT_MSG_CIERRE

    const minDesdeUltimoMsg     = (ahora - new Date(contacto.ultimoMensajeAt)) / 60000
    const minDesdeRecordatorio  = contacto.recordatorioAt
      ? (ahora - new Date(contacto.recordatorioAt)) / 60000
      : null

    // Obtener conversación para loguear mensajes salientes
    const conv = await prisma.eapiConversacion.findUnique({
      where: { contactoTel: contacto.telefono },
    }).catch(() => null)

    async function enviar(msg) {
      if (eapiUrl && eapiKey && instanceId) {
        await fetch(`${eapiUrl}/message/sendText/${instanceId}`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", "apikey": eapiKey },
          body:    JSON.stringify({ number: contacto.telefono, text: msg }),
        }).catch((e) => console.error("[cron] error enviando:", e))
      }
      if (conv) {
        await prisma.eapiMensaje.create({
          data: { conversacionId: conv.id, texto: msg, direccion: "saliente", estado: "enviado" },
        }).catch(() => {})
      }
    }

    // ── Fase 2: cerrar si ya se envió recordatorio y venció el tiempo de cierre ──
    if (contacto.recordatorioAt && minDesdeRecordatorio !== null && minDesdeRecordatorio >= minCierre) {
      console.log(`[cron] CIERRE ${contacto.telefono} (${minDesdeRecordatorio.toFixed(1)}min desde recordatorio)`)
      await enviar(msgCierre)
      await prisma.eapiContacto.update({
        where: { id: contacto.id },
        data:  { areaActiva: null, ultimoMensajeAt: null, recordatorioAt: null },
      })
      cierresEjecutados++
      continue
    }

    // ── Fase 1: enviar recordatorio si venció el tiempo sin respuesta ───────────
    if (!contacto.recordatorioAt && minDesdeUltimoMsg >= minRecordatorio) {
      console.log(`[cron] RECORDATORIO ${contacto.telefono} (${minDesdeUltimoMsg.toFixed(1)}min sin actividad)`)
      await enviar(msgRecordatorio)
      await prisma.eapiContacto.update({
        where: { id: contacto.id },
        data:  { recordatorioAt: ahora },
      })
      recordatoriosEnviados++
    }
  }

  return NextResponse.json({
    ok: true,
    revisados: contactos.length,
    recordatoriosEnviados,
    cierresEjecutados,
  })
}
