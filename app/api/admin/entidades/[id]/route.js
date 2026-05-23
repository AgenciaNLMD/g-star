import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return { error: "No autenticado", status: 401 }
  if (session.user.rol !== "admin") return { error: "Sin permiso", status: 403 }
  return { session }
}

export async function PUT(req, { params }) {
  const check = await requireAdmin()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { nombre, tipo, provincia, partido, localidad, descripcion, direccion, telefono, email, web, horaInicio, horaFin, intervaloMinutos, diasHabiles, turnosPorDia, sucursales, redesSociales, activo } = await req.json()

  const entidad = await prisma.entidad.update({
    where: { id: params.id },
    data: {
      ...(nombre           !== undefined && { nombre: nombre.trim() }),
      ...(tipo             !== undefined && { tipo             }),
      ...(provincia        !== undefined && { provincia        }),
      ...(partido          !== undefined && { partido          }),
      ...(localidad        !== undefined && { localidad        }),
      ...(descripcion      !== undefined && { descripcion      }),
      ...(direccion        !== undefined && { direccion        }),
      ...(telefono         !== undefined && { telefono         }),
      ...(email            !== undefined && { email            }),
      ...(web              !== undefined && { web              }),
      ...(horaInicio       !== undefined && { horaInicio       }),
      ...(horaFin          !== undefined && { horaFin          }),
      ...(intervaloMinutos !== undefined && { intervaloMinutos }),
      ...(diasHabiles      !== undefined && { diasHabiles      }),
      ...(turnosPorDia     !== undefined && { turnosPorDia     }),
      ...(sucursales       !== undefined && { sucursales       }),
      ...(redesSociales    !== undefined && { redesSociales    }),
      ...(activo           !== undefined && { activo           }),
    },
  })

  return NextResponse.json(entidad)
}

export async function DELETE(_, { params }) {
  const check = await requireAdmin()
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  await prisma.entidad.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
