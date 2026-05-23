// Configuración edge-safe de NextAuth (sin Prisma, sin Node APIs)
// Usada por middleware.js para validar rutas protegidas
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isOnPanel = request.nextUrl.pathname.startsWith("/panel")
      if (isOnPanel) return isLoggedIn
      return true
    },
  },
  providers: [],
}
