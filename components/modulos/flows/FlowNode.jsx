"use client"
import { createContext, useContext, useState } from "react"
import { Handle, Position } from "reactflow"
import {
  IcoPlay, IcoStop, IcoMessageSquare, IcoGitBranch, IcoClock,
  IcoZap, IcoSparkles, IcoBrain, IcoServer, IcoNote, IcoGrip,
  IcoSubflow, IcoButtons, IcoCopy2, IcoTrash, IcoChevronDown, IcoChevronUp,
} from "@/components/ui/Icons"

export const FlowActionsContext = createContext(null)

export const TIPOS = {
  inicio:    { color: "#97C459", colorDark: "#3B6D11", colorGlow: "rgba(151,196,89,0.22)",  colorBg: "#EAF3DE", colorText: "#173404", icono: IcoPlay,          label: "INICIO",    categoria: "sistema"  },
  mensaje:   { color: "#5DCAA5", colorDark: "#0F6E56", colorGlow: "rgba(93,202,165,0.22)",  colorBg: "#E1F5EE", colorText: "#04342C", icono: IcoMessageSquare, label: "MENSAJE",   categoria: "mensajes" },
  boton:     { color: "#5DCAA5", colorDark: "#0F6E56", colorGlow: "rgba(93,202,165,0.22)",  colorBg: "#E1F5EE", colorText: "#04342C", icono: IcoButtons,       label: "BOTÓN",     categoria: "mensajes" },
  condicion: { color: "#7F77DD", colorDark: "#534AB7", colorGlow: "rgba(127,119,221,0.22)", colorBg: "#EEEDFE", colorText: "#26215C", icono: IcoGitBranch,     label: "CONDICIÓN", categoria: "logica"   },
  delay:     { color: "#7F77DD", colorDark: "#534AB7", colorGlow: "rgba(127,119,221,0.22)", colorBg: "#EEEDFE", colorText: "#26215C", icono: IcoClock,         label: "DELAY",     categoria: "logica"   },
  espera:    { color: "#7F77DD", colorDark: "#534AB7", colorGlow: "rgba(127,119,221,0.22)", colorBg: "#EEEDFE", colorText: "#26215C", icono: IcoClock,         label: "ESPERA",    categoria: "logica"   },
  accion:    { color: "#EF9F27", colorDark: "#854F0B", colorGlow: "rgba(239,159,39,0.22)",  colorBg: "#FAEEDA", colorText: "#412402", icono: IcoZap,           label: "ACCIÓN",    categoria: "acciones" },
  ia:        { color: "#EF9F27", colorDark: "#854F0B", colorGlow: "rgba(239,159,39,0.22)",  colorBg: "#FAEEDA", colorText: "#412402", icono: IcoSparkles,      label: "IA",        categoria: "acciones" },
  agente:    { color: "#7F77DD", colorDark: "#534AB7", colorGlow: "rgba(127,119,221,0.22)", colorBg: "#EEEDFE", colorText: "#26215C", icono: IcoBrain,         label: "AGENTE",    categoria: "acciones" },
  memoria:   { color: "#ED93B1", colorDark: "#993556", colorGlow: "rgba(237,147,177,0.22)", colorBg: "#FBEAF0", colorText: "#4B1528", icono: IcoServer,        label: "MEMORIA",   categoria: "acciones" },
  fin:       { color: "#888780", colorDark: "#444441", colorGlow: "rgba(136,135,128,0.22)", colorBg: "#F1EFE8", colorText: "#2C2C2A", icono: IcoStop,          label: "FIN",       categoria: "sistema"  },
  subflow:   { color: "#888780", colorDark: "#444441", colorGlow: "rgba(136,135,128,0.22)", colorBg: "#F1EFE8", colorText: "#2C2C2A", icono: IcoSubflow,       label: "IR A FLOW", categoria: "sistema"  },
  nota:      { color: "#EF9F27", colorDark: "#854F0B", colorGlow: "rgba(239,159,39,0.22)",  colorBg: "#FAEEDA", colorText: "#412402", icono: IcoNote,          label: "NOTA",      categoria: null       },
}

export const CATEGORIAS = {
  sistema:  { label: "Sistema",  color: "#888780" },
  mensajes: { label: "Mensajes", color: "#5DCAA5" },
  logica:   { label: "Lógica",   color: "#7F77DD" },
  acciones: { label: "Acciones", color: "#EF9F27" },
}

