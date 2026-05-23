"use client"
import { Handle, Position } from "reactflow"
import { IcoPlay, IcoStop, IcoMessageSquare, IcoGitBranch, IcoHourglass, IcoZap, IcoBrain } from "@/components/ui/Icons"

export const TIPOS = {
  inicio:    { color: "#22c55e", icono: IcoPlay,         label: "INICIO"    },
  mensaje:   { color: "#3b82f6", icono: IcoMessageSquare,label: "MENSAJE"   },
  condicion: { color: "#f59e0b", icono: IcoGitBranch,    label: "CONDICIÓN" },
  espera:    { color: "#8b5cf6", icono: IcoHourglass,    label: "ESPERA"    },
  accion:    { color: "#06b6d4", icono: IcoZap,          label: "ACCIÓN"    },
  agente:    { color: "#a855f7", icono: IcoBrain,        label: "AGENTE IA" },
  fin:       { color: "#ef4444", icono: IcoStop,         label: "FIN"       },
}

export function FlowNodeComponent({ data, selected }) {
  const tipo      = TIPOS[data.tipo] ?? TIPOS.mensaje
  const TipoIcon  = tipo.icono
  const botones   = data.botones ?? []
  const tieneBots = botones.length > 0

  const esAgente  = data.tipo === "agente"
  const preview   = esAgente
    ? (data.area ? `Área: ${data.area}` : "(sin área)") + (data.herramientas?.length ? `\nHerramientas: ${data.herramientas.join(", ")}` : "")
    : data.contenido || data.keywords || data.accion || "(sin contenido)"

  return (
    <div style={{
      background: "#fff",
      border: `2px solid ${selected ? tipo.color : "#e2e8f0"}`,
      borderRadius: 10,
      padding: "0.625rem 0.875rem",
      minWidth: 220,
      maxWidth: 280,
      boxShadow: selected
        ? `0 0 0 3px ${tipo.color}33, 0 4px 12px rgba(0,0,0,0.1)`
        : "0 2px 6px rgba(0,0,0,0.08)",
      cursor: "pointer",
      fontFamily: "Inter, sans-serif",
      paddingBottom: tieneBots ? "0.875rem" : "0.625rem",
    }}>
      {/* Handle de entrada (arriba) — todos excepto inicio */}
      {data.tipo !== "inicio" && (
        <Handle type="target" position={Position.Top}
          style={{ background: tipo.color, width: 10, height: 10, top: -6 }} />
      )}

      {/* Cabecera del tipo */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.4rem" }}>
        <div style={{
          background: tipo.color + "18",
          border: `1px solid ${tipo.color}44`,
          borderRadius: 4,
          padding: "0.125rem 0.375rem",
          display: "flex", alignItems: "center", gap: "0.25rem",
        }}>
          <TipoIcon size={11} />
          <span style={{ fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: tipo.color }}>
            {tipo.label}
          </span>
        </div>
      </div>

      {/* Etiqueta */}
      {data.label && (
        <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "#0f172a", marginBottom: "0.25rem" }}>
          {data.label}
        </div>
      )}

      {/* Preview del contenido */}
      <div style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.4, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 72, overflow: "hidden" }}>
        {preview}
      </div>

      {/* Botones con handles individuales */}
      {tieneBots && (
        <div style={{ marginTop: "0.625rem", display: "flex", flexDirection: "column", gap: "0.375rem", position: "relative" }}>
          <div style={{ fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "0.125rem" }}>
            Botones
          </div>
          {botones.map((btn, i) => {
            const pct = botones.length === 1
              ? 50
              : 20 + (60 / (botones.length - 1)) * i
            return (
              <div key={btn.id} style={{ position: "relative" }}>
                <div style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 6,
                  padding: "0.3rem 0.625rem",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "#1d4ed8",
                  textAlign: "center",
                }}>
                  {btn.texto || `Opción ${i + 1}`}
                </div>
                <Handle
                  type="source"
                  position={Position.Bottom}
                  id={btn.id}
                  style={{
                    background: "#3b82f6",
                    width: 9,
                    height: 9,
                    bottom: -12,
                    left: `${pct}%`,
                    transform: "translateX(-50%)",
                    border: "2px solid #fff",
                  }}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Handle de salida simple — cuando no hay botones y no es fin */}
      {!tieneBots && data.tipo !== "fin" && (
        <Handle type="source" position={Position.Bottom}
          style={{ background: tipo.color, width: 10, height: 10, bottom: -6 }} />
      )}
    </div>
  )
}
