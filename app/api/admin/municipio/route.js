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

  const config = await prisma.configMunicipio.findFirst()
  return NextResponse.json(config ?? {})
}

export async function PUT(req) {
  const check = await requireAdmin()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { nombre, localidad, provincia, pais, direccion, telefono, email, web, cuit, intendente, descripcion, redesSociales } = await req.json()

  const existing = await prisma.configMunicipio.findFirst()

  const data = {
    ...(nombre        !== undefined && { nombre        }),
    ...(localidad     !== undefined && { localidad     }),
    ...(provincia     !== undefined && { provincia     }),
    ...(pais          !== undefined && { pais          }),
    ...(direccion     !== undefined && { direccion     }),
    ...(telefono      !== undefined && { telefono      }),
    ...(email         !== undefined && { email         }),
    ...(web           !== undefined && { web           }),
    ...(cuit          !== undefined && { cuit          }),
    ...(intendente    !== undefined && { intendente    }),
    ...(descripcion   !== undefined && { descripcion   }),
    ...(redesSociales !== undefined && { redesSociales }),
  }

  const config = existing
    ? await prisma.configMunicipio.update({ where: { id: existing.id }, data })
    : await prisma.configMunicipio.create({ data })

  return NextResponse.json(config)
}
