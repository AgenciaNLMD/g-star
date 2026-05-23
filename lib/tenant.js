import { auth } from "@/lib/auth"

// Devuelve el clienteId del usuario autenticado (server-side)
export async function getTenantId() {
  const session = await auth()
  if (!session?.user?.clienteId) {
    throw new Error("Sin tenant: el usuario no tiene clienteId asignado")
  }
  return session.user.clienteId
}

// Cláusula where de Prisma para filtrar por tenant
export function byTenant(clienteId) {
  return { clienteId }
}
