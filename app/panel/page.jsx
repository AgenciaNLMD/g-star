"use client"
import dynamic from "next/dynamic"
import { useModulo } from "@/lib/modulo-context"

// Mapa de módulos: slug → dynamic import del componente raíz
// Agregar módulo nuevo: 1 línea acá + components/modulos/[slug]/index.jsx + api + NavItem
const MODULOS = {
  dashboard: dynamic(() => import("@/components/modulos/dashboard"), { ssr: false }),
  reclamos:  dynamic(() => import("@/components/modulos/reclamos"),  { ssr: false }),
  turnos:    dynamic(() => import("@/components/modulos/turnos"),    { ssr: false }),
  agenda:    dynamic(() => import("@/components/modulos/agenda"),    { ssr: false }),
  mapa:      dynamic(() => import("@/components/modulos/mapa"),      { ssr: false }),
  admin:     dynamic(() => import("@/components/modulos/admin"),     { ssr: false }),
  eapi:      dynamic(() => import("@/components/modulos/eapi"),      { ssr: false }),
  flows:     dynamic(() => import("@/components/modulos/flows"),     { ssr: false }),
}

export default function PanelPage() {
  const { moduloActivo } = useModulo()

  const Modulo = MODULOS[moduloActivo]

  if (!Modulo) {
    return (
      <div className="mod-page">
        <div className="empty-state">
          <div className="empty-state__icon">⚠️</div>
          <p className="empty-state__title">Módulo no encontrado</p>
        </div>
      </div>
    )
  }

  return <Modulo />
}
