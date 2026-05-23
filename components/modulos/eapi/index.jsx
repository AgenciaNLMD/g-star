"use client"
import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import Inbox from "./Inbox"
import TemplateManager from "./TemplateManager"
import { IcoInbox, IcoFileText } from "@/components/ui/Icons"

const TABS = [
  { key: "inbox",     label: "Inbox",     Icon: IcoInbox    },
  { key: "templates", label: "Templates", Icon: IcoFileText },
]

export default function ModuloEAPI() {
  const [tab, setTab]                         = useState("inbox")
  const [conversaciones, setConversaciones]   = useState([])
  const [templates, setTemplates]             = useState([])
  const [loadingConv, setLoadingConv]         = useState(true)
  const [loadingTpl, setLoadingTpl]           = useState(true)
  const [activoId, setActivoId]               = useState(null)

  const fetchConversaciones = useCallback(async () => {
    setLoadingConv(true)
    try {
      const data = await api.get("/api/eapi/conversaciones")
      setConversaciones(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingConv(false)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    setLoadingTpl(true)
    try {
      const data = await api.get("/api/eapi/flows")
      setTemplates(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingTpl(false)
    }
  }, [])

  useEffect(() => {
    fetchConversaciones()
    fetchTemplates()
  }, [fetchConversaciones, fetchTemplates])

  const noLeidos = conversaciones.reduce((acc, c) => acc + (c.noLeidos ?? 0), 0)

  return (
    <div className="mod-page">
      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map(({ key, label, Icon }) => (
          <div
            key={key}
            className={`tab${tab === key ? " tab--active" : ""}`}
            onClick={() => setTab(key)}
          >
            <Icon size={14} />
            {label}
            {key === "inbox" && noLeidos > 0 && (
              <span className="badge badge--danger" style={{ marginLeft: "0.375rem", fontSize: "0.65rem" }}>
                {noLeidos}
              </span>
            )}
          </div>
        ))}
      </div>

      {tab === "inbox" && (
        <Inbox
          conversaciones={conversaciones}
          activoId={activoId}
          onSeleccionar={setActivoId}
          onMensajeEnviado={fetchConversaciones}
          onConvActualizada={fetchConversaciones}
          loading={loadingConv}
        />
      )}

      {tab === "templates" && (
        loadingTpl ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : (
          <TemplateManager templates={templates} onActualizar={fetchTemplates} />
        )
      )}
    </div>
  )
}