export const MSG_HANDLES = [
  { id: "handle-respuesta", label: "Con respuesta", color: "#97C459" },
  { id: "handle-sin-resp",  label: "Sin respuesta", color: "#ef4444" },
  { id: "handle-siguiente", label: "Siguiente",     color: "#94a3b8" },
]

const FL = { margin: "0 0 2px", fontSize: 10, color: "#9a9a93", textTransform: "uppercase", letterSpacing: "0.04em" }
const FV = { margin: 0, fontSize: 12, color: "#1a1a1a", lineHeight: 1.4 }

function pill(text, key, bg, color) {
  return (
    <span key={key} style={{ display: "inline-block", fontSize: 11, padding: "2px 6px", borderRadius: 3, marginRight: 4, marginBottom: 2, background: bg, color }}>
      {text}
    </span>
  )
}

function NodePreview({ data }) {
  if (data.tipo === "inicio") {
    const ts = data.triggers ?? []
    return ts.length > 0 ? ts.map((t) => t.canalLabel).join(", ") : "Sin disparadores"
  }
  if (data.tipo === "agente")    return data.agenteNombre || "Sin agente configurado"
  if (data.tipo === "subflow")   return data.flujoNombre  || "Seleccionar flow…"
  if (data.tipo === "condicion") return data.keywords     ? `"${data.keywords}"` : "Sin keywords"
  if (data.tipo === "delay")     return `${data.segundos ?? 5}s`
  if (data.tipo === "espera") {
    const m = data.tiempoMinutos ?? 60
    return `${m >= 60 ? `${m / 60}h` : `${m}min`} sin respuesta`
  }
  if (data.tipo === "accion")  return data.accion  || "Sin acción"
  if (data.tipo === "memoria") return data.memKey  || "Sin clave"
  const c = data.contenido ?? ""
  return c ? (c.length > 60 ? c.slice(0, 57) + "…" : c) : "(sin contenido)"
}

