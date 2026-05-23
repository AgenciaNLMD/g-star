"use client"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export default function ReclamosTimelineChart({ datos = [] }) {
  if (datos.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "2rem" }}>
        <p className="text-muted text-sm">Sin datos en el período.</p>
      </div>
    )
  }

  const labels = datos.map((d) => d.fecha)
  const values = datos.map((d) => d.total)

  const data = {
    labels,
    datasets: [{
      label: "Reclamos",
      data: values,
      borderColor: "#A87020",
      backgroundColor: "rgba(168,112,32,0.10)",
      borderWidth: 2,
      pointRadius: values.length > 20 ? 0 : 3,
      pointHoverRadius: 4,
      tension: 0.4,
      fill: true,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.raw} reclamos` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10, family: "Poppins" },
          maxTicksLimit: 10,
          color: "#9AAAB8",
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: {
          font: { size: 10, family: "Poppins" },
          stepSize: 1,
          color: "#9AAAB8",
        },
      },
    },
  }

  return (
    <div style={{ height: 180 }}>
      <Line data={data} options={options} />
    </div>
  )
}
