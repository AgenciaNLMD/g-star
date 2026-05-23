"use client"
import { useEffect, useState } from "react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from "chart.js"

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function RDLocalidades({ localidades = [] }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  if (localidades.length === 0) {
    return (
      <div className="rd-card rd-loc-card" style={{ "--rd-accent": "#8B5CF6" }}>
        <span className="rd-card__label">Reclamos por Localidad</span>
        <p className="rd-empty">Sin datos en el período</p>
      </div>
    )
  }

  const labels = localidades.map(l =>
    l.nombre.length > 12 ? l.nombre.slice(0, 12) + "…" : l.nombre
  )

  const data = {
    labels,
    datasets: [
      {
        label:           "Ingresados",
        data:            localidades.map(l => l.ingresados),
        backgroundColor: "rgba(92,110,133,0.82)",
        borderRadius:    3,
        borderSkipped:   false,
      },
      {
        label:           "Pendientes",
        data:            localidades.map(l => l.pendientes),
        backgroundColor: "rgba(168,112,32,0.82)",
        borderRadius:    3,
        borderSkipped:   false,
      },
      {
        label:           "Resueltos",
        data:            localidades.map(l => l.resueltos),
        backgroundColor: "rgba(26,122,74,0.82)",
        borderRadius:    3,
        borderSkipped:   false,
      },
    ],
  }

  const opts = {
    responsive:          true,
    maintainAspectRatio: false,
    animation:           { duration: 900, easing: "easeOutQuart" },
    plugins: {
      legend:  { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        grid:  { display: false },
        ticks: { font: { size: 9, family: "var(--font-family)" }, color: "#9AAAB8" },
      },
      y: {
        grid:  { color: "rgba(0,0,0,.04)" },
        ticks: { font: { size: 9 }, color: "#9AAAB8", maxTicksLimit: 5 },
      },
    },
  }

  return (
    <div className="rd-card rd-loc-card" style={{ "--rd-accent": "#8B5CF6" }}>
      <div className="rd-card__header">
        <span className="rd-card__label">Reclamos por Localidad</span>
        <div className="rd-loc__legend">
          <span><span className="rd-dot" style={{ background: "rgba(92,110,133,0.9)" }} />Ingresados</span>
          <span><span className="rd-dot" style={{ background: "rgba(168,112,32,0.9)" }} />Pendientes</span>
          <span><span className="rd-dot" style={{ background: "rgba(26,122,74,0.9)" }} />Resueltos</span>
        </div>
      </div>
      <div className="rd-chart-body">
        <Bar key={tick} data={data} options={opts} />
      </div>
    </div>
  )
}
