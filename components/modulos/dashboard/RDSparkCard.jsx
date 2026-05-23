"use client"
import { useEffect, useState, useRef } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  LineElement, PointElement,
  LinearScale, CategoryScale,
  Filler,
} from "chart.js"

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler)

export default function RDSparkCard({
  label     = "Total Reclamos",
  value     = 0,
  delta     = 0,
  sparkData = [],
  color     = "#5C6E85",   // siempre hex, nunca CSS var
}) {
  const [tick, setTick] = useState(0)
  const chartRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  const isUp   = delta > 0
  const isDown = delta < 0

  // Gradiente bajo la línea (como la imagen de referencia)
  function gradientPlugin(chart) {
    const ctx    = chart.ctx
    const area   = chart.chartArea
    if (!area) return null
    const grad = ctx.createLinearGradient(0, area.top, 0, area.bottom)
    grad.addColorStop(0, color + "55")
    grad.addColorStop(1, color + "00")
    return grad
  }

  const data = {
    labels:   sparkData.map((_, i) => i),
    datasets: [{
      data:            sparkData,
      borderColor:     color,
      borderWidth:     2.5,
      pointRadius:     0,
      tension:         0.45,
      fill:            true,
      backgroundColor: (ctx) => {
        const chart = ctx.chart
        return gradientPlugin(chart) ?? color + "22"
      },
    }],
  }

  const opts = {
    responsive:          true,
    maintainAspectRatio: false,
    animation:           { duration: 1400, easing: "easeInOutSine" },
    plugins:             { legend: { display: false }, tooltip: { enabled: false } },
    scales:              { x: { display: false }, y: { display: false } },
    elements:            { line: { capBezierPoints: true } },
  }

  return (
    <div className="rd-card rd-spark-card" style={{ "--rd-accent": color }}>
      <div className="rd-spark-left">
        <span className="rd-card__label">{label}</span>
        <span className="rd-card__value">{value}</span>
        <span className={`rd-card__delta ${isUp ? "rd-delta--up" : isDown ? "rd-delta--down" : ""}`}>
          {isUp ? "↑" : isDown ? "↓" : "·"} {Math.abs(delta)} hoy
        </span>
      </div>
      <div className="rd-spark-right">
        <Line ref={chartRef} key={tick} data={data} options={opts} />
      </div>
    </div>
  )
}
