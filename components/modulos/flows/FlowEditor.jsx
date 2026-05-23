"use client"
import { useState, useCallback, useEffect, useRef } from "react"
import { IcoSave, IcoTrash, IcoCopy2, IcoUndo, IcoRedo, IcoLock, IcoUnlock, IcoNote, IcoGrip, IcoWhatsApp, IcoInstagram, IcoFacebook, IcoTikTok, IcoMail, IcoGlobe, IcoSubflow, IcoMap, IcoButtons, IcoSun, IcoMoon, IcoFlow } from "@/components/ui/Icons"
import ReactFlow, {
  addEdge,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Panel,
  ReactFlowProvider,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from "reactflow"
import "reactflow/dist/style.css"
import { api } from "@/lib/api-client"
import { FlowNodeComponent, FlowActionsContext, TIPOS, CATEGORIAS } from "./FlowNode"

const nodeTypes = Object.fromEntries(
  Object.keys(TIPOS).map((t) => [t, FlowNodeComponent])
)

function CustomEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data }) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const { deleteElements } = useReactFlow()

  const gid       = `eg${id.replace(/[^a-zA-Z0-9]/g, "")}`
  const fromColor = data?.sourceColor ?? "#94a3b8"
  const toColor   = data?.targetColor ?? "#94a3b8"
  const sameColor = fromColor === toColor

  return (
    <>
      {/* Definición del gradiente SVG — siempre en el mismo SVG que el path */}
      <defs>
        <linearGradient
          id={gid}
          gradientUnits="userSpaceOnUse"
          x1={sourceX} y1={sourceY}
          x2={targetX} y2={targetY}
        >
          <stop offset="0%"   stopColor={fromColor} />
          <stop offset="100%" stopColor={sameColor ? fromColor : toColor} />
        </linearGradient>
      </defs>

      {/* BaseEdge mantiene la interactividad de ReactFlow (hover, selección) */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        className="flow-edge-animated"
        style={{
          ...style,
          stroke: `url(#${gid})`,
          strokeWidth: style?.strokeWidth ?? 1.5,
        }}
      />

      {/* X para eliminar la conexión */}
      <EdgeLabelRenderer>
        <div
          style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: "all", zIndex: 10 }}
          className="nodrag nopan"
        >
          <button
            onClick={() => deleteElements({ edges: [{ id }] })}
            style={{
              width: 16, height: 16, borderRadius: "50%",
              background: "#fff", border: "1.5px solid #cbd5e1",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#94a3b8", fontSize: 9, fontWeight: 800, lineHeight: 1,
              fontFamily: "inherit", padding: 0,
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              transition: "border-color 0.1s, color 0.1s, background 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fef2f2" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "#fff" }}
          >
            ✕
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const edgeTypes = { default: CustomEdge }

const SIDEBAR_ITEMS = [
  {
    categoria: "sistema",
    items: [
      { tipo: "fin",     desc: "Termina el flujo" },
      { tipo: "subflow", desc: "Continúa en otro flow" },
    ],
  },
  {
    categoria: "mensajes",
    items: [
      { tipo: "mensaje", desc: "Envía texto, guarda respuesta libre" },
      { tipo: "boton",   desc: "Lista de opciones para elegir"       },
    ],
  },
  {
    categoria: "logica",
    items: [
      { tipo: "condicion", desc: "Ramifica según keywords" },
      { tipo: "delay",     desc: "Pausa antes del siguiente paso" },
      { tipo: "espera",    desc: "Espera respuesta o dispara timeout" },
    ],
  },
  {
    categoria: "acciones",
    items: [
      { tipo: "accion",  desc: "Crear reclamo, turno, etc."          },
      { tipo: "ia",      desc: "Respuesta generada por IA"           },
      { tipo: "agente",  desc: "Agente IA con herramientas"          },
      { tipo: "memoria", desc: "Guardar / leer memoria del contacto" },
    ],
  },
]

