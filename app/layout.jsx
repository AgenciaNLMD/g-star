import "@/styles/globals.css"

export const metadata = {
  title: "g-start — Gestión Municipal",
  description: "Sistema SaaS de gestión para municipios",
  icons: {
    icon: "/logo-g.png",
    shortcut: "/logo-g.png",
    apple: "/logo-g.png",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
