"use client"
import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { IcoBrain, IcoSparkles, IcoZap, IcoUsers } from "@/components/ui/Icons"

// ── Helpers ───────────────────────────────────────────────────────────────────

const TOOL_LABELS = {
  solicitar_turno:     "Agendar turno",
  crear_reclamo:       "Registrar reclamo",
  transferir_a_area:   "Derivar a otro agente",
  transferir_a_humano: "Derivar a operador",
  sin_cobertura:       "Sin cobertura",
  fin_conversacion:    "Finalizar",
}

const PROV_COLOR = { anthropic: "#d97706", openai: "#16a34a" }
const PROV_LABEL = { anthropic: "Claude", openai: "GPT" }

// ── Componente de flecha SVG ──────────────────────────────────────────────────

function Flecha({ horizontal = true }) {
  if (horizontal) return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 4px", flexShrink: 0 }}>
      <svg width="36" height="16" viewBox="0 0 36 16" fill="none">
        <line x1="0" y1="8" x2="28" y2="8" stroke="#cbd5e1" strokeWidth="1.5" />
        <polygon points="28,4 36,8 28,12" fill="#cbd5e1" />
      </svg>
    </div>
  )
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4px 0", flexShrink: 0 }}>
      <svg width="16" height="28" viewBox="0 0 16 28" fill="none">
        <line x1="8" y1="0" x2="8" y2="20" stroke="#cbd5e1" strokeWidth="1.5" />
        <polygon points="4,20 8,28 12,20" fill="#cbd5e1" />
      </svg>
    </div>
  )
}

// ── Nodo WhatsApp ─────────────────────────────────────────────────────────────

function NodoWsp() {
  return (
    <div style={{
      background: "#dcfce7",
      border: "1.5px solid #86efac",
      borderRadius: 10,
      padding: "0.625rem 0.875rem",
      minWidth: 120,
      textAlign: "center",
      flexShrink: 0,
    }}>
      <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>📱</div>
      <div style={{ fontSize: "0.625rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#15803d" }}>WhatsApp</div>
      <div style={{ fontSize: "0.5625rem", color: "#16a34a", marginTop: "0.15rem" }}>Mensaje entrante</div>
    </div>
  )
}

// ── Nodo Orquestador ──────────────────────────────────────────────────────────

function NodoOrquestador({ agente }) {
  const prov  = agente?.proveedor ?? "anthropic"
  const color = PROV_COLOR[prov] ?? "#7c3aed"
  const label = PROV_LABEL[prov] ?? prov

  return (
    <div style={{
      background: "#faf5ff",
      border: "2px solid #7c3aed",
      borderRadius: 12,
      padding: "0.75rem 1rem",
      minWidth: 200,
      maxWidth: 240,
      flexShrink: 0,
      boxShadow: "0 4px 16px #7c3aed18",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <div style={{ background: "#7c3aed18", border: "1px solid #7c3aed33", borderRadius: 6, padding: "0.2rem 0.4rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <IcoBrain size={11} style={{ color: "#7c3aed" }} />
          <span style={{ fontSize: "0.5rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7c3aed" }}>Orquestador</span>
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "#0f172a", marginBottom: "0.25rem" }}>
        {agente?.nombre ?? "Sin orquestador"}
      </div>

      {agente ? (
        <>
          <div style={{ fontSize: "0.5625rem", color: "#94a3b8", background: "#f8fafc", borderRadius: 5, padding: "0.25rem 0.375rem", marginBottom: "0.375rem", lineHeight: 1.5, maxHeight: 52, overflow: "hidden" }}>
            {agente.sistemaPrompt?.slice(0, 120)}{agente.sistemaPrompt?.length > 120 ? "…" : ""}
          </div>
          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.5rem", fontWeight: 700, background: color + "15", color, border: `1px solid ${color}33`, borderRadius: 4, padding: "0.1rem 0.35rem" }}>
              {label} {agente.modelo ? `· ${agente.modelo.split("-")[0]}` : ""}
            </span>
            <span style={{ fontSize: "0.5rem", fontWeight: 700, background: "#7c3aed15", color: "#7c3aed", border: "1px solid #7c3aed33", borderRadius: 4, padding: "0.1rem 0.35rem" }}>
              derivar_a_area · responder
            </span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: "0.6875rem", color: "#f59e0b", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "0.375rem 0.5rem" }}>
          ⚠️ Creá un agente con tipo <strong>Orquestador</strong> en Conexiones
        </div>
      )}
    </div>
  )
}

