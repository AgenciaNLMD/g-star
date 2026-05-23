"use client"
import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { IcoTrash } from "@/components/ui/Icons"

function formatFecha(iso) {
  const d = new Date(iso)
  return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function SinCoberturaView() {
  const [items,         setItems]         = useState([])
  const [total,         setTotal]         = useState(0)
  const [pagina,        setPagina]        = useState(1)
  const [paginas,       setPaginas]       = useState(1)
  const [soloSinRevisar, setSoloSinRevisar] = useState(false)
  const [loading,       setLoading]       = useState(true)

  const fetchItems = useCallback(async (pag = 1, sinRevisar = false) => {
    setLoading(true)
    try {
      const d = await api.get(`/api/eapi/sin-cobertura?pagina=${pag}&sinRevisar=${sinRevisar}`)
      setItems(d.items ?? [])
      setTotal(d.total ?? 0)
      setPaginas(d.paginas ?? 1)
      setPagina(pag)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchItems(1, soloSinRevisar) }, [soloSinRevisar, fetchItems])

  async function marcarRevisada(id) {
    await api.patch(`/api/eapi/sin-cobertura/${id}`, {}).catch(console.error)
    fetchItems(pagina, soloSinRevisar)
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar esta consulta del registro?")) return
    await api.del(`/api/eapi/sin-cobertura/${id}`).catch(console.error)
    fetchItems(pagina, soloSinRevisar)
  }

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <div>
          <span className="card__title">Consultas sin cobertura</span>
          <p className="text-sm text-muted" style={{ marginTop: "0.25rem" }}>
            Temas que los vecinos preguntaron y el sistema no pudo responder. Usalos para priorizar nuevos agentes.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", cursor: "pointer", color: "#374151" }}>
            <input
              type="checkbox"
              checked={soloSinRevisar}
              onChange={(e) => setSoloSinRevisar(e.target.checked)}
              style={{ accentColor: "#7c3aed" }}
            />
            Solo sin revisar
          </label>
          <button className="btn btn--secondary btn--sm" onClick={() => fetchItems(pagina, soloSinRevisar)}>
            Actualizar
          </button>
        </div>
      </div>

      <div style={{ padding: "0 1.25rem 1.5rem" }}>

        {/* Contador */}
        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.75rem" }}>
          {total} consulta{total !== 1 ? "s" : ""} registrada{total !== 1 ? "s" : ""}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", border: "1px dashed #e2e8f0", borderRadius: 12, color: "#94a3b8", fontSize: "0.875rem" }}>
            {soloSinRevisar ? "No hay consultas pendientes de revisión. 🎉" : "Aún no hay consultas registradas."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  border: `1px solid ${item.revisada ? "#e2e8f0" : "#fde68a"}`,
                  borderLeft: `3px solid ${item.revisada ? "#e2e8f0" : "#f59e0b"}`,
                  borderRadius: 10,
                  padding: "0.75rem 1rem",
                  background: item.revisada ? "#fff" : "#fffbeb",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                }}
              >
                {/* Contenido principal */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                    {!item.revisada && (
                      <span style={{ fontSize: "0.55rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a", borderRadius: 4, padding: "0.1rem 0.35rem" }}>
                        Sin revisar
                      </span>
                    )}
                    {item.areaDetectada && (
                      <span style={{ fontSize: "0.55rem", fontWeight: 700, background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 4, padding: "0.1rem 0.35rem" }}>
                        {item.areaDetectada}
                      </span>
                    )}
                    <span style={{ fontSize: "0.6rem", color: "#94a3b8" }}>
                      {formatFecha(item.createdAt)} · {item.telefono}
                    </span>
                  </div>

                  {/* Pregunta del vecino */}
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a", marginBottom: "0.25rem", lineHeight: 1.4 }}>
                    "{item.pregunta}"
                  </div>

                  {/* Respuesta que se dio */}
                  {item.respondidoCon && (
                    <div style={{ fontSize: "0.75rem", color: "#64748b", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 6, padding: "0.375rem 0.5rem", lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600, color: "#94a3b8", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Respuesta dada: </span>
                      {item.respondidoCon}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flexShrink: 0 }}>
                  {!item.revisada && (
                    <button
                      onClick={() => marcarRevisada(item.id)}
                      style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 6, padding: "0.25rem 0.5rem", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                    >
                      ✓ Revisada
                    </button>
                  )}
                  <button
                    onClick={() => eliminar(item.id)}
                    style={{ background: "none", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, padding: "0.25rem 0.4rem", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <IcoTrash size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {paginas > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              className="btn btn--ghost btn--sm"
              disabled={pagina <= 1}
              onClick={() => fetchItems(pagina - 1, soloSinRevisar)}
            >
              ← Anterior
            </button>
            <span style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", alignItems: "center", padding: "0 0.5rem" }}>
              {pagina} / {paginas}
            </span>
            <button
              className="btn btn--ghost btn--sm"
              disabled={pagina >= paginas}
              onClick={() => fetchItems(pagina + 1, soloSinRevisar)}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
