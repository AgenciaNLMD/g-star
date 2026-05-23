"use client"
import { useState } from "react"
import { Bubble, Bar, Scatter } from "react-chartjs-2"
import {
  Chart as ChartJS,
  ArcElement, LinearScale, CategoryScale,
  PointElement, BubbleController,
  BarElement, Tooltip, Legend,
} from "chart.js"

ChartJS.register(
  ArcElement, LinearScale, CategoryScale,
  PointElement, BubbleController,
  BarElement, Tooltip, Legend
)

const TABS = [
  { key: "eficiencia", label: "Eficiencia" },
  { key: "saturacion", label: "Saturación" },
  { key: "velocidad",  label: "Velocidad"  },
  { key: "deuda",      label: "Deuda"      },
  { key: "flujo",      label: "Flujo"      },
]

// ── Bubble: eje X = días promedio, eje Y = tasa, radio = volumen ──
function VistaEficiencia({ analisis }) {
  const max = Math.max(...analisis.map(a => a.ingresados), 1)
  const data = {
    datasets: analisis.map(a => ({
      label: a.nombre,
      data: [{ x: a.diasPromedio, y: a.tasa, r: Math.max(4, (a.ingresados / max) * 22) }],
      backgroundColor: a.color + "99",
      borderColor:     a.color,
      borderWidth:     1.5,
    })),
  }
  const opts = {
    responsive: true, maintainAspectRatio: false,
    animation:  { duration: 900 },
    plugins: { legend: { display: false }, tooltip: { callbacks: {
      label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}% en ${ctx.parsed.x}d`,
    }}},
    scales: {
      x: { title: { display: true, text: "Días promedio", font: { size: 9 }, color: "#9AAAB8" }, grid: { color: "rgba(0,0,0,.04)" }, ticks: { font: { size: 9 }, color: "#9AAAB8" } },
      y: { title: { display: true, text: "Tasa resolución %", font: { size: 9 }, color: "#9AAAB8" }, min: 0, max: 100, grid: { color: "rgba(0,0,0,.04)" }, ticks: { font: { size: 9 }, color: "#9AAAB8" } },
    },
  }
  return <Bubble data={data} options={opts} />
}

// ── Saturación: barras horizontales por categoría (ingresados) ───
function VistaSaturacion({ analisis }) {
  const sorted = [...analisis].sort((a, b) => b.ingresados - a.ingresados)
  const data = {
    labels: sorted.map(a => a.nombre.length > 14 ? a.nombre.slice(0, 14) + "…" : a.nombre),
    datasets: [{
      label: "Ingresados",
      data:  sorted.map(a => a.ingresados),
      backgroundColor: sorted.map(a => a.color + "bb"),
      borderRadius: 3,
    }],
  }
  const opts = {
    indexAxis: "y",
    responsive: true, maintainAspectRatio: false,
    animation:  { duration: 900 },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} reclamos` }}},
    scales: {
      x: { grid: { color: "rgba(0,0,0,.04)" }, ticks: { font: { size: 9 }, color: "#9AAAB8" } },
      y: { grid: { display: false }, ticks: { font: { size: 9 }, color: "#9AAAB8" } },
    },
  }
  return <Bar data={data} options={opts} />
}

