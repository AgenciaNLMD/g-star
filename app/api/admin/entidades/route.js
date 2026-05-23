import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return { error: "No autenticado", status: 401 }
  if (session.user.rol !== "admin") return { error: "Sin permiso", status: 403 }
  return { session }
}

export async function GET() {
  const check = await requireAdmin()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const entidades = await prisma.entidad.findMany({ orderBy: { nombre: "asc" } })
  return NextResponse.json(entidades)
}

export async function POST(req) {
  const check = await requireAdmin()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { nombre, tipo, provincia, partido, localidad, descripcion, direccion, telefono, email, web, horaInicio, horaFin, intervaloMinutos, diasHabiles, turnosPorDia, sucursales, redesSociales, activo } = await req.json()

  if (!nombre?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })

  const entidad = await prisma.entidad.create({
    data: {
      nombre:          nombre.trim(),
      tipo:            tipo            ?? "municipal",
      provincia:       provincia       ?? "",
      partido:         partido         ?? "",
      localidad:       localidad       ?? "",
      descripcion:     descripcion     ?? null,
      direccion:       direccion       ?? null,
      telefono:        telefono        ?? null,
      email:           email           ?? null,
      web:             web             ?? null,
      horaInicio:      horaInicio      ?? "08:00",
      horaFin:         horaFin         ?? "17:00",
      intervaloMinutos: intervaloMinutos ?? 30,
      diasHabiles:     diasHabiles     ?? [1, 2, 3, 4, 5],
      turnosPorDia:    turnosPorDia    ?? null,
      sucursales:      sucursales      ?? null,
      redesSociales:   redesSociales   ?? null,
      activo:          activo          ?? true,
    },
  })

  return NextResponse.json(entidad, { status: 201 })
}
