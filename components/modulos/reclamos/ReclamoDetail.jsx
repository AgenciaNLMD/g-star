"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import ReclamoStatusBadge from "./ReclamoStatusBadge"
import { api } from "@/lib/api-client"
import { formatFechaHora, tiempoRelativo } from "@/lib/utils"
import {
  IcoTrash, IcoWhatsApp, IcoMail, IcoUser, IcoChevronUp, IcoChevronDown, IcoClipboard,
} from "@/components/ui/Icons"

// ── Iconos internos ────────────────────────────────────────────────
function IcoPresencial() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IcoPrint() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
}

function IcoArrowUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}

// ── Canal badge ────────────────────────────────────────────────────
function CanalBadge({ canal }) {
  const cfg = {
    whatsapp:   { icon: <IcoWhatsApp size={11} />, label: "WhatsApp", cls: "badge--canal-whatsapp" },
    email:      { icon: <IcoMail     size={11} />, label: "Email",    cls: "badge--canal-email"    },
    presencial: { icon: <IcoPresencial />,         label: "Presencial", cls: "badge--canal-presencial" },
  }[canal] ?? { icon: null, label: canal, cls: "badge--muted" }

  return (
    <span className={`badge ${cfg.cls}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
      {cfg.icon}{cfg.label}
    </span>
  )
}

// ── Sección del detalle ────────────────────────────────────────────
function Section({ titulo, children }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <h4 className="text-xs font-semi text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
        {titulo}
      </h4>
      {children}
    </div>
  )
}

function Campo({ label, valor }) {
  if (!valor) return null
  return (
    <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
      <span className="text-muted" style={{ minWidth: 88 }}>{label}:</span>
      <span>{valor}</span>
    </div>
  )
}

// ── Modal: Elevar al área ──────────────────────────────────────────
function ModalElevar({ onClose, onConfirm, guardando }) {
  const [area, setArea] = useState("")
  const [nota, setNota] = useState("")

  function submit(e) {
    e.preventDefault()
    if (!area.trim()) return
    onConfirm({ areaDestinataria: area.trim(), notas: nota })
  }

  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" style={{ maxWidth: 440 }}>
        <div className="dialog__header">
          <h3 className="dialog__title">Elevar al área</h3>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="dialog__body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="input-group">
              <label>Área destinataria *</label>
              <input
                className="input"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ej: Dirección de Vialidad"
                autoFocus
                required
              />
            </div>
            <div className="input-group">
              <label>Nota interna (opcional)</label>
              <textarea
                className="input"
                rows={2}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Observaciones para el área…"
                style={{ resize: "vertical" }}
              />
            </div>
          </div>
          <div className="dialog__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={guardando || !area.trim()}>
              {guardando ? "Elevando…" : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal: Cambio de estado con nota ──────────────────────────────
function ModalEstado({ nuevoEstado, label, onClose, onConfirm, guardando }) {
  const [nota, setNota] = useState("")

  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" style={{ maxWidth: 400 }}>
        <div className="dialog__header">
          <h3 className="dialog__title">{label}</h3>
          <button className="btn btn--ghost btn--icon" onClick={onClose}>✕</button>
        </div>
        <div className="dialog__body">
          <div className="input-group">
            <label>Nota interna (opcional)</label>
            <textarea
              className="input"
              rows={3}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Observaciones sobre este cambio…"
              style={{ resize: "vertical" }}
              autoFocus
            />
          </div>
        </div>
        <div className="dialog__footer">
          <button className="btn btn--secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button className="btn btn--primary" onClick={() => onConfirm(nota)} disabled={guardando}>
            {guardando ? "Guardando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────
export default function ReclamoDetail({ reclamo, loading, onActualizar, equipos }) {
  const { data: session } = useSession()
  const [guardando,      setGuardando]      = useState(false)
  const [logExpandido,   setLogExpandido]   = useState(false)
  const [modalElevar,    setModalElevar]    = useState(false)
  const [modalEstado,    setModalEstado]    = useState(null)

  // — Vacío / loading —
  if (loading) {
    return (
      <div className="reclamos-detail" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!reclamo) {
    return (
      <div className="reclamos-detail">
        <div className="empty-state" style={{ marginTop: "4rem" }}>
          <div className="empty-state__icon"><IcoClipboard size={40} /></div>
          <p className="empty-state__title">Seleccioná un reclamo</p>
          <p className="text-sm text-muted">Elegí un reclamo de la lista para ver su detalle.</p>
        </div>
      </div>
    )
  }

  const esAdmin   = session?.user?.rol === "admin"
  const userId    = session?.user?.id
  const estado    = reclamo.estado
  const historial = reclamo.historial ?? []

  // — Acciones de flujo —
  async function accionTomar() {
    setGuardando(true)
    try {
      await api.put(`/api/reclamos/${reclamo.id}`, { accion: "tomar" })
      onActualizar()
    } catch (e) { alert(e.message) }
    finally { setGuardando(false) }
  }

  async function accionElevar({ areaDestinataria, notas }) {
    setGuardando(true)
    try {
      await api.put(`/api/reclamos/${reclamo.id}`, { accion: "elevar", areaDestinataria, notas })
      setModalElevar(false)
      onActualizar()
    } catch (e) { alert(e.message) }
    finally { setGuardando(false) }
  }

  async function cambiarEstado(nuevoEstado, notas) {
    setGuardando(true)
    try {
      await api.put(`/api/reclamos/${reclamo.id}`, { estado: nuevoEstado, notas })
      setModalEstado(null)
      onActualizar()
    } catch (e) { alert(e.message) }
    finally { setGuardando(false) }
  }

  async function eliminar() {
    if (!confirm("¿Eliminar este reclamo? Esta acción no se puede deshacer.")) return
    setGuardando(true)
    try {
      await api.del(`/api/reclamos/${reclamo.id}`)
      onActualizar(null)
    } catch (e) { alert(e.message) }
    finally { setGuardando(false) }
  }

  function imprimir() { window.print() }

  return (
    <div className="reclamos-detail">

      {/* ── Ficha principal ─────────────────────────────────────── */}
      <div className="reclamo-detail__card">

        {/* Cabecera */}
        <div className="reclamo-detail__top">
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.375rem" }}>
              <span className="text-xs font-semi text-muted" style={{ fontFamily: "var(--font-mono)" }}>#{reclamo.numero}</span>
              <ReclamoStatusBadge estado={estado} />
              <CanalBadge canal={reclamo.canal} />
              {reclamo.etiqueta && reclamo.etiqueta !== "General" && (
                <span className="badge badge--primary">{reclamo.etiqueta}</span>
              )}
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.25rem" }}>{reclamo.asunto}</h3>
            <p className="text-xs text-muted">{formatFechaHora(reclamo.createdAt)}</p>
            {reclamo.equipo && (
              <div style={{ marginTop: "0.375rem" }}>
                <span className="reclamo-equipo-badge" style={{ "--equipo-color": reclamo.equipo.color }}>
                  {reclamo.equipo.nombre}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.375rem", alignItems: "flex-start" }}>
            {(estado === "tomado") && (
              <button
                className="btn btn--ghost btn--sm"
                onClick={imprimir}
                title="Imprimir ficha"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              >
                <IcoPrint /> Imprimir
              </button>
            )}
            {esAdmin && (
              <button
                className="btn btn--ghost btn--sm btn--icon"
                onClick={eliminar}
                disabled={guardando}
                title="Eliminar reclamo"
                style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center" }}
              >
                <IcoTrash size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Barra de acciones de flujo */}
        <div className="reclamo-acciones">
          {estado === "entrante" && (
            <button
              className="btn btn--primary reclamo-accion-btn"
              onClick={accionTomar}
              disabled={guardando}
            >
              <IcoUser size={14} /> Tomar reclamo
            </button>
          )}

          {estado === "tomado" && (
            <>
              <button
                className="btn btn--primary reclamo-accion-btn"
                onClick={() => setModalElevar(true)}
                disabled={guardando}
              >
                <IcoArrowUp /> Elevar al área
              </button>
              <button
                className="btn btn--secondary reclamo-accion-btn"
                onClick={() => setModalEstado({ nuevoEstado: "resuelto", label: "Marcar como resuelto" })}
                disabled={guardando}
              >
                Marcar resuelto
              </button>
              <button
                className="btn btn--ghost reclamo-accion-btn"
                onClick={() => setModalEstado({ nuevoEstado: "cerrado", label: "Cerrar reclamo" })}
                disabled={guardando}
              >
                Cerrar
              </button>
            </>
          )}

          {estado === "elevado" && (
            <>
              <div className="reclamo-area-chip">
                <IcoArrowUp />
                <span>Área: <strong>{reclamo.areaDestinataria}</strong></span>
                {reclamo.elevadoPor && <span className="text-muted">· por {reclamo.elevadoPor.nombre}</span>}
              </div>
              <button
                className="btn btn--primary reclamo-accion-btn"
                onClick={() => setModalEstado({ nuevoEstado: "en_proceso", label: "Marcar en proceso" })}
                disabled={guardando}
              >
                En proceso
              </button>
              <button
                className="btn btn--secondary reclamo-accion-btn"
                onClick={() => setModalEstado({ nuevoEstado: "resuelto", label: "Marcar como resuelto" })}
                disabled={guardando}
              >
                Resuelto
              </button>
              <button
                className="btn btn--ghost reclamo-accion-btn"
                onClick={() => setModalEstado({ nuevoEstado: "cerrado", label: "Cerrar reclamo" })}
                disabled={guardando}
              >
                Cerrar
              </button>
            </>
          )}

          {estado === "en_proceso" && (
            <>
              {reclamo.areaDestinataria && (
                <div className="reclamo-area-chip">
                  <span>Área: <strong>{reclamo.areaDestinataria}</strong></span>
                </div>
              )}
              <button
                className="btn btn--success reclamo-accion-btn"
                onClick={() => setModalEstado({ nuevoEstado: "resuelto", label: "Marcar como resuelto" })}
                disabled={guardando}
              >
                Marcar resuelto
              </button>
              <button
                className="btn btn--ghost reclamo-accion-btn"
                onClick={() => setModalEstado({ nuevoEstado: "cerrado", label: "Cerrar reclamo" })}
                disabled={guardando}
              >
                Cerrar
              </button>
            </>
          )}

          {estado === "resuelto" && (
            <button
              className="btn btn--secondary reclamo-accion-btn"
              onClick={() => setModalEstado({ nuevoEstado: "cerrado", label: "Cerrar reclamo" })}
              disabled={guardando}
            >
              Cerrar reclamo
            </button>
          )}
        </div>

        {/* Cuerpo de la ficha */}
        <div className="reclamo-detail__body">

          {/* Tomado por */}
          {reclamo.tomadoPor && (
            <Section titulo="Tomado por">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {reclamo.tomadoPor.image
                  ? <img src={reclamo.tomadoPor.image} style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} alt="" />
                  : <div className="usuario-avatar" style={{ width: 24, height: 24, fontSize: "0.6rem" }}><IcoUser size={12} /></div>
                }
                <span className="text-sm">{reclamo.tomadoPor.nombre}</span>
                {reclamo.tomadoAt && (
                  <span className="text-xs text-muted">{tiempoRelativo(reclamo.tomadoAt)}</span>
                )}
              </div>
            </Section>
          )}

          {/* Ciudadano */}
          {!reclamo.esAnonimo && (reclamo.contactoNombre || reclamo.contactoTelefono || reclamo.contactoEmail) ? (
            <Section titulo="Ciudadano">
              <Campo label="Nombre"    valor={reclamo.contactoNombre} />
              <Campo label="Teléfono"  valor={reclamo.contactoTelefono} />
              <Campo label="Email"     valor={reclamo.contactoEmail} />
            </Section>
          ) : reclamo.esAnonimo ? (
            <Section titulo="Ciudadano">
              <span className="badge badge--muted">Anónimo</span>
            </Section>
          ) : null}

          {/* Ubicación */}
          {(reclamo.direccion || reclamo.barrio || reclamo.localidad) && (
            <Section titulo="Ubicación">
              <Campo label="Dirección" valor={reclamo.direccion} />
              <Campo label="Barrio"    valor={reclamo.barrio} />
              <Campo label="Localidad" valor={reclamo.localidad} />
              {reclamo.lat && reclamo.lng && (
                <Campo label="Coords" valor={`${reclamo.lat.toFixed(5)}, ${reclamo.lng.toFixed(5)}`} />
              )}
            </Section>
          )}

          {/* Descripción */}
          <Section titulo="Descripción">
            <p className="text-sm" style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {reclamo.texto || <span className="text-muted">Sin descripción.</span>}
            </p>
          </Section>

          {/* Adjuntos */}
          {reclamo.adjuntos?.length > 0 && (
            <Section titulo={`Adjuntos (${reclamo.adjuntos.length})`}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {reclamo.adjuntos.map((adj, i) => (
                  <a
                    key={i}
                    href={adj.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`btn btn--secondary btn--sm ${adj.tipo === "recibo" ? "reclamo-recibo-btn" : ""}`}
                  >
                    {adj.tipo === "recibo" ? "🧾" : "📎"} {adj.nombre ?? `Adjunto ${i + 1}`}
                  </a>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* ── Log expandible al pie ─────────────────────────────── */}
      <div className={`reclamo-log-bar${logExpandido ? " reclamo-log-bar--expanded" : ""}`}>
        <button
          className="reclamo-log-bar__toggle"
          onClick={() => setLogExpandido((v) => !v)}
        >
          <span className="reclamo-log-bar__label">
            {logExpandido ? <IcoChevronDown size={13} /> : <IcoChevronUp size={13} />}
            Historial
            <span className="reclamo-log-bar__count">{historial.length}</span>
          </span>
        </button>

        {logExpandido && (
          <div className="reclamo-log-bar__panel">
            {historial.length === 0 ? (
              <p className="text-xs text-muted" style={{ padding: "0.75rem 1rem" }}>Sin eventos.</p>
            ) : (
              <div className="reclamo-log-list">
                {historial.map((h, i) => (
                  <div key={i} className="historial-item">
                    <div className="historial-item__dot" />
                    <div className="historial-item__content">
                      <div className="historial-item__accion">{h.accion}</div>
                      {h.detalle && <div className="historial-item__detalle">{h.detalle}</div>}
                      <div className="historial-item__detalle">{h.usuario ?? "Sistema"}</div>
                    </div>
                    <div className="historial-item__fecha">{tiempoRelativo(h.fecha)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modales ──────────────────────────────────────────────── */}
      {modalElevar && (
        <ModalElevar
          onClose={() => setModalElevar(false)}
          onConfirm={accionElevar}
          guardando={guardando}
        />
      )}

      {modalEstado && (
        <ModalEstado
          nuevoEstado={modalEstado.nuevoEstado}
          label={modalEstado.label}
          onClose={() => setModalEstado(null)}
          onConfirm={(nota) => cambiarEstado(modalEstado.nuevoEstado, nota)}
          guardando={guardando}
        />
      )}
    </div>
  )
}
