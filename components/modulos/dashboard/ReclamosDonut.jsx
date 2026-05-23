"use client"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"

ChartJS.register(ArcElement, Tooltip, Legend)

const CONFIG = [
  { key: "pendiente",  label: "Pendiente",  color: "#d69e2e" },
  { key: "en_proceso", label: "En proceso", color: "#3182ce" },
  { key: "resuelto",   label: "Resuelto",   color: "#38a169" },
  { key: "cerrado",    label: "Cerrado",    color: "#718096" },
]

export default function ReclamosDonut({ datos = {} }) {
  const values = CONFIG.map((c) => datos[c.key] ?? 0)
  const total  = values.reduce((a, b) => a + b, 0)

  if (total === 0) {
    return (
      <div className="empty-state" style={{ padding: "2rem" }}>
        <p className="text-muted text-sm">Sin reclamos en el período.</p>
      </div>
    )
  }

  const data = {
    labels: CONFIG.map((c) => c.label),
    datasets: [{
      data: values,
      backgroundColor: CONFIG.map((c) => c.color),
      borderWidth: 2,
      borderColor: "var(--color-surface)",
      hoverOffset: 4,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 12,
          font: { size: 11, family: "Poppins" },
          boxWidth: 10, boxHeight: 10,
        },
      },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}` },
      },
    },
  }

  return (
    <div style={{ position: "relative", height: 220 }}>
      <Doughnut data={data} options={options} />
      <div style={{
        position: "absolute", top: "38%", left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center", pointerEvents: "none",
      }}>
        <div style={{ fontSize: "1.625rem", fontWeight: 700, lineHeight: 1 }}>{total}</div>
        <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>total</div>
      </div>
    </div>
  )
}