// ── Velocidad: scatter días promedio vs tasa ─────────────────────
function VistaVelocidad({ analisis }) {
  const data = {
    datasets: analisis.map(a => ({
      label: a.nombre,
      data: [{ x: a.diasPromedio, y: a.tasa }],
      backgroundColor: a.color + "cc",
      pointRadius: 7,
      pointHoverRadius: 9,
    })),
  }
  const opts = {
    responsive: true, maintainAspectRatio: false,
    animation:  { duration: 900 },
    plugins: { legend: { display: false }, tooltip: { callbacks: {
      label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.x}d · ${ctx.parsed.y}%`,
    }}},
    scales: {
      x: { title: { display: true, text: "Días promedio", font: { size: 9 }, color: "#9AAAB8" }, grid: { color: "rgba(0,0,0,.04)" }, ticks: { font: { size: 9 }, color: "#9AAAB8" } },
      y: { title: { display: true, text: "Tasa %", font: { size: 9 }, color: "#9AAAB8" }, min: 0, max: 100, grid: { color: "rgba(0,0,0,.04)" }, ticks: { font: { size: 9 }, color: "#9AAAB8" } },
    },
  }
  return <Scatter data={data} options={opts} />
}

// ── Deuda operativa: sin resolver por categoría ──────────────────
function VistaDeuda({ analisis }) {
  const sorted = [...analisis].sort((a, b) => b.sinResolver - a.sinResolver)
  const data = {
    labels: sorted.map(a => a.nombre.length > 14 ? a.nombre.slice(0, 14) + "…" : a.nombre),
    datasets: [{
      label: "Sin resolver",
      data:  sorted.map(a => a.sinResolver),
      backgroundColor: sorted.map(a => a.color + "bb"),
      borderRadius: 3,
    }],
  }
  const opts = {
    indexAxis: "y",
    responsive: true, maintainAspectRatio: false,
    animation:  { duration: 900 },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} sin resolver` }}},
    scales: {
      x: { grid: { color: "rgba(0,0,0,.04)" }, ticks: { font: { size: 9 }, color: "#9AAAB8" } },
      y: { grid: { display: false }, ticks: { font: { size: 9 }, color: "#9AAAB8" } },
    },
  }
  return <Bar data={data} options={opts} />
}

// ── Flujo: resueltos vs sin resolver apilados ────────────────────
function VistaFlujo({ analisis }) {
  const sorted = [...analisis].sort((a, b) => b.ingresados - a.ingresados).slice(0, 8)
  const labels = sorted.map(a => a.nombre.length > 12 ? a.nombre.slice(0, 12) + "…" : a.nombre)
  const data = {
    labels,
    datasets: [
      { label: "Resueltos",   data: sorted.map(a => a.resueltos),   backgroundColor: "rgba(26,122,74,0.8)",   borderRadius: 3 },
      { label: "Sin resolver",data: sorted.map(a => a.sinResolver), backgroundColor: "rgba(192,57,43,0.7)",   borderRadius: 3 },
    ],
  }
  const opts = {
    responsive: true, maintainAspectRatio: false,
    animation:  { duration: 900 },
    plugins: { legend: { display: false }, tooltip: { mode: "index" }},
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { size: 9 }, color: "#9AAAB8" } },
      y: { stacked: true, grid: { color: "rgba(0,0,0,.04)" }, ticks: { font: { size: 9 }, color: "#9AAAB8" } },
    },
  }
  return <Bar data={data} options={opts} />
}

export default function RDAnalisis({ analisis = [] }) {
  const [tab, setTab] = useState("eficiencia")

  return (
    <div className="rd-card rd-analisis-card" style={{ "--rd-accent": "#8B5CF6" }}>
      <div className="rd-card__header">
        <span className="rd-card__label">Análisis por Categoría</span>
        <div className="rd-analisis__tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`rd-analisis__tab${tab === t.key ? " rd-analisis__tab--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rd-chart-body">
        {analisis.length === 0 && <p className="rd-empty">Sin datos en el período</p>}
        {analisis.length > 0 && tab === "eficiencia" && <VistaEficiencia  analisis={analisis} />}
        {analisis.length > 0 && tab === "saturacion" && <VistaSaturacion  analisis={analisis} />}
        {analisis.length > 0 && tab === "velocidad"  && <VistaVelocidad   analisis={analisis} />}
        {analisis.length > 0 && tab === "deuda"      && <VistaDeuda       analisis={analisis} />}
        {analisis.length > 0 && tab === "flujo"      && <VistaFlujo       analisis={analisis} />}
      </div>
    </div>
  )
}
