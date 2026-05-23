import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function parseFechaLocal(str) {
  // Evita que "2026-05-16" se interprete como UTC y quede un día atrás en zona -03:00
  const [y, m, d] = str.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function generarHoras(horaInicio, horaFin, intervaloMinutos) {
  const horas = []
  const [hI, mI] = (horaInicio ?? "08:00").split(":").map(Number)
  const [hF, mF] = (horaFin    ?? "17:00").split(":").map(Number)
  let min = hI * 60 + mI
  const fin = hF * 60 + mF
  while (min < fin) {
    horas.push(
      `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`
    )
    min += intervaloMinutos ?? 30
  }
  return horas
}

export async function POST(request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json()
  const { entidadId, localidad, desde } = body

  if (!entidadId) return NextResponse.json({ error: "entidadId requerido" }, { status: 400 })

  const entidad = await prisma.entidad.findUnique({ where: { id: entidadId } })
  if (!entidad) return NextResponse.json({ error: "Entidad no encontrada" }, { status: 404 })

  // Buscar config de la sucursal activa en el JSON de sucursales
  const sucursales = Array.isArray(entidad.sucursales) ? entidad.sucursales : []
  const sucursalCfg = localidad
    ? sucursales.find((s) =>
        (typeof s === "string" ? s : (s?.localidad || s?.nombre)) === localidad
      )
    : null

  // Usar config de sucursal si existe, si no la de la entidad
  const horaInicio       = sucursalCfg?.horaInicio       ?? entidad.horaInicio       ?? "08:00"
  const horaFin          = sucursalCfg?.horaFin          ?? entidad.horaFin          ?? "17:00"
  const intervaloMinutos = sucursalCfg?.intervaloMinutos  ?? entidad.intervaloMinutos ?? 30
  const diasHabiles      = Array.isArray(entidad.diasHabiles)
    ? entidad.diasHabiles
    : [1, 2, 3, 4, 5]

  const horas = generarHoras(horaInicio, horaFin, intervaloMinutos)

  // Cursor de fecha: siempre desde hoy (o la fecha pedida si es futura), nunca en el pasado
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const desdeDate = desde ? parseFechaLocal(desde) : hoy
  const cursor    = desdeDate >= hoy ? desdeDate : hoy
  cursor.setHours(0, 0, 0, 0)

  // Turnos pendientes para esta entidad (y sucursal si aplica), ordenados por prioridad
  const wherePendientes = {
    entidadId,
    estado: { in: ["pedido", "pendiente"] },
    ...(localidad ? { sucursal: localidad } : {}),
  }
  const pendientes = await prisma.turno.findMany({
    where: wherePendientes,
    orderBy: [{ fechaSolicitada: "asc" }, { createdAt: "asc" }],
  })

  if (pendientes.length === 0) return NextResponse.json({ asignados: 0 })

  // Slots ya ocupados desde hoy en adelante (para esta entidad y sucursal)
  const whereOcupados = {
    entidadId,
    estado:        { in: ["asignado", "confirmado"] },
    fechaAsignada: { gte: hoy },
    ...(localidad ? { sucursal: localidad } : {}),
  }
  const yaAsignados = await prisma.turno.findMany({
    where:  whereOcupados,
    select: { fechaAsignada: true, horaAsignada: true },
  })

  const ocupados = new Set(
    yaAsignados.map((t) => `${t.fechaAsignada.toISOString().slice(0, 10)}_${t.horaAsignada}`)
  )

  let asignados = 0
  const MAX_DIAS = 90

  for (const turno of pendientes) {
    let cursorTurno = new Date(cursor)

    // Si el turno tiene fecha solicitada futura, empezar desde ahí
    if (turno.fechaSolicitada) {
      const fs = new Date(turno.fechaSolicitada)
      fs.setHours(0, 0, 0, 0)
      if (fs > cursorTurno) cursorTurno = new Date(fs)
    }

    let asignado = false
    for (let d = 0; d < MAX_DIAS && !asignado; d++) {
      const diaSemana = cursorTurno.getDay() || 7 // 1=Lun … 7=Dom
      if (diasHabiles.includes(diaSemana)) {
        const fechaStr = `${cursorTurno.getFullYear()}-${String(cursorTurno.getMonth() + 1).padStart(2, "0")}-${String(cursorTurno.getDate()).padStart(2, "0")}`
        for (const hora of horas) {
          const key = `${fechaStr}_${hora}`
          if (!ocupados.has(key)) {
            await prisma.turno.update({
              where: { id: turno.id },
              data: {
                estado:        "asignado",
                fechaAsignada: new Date(`${fechaStr}T00:00:00`),
                horaAsignada:  hora,
              },
            })
            await prisma.turnoLog.create({
              data: {
                turnoId:       turno.id,
                usuarioId:     session.user.id,
                estado:        "asignado",
                fechaAsignada: new Date(`${fechaStr}T00:00:00`),
                horaAsignada:  hora,
                observaciones: "Asignación automática",
              },
            })
            ocupados.add(key)
            asignados++
            asignado = true
            break
          }
        }
      }
      cursorTurno.setDate(cursorTurno.getDate() + 1)
    }
  }

  await prisma.logSistema.create({
    data: {
      usuarioId: session.user.id,
      accion:  "AUTO_ASIGNAR",
      modulo:  "turnos",
      detalle: `Auto-asignados ${asignados} turnos para ${entidad.nombre}${localidad ? ` (${localidad})` : ""}`,
    },
  }).catch(() => {})

  return NextResponse.json({ asignados })
}
