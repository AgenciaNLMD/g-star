"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { api } from "@/lib/api-client"
import { IcoMessageCircle, IcoSparkles, IcoUser } from "@/components/ui/Icons"

function iniciales(str) {
  if (!str) return "?"
  return str.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

const FLUJO_LABELS = {
  menu: "Menú", anses: "ANSES", renaper: "RENAPER",
  migraciones: "Migraciones", turnos: "Turnos",
  reclamos: "Reclamos", operativo: "Operativo",
}

function Burbuja({ msg }) {
  const esEntrante = msg.direccion === "entrante"
  return (
    <div className={`eapi-message${esEntrante ? " eapi-message--in" : " eapi-message--out"}`}
      style={{ borderRadius: "var(--radius-lg)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {msg.texto}
      <span className="eapi-message__time">
        {new Date(msg.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
        {!esEntrante && (msg.estado === "leido" || msg.estado === "entregado" ? " ✓✓" : " ✓")}
      </span>
    </div>
  )
}

export default function ChatView({ conversacionId, onMensajeEnviado, onConvActualizada }) {
  const [conv, setConv]         = useState(null)
  const [texto, setTexto]       = useState("")
  const [loading, setLoading]   = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [toggling, setToggling] = useState(false)
  const bottomRef = useRef(null)
  const prevCountRef = useRef(0)

  const fetchConv = useCallback(async (silencioso = false) => {
    if (!conversacionId) return
    if (!silencioso) setLoading(true)
    try {
      const data = await api.get(`/api/eapi/conversaciones/${conversacionId}`)
      setConv(data)
      if (data.mensajes?.length !== prevCountRef.current) {
        prevCountRef.current = data.mensajes?.length ?? 0
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (!silencioso) setLoading(false)
    }
  }, [conversacionId])

  // Carga inicial
  useEffect(() => {
    setConv(null)
    prevCountRef.current = 0
    fetchConv()
  }, [fetchConv])

  // Auto-refresh cada 3s
  useEffect(() => {
    if (!conversacionId) return
    const interval = setInterval(() => fetchConv(true), 3000)
    return () => clearInterval(interval)
  }, [conversacionId, fetchConv])

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim() || !conversacionId) return
    setEnviando(true)
    try {
      await api.post("/api/eapi/enviar", { conversacionId, texto: texto.trim() })
      setTexto("")
      fetchConv(true)
      onMensajeEnviado?.()
    } catch (err) {
      alert(err.message)
    } finally {
      setEnviando(false)
    }
  }

  async function toggleBot() {
    if (!conv?.contactoTel) return
    setToggling(true)
    try {
      const nuevoModo = !conv.contacto?.modoBot
      await api.patch(`/api/eapi/contactos/${conv.contactoTel}`, { modoBot: nuevoModo })
      await fetchConv(true)
      onConvActualizada?.()
    } catch (e) {
      alert(e.message)
    } finally {
      setToggling(false)
    }
  }

  if (!conversacionId) {
    return (
      <div className="eapi-chat" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
          <div style={{ opacity: 0.3, marginBottom: "0.5rem" }}><IcoMessageCircle size={40} /></div>
          <p style={{ fontWeight: 500 }}>Seleccioná una conversación</p>
          <p style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>Elegí un contacto de la lista para ver el chat.</p>
        </div>
      </div>
    )
  }

  const modoBot   = conv?.contacto?.modoBot ?? true
  const flujoLabel = FLUJO_LABELS[conv?.contacto?.flujoActual] ?? null
  const mensajes  = conv?.mensajes ?? []

  return (
    <div className="eapi-chat">
      {/* Header */}
      <div className="eapi-chat__header">
        <div className="conversation-item__avatar" style={{ width: 36, height: 36, flexShrink: 0 }}>
          {iniciales(conv?.contactoNombre || conv?.contactoTel)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {conv?.contactoNombre || conv?.contactoTel}
            {flujoLabel && (
              <span className="badge badge--primary" style={{ fontSize: "0.6rem" }}>{flujoLabel}</span>
            )}
          </div>
          <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
            {conv?.contactoTel}
          </div>
        </div>
        <button
          className={`btn btn--sm ${modoBot ? "btn--secondary" : "btn--warning"}`}
          onClick={toggleBot}
          disabled={toggling || !conv}
          title={modoBot ? "El bot responde automáticamente. Click para tomar control." : "Estás en control manual. Click para reactivar el bot."}
        >
          {toggling ? "…" : modoBot
            ? <><IcoSparkles size={12} style={{ marginRight: "0.25rem" }} /> Bot activo</>
            : <><IcoUser size={12} style={{ marginRight: "0.25rem" }} /> Control manual</>
          }
        </button>
      </div>

      {/* Mensajes */}
      <div className="eapi-messages">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            <div className="spinner" />
          </div>
        ) : mensajes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
            Sin mensajes aún
          </div>
        ) : (
          mensajes.map((m) => <Burbuja key={m.id} msg={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="eapi-input" onSubmit={enviar}>
        {!modoBot && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 0)", left: 0, right: 0,
            background: "var(--color-warning-bg, #fff8e1)",
            borderTop: "1px solid var(--color-warning, #f59e0b)",
            padding: "0.375rem 1.25rem",
            fontSize: "0.75rem",
            color: "var(--color-warning-dark, #92400e)",
          }}>
            Control manual activado — el bot no responde
          </div>
        )}
        <textarea
          className="input"
          placeholder={modoBot ? "Escribí un mensaje (el bot responde automáticamente)…" : "Escribí un mensaje…"}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={enviando}
          rows={1}
          style={{ resize: "none", flex: 1 }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(e) }
          }}
        />
        <button type="submit" className="btn btn--primary" disabled={enviando || !texto.trim()}>
          {enviando ? "…" : "Enviar"}
        </button>
      </form>
    </div>
  )
}
