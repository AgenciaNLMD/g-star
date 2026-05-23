// Formatea fecha como DD/MM/YYYY
export function formatFecha(fecha) {
  if (!fecha) return ""
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// Formatea fecha y hora como DD/MM/YYYY HH:mm
export function formatFechaHora(fecha) {
  if (!fecha) return ""
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Tiempo relativo: "hace 3 minutos", "hace 2 días"
export function tiempoRelativo(fecha) {
  if (!fecha) return ""
  const diff = Date.now() - new Date(fecha).getTime()
  const minutos = Math.floor(diff / 60000)
  if (minutos < 1) return "ahora"
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas}h`
  const dias = Math.floor(horas / 24)
  if (dias < 30) return `hace ${dias} días`
  return formatFecha(fecha)
}

// Une clases CSS condicionalmente
export function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

// Genera initiales desde nombre completo (ej: "Juan Pérez" → "JP")
export function initiales(nombre) {
  if (!nombre) return "?"
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("")
}

// Capitaliza primera letra
export function capitalize(str) {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1)
}
