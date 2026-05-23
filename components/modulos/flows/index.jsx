"use client"
import { useEffect, useCallback } from "react"
import { useState } from "react"
import { api } from "@/lib/api-client"
import { useModulo } from "@/lib/modulo-context"
import FlowBuilder from "./FlowBuilder"
import CamposManager from "./CamposManager"
import ConexionesConfig from "./ConexionesConfig"
import AgentesView from "./AgentesView"
import SinCoberturaView from "./SinCoberturaView"

export default function ModuloFlows() {
  const { flowsTab } = useModulo()

  const [flows,   setFlows]   = useState([])
  const [campos,  setCampos]  = useState([])
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFlows   = useCallback(async () => { try { const d = await api.get("/api/flows");          setFlows(Array.isArray(d) ? d : [])   } catch (e) { console.error(e) } }, [])
  const fetchCampos  = useCallback(async () => { try { const d = await api.get("/api/flows/campos");   setCampos(Array.isArray(d) ? d : [])  } catch (e) { console.error(e) } }, [])
  const fetchConfigs = useCallback(async () => { try { const d = await api.get("/api/flows/config");   setConfigs(Array.isArray(d) ? d : []) } catch (e) { console.error(e) } }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchFlows(), fetchCampos(), fetchConfigs()]).finally(() => setLoading(false))
  }, [fetchFlows, fetchCampos, fetchConfigs])

  useEffect(() => {
    if (flowsTab === "campos") fetchCampos()
  }, [flowsTab, fetchCampos])

  if (loading) return (
    <div className="mod-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  )

  return (
    <div className="mod-page">
      {flowsTab === "agentes"          && <AgentesView />}
      {flowsTab === "automatizaciones" && <FlowBuilder flows={flows} onActualizar={fetchFlows} />}
      {flowsTab === "campos"           && <CamposManager campos={campos} onActualizar={fetchCampos} />}
      {flowsTab === "conexiones"       && <ConexionesConfig configs={configs} onActualizar={fetchConfigs} />}
      {flowsTab === "sin_cobertura"    && <SinCoberturaView />}
    </div>
  )
}
