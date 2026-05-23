"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import NavItem from "@/components/layout/NavItem"
import BtnPerfil from "@/components/layout/BtnPerfil"
import { useModulo } from "@/lib/modulo-context"

const NAV_ITEMS = [
  { slug: "dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { slug: "agenda",    label: "Agenda",    icon: <IconAgenda />    },
  { slug: "turnos",    label: "Turnos",    icon: <IconTurnos />    },
  { slug: "mapa",      label: "Mapa",      icon: <IconMapa />      },
  { slug: "reclamos",  label: "Reclamos",  icon: <IconReclamos />  },
  { slug: "eapi",      label: "eAPI",      icon: <IconEapi />      },
  { slug: "flows",     label: "Flows",     icon: <IconFlows />     },
  { slug: "admin",     label: "Admin",     icon: <IconAdmin />     },
]

const FLOWS_SUBITEMS = [
  { key: "agentes",          label: "Agentes"          },
  { key: "automatizaciones", label: "Automatizaciones" },
  { key: "campos",           label: "Campos"           },
  { key: "conexiones",       label: "Conexiones"       },
  { key: "sin_cobertura",    label: "Sin cobertura"    },
]

const ADMIN_SUBITEMS = [
  { key: "usuarios",  label: "Usuarios"  },
  { key: "equipos",   label: "Equipos"   },
  { key: "municipio", label: "Municipio" },
  { key: "entidades", label: "Entidades" },
]

export default function Sidebar() {
  const { data: session }         = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const { moduloActivo, setModuloActivo, flowsTab, setFlowsTab, adminTab, setAdminTab } = useModulo()

  function collapse() { setCollapsed(true)  }
  function expand()   { setCollapsed(false) }

  // Click en el aside: si está colapsado, expandir (los nav-items detienen la burbuja cuando están expandidos)
  function handleAsideClick() {
    if (collapsed) expand()
  }

  return (
    <aside
      className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}
      onClick={handleAsideClick}
    >
      <div className="sidebar__logo">
        <div className="sidebar__logo-mark">
          <img src="/logo-g.png" alt="G" width={28} height={28} style={{ display: "block", width: 28, height: 28, objectFit: "contain" }} />
        </div>
        <span className="sidebar__logo-text">-Start</span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          if (item.slug === "flows") {
            const isFlowsActive = moduloActivo === "flows"
            return (
              <div key="flows">
                <div
                  className={`nav-item${isFlowsActive ? " nav-item--active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); if (collapsed) { if (isFlowsActive) expand(); else setModuloActivo("flows") } else { setModuloActivo("flows"); collapse() } }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") { if (collapsed) { if (isFlowsActive) expand(); else setModuloActivo("flows") } else { setModuloActivo("flows"); collapse() } } }}
                >
                  <span className="nav-item__icon" title={collapsed ? "Flows" : undefined}>{item.icon}</span>
                  {!collapsed && <span className="nav-item__label">Flows</span>}
                  {!collapsed && (
                    <span style={{ marginLeft: "auto", fontSize: "0.6rem", opacity: 0.45, lineHeight: 1 }}>
                      {isFlowsActive ? "▾" : "▸"}
                    </span>
                  )}
                </div>

                {isFlowsActive && !collapsed && (
                  <div>
                    {FLOWS_SUBITEMS.map(({ key, label }) => (
                      <div
                        key={key}
                        className={`nav-sub-item${flowsTab === key ? " nav-sub-item--active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); setFlowsTab(key); collapse() }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && (setFlowsTab(key), collapse())}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          if (item.slug === "admin") {
            const isAdminActive = moduloActivo === "admin"
            return (
              <div key="admin">
                <div
                  className={`nav-item${isAdminActive ? " nav-item--active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); if (collapsed) { if (isAdminActive) expand(); else setModuloActivo("admin") } else { setModuloActivo("admin"); collapse() } }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") { if (collapsed) { if (isAdminActive) expand(); else setModuloActivo("admin") } else { setModuloActivo("admin"); collapse() } } }}
                >
                  <span className="nav-item__icon" title={collapsed ? "Admin" : undefined}>{item.icon}</span>
                  {!collapsed && <span className="nav-item__label">Admin</span>}
                  {!collapsed && (
                    <span style={{ marginLeft: "auto", fontSize: "0.6rem", opacity: 0.45, lineHeight: 1 }}>
                      {isAdminActive ? "▾" : "▸"}
                    </span>
                  )}
                </div>
                {isAdminActive && !collapsed && (
                  <div>
                    {ADMIN_SUBITEMS.map(({ key, label }) => (
                      <div
                        key={key}
                        className={`nav-sub-item${adminTab === key ? " nav-sub-item--active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); setAdminTab(key); collapse() }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && (setAdminTab(key), collapse())}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavItem
              key={item.slug}
              slug={item.slug}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
              onNavigate={collapse}
              onExpand={expand}
            />
          )
        })}
      </nav>

      <div className="sidebar__footer">
        <BtnPerfil collapsed={collapsed} />
      </div>
    </aside>
  )
}

// ── Íconos SVG (estilo Lucide) ───────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1"/>
      <rect width="7" height="5" x="14" y="3" rx="1"/>
      <rect width="7" height="9" x="14" y="12" rx="1"/>
      <rect width="7" height="5" x="3" y="16" rx="1"/>
    </svg>
  )
}

function IconReclamos() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11v2a1 1 0 0 0 1 1h1v-4H4a1 1 0 0 0-1 1z"/>
      <path d="M5 10v4l13 4V6L5 10z"/>
      <path d="M9 18v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2"/>
    </svg>
  )
}

function IconTurnos() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 3"/>
    </svg>
  )
}

function IconAgenda() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4"/>
      <path d="M16 2v4"/>
      <rect width="18" height="18" x="3" y="4" rx="2"/>
      <path d="M3 10h18"/>
      <path d="M8 14h.01"/>
      <path d="M12 14h.01"/>
      <path d="M16 14h.01"/>
      <path d="M8 18h.01"/>
      <path d="M12 18h.01"/>
      <path d="M16 18h.01"/>
    </svg>
  )
}

function IconMapa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

function IconEapi() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 1 8.66 15l1.34 5-5.23-1.37A10 10 0 1 1 12 2z"/>
      <path d="M8.5 11.5c.5 1 1.5 2 3 2.5"/>
      <path d="M8 9c0-.5.4-1 1-1h.5c.4 0 .8.3.9.7l.6 1.8c.1.3 0 .7-.3.9l-.7.5c.5 1 1.3 1.8 2.3 2.3l.5-.7c.2-.3.6-.4.9-.3l1.8.6c.4.1.7.5.7.9V16c0 .6-.5 1-1 1C10 17 7 14 7 10"/>
    </svg>
  )
}

function IconFlows() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" x2="6" y1="3" y2="15"/>
      <circle cx="18" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <path d="M18 9a9 9 0 0 1-9 9"/>
    </svg>
  )
}

function IconAdmin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7h-9"/>
      <path d="M14 17H5"/>
      <circle cx="17" cy="17" r="3"/>
      <circle cx="7" cy="7" r="3"/>
    </svg>
  )
}
