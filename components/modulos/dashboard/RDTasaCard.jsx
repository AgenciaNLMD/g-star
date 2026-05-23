"use client"
import { useEffect, useState } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  LineElement, PointElement,
  LinearScale, CategoryScale,
} from "chart.js"

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale)

export default function RDTasaCard({
  tasa     = 0,
  cerrados = 0,
  abiertos = 0,
  timeline = [],
}) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  const chartData = {
    labels:   timeline.map((_, i) => i),
    datasets: [
      {
        label:       "Cerrados",
        data:        timeline.map(t => t.ce),
        borderColor: "#1A7A4A",
        borderWidth: 2,
        pointRadius: 0,
        tension:     0.4,
        fill:        false,
      },
      {
        label:       "Abiertos",
        data:        timeline.map(t => t.ab),
        borderColor: "#C0392B",
        borderWidth: 2,
        pointRadius: 0,
        tension:     0.4,
        fill:        false,
      },
    ],
  }

  const opts = {
    responsive:          true,
    maintainAspectRatio: false,
    animation:           { duration: 1400, easing: "easeInOutSine" },
    plugins:             { legend: { display: false }, tooltip: { enabled: false } },
    scales:              { x: { display: false }, y: { display: false } },
  }

  return (
    <div className="rd-card rd-spark-card" style={{ "--rd-accent": "#1A7A4A" }}>
      <div className="rd-spark-left">
        <span className="rd-card__label">Tasa de Resolución</span>
        <span className="rd-card__value">{tasa}%</span>
        <div className="rd-tasa__legend">
          <span className="rd-tasa__item">
            <span className="rd-dot" style={{ background: "#1A7A4A" }} />
            {cerrados} cerrados
          </span>
          <span className="rd-tasa__item">
            <span className="rd-dot" style={{ background: "#C0392B" }} />
            {abiertos} abiertos
          </span>
        </div>
      </div>
      <div className="rd-spark-right">
        <Line key={tick} data={chartData} options={opts} />
      </div>
    </div>
  )
}
