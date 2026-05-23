const CONFIG = {
  pendiente:  { label: "Pendiente",  cls: "badge--warning"    },
  entrante:   { label: "Entrante",   cls: "badge--entrante"   },
  tomado:     { label: "Tomado",     cls: "badge--tomado"     },
  elevado:    { label: "Elevado",    cls: "badge--elevado"    },
  en_proceso: { label: "En proceso", cls: "badge--info"       },
  resuelto:   { label: "Resuelto",   cls: "badge--success"    },
  cerrado:    { label: "Cerrado",    cls: "badge--muted"      },
}

export default function ReclamoStatusBadge({ estado }) {
  const cfg = CONFIG[estado] ?? { label: estado, cls: "badge--muted" }
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
}

export const ESTADO_LABEL = Object.fromEntries(
  Object.entries(CONFIG).map(([k, v]) => [k, v.label])
)
