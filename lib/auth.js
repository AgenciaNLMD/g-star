import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // Solo permite acceso si el email existe en la DB y está activo
    async signIn({ user }) {
      const existente = await prisma.usuario.findUnique({
        where: { email: user.email },
        select: { id: true, estado: true },
      })
      return !!(existente && existente.estado === "activo")
    },

    // Agrega datos del usuario al token JWT
    async jwt({ token, user }) {
      if (user?.email) {
        const usuario = await prisma.usuario.findUnique({
          where: { email: user.email },
          select: { id: true, rol: true },
        })
        if (usuario) {
          token.id = usuario.id
          token.rol = usuario.rol
        }
      }
      return token
    },

    // Expone los datos del token en session.user
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.rol = token.rol
      }
      return session
    },

    // Edge-safe: requerido por authConfig
    authorized: authConfig.callbacks.authorized,
  },
})
