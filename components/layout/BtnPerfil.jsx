"use client"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { initiales } from "@/lib/utils"

const ROL_LABEL = {
  admin: "Administrador",
  operador: "Operador",
  supervisor: "Supervisor",
  readonly: "Solo lectura",
}

export default function BtnPerfil({ collapsed = false }) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  const user = session?.user
  const nombre = user?.name ?? user?.email ?? "Usuario"
  const rol = ROL_LABEL[user?.rol] ?? user?.rol ?? "—"

  return (
    <div className="btn-perfil">
      {open && (
        <div className="btn-perfil__dropdown">
          <div
            className="btn-perfil__dropdown-item btn-perfil__dropdown-item--danger"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <IconLogout />
            Cerrar sesión
          </div>
        </div>
      )}

      <div
        className="btn-perfil__trigger"
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}
      >
        <div className="btn-perfil__avatar">
          {user?.image
            ? <img src={user.image} alt={nombre} referrerPolicy="no-referrer" />
            : initiales(nombre)
          }
        </div>
        {!collapsed && (
          <div className="btn-perfil__info">
            <div className="btn-perfil__name">{nombre}</div>
            <div className="btn-perfil__role">{rol}</div>
          </div>
        )}
        {!collapsed && <IconChevron open={open} />}
      </div>
    </div>
  )
}

function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function IconChevron({ open }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s ease", marginLeft: "auto", flexShrink: 0 }}
    >
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  )
}