function NodeExpanded({ data, tipo }) {
  const P = (text, key) => pill(text, key, tipo.colorBg, tipo.colorText)

  if (data.tipo === "inicio") {
    const ts = data.triggers ?? []
    return (
      <div>
        <p style={FL}>Disparadores</p>
        {ts.length === 0
          ? <p style={{ ...FV, color: "#9a9a93" }}>Sin disparadores</p>
          : ts.map((t) => pill(t.canalLabel ?? t.canal, t.id, (t.canalColor ?? "#94a3b8") + "22", t.canalColor ?? "#444"))
        }
      </div>
    )
  }

  if (data.tipo === "agente") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div>
          <p style={FL}>Agente</p>
          <p style={FV}>{data.agenteNombre || <span style={{ color: "#9a9a93" }}>Sin agente</span>}</p>
        </div>
        {(data.timeoutRecordatorioMin || data.timeoutCierreMin) && (
          <div>
            <p style={FL}>Inactividad</p>
            <p style={FV}>⏱ {data.timeoutRecordatorioMin ?? 10}min → {data.timeoutCierreMin ?? 20}min</p>
          </div>
        )}
      </div>
    )
  }

  if (data.tipo === "mensaje") {
    const bots = data.botones ?? []
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div>
          <p style={FL}>Mensaje</p>
          <p style={{ ...FV, color: "#6a6a63", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {data.contenido || <span style={{ fontStyle: "italic" }}>(sin contenido)</span>}
          </p>
        </div>
        {bots.length > 0 && (
          <div>
            <p style={FL}>Botones</p>
            <div>{bots.map((b, i) => P(b.texto || `Op. ${i + 1}`, b.id))}</div>
          </div>
        )}
        <div>
          <p style={FL}>Guarda respuesta en</p>
          <p style={FV}>{data.respuestaCampo || (data.respuestaTipo === "numero" ? "Número" : data.respuestaTipo === "imagen" ? "Imagen" : "Texto")}</p>
        </div>
      </div>
    )
  }

  if (data.tipo === "boton") {
    const bots = data.botones ?? []
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.contenido && (
          <div>
            <p style={FL}>Texto</p>
            <p style={{ ...FV, color: "#6a6a63" }}>{data.contenido}</p>
          </div>
        )}
        <div>
          <p style={FL}>Opciones</p>
          {bots.length === 0
            ? <p style={{ ...FV, color: "#9a9a93" }}>Sin opciones</p>
            : <div>{bots.map((b, i) => P(b.texto || `Op. ${i + 1}`, b.id))}</div>
          }
        </div>
      </div>
    )
  }

  if (data.tipo === "condicion") {
    const bots = data.botones ?? []
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div>
          <p style={FL}>Keywords</p>
          <p style={{ ...FV, color: "#6a6a63" }}>{data.keywords || "(sin keywords)"}</p>
        </div>
        {bots.length > 0 && (
          <div>
            <p style={FL}>Ramas</p>
            <div>{bots.map((b) => P(b.texto || "Rama", b.id))}</div>
          </div>
        )}
      </div>
    )
  }

  if (data.tipo === "espera") {
    const m = data.tiempoMinutos ?? 60
    return (
      <div>
        <p style={FL}>Tiempo sin respuesta</p>
        <p style={FV}>{m >= 60 ? `${m / 60}h` : `${m}min`}</p>
      </div>
    )
  }

  if (data.tipo === "delay") {
    return (
      <div>
        <p style={FL}>Espera</p>
        <p style={FV}>{data.segundos ?? 5} segundos</p>
      </div>
    )
  }

  if (data.tipo === "accion") {
    return (
      <div>
        <p style={FL}>Acción</p>
        <p style={FV}>{data.accion || <span style={{ color: "#9a9a93" }}>Sin configurar</span>}</p>
      </div>
    )
  }

  if (data.tipo === "ia") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div>
          <p style={FL}>Prompt</p>
          <p style={{ ...FV, color: "#6a6a63", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {data.pregunta || <span style={{ fontStyle: "italic" }}>(sin prompt)</span>}
          </p>
        </div>
        {data.campoRespuesta && (
          <div>
            <p style={FL}>Guardar en</p>
            <p style={FV}>{data.campoRespuesta}</p>
          </div>
        )}
      </div>
    )
  }

  if (data.tipo === "memoria") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div>
          <p style={FL}>Operación</p>
          <p style={FV}>{data.memOp ?? "leer"}</p>
        </div>
        {data.memKey && (
          <div>
            <p style={FL}>Clave</p>
            <p style={{ ...FV, fontFamily: "monospace", fontSize: 11 }}>{data.memKey}</p>
          </div>
        )}
      </div>
    )
  }

  if (data.tipo === "subflow") {
    return (
      <div>
        <p style={FL}>Flow destino</p>
        <p style={FV}>{data.flujoNombre || <span style={{ color: "#9a9a93" }}>Sin seleccionar</span>}</p>
      </div>
    )
  }

  return null
}

const BTN = (danger = false) => ({
  background: "none",
  border: "none",
  padding: 0,
  width: 22,
  height: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 3,
  cursor: "pointer",
  color: danger ? "#A32D2D" : "rgba(0,0,0,0.42)",
  fontFamily: "inherit",
  flexShrink: 0,
})