const INPUT = { width: "100%", border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.3rem 0.5rem", fontSize: "0.8rem", fontFamily: "inherit", background: "#f8fafc", color: "#0f172a" }
const LABEL = { fontSize: "0.625rem", fontWeight: 700, display: "block", marginBottom: "0.2rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em" }

const defaultEdgeOptions = { style: { strokeWidth: 1.5 } }

const NODO_INICIAL = {
  id: "inicio-1",
  type: "inicio",
  position: { x: 160, y: 60 },
  data: { tipo: "inicio", label: "Inicio", triggers: [], botones: [] },
}

const CANALES = [
  { id: "whatsapp",  label: "WhatsApp",   color: "#25d366", Icon: IcoWhatsApp,  eventos: [
    { id: "mensaje_entrante",   label: "Cualquier mensaje",       desc: "Cualquier mensaje entrante al canal" },
    { id: "keyword",            label: "Contiene keyword",        desc: "El mensaje incluye una o más palabras clave" },
    { id: "primer_mensaje",     label: "Primer contacto",         desc: "Primera vez que el contacto escribe" },
  ]},
  { id: "instagram", label: "Instagram",  color: "#e1306c", Icon: IcoInstagram, eventos: [
    { id: "dm",                 label: "DM recibido",             desc: "El usuario envía un mensaje directo" },
    { id: "comentario_post",    label: "Comenta publicación",     desc: "El usuario comenta un post" },
    { id: "respuesta_historia", label: "Responde historia",       desc: "El usuario responde a una historia" },
  ]},
  { id: "facebook",  label: "Facebook",   color: "#1877f2", Icon: IcoFacebook,  eventos: [
    { id: "mensaje",            label: "Mensaje recibido",        desc: "El usuario envía un mensaje" },
    { id: "comentario",         label: "Comenta publicación",     desc: "El usuario comenta un post" },
  ]},
  { id: "tiktok",    label: "TikTok",     color: "#1a1a1a", Icon: IcoTikTok,    eventos: [
    { id: "comentario",         label: "Comenta video",           desc: "El usuario comenta un video" },
    { id: "dm",                 label: "DM recibido",             desc: "El usuario envía un DM" },
  ]},
  { id: "email",     label: "Email",      color: "#6366f1", Icon: IcoMail,      eventos: [
    { id: "email_recibido",     label: "Email recibido",          desc: "Se recibe un nuevo email" },
  ]},
  { id: "web",       label: "Chat web",   color: "#3b82f6", Icon: IcoGlobe,     eventos: [
    { id: "chat_iniciado",      label: "Chat iniciado",           desc: "El usuario abre el chat en el sitio" },
  ]},
  { id: "flujo",    label: "Otro flow",  color: "#ca8a04", Icon: IcoSubflow,   eventos: [
    { id: "desde_flujo",        label: "Viene de otro flow",      desc: "Este flow se activa cuando otro flow redirige aquí" },
  ]},
]

// ════════════════════════════════════════════════════════════════════════════
// Picker reutilizable de módulos — aparece en FAB, dropPicker y paneCtxMenu
function ModulePicker({ onAdd, onDragStart }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 6px 24px rgba(0,0,0,0.14)", width: 220, maxHeight: 360, overflowY: "auto", padding: "6px 0" }}>
      <div style={{ padding: "5px 12px 4px", fontSize: "0.45rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>
        Insertar módulo
      </div>
      {SIDEBAR_ITEMS.map(({ categoria, items }) => {
        const cat = CATEGORIAS[categoria]
        return (
          <div key={categoria}>
            <div style={{ padding: "4px 12px 2px", fontSize: "0.42rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em", color: cat.color, marginTop: 2 }}>
              {cat.label}
            </div>
            {items.map(({ tipo, desc }) => {
              const t    = TIPOS[tipo]
              const Icon = t.icono
              return (
                <div
                  key={tipo}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/reactflow", tipo)
                    e.dataTransfer.effectAllowed = "move"
                    onDragStart?.(tipo)
                  }}
                  onClick={() => onAdd(tipo)}
                  style={{ display: "flex", alignItems: "center", gap: 0, margin: "2px 8px", borderRadius: 6, overflow: "hidden", cursor: "grab", border: `1px solid ${t.color}33`, transition: "box-shadow 0.1s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${t.color}44` }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none" }}
                >
                  {/* Mini topbar con gradiente */}
                  <div style={{ width: 32, flexShrink: 0, alignSelf: "stretch", background: `linear-gradient(to bottom, ${t.color}, ${t.color}88)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={13} style={{ color: "#fff" }} />
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, padding: "5px 8px", background: "#fff" }}>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>{t.label}</div>
                    <div style={{ fontSize: "0.5rem", color: "#94a3b8", lineHeight: 1.3, marginTop: 1 }}>{desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
function FlowEditorInner({ flow, onGuardar, onVolver }) {
  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [nombre,    setNombre]    = useState(flow?.nombre ?? "Nuevo flow")
  const [activo,    setActivo]    = useState(flow?.activo ?? true)
  const [selId,     setSelId]     = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [savedAt,   setSavedAt]   = useState(null)

  const [fabOpen,      setFabOpen]      = useState(false)
  const [dropPicker,   setDropPicker]   = useState(null)  // { x, y } screen coords
  const [connectFrom,  setConnectFrom]  = useState(null)  // { nodeId, handleId }
  const [minimapOpen, setMinimapOpen] = useState(false)
  const [ctxMenu,      setCtxMenu]      = useState(null)
  const [triggerModal, setTriggerModal] = useState(false)
  const [triggerCanal, setTriggerCanal] = useState(CANALES[0].id)
  const [nodesLocked,    setNodesLocked]    = useState(false)
  const [dragBtnId,      setDragBtnId]      = useState(null)
  const [allFlows,       setAllFlows]       = useState([])
  const [allCampos,      setAllCampos]      = useState([])
  const [allAgentes,     setAllAgentes]     = useState([])
  const [nuevoCampo,     setNuevoCampo]     = useState(null) // null | { nombre, tipo, creando }
  const [isDark,         setIsDark]         = useState(false)
  const [paneCtxMenu,    setPaneCtxMenu]    = useState(null) // { x, y }

  const flowActionsRef = useRef({})
  const { zoomIn, zoomOut, fitView: rfFitView } = useReactFlow()

  // Actualizar acciones del nodo en cada render para evitar closures stale
  flowActionsRef.current = {
    deleteNode: (nodeId) => {
      const newEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
      const newNodes = nodes.filter((n) => n.id !== nodeId)
      setEdges(newEdges)
      setNodes(newNodes)
      pushHistorySnap(newNodes, newEdges)
      if (selId === nodeId) setSelId(null)
    },
    duplicateNode: (nodeId) => {
      const nodo = nodes.find((n) => n.id === nodeId)
      if (!nodo) return
      const newId  = `${nodo.data.tipo}-${Date.now()}`
      const newNode = { ...nodo, id: newId, selected: false, position: { x: nodo.position.x + 24, y: nodo.position.y + 24 } }
      const newNodes = [...nodes, newNode]
      setNodes(newNodes)
      pushHistorySnap(newNodes, edges)
    },
  }

  // ── Historia undo/redo ─────────────────────────────────────────────────────
  const historyRef  = useRef([])
  const [historyIdx, setHistoryIdx] = useState(0)
  const undoingRef  = useRef(false)

  function pushHistorySnap(ns, es) {
    if (undoingRef.current) return
    setHistoryIdx((prev) => {
      const trimmed = historyRef.current.slice(0, prev + 1)
      trimmed.push({ nodes: JSON.parse(JSON.stringify(ns)), edges: JSON.parse(JSON.stringify(es)) })
      historyRef.current = trimmed.slice(-50)
      return historyRef.current.length - 1
    })
  }

  const undo = useCallback(() => {
    setHistoryIdx((prev) => {
      if (prev <= 0) return prev
      const idx  = prev - 1
      const snap = historyRef.current[idx]
      undoingRef.current = true
      setNodes(snap.nodes)
      setEdges(snap.edges)
      setTimeout(() => { undoingRef.current = false }, 50)
      return idx
    })
  }, [setNodes, setEdges])

  const redo = useCallback(() => {
    setHistoryIdx((prev) => {
      if (prev >= historyRef.current.length - 1) return prev
      const idx  = prev + 1
      const snap = historyRef.current[idx]
      undoingRef.current = true
      setNodes(snap.nodes)
      setEdges(snap.edges)
      setTimeout(() => { undoingRef.current = false }, 50)
      return idx
    })
  }, [setNodes, setEdges])

  const canUndo = historyIdx > 0
  const canRedo = historyIdx < historyRef.current.length - 1

  // Ctrl+Z / Ctrl+Y — solo cuando el foco NO está en un input
  useEffect(() => {
    function handleKey(e) {
      const tag = document.activeElement?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.ctrlKey && e.key === "y") || (e.ctrlKey && e.shiftKey && e.key === "Z")) { e.preventDefault(); redo() }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [undo, redo])

  // ── Carga de flows, campos y agentes (para selectores) ───────────────────
  useEffect(() => {
    api.get("/api/flows").then((d) => setAllFlows(Array.isArray(d) ? d : [])).catch(() => {})
    api.get("/api/flows/campos").then((d) => setAllCampos(Array.isArray(d) ? d : [])).catch(() => {})
    api.get("/api/flows/agentes").then((d) => setAllAgentes(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  // ── Carga de flow ──────────────────────────────────────────────────────────
  useEffect(() => {
    const initialNodes = flow?.nodos?.nodes?.length ? flow.nodos.nodes : [NODO_INICIAL]
    const rawEdges     = flow?.nodos?.edges ?? []

    // Inyectar colores en edges cargados de DB (no tienen sourceColor/targetColor)
    const initialEdges = rawEdges.map((edge) => {
      if (edge.data?.sourceColor) return edge // ya tiene colores
      const srcNode   = initialNodes.find((n) => n.id === edge.source)
      const tgtNode   = initialNodes.find((n) => n.id === edge.target)
      const srcColor  = TIPOS[srcNode?.data?.tipo]?.color ?? "#94a3b8"
      const tgtColor  = TIPOS[tgtNode?.data?.tipo]?.color ?? "#94a3b8"
      return { ...edge, data: { ...edge.data, sourceColor: srcColor, targetColor: tgtColor } }
    })

    setNodes(initialNodes)
    setEdges(initialEdges)
    setNombre(flow?.nombre ?? "Nuevo flow")
    setActivo(flow?.activo ?? true)
    setSelId(null)
    historyRef.current = [{ nodes: JSON.parse(JSON.stringify(initialNodes)), edges: JSON.parse(JSON.stringify(initialEdges)) }]
    setHistoryIdx(0)
    setSavedAt(null)
  }, [flow])

  // ── Acciones ───────────────────────────────────────────────────────────────
  const onConnect = useCallback((params) => {
    const sourceNode  = nodes.find((n) => n.id === params.source)
    const targetNode  = nodes.find((n) => n.id === params.target)
    const sourceColor = TIPOS[sourceNode?.data?.tipo]?.color ?? "#94a3b8"
    const targetColor = TIPOS[targetNode?.data?.tipo]?.color ?? "#94a3b8"
    const newEdges = addEdge({
      ...params,
      style: { strokeWidth: 1.5 },
      data:  { sourceColor, targetColor },
    }, edges)
    setEdges(newEdges)
    pushHistorySnap(nodes, newEdges)
  }, [nodes, edges])

  const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move" }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const tipo = e.dataTransfer.getData("application/reactflow")
    if (!reactFlowInstance) return
    // Si venía con un tipo ya elegido desde el picker, abrimos el ModulePicker
    // en la posición de suelta para que el usuario confirme / elija el módulo
    setDropPicker({ x: e.clientX, y: e.clientY })
    setFabOpen(false)
    setConnectFrom(null)
  }, [reactFlowInstance])

  function actualizarNodo(campo, valor) {
    if (!selId) return
    setNodes((nds) => nds.map((n) => n.id === selId ? { ...n, data: { ...n.data, [campo]: valor } } : n))
  }

  function agregarBoton() {
    const nodo = nodes.find((n) => n.id === selId)
    if (!nodo) return
    const botones  = [...(nodo.data.botones ?? []), { id: `btn-${Date.now()}`, texto: "" }]
    const newNodes = nodes.map((n) => n.id === selId ? { ...n, data: { ...n.data, botones } } : n)
    setNodes(newNodes)
    pushHistorySnap(newNodes, edges)
  }

  function actualizarBoton(btnId, texto) {
    const nodo = nodes.find((n) => n.id === selId)
    if (!nodo) return
    actualizarNodo("botones", (nodo.data.botones ?? []).map((b) => b.id === btnId ? { ...b, texto } : b))
  }

  function eliminarBoton(btnId) {
    const nodo = nodes.find((n) => n.id === selId)
    if (!nodo) return
    const botones  = (nodo.data.botones ?? []).filter((b) => b.id !== btnId)
    const newNodes = nodes.map((n) => n.id === selId ? { ...n, data: { ...n.data, botones } } : n)
    const newEdges = edges.filter((e) => !(e.source === selId && e.sourceHandle === btnId))
    setNodes(newNodes)
    setEdges(newEdges)
    pushHistorySnap(newNodes, newEdges)
  }

  function moverBoton(fromId, toId) {
    if (fromId === toId) return
    const nodo = nodes.find((n) => n.id === selId)
    if (!nodo) return
    const bots    = [...(nodo.data.botones ?? [])]
    const fromIdx = bots.findIndex((b) => b.id === fromId)
    const toIdx   = bots.findIndex((b) => b.id === toId)
    if (fromIdx === -1 || toIdx === -1) return
    const [moved] = bots.splice(fromIdx, 1)
    bots.splice(toIdx, 0, moved)
    const newNodes = nodes.map((n) => n.id === selId ? { ...n, data: { ...n.data, botones: bots } } : n)
    setNodes(newNodes)
    pushHistorySnap(newNodes, edges)
  }

  function eliminarNodo() {
    const newEdges = edges.filter((e) => e.source !== selId && e.target !== selId)
    const newNodes = nodes.filter((n) => n.id !== selId)
    setEdges(newEdges)
    setNodes(newNodes)
    pushHistorySnap(newNodes, newEdges)
    setSelId(null)
  }

  function agregarNota() {
    const id  = `nota-${Date.now()}`
    const bounds = reactFlowWrapper.current?.getBoundingClientRect()
    const cx  = bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2
    const cy  = bounds ? bounds.top  + bounds.height / 2 : window.innerHeight / 2
    const pos = reactFlowInstance?.screenToFlowPosition({ x: cx, y: cy }) ?? { x: 200, y: 200 }
    const newNode = { id, type: "nota", position: pos, data: { tipo: "nota", contenido: "Nota…", botones: [] } }
    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    pushHistorySnap(newNodes, edges)
    setSelId(id)
  }

  function addNodeAt(tipo, screenX, screenY) {
    if (!reactFlowInstance) return
    const bounds = reactFlowWrapper.current.getBoundingClientRect()
    // screenToFlowPosition espera coordenadas de viewport (clientX/Y), NO relativas al contenedor
    const cx = screenX ?? (bounds.left + bounds.width / 2)
    const cy = screenY ?? (bounds.top + bounds.height / 2)
    const position = reactFlowInstance.screenToFlowPosition({ x: cx, y: cy })
    const id = `${tipo}-${Date.now()}`
    const extraData = tipo === "subflow"
      ? { flujoId: "", flujoNombre: "" }
      : tipo === "mensaje"
        ? { respuestaTipo: "texto", respuestaCampo: "", respuestaOpen: true }
        : {}
    const newNode = { id, type: tipo, position, data: { tipo, label: "", contenido: "", keywords: "", accion: "", pregunta: "", botones: [], triggers: [], ...extraData } }
    const newNodes = [...nodes, newNode]
    let newEdges = edges
    if (connectFrom?.nodeId) {
      const sourceNode  = nodes.find((n) => n.id === connectFrom.nodeId)
      const sourceColor = TIPOS[sourceNode?.data?.tipo]?.color ?? "#94a3b8"
      const targetColor = TIPOS[tipo]?.color ?? "#94a3b8"
      newEdges = addEdge({
        id: `e-${connectFrom.nodeId}-${id}`,
        source: connectFrom.nodeId,
        target: id,
        sourceHandle: connectFrom.handleId ?? null,
        style: { strokeWidth: 1.5 },
        data:  { sourceColor, targetColor },
      }, edges)
    }
    setNodes(newNodes)
    setEdges(newEdges)
    pushHistorySnap(newNodes, newEdges)
    setSelId(id)
    setFabOpen(false)
    setDropPicker(null)
    setConnectFrom(null)
  }

  const onConnectStart = useCallback((_, { nodeId, handleId }) => {
    setConnectFrom({ nodeId, handleId })
  }, [])

  const onConnectEnd = useCallback((event) => {
    const target = event.target
    const onCanvas = target.classList.contains("react-flow__pane")
      || target.classList.contains("react-flow__background")
      || target.tagName === "svg"
    if (onCanvas) {
      setDropPicker({ x: event.clientX, y: event.clientY })
      setFabOpen(false)
    } else {
      setConnectFrom(null)
    }
  }, [])

  function agregarTrigger(canalId, eventoId) {
    const canal  = CANALES.find((c) => c.id === canalId)
    const evento = canal?.eventos.find((e) => e.id === eventoId)
    if (!canal || !evento || !nodoActivo) return
    const trig = { id: `trig-${Date.now()}`, canal: canalId, canalLabel: canal.label, canalColor: canal.color, evento: eventoId, eventoLabel: evento.label, keywords: "" }
    actualizarNodo("triggers", [...(nodoActivo.data.triggers ?? []), trig])
    setTriggerModal(false)
  }

  function eliminarTrigger(trigId) {
    if (!nodoActivo) return
    actualizarNodo("triggers", (nodoActivo.data.triggers ?? []).filter((t) => t.id !== trigId))
  }

  function eliminarNodoPorId(id) {
    const newEdges = edges.filter((e) => e.source !== id && e.target !== id)
    const newNodes = nodes.filter((n) => n.id !== id)
    setEdges(newEdges)
    setNodes(newNodes)
    pushHistorySnap(newNodes, newEdges)
    if (selId === id) setSelId(null)
  }

  function onNodeDragStart() {}
  function onNodeDragStop()  {}

  function onNodeContextMenu(event, node) {
    event.preventDefault()
    setCtxMenu({ nodeId: node.id, x: event.clientX, y: event.clientY })
    setSelId(node.id)
  }

  function ctxDuplicar() {
    const nodo = nodes.find((n) => n.id === ctxMenu?.nodeId)
    if (!nodo) return
    const id      = `${nodo.data.tipo}-${Date.now()}`
    const newNode = { ...nodo, id, selected: false, position: { x: nodo.position.x + 24, y: nodo.position.y + 24 } }
    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    pushHistorySnap(newNodes, edges)
    setCtxMenu(null)
  }

  function ctxEliminar() {
    const id = ctxMenu?.nodeId
    if (!id) return
    const newEdges = edges.filter((e) => e.source !== id && e.target !== id)
    const newNodes = nodes.filter((n) => n.id !== id)
    setEdges(newEdges)
    setNodes(newNodes)
    pushHistorySnap(newNodes, newEdges)
    if (selId === id) setSelId(null)
    setCtxMenu(null)
  }

  async function guardar() {
    if (!nombre.trim()) { alert("El flow necesita un nombre"); return }
    setGuardando(true)
    try {
      const payload = { nombre: nombre.trim(), activo, nodos: { nodes, edges } }
      if (flow?.id) { await api.put(`/api/flows/${flow.id}`, payload) }
      else          { await api.post("/api/flows", payload) }
      setSavedAt(new Date())
      onGuardar?.()
    } catch (e) { alert(e.message) }
    finally { setGuardando(false) }
  }

  const nodoActivo = selId ? nodes.find((n) => n.id === selId) : null
  const tipoActivo = nodoActivo ? TIPOS[nodoActivo.data.tipo] : null
  const TipoIcon   = tipoActivo?.icono ?? null

  const inicioNode    = nodes.find((n) => n.data?.tipo === "inicio")
  const canalesActivos = [...new Map((inicioNode?.data.triggers ?? []).map((t) => [t.canal, t])).values()]

  const btnGhost = {
    background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center",
    gap: "0.25rem", borderRadius: 6, padding: "0.3rem 0.4rem", fontFamily: "inherit",
    transition: "background 0.12s", color: "#64748b",
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>

      {/* ── TOPBAR ── */}
      <div style={{ height: 42, borderBottom: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", padding: "0 0.75rem", gap: "0.25rem", flexShrink: 0 }}>

        {/* Izquierdo: breadcrumb */}
        <button
          onClick={onVolver}
          style={{ ...btnGhost, gap: "0.3rem", fontSize: "0.8rem", color: "#94a3b8" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none" }}
        >
          ← <span>Automatizaciones</span>
        </button>

        <span style={{ color: "#e2e8f0", fontSize: "1rem" }}>›</span>

        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={{ border: "none", outline: "none", fontSize: "0.875rem", fontWeight: 600, color: "#0f172a", background: "transparent", width: Math.max(60, Math.min(nombre.length * 9, 220)), minWidth: 60 }}
          placeholder="Nombre del flow"
        />

        <span style={{
          fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: 4, whiteSpace: "nowrap",
          letterSpacing: "0.05em",
          background: activo ? "#dcfce7" : "#f1f5f9",
          color:      activo ? "#16a34a" : "#94a3b8",
          border:     `1px solid ${activo ? "#bbf7d0" : "#e2e8f0"}`,
        }}>
          {activo ? "LIVE" : "INACTIVO"}
        </span>

        {/* Canal indicators */}
        {canalesActivos.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.15rem", marginLeft: "0.25rem" }}>
            {canalesActivos.map((t) => {
              const canal   = CANALES.find((c) => c.id === t.canal)
              const CIcon   = canal?.Icon
              return CIcon ? (
                <div key={t.canal} title={t.canalLabel} style={{ width: 20, height: 20, borderRadius: 5, background: t.canalColor + "18", border: `1px solid ${t.canalColor}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: t.canalColor }}>
                  <CIcon size={11} />
                </div>
              ) : null
            })}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Guardado indicator */}
        {savedAt && (
          <span style={{ fontSize: "0.7rem", color: "#94a3b8", marginRight: "0.25rem" }}>✓ Guardado</span>
        )}

        {/* Undo */}
        <button
          onClick={undo}
          title="Deshacer (Ctrl+Z)"
          disabled={!canUndo}
          style={{ ...btnGhost, opacity: canUndo ? 1 : 0.3 }}
          onMouseEnter={(e) => canUndo && (e.currentTarget.style.background = "#f1f5f9")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <IcoUndo size={15} />
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          title="Rehacer (Ctrl+Y)"
          disabled={!canRedo}
          style={{ ...btnGhost, opacity: canRedo ? 1 : 0.3 }}
          onMouseEnter={(e) => canRedo && (e.currentTarget.style.background = "#f1f5f9")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <IcoRedo size={15} />
        </button>

        <div style={{ width: 1, height: 18, background: "#e2e8f0", margin: "0 0.25rem" }} />

        {/* Activo */}
        <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", cursor: "pointer", color: "#374151", userSelect: "none" }}>
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} style={{ width: 13, height: 13 }} />
          Activo
        </label>

        {/* Guardar */}
        <button
          onClick={guardar}
          disabled={guardando}
          style={{ background: guardando ? "#93c5fd" : "#3b82f6", color: "white", border: "none", borderRadius: 6, padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontFamily: "inherit", marginLeft: "0.25rem" }}
        >
          <IcoSave size={12} />
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>

      {/* ── MAIN ROW ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* ── CANVAS ── */}
        <div ref={reactFlowWrapper} style={{ flex: 1, minWidth: 0, position: "relative", background: isDark ? "#1A1A1E" : "#FAFAF7" }}>
          <FlowActionsContext.Provider value={flowActionsRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(_, node) => { setSelId(node.id); setCtxMenu(null) }}
            onPaneClick={() => { setSelId(null); setCtxMenu(null); setFabOpen(false); setDropPicker(null); setConnectFrom(null); setPaneCtxMenu(null) }}
            onPaneContextMenu={(e) => { e.preventDefault(); setPaneCtxMenu({ x: e.clientX, y: e.clientY }); setFabOpen(false); setCtxMenu(null) }}
            onNodeContextMenu={onNodeContextMenu}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            connectionRadius={60}
            fitView
            fitViewOptions={{ padding: 2.5, maxZoom: 0.65 }}
            nodesDraggable={!nodesLocked}
            elementsSelectable={!nodesLocked}
            deleteKeyCode="Delete"
            snapToGrid
            snapGrid={[16, 16]}
          >
            <Background variant="dots" color={isDark ? "#3A3A40" : "#D0CFCB"} gap={20} size={1.5} />

            {minimapOpen && (
              <MiniMap
                nodeColor={(n) => TIPOS[n.data?.tipo]?.color ?? "#94a3b8"}
                maskColor="rgba(0,0,0,0.04)"
                style={{ border: "1px solid #e2e8f0", borderRadius: 8, bottom: 56, right: 12, top: "auto" }}
              />
            )}

            {/* ── Barra de controles — abajo derecha ── */}
            <Panel position="bottom-right" style={{ margin: "0 0 8px 0" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, position: "relative" }}>

                {/* Picker de módulos — abre hacia arriba */}
                {fabOpen && (
                  <ModulePicker
                    onAdd={(tipo) => { addNodeAt(tipo); setFabOpen(false) }}
                    onDragStart={(tipo) => { setFabOpen(false) }}
                  />
                )}

              <div style={{ display: "flex", alignItems: "center", background: isDark ? "#2A2A2E" : "#fff", borderRadius: 8, boxShadow: "0 1px 8px rgba(0,0,0,0.12)", border: `1px solid ${isDark ? "#3A3A40" : "#e2e8f0"}`, overflow: "hidden" }}>

                {/* Módulos */}
                <button
                  onClick={() => { setFabOpen((v) => !v); setDropPicker(null); setConnectFrom(null) }}
                  title="Insertar módulo"
                  style={{ width: 28, height: 28, background: fabOpen ? (isDark ? "#3A3A40" : "#f1f5f9") : "none", border: "none", borderRight: `1px solid ${isDark ? "#3A3A40" : "#f1f5f9"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: fabOpen ? "#7F77DD" : (isDark ? "#aaa" : "#64748b"), flexShrink: 0 }}
                >
                  <IcoFlow size={13} />
                </button>

                <div style={{ width: 1, height: 18, background: isDark ? "#3A3A40" : "#e2e8f0", flexShrink: 0 }} />

                {/* Zoom − + fit */}
                {[
                  { title: "Alejar",        onClick: () => zoomOut({ duration: 200 }), label: "−" },
                  { title: "Acercar",       onClick: () => zoomIn({ duration: 200 }),  label: "+" },
                  { title: "Ajustar vista", onClick: () => rfFitView({ duration: 300, padding: 0.3 }), label: "⊡" },
                ].map(({ title, onClick, label }) => (
                  <button key={title} onClick={onClick} title={title} style={{ width: 28, height: 28, background: "none", border: "none", borderRight: `1px solid ${isDark ? "#3A3A40" : "#f1f5f9"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", color: isDark ? "#aaa" : "#374151", fontFamily: "inherit", flexShrink: 0 }}>
                    {label}
                  </button>
                ))}

                <div style={{ width: 1, height: 18, background: isDark ? "#3A3A40" : "#e2e8f0", flexShrink: 0 }} />

                {/* Lock */}
                <button
                  onClick={() => setNodesLocked((v) => !v)}
                  title={nodesLocked ? "Desbloquear" : "Bloquear nodos"}
                  style={{ width: 28, height: 28, background: "none", border: "none", borderRight: `1px solid ${isDark ? "#3A3A40" : "#f1f5f9"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: nodesLocked ? "#ef4444" : (isDark ? "#aaa" : "#64748b"), flexShrink: 0 }}
                >
                  {nodesLocked ? <IcoLock size={13} /> : <IcoUnlock size={13} />}
                </button>

                {/* Nota */}
                <button onClick={agregarNota} title="Agregar nota" style={{ width: 28, height: 28, background: "none", border: "none", borderRight: `1px solid ${isDark ? "#3A3A40" : "#f1f5f9"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isDark ? "#aaa" : "#64748b", flexShrink: 0 }}>
                  <IcoNote size={13} />
                </button>

                {/* Minimap */}
                <button onClick={() => setMinimapOpen((v) => !v)} title={minimapOpen ? "Ocultar mapa" : "Mostrar mapa"} style={{ width: 28, height: 28, background: minimapOpen ? (isDark ? "#3A3A40" : "#f1f5f9") : "none", border: "none", borderRight: `1px solid ${isDark ? "#3A3A40" : "#f1f5f9"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: minimapOpen ? "#7F77DD" : (isDark ? "#aaa" : "#64748b"), flexShrink: 0 }}>
                  <IcoMap size={13} />
                </button>

                <div style={{ width: 1, height: 18, background: isDark ? "#3A3A40" : "#e2e8f0", flexShrink: 0 }} />

                {/* Sol / Luna — modo claro/oscuro */}
                <button
                  onClick={() => setIsDark((v) => !v)}
                  title={isDark ? "Modo claro" : "Modo oscuro"}
                  style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isDark ? "#fbbf24" : "#64748b", flexShrink: 0 }}
                >
                  {isDark ? <IcoSun size={13} /> : <IcoMoon size={13} />}
                </button>
              </div>
              </div>
            </Panel>
          </ReactFlow>
          </FlowActionsContext.Provider>
        </div>

        {/* ── DROP PICKER — aparece en el punto de soltar una conexión ── */}
        {dropPicker && (
          <div
            style={{ position: "fixed", top: dropPicker.y, left: dropPicker.x, zIndex: 5000 }}
            onMouseLeave={() => { setDropPicker(null); setConnectFrom(null) }}
          >
            <ModulePicker onAdd={(tipo) => addNodeAt(tipo, dropPicker.x, dropPicker.y)} />
          </div>
        )}

        {/* ── PANE CONTEXT MENU — click derecho en lienzo ── */}
        {paneCtxMenu && (
          <div
            style={{ position: "fixed", top: paneCtxMenu.y, left: paneCtxMenu.x, zIndex: 5000 }}
            onMouseLeave={() => setPaneCtxMenu(null)}
          >
            <ModulePicker onAdd={(tipo) => { addNodeAt(tipo, paneCtxMenu.x, paneCtxMenu.y); setPaneCtxMenu(null) }} />
          </div>
        )}

        {/* ── CONTEXT MENU (click derecho en nodo) ── */}
        {ctxMenu && (
          <div
            style={{ position: "fixed", top: ctxMenu.y, left: ctxMenu.x, zIndex: 2000, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 148, overflow: "hidden", fontSize: "0.8rem" }}
            onMouseLeave={() => setCtxMenu(null)}
          >
            {[
              { label: "Duplicar", icon: <IcoCopy2 size={13} />, action: ctxDuplicar, danger: false },
              { label: "Eliminar", icon: <IcoTrash  size={13} />, action: ctxEliminar, danger: true  },
            ].map(({ label, icon, action, danger }) => (
              <button
                key={label}
                onClick={action}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 0.75rem", background: "none", border: "none", cursor: "pointer", color: danger ? "#ef4444" : "#374151", textAlign: "left", transition: "background 0.1s", fontFamily: "inherit", fontSize: "inherit" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "#fef2f2" : "#f8fafc" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none" }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        )}

        {/* ── PANEL DERECHO — Propiedades del nodo ── */}
        <div style={{ width: nodoActivo ? 240 : 0, overflow: "hidden", transition: "width 0.18s ease", background: "#fff", borderLeft: "1px solid #e2e8f0", flexShrink: 0 }}>
          {nodoActivo && (
            <div style={{ width: 240, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.625rem", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>

              {/* Badge tipo */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ background: tipoActivo?.color + "18", border: `1px solid ${tipoActivo?.color}44`, borderRadius: 5, padding: "0.2rem 0.5rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", color: tipoActivo?.color }}>
                  {TipoIcon && <TipoIcon size={10} />}
                  <span style={{ fontSize: "0.5rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em" }}>{tipoActivo?.label}</span>
                </div>
              </div>

              {/* Etiqueta */}
              <div>
                <label style={LABEL}>Etiqueta</label>
                <input style={INPUT} value={nodoActivo.data.label ?? ""} onChange={(e) => actualizarNodo("label", e.target.value)} placeholder="Nombre visible en el canvas" />
              </div>

              {/* INICIO — triggers */}
              {nodoActivo.data.tipo === "inicio" && (
                <div>
                  <label style={LABEL}>Disparadores</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {(nodoActivo.data.triggers ?? []).map((trig) => (
                      <div key={trig.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.4rem 0.5rem", borderLeft: `3px solid ${trig.canalColor ?? "#94a3b8"}` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.625rem", fontWeight: 700, color: trig.canalColor ?? "#64748b" }}>{trig.canalLabel}</div>
                          <div style={{ fontSize: "0.5625rem", color: "#64748b", marginTop: "0.1rem" }}>{trig.eventoLabel}</div>
                          {trig.keywords && <div style={{ fontSize: "0.5rem", color: "#94a3b8", marginTop: "0.1rem", fontStyle: "italic" }}>"{trig.keywords}"</div>}
                        </div>
                        <button onClick={() => eliminarTrigger(trig.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.1rem", flexShrink: 0, fontSize: "0.75rem", lineHeight: 1 }}>✕</button>
                      </div>
                    ))}
                    {(nodoActivo.data.triggers ?? []).length === 0 && (
                      <div style={{ fontSize: "0.625rem", color: "#94a3b8", background: "#f8fafc", border: "1px dashed #e2e8f0", borderRadius: 6, padding: "0.5rem", textAlign: "center" }}>
                        Sin disparadores — el flow no se activará
                      </div>
                    )}
                    <button
                      onClick={() => setTriggerModal(true)}
                      style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: 6, padding: "0.35rem 0.5rem", fontSize: "0.6875rem", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", textAlign: "center" }}
                    >
                      + Agregar disparador
                    </button>
                  </div>
                </div>
              )}

              {nodoActivo.data.tipo === "mensaje" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div>
                    <label style={LABEL}>Texto del mensaje</label>
                    <textarea
                      style={{ ...INPUT, resize: "vertical", minHeight: 80 }}
                      value={nodoActivo.data.contenido ?? ""}
                      onChange={(e) => actualizarNodo("contenido", e.target.value)}
                      placeholder="¡Hola! ¿En qué te puedo ayudar?"
                    />
                  </div>

                  {/* Bloque "Respuesta del contacto" — siempre visible */}
                  <div>
                    <label style={LABEL}>Respuesta del contacto</label>
                    <div style={{ background: "#eff6ff", border: "1px dashed #93c5fd", borderRadius: 7, overflow: "hidden" }}>
                      {/* Cabecera clickeable */}
                      <div
                        onClick={() => actualizarNodo("respuestaOpen", !(nodoActivo.data.respuestaOpen ?? true))}
                        style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.5rem", cursor: "pointer", userSelect: "none" }}
                      >
                        <IcoGrip size={10} style={{ color: "#93c5fd" }} />
                        <span style={{ fontSize: "0.6875rem", color: "#3b82f6", fontWeight: 600, flex: 1 }}>
                          Respuesta del contacto:&nbsp;
                          <span style={{ fontWeight: 400 }}>
                            {nodoActivo.data.respuestaTipo === "numero" ? "Número"
                              : nodoActivo.data.respuestaTipo === "imagen" ? "Imagen"
                              : "Texto"}
                          </span>
                        </span>
                        <span style={{ fontSize: "0.55rem", color: "#93c5fd", transition: "transform 0.15s", display: "inline-block", transform: (nodoActivo.data.respuestaOpen ?? true) ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
                      </div>

                      {/* Panel expandible */}
                      {(nodoActivo.data.respuestaOpen ?? true) && (
                        <div style={{ borderTop: "1px solid #bfdbfe", padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem", background: "#fff" }}>
                          <div>
                            <label style={LABEL}>Tipo de respuesta</label>
                            <select
                              style={INPUT}
                              value={nodoActivo.data.respuestaTipo ?? "texto"}
                              onChange={(e) => actualizarNodo("respuestaTipo", e.target.value)}
                            >
                              <option value="texto">Texto</option>
                              <option value="numero">Número</option>
                              <option value="imagen">Imagen</option>
                            </select>
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                              <label style={{ ...LABEL, margin: 0 }}>Guardar en campo</label>
                              {!nuevoCampo && (
                                <button
                                  onClick={() => setNuevoCampo({ nombre: "", tipo: "texto", creando: false })}
                                  style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "0.6rem", fontWeight: 700, cursor: "pointer", padding: "0.1rem 0.25rem", fontFamily: "inherit" }}
                                >
                                  + Nuevo
                                </button>
                              )}
                            </div>

                            {/* Mini-form crear campo */}
                            {nuevoCampo && (
                              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 6, padding: "0.5rem", marginBottom: "0.35rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                <input
                                  style={{ ...INPUT, fontFamily: "monospace", fontSize: "0.75rem" }}
                                  value={nuevoCampo.nombre}
                                  onChange={(e) => setNuevoCampo((f) => ({ ...f, nombre: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                                  placeholder="nombre_campo"
                                  autoFocus
                                />
                                <select
                                  style={{ ...INPUT, fontSize: "0.75rem" }}
                                  value={nuevoCampo.tipo}
                                  onChange={(e) => setNuevoCampo((f) => ({ ...f, tipo: e.target.value }))}
                                >
                                  <option value="texto">Texto</option>
                                  <option value="numero">Número</option>
                                  <option value="fecha">Fecha</option>
                                  <option value="booleano">Sí / No</option>
                                </select>
                                <div style={{ display: "flex", gap: "0.3rem" }}>
                                  <button
                                    onClick={async () => {
                                      if (!nuevoCampo.nombre.trim()) return
                                      setNuevoCampo((f) => ({ ...f, creando: true }))
                                      try {
                                        const campo = await api.post("/api/flows/campos", { nombre: nuevoCampo.nombre, tipo: nuevoCampo.tipo })
                                        const nuevos = [...allCampos, campo]
                                        setAllCampos(nuevos)
                                        actualizarNodo("respuestaCampo", campo.nombre)
                                        setNuevoCampo(null)
                                      } catch (e) {
                                        alert(e.message)
                                        setNuevoCampo((f) => ({ ...f, creando: false }))
                                      }
                                    }}
                                    disabled={nuevoCampo.creando || !nuevoCampo.nombre.trim()}
                                    style={{ flex: 1, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 5, padding: "0.3rem", fontSize: "0.6875rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: (!nuevoCampo.nombre.trim() || nuevoCampo.creando) ? 0.5 : 1 }}
                                  >
                                    {nuevoCampo.creando ? "Creando…" : "Crear"}
                                  </button>
                                  <button
                                    onClick={() => setNuevoCampo(null)}
                                    style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 5, padding: "0.3rem 0.5rem", fontSize: "0.6875rem", cursor: "pointer", color: "#64748b", fontFamily: "inherit" }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )}

                            <select
                              style={INPUT}
                              value={nodoActivo.data.respuestaCampo ?? ""}
                              onChange={(e) => actualizarNodo("respuestaCampo", e.target.value)}
                            >
                              <option value="">Sin guardar</option>
                              {allCampos.map((c) => (
                                <option key={c.id} value={c.nombre}>{c.nombre}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "0.5rem", color: "#94a3b8", marginTop: "0.25rem", lineHeight: 1.4 }}>
                      El flow se pausa hasta que el contacto responde.
                    </div>
                  </div>
                </div>
              )}

              {nodoActivo.data.tipo === "condicion" && (
                <div>
                  <label style={LABEL}>Keywords (separadas por coma)</label>
                  <input style={INPUT} value={nodoActivo.data.keywords ?? ""} onChange={(e) => actualizarNodo("keywords", e.target.value)} placeholder="turno, reclamo, consulta" />
                  <div style={{ fontSize: "0.5625rem", color: "#94a3b8", marginTop: "0.25rem", lineHeight: 1.4 }}>Si el mensaje contiene alguna de estas palabras, toma este camino.</div>
                </div>
              )}

              {nodoActivo.data.tipo === "delay" && (
                <div>
                  <label style={LABEL}>Segundos de espera</label>
                  <input type="number" style={INPUT} value={nodoActivo.data.segundos ?? 5} onChange={(e) => actualizarNodo("segundos", Number(e.target.value))} min={1} max={3600} />
                </div>
              )}

              {nodoActivo.data.tipo === "espera" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div>
                    <label style={LABEL}>Tiempo sin respuesta</label>
                    <select style={INPUT} value={nodoActivo.data.tiempoMinutos ?? 60} onChange={(e) => actualizarNodo("tiempoMinutos", Number(e.target.value))}>
                      <option value={5}>5 minutos</option>
                      <option value={10}>10 minutos</option>
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={60}>1 hora</option>
                      <option value={120}>2 horas</option>
                      <option value={240}>4 horas</option>
                      <option value={480}>8 horas</option>
                      <option value={1440}>24 horas</option>
                    </select>
                  </div>
                  <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 7, padding: "0.5rem 0.625rem", fontSize: "0.5625rem", color: "#c2410c", lineHeight: 1.6 }}>
                    <strong>Respondió →</strong> si el contacto escribe dentro del tiempo<br />
                    <strong>Timeout →</strong> si no hay respuesta al vencerse el tiempo
                  </div>
                </div>
              )}

              {nodoActivo.data.tipo === "accion" && (
                <div>
                  <label style={LABEL}>Acción a ejecutar</label>
                  <select style={INPUT} value={nodoActivo.data.accion ?? ""} onChange={(e) => actualizarNodo("accion", e.target.value)}>
                    <option value="">Seleccionar…</option>
                    <option value="crear_reclamo">Crear reclamo</option>
                    <option value="crear_turno">Crear turno</option>
                    <option value="notificar_agente">Notificar agente</option>
                    <option value="guardar_campo">Guardar campo de contacto</option>
                  </select>
                </div>
              )}

              {nodoActivo.data.tipo === "ia" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div>
                    <label style={LABEL}>Prompt / Contexto para la IA</label>
                    <textarea style={{ ...INPUT, resize: "vertical", minHeight: 80 }} value={nodoActivo.data.pregunta ?? ""} onChange={(e) => actualizarNodo("pregunta", e.target.value)} placeholder="Sos un asistente municipal. Respondé en base a: {{contexto}}" />
                  </div>
                  <div>
                    <label style={LABEL}>Guardar respuesta en campo</label>
                    <input style={INPUT} value={nodoActivo.data.campoRespuesta ?? ""} onChange={(e) => actualizarNodo("campoRespuesta", e.target.value)} placeholder="ej: respuesta_ia" />
                  </div>
                </div>
              )}

              {nodoActivo.data.tipo === "agente" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div>
                    <label style={LABEL}>Agente</label>
                    {allAgentes.length === 0 ? (
                      <div style={{ fontSize: "0.6875rem", color: "#94a3b8", background: "#f8fafc", border: "1px dashed #e2e8f0", borderRadius: 6, padding: "0.5rem 0.625rem" }}>
                        Sin agentes — creá uno en <strong>Conexiones</strong>
                      </div>
                    ) : (
                      <select
                        style={INPUT}
                        value={nodoActivo.data.agenteId ?? ""}
                        onChange={(e) => {
                          const ag = allAgentes.find((a) => a.id === e.target.value)
                          if (!selId) return
                          setNodes((nds) => nds.map((n) => n.id === selId ? {
                            ...n, data: {
                              ...n.data,
                              agenteId:               e.target.value,
                              agenteNombre:           ag?.nombre ?? "",
                              timeoutRecordatorioMin: ag?.timeoutRecordatorioMin ?? 10,
                              timeoutCierreMin:       ag?.timeoutCierreMin ?? 20,
                            }
                          } : n))
                        }}
                      >
                        <option value="">Seleccionar agente…</option>
                        {allAgentes.filter((a) => a.activo).map((a) => (
                          <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {nodoActivo.data.agenteId && (() => {
                    const ag = allAgentes.find((a) => a.id === nodoActivo.data.agenteId)
                    if (!ag) return null
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <div style={{ background: "#faf5ff", border: "1px solid #a855f733", borderRadius: 8, padding: "0.4rem 0.625rem", fontSize: "0.6rem", color: "#7c3aed", lineHeight: 1.6 }}>
                          <strong>{ag.proveedor}</strong>{ag.modelo ? ` · ${ag.modelo}` : ""}<br />
                          {ag.herramientas?.length > 0 && <span style={{ color: "#64748b" }}>{ag.herramientas.join(", ")}</span>}
                        </div>
                        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 7, padding: "0.4rem 0.625rem", fontSize: "0.6rem", color: "#c2410c", lineHeight: 1.7 }}>
                          <strong>⏱ Inactividad</strong><br />
                          Recordatorio: <strong>{ag.timeoutRecordatorioMin ?? 10} min</strong><br />
                          Cierre: <strong>{ag.timeoutCierreMin ?? 20} min</strong><br />
                          <span style={{ color: "#94a3b8", fontSize: "0.55rem" }}>Configurable en Conexiones → Agentes</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {nodoActivo.data.tipo === "memoria" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div>
                    <label style={LABEL}>Operación</label>
                    <select style={INPUT} value={nodoActivo.data.memOp ?? "leer"} onChange={(e) => actualizarNodo("memOp", e.target.value)}>
                      <option value="leer">Leer memoria</option>
                      <option value="escribir">Escribir en memoria</option>
                      <option value="limpiar">Limpiar memoria</option>
                    </select>
                  </div>
                  <div>
                    <label style={LABEL}>Clave / Namespace</label>
                    <input style={INPUT} value={nodoActivo.data.memKey ?? ""} onChange={(e) => actualizarNodo("memKey", e.target.value)} placeholder="conv_{{contactId}}" />
                  </div>
                  <div>
                    <label style={LABEL}>Almacenamiento</label>
                    <select style={INPUT} value={nodoActivo.data.storageType ?? "interno"} onChange={(e) => actualizarNodo("storageType", e.target.value)}>
                      <option value="interno">Interno (g-start)</option>
                      <option value="redis">Redis</option>
                      <option value="n8n">n8n webhook</option>
                      <option value="webhook">Webhook externo</option>
                    </select>
                  </div>
                  <div style={{ fontSize: "0.5625rem", color: "#94a3b8", lineHeight: 1.4, background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 5, padding: "0.375rem 0.5rem" }}>
                    Módulo en desarrollo. El almacenamiento externo se configurará en Conexiones.
                  </div>
                </div>
              )}

              {nodoActivo.data.tipo === "nota" && (
                <div>
                  <label style={LABEL}>Contenido de la nota</label>
                  <textarea
                    style={{ ...INPUT, resize: "vertical", minHeight: 100, background: "#fefce8", border: "1px solid #fde68a" }}
                    value={nodoActivo.data.contenido ?? ""}
                    onChange={(e) => actualizarNodo("contenido", e.target.value)}
                    placeholder="Escribe tu nota aquí…"
                  />
                </div>
              )}

              {nodoActivo.data.tipo === "subflow" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div>
                    <label style={LABEL}>Flow de destino</label>
                    {allFlows.length > 0 ? (
                      <select
                        style={INPUT}
                        value={nodoActivo.data.flujoId ?? ""}
                        onChange={(e) => {
                          const f = allFlows.find((x) => String(x.id) === e.target.value)
                          if (!selId) return
                          setNodes((nds) => nds.map((n) => n.id === selId
                            ? { ...n, data: { ...n.data, flujoId: e.target.value, flujoNombre: f?.nombre ?? "" } }
                            : n
                          ))
                        }}
                      >
                        <option value="">Seleccionar flow…</option>
                        {allFlows.filter((f) => f.id !== nodoActivo?.data?.flujoId || true).map((f) => (
                          <option key={f.id} value={f.id}>{f.nombre}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        style={INPUT}
                        value={nodoActivo.data.flujoNombre ?? ""}
                        onChange={(e) => actualizarNodo("flujoNombre", e.target.value)}
                        placeholder="Nombre del flow"
                      />
                    )}
                    <div style={{ fontSize: "0.5rem", color: "#94a3b8", marginTop: "0.25rem", lineHeight: 1.4 }}>
                      La conversación continuará en el flow seleccionado.
                    </div>
                  </div>
                </div>
              )}

              {/* BOTÓN — opciones de lista */}
              {nodoActivo.data.tipo === "boton" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div>
                    <label style={LABEL}>Texto introductorio</label>
                    <textarea
                      style={{ ...INPUT, resize: "vertical", minHeight: 60 }}
                      value={nodoActivo.data.contenido ?? ""}
                      onChange={(e) => actualizarNodo("contenido", e.target.value)}
                      placeholder="Seleccioná una opción:"
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <label style={{ ...LABEL, margin: 0 }}>Opciones</label>
                      <button
                        style={{ background: "#ecfdf5", color: "#10b981", border: "1px solid #6ee7b7", borderRadius: 4, padding: "0.15rem 0.4rem", fontSize: "0.625rem", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}
                        onClick={agregarBoton}
                        disabled={(nodoActivo.data.botones?.length ?? 0) >= 10}
                      >
                        + Agregar
                      </button>
                    </div>
                    {(nodoActivo.data.botones ?? []).length === 0 ? (
                      <div style={{ fontSize: "0.625rem", color: "#94a3b8", background: "#f8fafc", border: "1px dashed #e2e8f0", borderRadius: 6, padding: "0.5rem", textAlign: "center" }}>
                        Agregá al menos una opción
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        {(nodoActivo.data.botones ?? []).map((btn, i) => (
                          <div
                            key={btn.id}
                            draggable
                            onDragStart={(e) => { e.dataTransfer.setData("btnId", btn.id); setDragBtnId(btn.id) }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); moverBoton(dragBtnId, btn.id); setDragBtnId(null) }}
                            style={{ display: "flex", gap: "0.3rem", alignItems: "center", background: dragBtnId === btn.id ? "#f0fdf4" : "transparent", borderRadius: 5, transition: "background 0.1s" }}
                          >
                            <IcoGrip size={11} style={{ color: "#d1d5db", flexShrink: 0, cursor: "grab" }} />
                            <input style={{ ...INPUT, flex: 1, borderColor: "#6ee7b788" }} value={btn.texto} onChange={(e) => actualizarBoton(btn.id, e.target.value)} placeholder={`Opción ${i + 1}`} />
                            <button style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.1rem", flexShrink: 0 }} onClick={() => eliminarBoton(btn.id)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: "0.5rem", color: "#94a3b8", marginTop: "0.3rem", lineHeight: 1.4 }}>
                      Cada opción genera un handle de salida. Conectalo al siguiente nodo del flow.
                    </div>
                  </div>
                </div>
              )}

              {/* Eliminar nodo */}
              <button
                style={{ marginTop: "auto", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, padding: "0.4rem 0.625rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.3rem" }}
                onClick={eliminarNodo}
              >
                <IcoTrash size={13} /> Eliminar nodo
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ── TRIGGER PICKER MODAL ── */}
      {triggerModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 4000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => e.target === e.currentTarget && setTriggerModal(false)}
        >
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", width: 540, maxHeight: "76vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ padding: "0.875rem 1.125rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>Agregar disparador</h3>
              <button onClick={() => setTriggerModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1rem", lineHeight: 1 }}>✕</button>
            </div>

            {/* Body: canal izquierdo + eventos derecho */}
            <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

              {/* Canal list */}
              <div style={{ width: 172, borderRight: "1px solid #f1f5f9", padding: "0.5rem 0.375rem", overflowY: "auto", flexShrink: 0 }}>
                {CANALES.map((canal) => {
                  const CanalIcon = canal.Icon
                  const active    = triggerCanal === canal.id
                  return (
                    <div
                      key={canal.id}
                      onClick={() => setTriggerCanal(canal.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.475rem 0.625rem", borderRadius: 8, cursor: "pointer",
                        background: active ? canal.color + "14" : "none",
                        border: `1px solid ${active ? canal.color + "55" : "transparent"}`,
                        marginBottom: "0.125rem", transition: "background 0.1s",
                      }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: canal.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: canal.color }}>
                        <CanalIcon size={15} />
                      </div>
                      <span style={{ fontSize: "0.8125rem", fontWeight: active ? 700 : 400, color: active ? canal.color : "#374151" }}>{canal.label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Evento list */}
              <div style={{ flex: 1, padding: "0.625rem 0.75rem", overflowY: "auto" }}>
                {(() => {
                  const canal = CANALES.find((c) => c.id === triggerCanal)
                  const CanalIcon = canal?.Icon
                  return canal?.eventos.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => agregarTrigger(triggerCanal, ev.id)}
                      style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.75rem", borderRadius: 8, cursor: "pointer", border: "1px solid #f1f5f9", marginBottom: "0.375rem", transition: "background 0.1s, border-color 0.1s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = canal.color + "0d"; e.currentTarget.style.borderColor = canal.color + "44" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "#f1f5f9" }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: canal.color + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: canal.color }}>
                        <CanalIcon size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a", marginBottom: "0.15rem" }}>{ev.label}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{ev.desc}</div>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FlowEditor(props) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner {...props} />
    </ReactFlowProvider>
  )
}
