"use client"
import { IcoPencil, IcoTrash } from "@/components/ui/Icons"

const TIPO_CFG = {
  reunion:    { label: "Reunión",     cls: "badge--primary" },
  tarea:      { label: "Tarea",       cls: "badge--info"    },
  recordatorio: { label: "Recordatorio", cls: "badge--muted" },
  evento:     { label: "Evento",      cls: "badge--success" },
}

export default function AgendaItem({ evento, onEditar, onEliminar, compacto = false }) {
  const cfg = TIPO_CFG[evento.tipo] ?? { label: evento.tipo, cls: "badge--muted" }

  if (compacto) {
    return (
      <div
        className="agenda-item agenda-item--compacto"
        onClick={() => onEditar(evento)}
        title={evento.titulo}
      >
        <span className={`agenda-item__dot agenda-item__dot--${evento.tipo}`} />
        <span className="agenda-item__titulo-compacto">{evento.titulo}</span>
      </div>
    )
  }

  return (
    <div className="agenda-item" onClick={() => onEditar(evento)}>
      <div className="agenda-item__color" data-tipo={evento.tipo} />
      <div className="agenda-item__body">
        <div className="agenda-item__header">
          <span className="agenda-item__titulo">{evento.titulo}</span>
          <span className={`badge ${cfg.cls}`} style={{ fontSize: "0.7rem" }}>{cfg.label}</span>
        </div>
        {evento.hora && (
          <div className="agenda-item__hora text-xs text-muted">{evento.hora}</div>
        )}
        {evento.descripcion && (
          <div className="agenda-item__desc text-xs text-muted">{evento.descripcion}</div>
        )}
      </div>
      <div className="agenda-item__actions" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn--ghost btn--icon" onClick={() => onEditar(evento)} title="Editar" style={{ display: "inline-flex", alignItems: "center" }}><IcoPencil size={14} /></button>
        <button className="btn btn--ghost btn--icon" onClick={() => onEliminar(evento.id)} title="Eliminar" style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center" }}><IcoTrash size={14} /></button>
      </div>
    </div>
  )
}