export function FlowNodeComponent({ id, data, selected }) {
  const tipo      = TIPOS[data.tipo] ?? TIPOS.mensaje
  const TipoIcon  = tipo.icono
  const [expanded, setExpanded] = useState(true)
  const actionsRef = useContext(FlowActionsContext)

  const botones     = data.botones ?? []
  const isMensaje   = data.tipo === "mensaje"
  const isBoton     = data.tipo === "boton"
  const isCondicion = data.tipo === "condicion"
  const isEspera    = data.tipo === "espera"
  const hasBranches = isCondicion && botones.length > 0
  const hasSimpleOut = !["mensaje", "boton", "fin", "nota", "espera"].includes(data.tipo) && !hasBranches

  // ── Nota sticky ──────────────────────────────────────────────────────────────
  if (data.tipo === "nota") {
    return (
      <div style={{
        background: "#fef9c3",
        border: `1.5px solid ${selected ? "#ca8a04" : "#fde68a"}`,
        borderRadius: 4,
        minWidth: 140, maxWidth: 220,
        padding: "0.5rem 0.625rem",
        boxShadow: selected ? "0 0 0 3px #fbbf2433" : "2px 2px 8px rgba(0,0,0,0.07)",
        cursor: "pointer",
        fontFamily: "Inter, sans-serif",
        fontSize: "0.6875rem",
        color: "#78350f",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {data.contenido || <span style={{ opacity: 0.45, fontStyle: "italic" }}>Nota vacía…</span>}
      </div>
    )
  }

  const nodeName = data.label
    || (data.tipo === "agente" ? data.agenteNombre : null)
    || (tipo.label.charAt(0) + tipo.label.slice(1).toLowerCase())

  return (
    <div style={{
      background: "#FFFFFF",
      border: `1.5px solid ${tipo.color}`,
      borderRadius: 4,
      minWidth: 220,
      maxWidth: 260,
      overflow: "visible",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      boxShadow: selected
        ? `0 0 0 3px ${tipo.colorGlow}, 0 2px 8px rgba(0,0,0,0.1)`
        : "0 1px 4px rgba(0,0,0,0.08)",
      transition: "box-shadow 0.15s",
      position: "relative",
    }}>

      {/* Handle entrada — ARRIBA */}
      {data.tipo !== "inicio" && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: tipo.color, width: 10, height: 10, top: -5, border: "2px solid #fff", zIndex: 10 }}
        />
      )}

      {/* ── TOPBAR ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "7px 8px",
        background: `linear-gradient(to right, ${tipo.color} 0%, #EEEDE9 100%)`,
        borderBottom: `1px solid ${tipo.color}44`,
        borderRadius: "3px 3px 0 0",
        minHeight: 36,
      }}>

        {/* Ícono de categoría */}
        <div style={{
          width: 22, height: 22,
          borderRadius: 3,
          background: "rgba(255,255,255,0.25)",
          border: "1px solid rgba(255,255,255,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white",
          flexShrink: 0,
        }}>
          <TipoIcon size={12} />
        </div>

        <span style={{
          fontSize: 10, fontWeight: 600, color: "white",
          textTransform: "uppercase", letterSpacing: "0.05em",
          textShadow: "0 1px 2px rgba(0,0,0,0.18)",
          lineHeight: 1, flexShrink: 0,
        }}>
          {tipo.label}
        </span>

        <div style={{ flex: 1 }} />

        {/* Acciones — siempre visibles */}
        <button
          onClick={(e) => { e.stopPropagation(); actionsRef?.current?.duplicateNode(id) }}
          title="Duplicar"
          style={{ ...BTN(false), opacity: selected ? 1 : 0.55 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.1)"; e.currentTarget.style.opacity = "1" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.opacity = selected ? "1" : "0.55" }}
        >
          <IcoCopy2 size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); actionsRef?.current?.deleteNode(id) }}
          title="Eliminar"
          style={{ ...BTN(true), opacity: selected ? 1 : 0.55 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(163,45,45,0.12)"; e.currentTarget.style.opacity = "1" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.opacity = selected ? "1" : "0.55" }}
        >
          <IcoTrash size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
          title={expanded ? "Colapsar" : "Expandir"}
          style={{ ...BTN(false), opacity: selected ? 1 : 0.55 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.1)"; e.currentTarget.style.opacity = "1" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.opacity = selected ? "1" : "0.55" }}
        >
          {expanded ? <IcoChevronUp size={12} /> : <IcoChevronDown size={12} />}
        </button>
      </div>

      {/* ── BODY ── */}
      <div style={{ padding: "9px 11px" }}>

        {/* Título del nodo */}
        <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 500, color: "#1a1a1a", lineHeight: 1.3, wordBreak: "break-word" }}>
          {nodeName}
        </p>

        {/* Preview (colapsado) */}
        {!expanded && (
          <p style={{ margin: 0, fontSize: 11, color: "#6a6a63", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <NodePreview data={data} />
          </p>
        )}

        {/* Contenido expandido */}
        {expanded && (
          <div style={{ marginTop: 8, padding: 10, background: "#F4F3EF", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 3 }}>
            <NodeExpanded data={data} tipo={tipo} />
          </div>
        )}
      </div>

      {/* MENSAJE: chip "Respuesta del contacto" */}
      {isMensaje && !expanded && (
        <div style={{ margin: "0 8px 8px", background: tipo.colorBg, border: `1px dashed ${tipo.color}66`, borderRadius: 4, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4 }}>
          <IcoGrip size={9} style={{ color: tipo.color, flexShrink: 0 }} />
          <span style={{ fontSize: "0.5625rem", color: tipo.colorDark, fontWeight: 500 }}>
            Respuesta: {data.respuestaCampo || (data.respuestaTipo === "numero" ? "Número" : data.respuestaTipo === "imagen" ? "Imagen" : "Texto")}
          </span>
        </div>
      )}

      {/* ── HANDLES DE SALIDA ────────────────────────────────────────── */}

      {/* MENSAJE: 3 salidas */}
      {isMensaje && (
        <div style={{ borderTop: "1px solid #f1f5f9", display: "flex" }}>
          {MSG_HANDLES.map(({ id: hid, label, color }) => (
            <div key={hid} style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 4px 10px", gap: 2 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: "0.38rem", color: "#94a3b8", fontWeight: 500, textAlign: "center", lineHeight: 1.2, whiteSpace: "nowrap" }}>{label}</span>
              <Handle
                type="source"
                position={Position.Bottom}
                id={hid}
                style={{ background: color, width: 9, height: 9, bottom: -1, left: "50%", transform: "translateX(-50%)", border: "2px solid #fff", zIndex: 10 }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ESPERA: handle-respondio + handle-timeout */}
      {isEspera && (
        <div style={{ borderTop: "1px solid #f1f5f9", display: "flex" }}>
          <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 4px 10px", gap: 2 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: "0.38rem", color: "#94a3b8", fontWeight: 500, lineHeight: 1.2, whiteSpace: "nowrap" }}>Respondió</span>
            <Handle type="source" position={Position.Bottom} id="handle-respondio"
              style={{ background: "#22c55e", width: 9, height: 9, bottom: -1, left: "50%", transform: "translateX(-50%)", border: "2px solid #fff", zIndex: 10 }} />
          </div>
          <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 4px 10px", gap: 2, borderLeft: "1px dashed #f1f5f9" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f97316" }} />
            <span style={{ fontSize: "0.38rem", color: "#94a3b8", fontWeight: 500, lineHeight: 1.2, whiteSpace: "nowrap" }}>Timeout</span>
            <Handle type="source" position={Position.Bottom} id="handle-timeout"
              style={{ background: "#f97316", width: 9, height: 9, bottom: -1, left: "50%", transform: "translateX(-50%)", border: "2px solid #fff", zIndex: 10 }} />
          </div>
        </div>
      )}

      {/* BOTÓN: handle por cada opción + sin-respuesta */}
      {isBoton && botones.length > 0 && (
        <div style={{ borderTop: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap" }}>
          {botones.map((btn, i) => (
            <div key={btn.id} style={{ flex: "1 1 auto", minWidth: "33%", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "3px 3px 10px", gap: 2 }}>
              <div style={{ background: tipo.colorBg, border: `1px solid ${tipo.color}44`, borderRadius: 99, padding: "1px 5px", fontSize: "0.4rem", fontWeight: 600, color: tipo.colorText, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {btn.texto || `Op. ${i + 1}`}
              </div>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: tipo.color }} />
              <Handle type="source" position={Position.Bottom} id={btn.id}
                style={{ background: tipo.color, width: 9, height: 9, bottom: -1, left: "50%", transform: "translateX(-50%)", border: "2px solid #fff", zIndex: 10 }} />
            </div>
          ))}
          <div style={{ flex: "1 1 auto", minWidth: "33%", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "3px 3px 10px", gap: 2, borderLeft: "1px dashed #f1f5f9" }}>
            <span style={{ fontSize: "0.38rem", color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>Sin resp.</span>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444" }} />
            <Handle type="source" position={Position.Bottom} id="handle-sin-resp"
              style={{ background: "#ef4444", width: 9, height: 9, bottom: -1, left: "50%", transform: "translateX(-50%)", border: "2px solid #fff", zIndex: 10 }} />
          </div>
        </div>
      )}

      {/* CONDICIÓN: ramas */}
      {hasBranches && (
        <div style={{ borderTop: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap" }}>
          {botones.map((btn) => (
            <div key={btn.id} style={{ flex: "1 1 auto", minWidth: "33%", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "3px 3px 10px", gap: 2 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: tipo.color }} />
              <span style={{ fontSize: "0.4rem", color: "#64748b", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {btn.texto || "Rama"}
              </span>
              <Handle type="source" position={Position.Bottom} id={btn.id}
                style={{ background: tipo.color, width: 9, height: 9, bottom: -1, left: "50%", transform: "translateX(-50%)", border: "2px solid #fff", zIndex: 10 }} />
            </div>
          ))}
        </div>
      )}

      {/* Salida simple */}
      {hasSimpleOut && (
        <Handle type="source" position={Position.Bottom}
          style={{ background: tipo.color, width: 9, height: 9, bottom: -1, border: "2px solid #fff", zIndex: 10 }} />
      )}
    </div>
  )
}
