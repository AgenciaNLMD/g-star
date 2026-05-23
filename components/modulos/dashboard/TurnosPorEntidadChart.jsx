"use client"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const ESTADOS = [
  { key: "completado", label: "Completado", color: "#38a169" },
  { key: "asignado",   label: "Asignado",   color: "#3182ce" },
  { key: "confirmado", label: "Confirmado", color: "#00bfa6" },
  { key: "pendiente",  label: "Pendiente",  color: "#d69e2e" },
  { key: "ausente",    label: "Ausente",    color: "#e53e3e" },
  { key: "cancelado",  label: "Cancelado",  color: "#718096" },
]

export default function TurnosPorEntidadChart({ datos = {} }) {
  const entidades = Object.keys(datos)

  if (entidades.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "2rem" }}>
        <p className="text-muted text-sm">Sin datos de entidades en el período.</p>
      </div>
    )
  }

  const chartData = {
    labels: entidades,
    datasets: ESTADOS.map((e) => ({
      label: e.label,
      data: entidades.map((ent) => datos[ent][e.key] ?? 0),
      backgroundColor: e.color,
      borderRadius: 3,
      borderSkipped: false,
    })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 11, family: "Poppins" },
          boxWidth: 10, boxHeight: 10, padding: 14,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { font: { size: 11, family: "Poppins" }, stepSize: 1 },
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: 12, family: "Poppins" } },
      },
    },
  }

  const height = Math.max(180, entidades.length * 52 + 80)

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
