"use client"
import { useModulo } from "@/lib/modulo-context"

export default function NavItem({ slug, label, icon, collapsed = false, onNavigate, onExpand }) {
  const { moduloActivo, setModuloActivo } = useModulo()
  const isActive = moduloActivo === slug

  function handleNavigate(e) {
    e.stopPropagation()
    if (collapsed) {
      if (isActive) {
        onExpand?.()          // ícono activo colapsado → expande el sidebar
      } else {
        setModuloActivo(slug) // ícono diferente colapsado → cambia módulo, queda colapsado
      }
    } else {
      setModuloActivo(slug)
      onNavigate?.()          // expandido → cambia módulo y colapsa
    }
  }

  return (
    <div
      className={`nav-item${isActive ? " nav-item--active" : ""}`}
      onClick={handleNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleNavigate(e)}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="nav-item__icon" title={collapsed ? label : undefined}>{icon}</span>
      {!collapsed && <span className="nav-item__label">{label}</span>}
    </div>
  )
}
