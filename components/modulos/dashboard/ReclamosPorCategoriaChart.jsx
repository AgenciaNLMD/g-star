"use client"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const COLORES = [
  "#5C6E85", "#1499C2", "#1A7A4A", "#A87020",
  "#8A4A9B", "#C0392B", "#00897B", "#3A4A5C",
]

export default function ReclamosPorCategoriaChart({ datos = [] }) {
  if (datos.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "2rem" }}>
        <p className="text-muted text-sm">Sin reclamos categorizados en el período.</p>
      </div>
    )
  }

  const labels = datos.map((d) => d.nombre)
  const values = datos.map((d) => d.count)

  const data = {
    labels,
    datasets: [{
      label: "Reclamos",
      data: values,
      backgroundColor: datos.map((_, i) => COLORES[i % COLORES.length]),
      borderRadius: 3,
      borderSkipped: false,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.raw} reclamos` },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: { font: { size: 10, family: "Poppins" }, stepSize: 1, color: "#9AAAB8" },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11, family: "Poppins" }, color: "#3A4A5C" },
      },
    },
  }

  const height = Math.max(160, datos.length * 36 + 40)

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  )
}