// ── Nodo Agente de Área ───────────────────────────────────────────────────────

function NodoArea({ agente }) {
  const prov  = agente.proveedor ?? "anthropic"
  const color = PROV_COLOR[prov] ?? "#64748b"
  const label = PROV_LABEL[prov] ?? prov
  const tools = Array.isArray(agente.herramientas) ? agente.herramientas : []

  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #e2e8f0",
      borderRadius: 10,
      padding: "0.625rem 0.875rem",
      minWidth: 190,
      maxWidth: 220,
      flexShrink: 0,
      transition: "border-color 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
        <div style={{ background: "#a855f715", border: "1px solid #a855f733", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IcoBrain size={13} style={{ color: "#a855f7" }} />
        </div>
        <div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "#0f172a", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {agente.nombre}
        </div>
      </div>

      {agente.keywords && (
        <div style={{ fontSize: "0.5rem", color: "#7c3aed", background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 4, padding: "0.15rem 0.4rem", marginBottom: "0.3rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          🔑 {agente.keywords}
        </div>
      )}

      {agente.conocimiento && (
        <div style={{ fontSize: "0.5rem", color: "#64748b", marginBottom: "0.3rem" }}>
          📄 {agente.conocimiento.length.toLocaleString()} chars de conocimiento
        </div>
      )}

      {tools.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem" }}>
          {tools.map((t) => (
            <span key={t} style={{ fontSize: "0.475rem", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 4, padding: "0.1rem 0.3rem", fontWeight: 600 }}>
              {TOOL_LABELS[t] ?? t}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: "0.3rem" }}>
        <span style={{ fontSize: "0.475rem", background: color + "12", color, border: `1px solid ${color}33`, borderRadius: 4, padding: "0.1rem 0.35rem", fontWeight: 700 }}>
          {label} {agente.modelo ? `· ${agente.modelo.split("-")[0]}` : ""}
        </span>
      </div>
    </div>
  )
}

// ── Nodo Humano ───────────────────────────────────────────────────────────────

function NodoHumano() {
  return (
    <div style={{
      background: "#fff7ed",
      border: "1.5px solid #fed7aa",
      borderRadius: 10,
      padding: "0.5rem 0.75rem",
      textAlign: "center",
      flexShrink: 0,
      minWidth: 120,
    }}>
      <div style={{ fontSize: "1rem", marginBottom: "0.15rem" }}>👤</div>
      <div style={{ fontSize: "0.5625rem", fontWeight: 700, color: "#c2410c" }}>Operador humano</div>
      <div style={{ fontSize: "0.5rem", color: "#ea580c", marginTop: "0.1rem" }}>transferir_a_humano</div>
    </div>
  )
}

function NodoDB() {
  return (
    <div style={{
      background: "#eff6ff",
      border: "1.5px solid #bfdbfe",
      borderRadius: 10,
      padding: "0.5rem 0.75rem",
      textAlign: "center",
      flexShrink: 0,
      minWidth: 120,
    }}>
      <div style={{ fontSize: "1rem", marginBottom: "0.15rem" }}>🗄️</div>
      <div style={{ fontSize: "0.5625rem", fontWeight: 700, color: "#1e40af" }}>Base de datos</div>
      <div style={{ fontSize: "0.5rem", color: "#3b82f6", marginTop: "0.1rem" }}>Turnos · Reclamos</div>
    </div>
  )
}

// ── Leyenda de herramientas ───────────────────────────────────────────────────

function Leyenda() {
  const items = [
    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Capacidades del agente de área" },
    { color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff", label: "Keywords de activación" },
    { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Proveedor Claude (Anthropic)" },
    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Proveedor OpenAI / GPT" },
  ]
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem", padding: "0.75rem 1rem", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
      {items.map(({ color, bg, border, label }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.6rem", color: "#475569" }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: bg, border: `1px solid ${border}` }} />
          {label}
        </div>
      ))}
    </div>
  )
}

// ── Sección de flujo paso a paso ──────────────────────────────────────────────

function PasoAPaso() {
  const pasos = [
    { n: 1, titulo: "Mensaje entrante", desc: "El vecino envía un WhatsApp. El webhook lo recibe y guarda en la DB." },
    { n: 2, titulo: "¿Tiene área activa?", desc: "Si el contacto ya estaba hablando con un área específica, va directo a ese agente." },
    { n: 3, titulo: "Orquestador", desc: "Si no hay área activa, el orquestador analiza el mensaje y elige: derivar a un área o responder directamente." },
    { n: 4, titulo: "Agente de área", desc: "El agente especializado conversa usando su conocimiento. Puede derivar a otro agente de área si el vecino cambia de tema." },
    { n: 5, titulo: "Acciones", desc: "El agente crea turnos, reclamos, deriva a un operador, registra consultas sin cobertura o cierra la conversación." },
    { n: 6, titulo: "Inactividad", desc: "Si el vecino no responde, el agente envía un recordatorio. Si persiste la inactividad, cierra la consulta automáticamente." },
  ]

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: "0.75rem" }}>
        Cómo funciona
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {pasos.map(({ n, titulo, desc }) => (
          <div key={n} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, flexShrink: 0, marginTop: "0.1rem" }}>
              {n}
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f172a" }}>{titulo}</div>
              <div style={{ fontSize: "0.6875rem", color: "#64748b", lineHeight: 1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────

export default function AgentesView() {
  const [agentes, setAgentes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAgentes = useCallback(async () => {
    try {
      const d = await api.get("/api/flows/agentes")
      setAgentes(Array.isArray(d) ? d : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAgentes() }, [fetchAgentes])

  const orquestador = agentes.find((a) => a.esOrquestador) ?? null
  const areasActivas = agentes.filter((a) => !a.esOrquestador && a.activo)
  const areasInactivas = agentes.filter((a) => !a.esOrquestador && !a.activo)

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  )

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <div>
          <span className="card__title">Sistema de agentes</span>
          <p className="text-sm text-muted" style={{ marginTop: "0.25rem" }}>
            Diagrama de cómo fluye cada mensaje de WhatsApp a través del sistema de IA
          </p>
        </div>
        <button className="btn btn--secondary btn--sm" onClick={fetchAgentes}>
          Actualizar
        </button>
      </div>

      <div style={{ padding: "0 1.25rem 1.5rem" }}>

        {/* ── Diagrama principal ── */}
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: "1.5rem",
          overflowX: "auto",
        }}>

          {/* Fila 1: WSP → Orquestador → Áreas */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "nowrap" }}>
            <NodoWsp />
            <Flecha />
            <NodoOrquestador agente={orquestador} />

            {areasActivas.length > 0 && (
              <>
                <Flecha />
                {/* Stack vertical de áreas */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {areasActivas.map((ag, i) => (
                    <div key={ag.id} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                      {/* Línea de conexión vertical — solo visual, la flecha ya indica dirección */}
                      <NodoArea agente={ag} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {areasActivas.length === 0 && (
              <>
                <Flecha />
                <div style={{ background: "#fffbeb", border: "1px dashed #fde68a", borderRadius: 10, padding: "0.75rem 1rem", maxWidth: 200, fontSize: "0.6875rem", color: "#92400e" }}>
                  ⚠️ No hay agentes de área activos.<br />
                  Creá uno en <strong>Conexiones → Agentes</strong>.
                </div>
              </>
            )}
          </div>

          {/* Fila 2: área → acciones */}
          {areasActivas.length > 0 && (
            <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px dashed #e2e8f0" }}>
              <div style={{ fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8", marginBottom: "0.75rem" }}>
                Acciones disponibles para los agentes de área
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <NodoDB />
                <div style={{ fontSize: "0.5625rem", color: "#94a3b8" }}>
                  crear_reclamo<br />solicitar_turno
                </div>
                <div style={{ width: 1, height: 40, background: "#e2e8f0" }} />
                <NodoHumano />
              </div>
            </div>
          )}
        </div>

        <Leyenda />

        {/* Agentes inactivos */}
        {areasInactivas.length > 0 && (
          <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", marginBottom: "0.5rem" }}>
              Agentes inactivos (no participan en el flujo)
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {areasInactivas.map((ag) => (
                <span key={ag.id} style={{ fontSize: "0.6875rem", color: "#94a3b8", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.2rem 0.5rem" }}>
                  {ag.nombre}
                </span>
              ))}
            </div>
          </div>
        )}

        <PasoAPaso />
      </div>
    </div>
  )
}
