import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

// Middleware edge-safe: usa solo JWT, sin Prisma
export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/panel/:path*"],
}
