"use client"
import { useSession } from "next-auth/react"
import { useModulo } from "@/lib/modulo-context"
import UsuariosTab from "./UsuariosTab"
import MunicipioTab from "./MunicipioTab"
import EntidadesTab from "./EntidadesTab"
import EquiposTab from "./EquiposTab"
import { IcoLock } from "@/components/ui/Icons"

export default function ModuloAdmin() {
  const { data: session } = useSession()
  const { adminTab }      = useModulo()

  if (session?.user?.rol !== "admin") {
    return (
      <div className="mod-page">
        <div className="empty-state">
          <div className="empty-state__icon"><IcoLock size={40} /></div>
          <p className="empty-state__title">Acceso restringido</p>
          <p className="text-sm text-muted">Este módulo solo está disponible para administradores.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      {adminTab === "municipio"  && <MunicipioTab />}
      {adminTab === "entidades"  && <EntidadesTab />}
      {adminTab === "equipos"    && <EquiposTab />}
      {(!adminTab || adminTab === "usuarios") && <UsuariosTab />}
    </div>
  )
}
