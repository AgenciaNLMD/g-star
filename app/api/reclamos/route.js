import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const estado        = searchParams.get("estado")        || undefined
  const etiqueta      = searchParams.get("etiqueta")      || undefined
  const categoriaSlug = searchParams.get("categoriaSlug") || undefined
  const localidad     = searchParams.get("localidad")     || undefined
  const canal         = searchParams.get("canal")         || undefined
  const equipoId      = searchParams.get("equipoId")      || undefined
  const busqueda      = searchParams.get("busqueda")      || undefined
  const fechaDesde    = searchParams.get("fechaDesde")
  const fechaHasta    = searchParams.get("fechaHasta")

  const baseWhere = {
    ...(estado    && { estado }),
    ...(etiqueta  && { etiqueta }),
    ...(categoriaSlug && { categoria: { slug: categoriaSlug } }),
    ...(localidad && { localidad }),
    ...(canal     && { canal }),
    ...(equipoId  && { equipoId }),
    ...((fechaDesde || fechaHasta) && {
      createdAt: {
        ...(fechaDesde && { gte: new Date(fechaDesde) }),
        ...(fechaHasta && { lte: new Date(fechaHasta + "T23:59:59") }),
      },
    }),
    ...(busqueda && {
      OR: [
        { asunto:           { contains: busqueda } },
        { barrio:           { contains: busqueda } },
        { localidad:        { contains: busqueda } },
        { contactoNombre:   { contains: busqueda } },
        { numero:           { contains: busqueda } },
      ],
    }),
  }

  // Filtro por equipo para usuarios no-admin
  let where = baseWhere
  if (session.user.rol !== "admin") {
    const membresias = await prisma.equipoMiembro.findMany({
      where: { usuarioId: session.user.id },
      select: { equipoId: true },
    })
    const equipoIds = membresias.map((m) => m.equipoId)

    where = {
      ...baseWhere,
      OR: [
        { estado: "entrante" },
        ...(equipoIds.length > 0 ? [{ equipoId: { in: equipoIds } }] : []),
        { tomadoPorId: session.user.id },
        { usuarioId:   session.user.id },
      ],
    }
  }

  const reclamos = await prisma.reclamo.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, numero: true, asunto: true, estado: true,
      etiqueta: true, barrio: true, localidad: true, canal: true,
      esAnonimo: true, contactoNombre: true, createdAt: true,
      areaDestinataria: true,
      categoria: { select: { slug: true, nombre: true, color: true } },
      equipo:    { select: { id: true, nombre: true, color: true } },
      tomadoPor: { select: { nombre: true } },
    },
  })

  return NextResponse.json(reclamos)
}

export async function POST(request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json()
  const {
    asunto, texto, etiqueta, barrio, localidad, direccion, lat, lng,
    canal, contactoNombre, contactoTelefono, contactoEmail, esAnonimo,
  } = body

  if (!asunto?.trim()) {
    return NextResponse.json({ error: "El asunto es requerido" }, { status: 400 })
  }

  const count  = await prisma.reclamo.count()
  const anio   = new Date().getFullYear()
  const numero = `${anio}-${String(count + 1).padStart(4, "0")}`

  const reclamo = await prisma.reclamo.create({
    data: {
      numero,
      asunto:    asunto.trim(),
      texto:     texto?.trim() ?? "",
      estado:    "entrante",
      etiqueta:  etiqueta  ?? "General",
      canal:     canal     ?? "presencial",
      barrio:    barrio    ?? "",
      localidad: localidad ?? "",
      direccion: direccion ?? "",
      lat:  lat ? parseFloat(lat) : null,
      lng:  lng ? parseFloat(lng) : null,
      esAnonimo:        !!esAnonimo,
      contactoNombre:   esAnonimo ? "" : (contactoNombre   ?? ""),
      contactoTelefono: esAnonimo ? "" : (contactoTelefono ?? ""),
      contactoEmail:    esAnonimo ? "" : (contactoEmail    ?? ""),
      usuarioId: session.user.id,
    },
  })

  await prisma.reclamoLog.create({
    data: {
      reclamoId: reclamo.id,
      usuarioId: session.user.id,
      accion:    "Reclamo creado",
      detalle:   `Ingresado por ${session.user.name ?? session.user.email} vía ${canal ?? "presencial"}`,
    },
  })

  await prisma.logSistema.create({
    data: {
      usuarioId: session.user.id,
      accion:    "CREAR",
      modulo:    "reclamos",
      detalle:   `Reclamo #${numero}: ${asunto}`,
    },
  }).catch(() => {})

  return NextResponse.json(reclamo, { status: 201 })
}
