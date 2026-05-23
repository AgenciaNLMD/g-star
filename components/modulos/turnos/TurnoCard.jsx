const ESTADO_CFG = {
  pedido:     { label: "Pedido",     cls: "badge--purple"  },
  pendiente:  { label: "Pendiente",  cls: "badge--warning" },
  asignado:   { label: "Asignado",   cls: "badge--info"    },
  confirmado: { label: "Confirmado", cls: "badge--primary" },
  completado: { label: "Completado", cls: "badge--success" },
  cancelado:  { label: "Cancelado",  cls: "badge--muted"   },
  ausente:    { label: "Ausente",    cls: "badge--danger"  },
}

const AVATAR_PAIRS = [
  { bg: "#fce7f3", fg: "#9d174d" },
  { bg: "#dbeafe", fg: "#1e40af" },
  { bg: "#dcfce7", fg: "#166534" },
  { bg: "#fef3c7", fg: "#854d0e" },
  { bg: "#ede9fe", fg: "#5b21b6" },
  { bg: "#ffe4e6", fg: "#9f1239" },
  { bg: "#D1FAE5", fg: "#065F46" },
  { bg: "#FEF9C3", fg: "#713f12" },
]

function getAvatar(nombre) {
  return AVATAR_PAIRS[(nombre?.charCodeAt(0) ?? 0) % AVATAR_PAIRS.length]
}

function getInitials(nombre) {
  if (!nombre) return "?"
  const parts = nombre.trim().split(" ").filter(Boolean)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getUrgencia(createdAt) {
  if (!createdAt) return { cls: "nuevo", label: "Nuevo", borderColor: "#10B981" }
  const hs = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
  if (hs >= 72) return { cls: "urgente",   label: "Urgente",   borderColor: "#EF4444" }
  if (hs >= 24) return { cls: "prioridad", label: "Prioridad", borderColor: "#F59E0B" }
  return { cls: "nuevo", label: "Nuevo", borderColor: "#10B981" }
}

function formatAge(createdAt) {
  if (!createdAt) return ""
  const hs = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
  if (hs < 1)   return "hace unos min"
  if (hs < 24)  return `hace ${Math.floor(hs)}h`
  const d = Math.floor(hs / 24)
  return d === 1 ? "ayer" : `hace ${d}d`
}

// ── Versión compacta (para slots del calendario) ──────────────────────────────

function TurnoCardCompact({ turno, onClick, draggable, onDragStart }) {
  function handleDragStart(e) {
    e.dataTransfer.setData("turnoId", turno.id)
    e.dataTransfer.effectAllowed = "move"
    if (onDragStart) onDragStart(turno)
  }
  return (
    <div
      className={`turno-card${draggable ? " turno-card--draggable" : ""}`}
      onClick={onClick}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      title={`${turno.nombre} — ${turno.tramite}`}
    >
      <div className="turno-card__nombre">{turno.nombre}</div>
      <div className="turno-card__tramite">{turno.tramite}</div>
    </div>
  )
}

// ── Versión lista (panel de solicitantes) ─────────────────────────────────────

export default function TurnoCard({ turno, onClick, compact = false, draggable = false, onDragStart }) {
  if (compact) {
    return <TurnoCardCompact turno={turno} onClick={onClick} draggable={draggable} onDragStart={onDragStart} />
  }

  const avatar   = getAvatar(turno.nombre)
  const initials = getInitials(turno.nombre)
  const urgencia = getUrgencia(turno.createdAt)
  const age      = formatAge(turno.createdAt)

  function handleDragStart(e) {
    e.dataTransfer.setData("turnoId", turno.id)
    e.dataTransfer.effectAllowed = "move"
    if (onDragStart) onDragStart(turno)
  }

  return (
    <div
      className={`req-card${draggable ? " req-card--draggable" : ""}`}
      style={{ borderLeftColor: urgencia.borderColor }}
      onClick={onClick}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
    >
      <div className="req-avatar" style={{ background: avatar.bg, color: avatar.fg }}>
        {initials}
      </div>

      <div className="req-info">
        <div className="req-name">{turno.nombre}</div>
        <div className="req-meta">
          {turno.dni && <span>DNI {turno.dni}</span>}
          {turno.dni && age && <span className="req-sep">·</span>}
          {age && <span>{age}</span>}
        </div>
        <div className="req-tags">
          {urgencia.cls === "urgente"   && <span className="req-tag req-tag--urgente">● Urgente</span>}
          {urgencia.cls === "prioridad" && <span className="req-tag req-tag--prioridad">Prioridad</span>}
          {urgencia.cls === "nuevo"     && <span className="req-tag req-tag--new">Nuevo</span>}
          {turno.tramite && <span className="req-tag">{turno.tramite}</span>}
        </div>
      </div>

      <span className="req-grip">⋮⋮</span>
    </div>
  )
}

export { ESTADO_CFG }
