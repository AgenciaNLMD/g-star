"use client"
import { useState } from "react"
import ModuloContext from "@/lib/modulo-context"
import SessionProviderWrapper from "@/components/layout/SessionProviderWrapper"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"
import Modwrap from "@/components/layout/Modwrap"

// Shell interno: puede usar useSession() porque está dentro de SessionProviderWrapper
function PanelShell({ children }) {
  const [moduloActivo, setModuloActivo] = useState("dashboard")
  const [flowsTab,    setFlowsTab]    = useState("automatizaciones")
  const [adminTab,    setAdminTab]    = useState("usuarios")
  const [topbarSlot,  setTopbarSlot]  = useState(null)

  return (
    <ModuloContext.Provider value={{ moduloActivo, setModuloActivo, flowsTab, setFlowsTab, adminTab, setAdminTab, topbarSlot, setTopbarSlot }}>
      <div className="layout">
        <Sidebar />
        <div className="layout__main">
          <Topbar />
          <Modwrap>{children}</Modwrap>
        </div>
      </div>
    </ModuloContext.Provider>
  )
}

export default function PanelLayout({ children }) {
  return (
    <SessionProviderWrapper>
      <PanelShell>{children}</PanelShell>
    </SessionProviderWrapper>
  )
}
