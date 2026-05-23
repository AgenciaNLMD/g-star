"use client"
import { useModulo } from "@/lib/modulo-context"

const MODULO_LABEL = {
  dashboard: "Dashboard",
  reclamos:  "Reclamos",
  turnos:    "Turnos",
  agenda:    "Agenda",
  mapa:      "Mapa",
  panel:     "Panel",
  admin:     "Administración",
  healtech:  "HealTech",
  logistech: "LogisTech",
  eapi:      "eAPI",
  flows:     "Flows",
}

export default function Topbar() {
  const { moduloActivo, topbarSlot } = useModulo()
  const label = MODULO_LABEL[moduloActivo] ?? moduloActivo

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__modname">{label}</span>
      </div>

      {topbarSlot && (
        <div className="topbar__slot">{topbarSlot}</div>
      )}
    </header>
  )
}
