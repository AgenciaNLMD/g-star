"use client"
import { useEffect, useState, useCallback } from "react"
import { api }     from "@/lib/api-client"
import dynamic     from "next/dynamic"

const RDSparkCard         = dynamic(() => import("./RDSparkCard"),          { ssr: false })
const RDTasaCard          = dynamic(() => import("./RDTasaCard"),           { ssr: false })
const RDCanales           = dynamic(() => import("./RDCanales"),            { ssr: false })
const RDCategorias        = dynamic(() => import("./RDCategorias"),         { ssr: false })
const RDEquiposDerivacion = dynamic(() => import("./RDEquiposDerivacion"),  { ssr: false })
const RDRendimiento       = dynamic(() => import("./RDRendimiento"),        { ssr: false })
const RDLocalidades       = dynamic(() => import("./RDLocalidades"),        { ssr: false })
const RDTiempos           = dynamic(() => import("./RDTiempos"),            { ssr: false })
const RDAnalisis          = dynamic(() => import("./RDAnalisis"),           { ssr: false })

export default function RDashboard() {
  const [datos,   setDatos]   = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchDatos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get("/api/dashboard/reclamos")
      setDatos(data)
    } catch (e) {
      console.error("RDashboard error:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDatos() }, [fetchDatos])

  const d = datos ?? {}

  return (
    <div className="rd-grid">

      {/* ── Fila 1: métricas ─────────────────────────── */}
      <RDSparkCard
        label="Total Reclamos"
        value={loading ? "…" : (d.total ?? 0)}
        delta={loading ? 0 : (d.totalHoy ?? 0)}
        sparkData={loading ? [] : (d.sparkline ?? [])}
        color="#5C6E85"
      />
      <RDTasaCard
        tasa={loading ? 0 : (d.tasa ?? 0)}
        cerrados={loading ? 0 : (d.cerrados ?? 0)}
        abiertos={loading ? 0 : (d.abiertos ?? 0)}
        timeline={loading ? [] : (d.timeline ?? [])}
      />
      <RDCanales canales={loading ? {} : (d.canales ?? {})} />

      {/* ── Fila 2: equipos y categorías ─────────────── */}
      <RDCategorias categorias={loading ? [] : (d.categorias ?? [])} />
      <RDEquiposDerivacion
        derivacion={loading ? {} : (d.derivacion ?? {})}
        equipos={loading ? [] : (d.equipos ?? [])}
      />
      <RDRendimiento equipos={loading ? [] : (d.equipos ?? [])} />

      {/* ── Fila 3: localidades, tiempos, análisis ───── */}
      <RDLocalidades localidades={loading ? [] : (d.localidades ?? [])} />
      <RDTiempos tiempos={loading ? [] : (d.tiempos ?? [])} />
      <RDAnalisis analisis={loading ? [] : (d.analisis ?? [])} />

    </div>
  )
}
