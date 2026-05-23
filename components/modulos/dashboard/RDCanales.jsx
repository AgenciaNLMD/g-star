"use client"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js"

ChartJS.register(ArcElement, Tooltip)

const CANAL_CFG = {
  whatsapp:   { label: "WhatsApp",   color: "#25D366" },
  presencial: { label: "Presencial", color: "#5C6E85" },
  web:        { label: "Web",        color: "#1499C2" },
  telefono:   { label: "Teléfono",   color: "#A87020" },
  email:      { label: "Email",      color: "#8B5CF6" },
}

function canalCfg(k) {
  return CANAL_CFG[k] ?? { label: k.charAt(0).toUpperCase() + k.slice(1), color: "#9AAAB8" }
}

export default function RDCanales({ canales = {} }) {
  const entries = Object.entries(canales).sort((a, b) => b[1] - a[1])
  const total   = entries.reduce((s, [, v]) => s + v, 0)

  if (total === 0) {
    return (
      <div className="rd-card rd-canales-card" style={{ "--rd-accent": "#1499C2" }}>
        <span className="rd-card__label">Canales de Ingreso</span>
        <p className="rd-empty">Sin datos en el período</p>
      </div>
    )
  }

  const data = {
    labels:   entries.map(([k]) => canalCfg(k).label),
    datasets: [{
      data:            entries.map(([, v]) => v),
      backgroundColor: entries.map(([k]) => canalCfg(k).color),
      borderWidth:     2,
      borderColor:     "var(--color-surface)",
      hoverOffset:     4,
    }],
  }

  const opts = {
    responsive:          true,
    maintainAspectRatio: false,
    cutout:              "68%",
    animation:           { duration: 900 },
    plugins: {
      legend:  { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } },
    },
  }

  return (
    <div className="rd-card rd-canales-card" style={{ "--rd-accent": "#1499C2" }}>
      <span className="rd-card__label">Canales de Ingreso</span>
      <div className="rd-canales__body">
        <div className="rd-canales__donut-wrap">
          <Doughnut data={data} options={opts} />
          <div className="rd-canales__center">
            <span className="rd-canales__total">{total}</span>
            <span className="rd-canales__sub">total</span>
          </div>
        </div>
        <div className="rd-canales__legend">
          {entries.map(([k, v]) => (
            <div key={k} className="rd-canales__row">
              <span className="rd-dot" style={{ background: canalCfg(k).color }} />
              <span className="rd-canales__name">{canalCfg(k).label}</span>
              <span className="rd-canales__num">{v}</span>
              <span className="rd-canales__pct">{Math.round(v / total * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
