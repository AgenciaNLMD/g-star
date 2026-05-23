"use client"
import { useState, useCallback, useEffect } from "react"
import { IcoSave, IcoTrash } from "@/components/ui/Icons"
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
} from "reactflow"
import "reactflow/dist/style.css"
import { api } from "@/lib/api-client"
import { FlowNodeComponent, TIPOS } from "./FlowNode"

const nodeTypes = {
  inicio:    FlowNodeComponent,
  mensaje:   FlowNodeComponent,
  condicion: FlowNodeComponent,
  espera:    FlowNodeComponent,
  accion:    FlowNodeComponent,
  agente:    FlowNodeComponent,
  fin:       FlowNodeComponent,
}

const TIPO_OPCIONES = [
  { value: "inicio",    label: "Inicio"    },
  { value: "mensaje",   label: "Mensaje"   },
  { value: "condicion", label: "Condición" },
  { value: "espera",    label: "Esperar"   },
  { value: "accion",    label: "Acción"    },
  { value: "agente",    label: "Agente IA" },
  { value: "fin",       label: "Fin"       },
]

const AREAS_AGENTE = [
  { value: "anses",       label: "ANSES"       },
  { value: "renaper",     label: "RENAPER"     },
  { value: "migraciones", label: "MIGRACIONES" },
  { value: "pami",        label: "PAMI"        },
  { value: "reclamos",    label: "Reclamos"    },
]

const HERRAMIENTAS_AGENTE = [
  { value: "solicitar_turno",    label: "Solicitar turno"    },
  { value: "crear_reclamo",      label: "Crear reclamo"      },
  { value: "guardar_dato",       label: "Guardar dato"       },
  { value: "transferir_a_humano",label: "Transferir a humano"},
  { value: "volver_menu",        label: "Volver al menú"     },
]

const INPUT = { width: "100%", border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.375rem 0.5rem", fontSize: "0.8125rem", fontFamily: "inherit" }
const LABEL = { fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.25rem", color: "#374151" }

export default function FlowEditor({ flow, onGuardar, onVolver }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [nombre, setNombre]   = useState(flow?.nombre ?? "Nuevo flow")
  const [activo, setActivo]   = useState(flow?.activo ?? true)
  const [selId, setSelId]     = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (flow?.nodos?.nodes) {
      setNodes(flow.nodos.nodes)
      setEdges(flow.nodos.edges ?? [])
    } else {
      setNodes([{
        id: "inicio-1",
        type: "inicio",
        position: { x: 220, y: 60 },
        data: { tipo: "inicio", label: "Inicio", contenido: "cualquier mensaje entrante", botones: [] },
      }])
      setEdges([])
    }
    setNombre(flow?.nombre ?? "Nuevo flow")
    setActivo(flow?.activo ?? true)
    setSelId(null)
  }, [flow])

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, style: { strokeWidth: 2 } }, eds))
  }, [setEdges])

  function agregarNodo(tipo) {
    const id = `${tipo}-${Date.now()}`
    const dataBase = { tipo, label: "", contenido: "", keywords: "", accion: "", botones: [] }
    if (tipo === "agente") {
      dataBase.area         = ""
      dataBase.sistemaPrompt = ""
      dataBase.herramientas  = ["solicitar_turno", "crear_reclamo", "transferir_a_humano", "volver_menu"]
    }
    setNodes((nds) => [...nds, {
      id,
      type: tipo,
      position: { x: 150 + Math.random() * 100, y: 80 + nds.length * 160 },
      data: dataBase,
    }])
  }

  function actualizarNodo(campo, valor) {
    if (!selId) return
    setNodes((nds) => nds.map((n) =>
      n.id === selId ? { ...n, data: { ...n.data, [campo]: valor } } : n
    ))
  }

  function agregarBoton() {
    const nodo = nodes.find((n) => n.id === selId)
    if (!nodo) return
    const botones = [...(nodo.data.botones ?? []), { id: `btn-${Date.now()}`, texto: "" }]
    actualizarNodo("botones", botones)
  }

  function actualizarBoton(btnId, texto) {
    const nodo = nodes.find((n) => n.id === selId)
    if (!nodo) return
    const botones = (nodo.data.botones ?? []).map((b) => b.id === btnId ? { ...b, texto } : b)
    actualizarNodo("botones", botones)
  }

  function eliminarBoton(btnId) {
    const nodo = nodes.find((n) => n.id === selId)
    if (!nodo) return
    const botones = (nodo.data.botones ?? []).filter((b) => b.id !== btnId)
    actualizarNodo("botones", botones)
    // Eliminar edges que venían de ese handle
    setEdges((eds) => eds.filter((e) => !(e.source === selId && e.sourceHandle === btnId)))
  }

  function eliminarNodo() {
    setEdges((eds) => eds.filter((e) => e.source !== selId && e.target !== selId))
    setNodes((nds) => nds.filter((n) => n.id !== selId))
    setSelId(null)
  }

  async function guardar() {
    if (!nombre.trim()) { alert("El flow necesita un nombre"); return }
    setGuardando(true)
    try {
      const payload = { nombre: nombre.trim(), activo, nodos: { nodes, edges } }
      if (flow?.id) {
        await api.put(`/api/eapi/flows/${flow.id}`, payload)
      } else {
        await api.post("/api/eapi/flows", payload)
      }
      onGuardar?.()
    } catch (e) {
      alert(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const nodoActivo = selId ? nodes.find((n) => n.id === selId) : null
  const tipoActivo = nodoActivo ? TIPOS[nodoActivo.data.tipo] : null

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>

      {/* Panel izquierdo — tipos de nodo */}
      <div style={{ width: 160, background: "var(--color-surface)", borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column", padding: "0.75rem", gap: "0.375rem", flexShrink: 0 }}>
        <div style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "0.25rem" }}>
          Agregar nodo
        </div>
        {TIPO_OPCIONES.map((t) => (
          <button key={t.value}
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.4rem 0.625rem", fontSize: "0.75rem", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#f8fafc"}
            onClick={() => agregarNodo(t.value)}>
            {t.label}
          </button>
        ))}
        <div style={{ marginTop: "auto", paddingTop: "0.75rem", borderTop: "1px solid #e2e8f0", fontSize: "0.6875rem", color: "#94a3b8", lineHeight: 1.5 }}>
          Arrastrá desde ● abajo hasta ● arriba del siguiente nodo para conectar.
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => setSelId(node.id)}
          onPaneClick={() => setSelId(null)}
          fitView
          deleteKeyCode="Delete"
        >
          <Background color="#e2e8f0" gap={20} />
          <Controls />
          <MiniMap nodeColor={(n) => TIPOS[n.data?.tipo]?.color ?? "#94a3b8"} maskColor="rgba(0,0,0,0.05)" />
          <Panel position="top-center">
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "0.625rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <input
                style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.3rem 0.6rem", fontSize: "0.875rem", fontWeight: 600, width: 220 }}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del flow"
              />
              <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", cursor: "pointer", userSelect: "none" }}>
                <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
                Activo
              </label>
              <button style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.3rem 0.75rem", fontSize: "0.8125rem", cursor: "pointer" }} onClick={onVolver}>
                ← Volver
              </button>
              <button
                style={{ background: "#3b82f6", color: "white", border: "none", borderRadius: 6, padding: "0.3rem 0.875rem", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", opacity: guardando ? 0.7 : 1 }}
                onClick={guardar} disabled={guardando}
              >
                <IcoSave size={13} style={{ marginRight: "0.3rem" }} />
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Panel derecho — propiedades */}
      <div style={{ width: nodoActivo ? 260 : 0, overflow: "hidden", transition: "width 0.2s ease", background: "var(--color-surface)", borderLeft: "1px solid var(--color-border)", flexShrink: 0 }}>
        {nodoActivo && (
          <div style={{ width: 260, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.875rem", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>

            {/* Tipo badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ background: tipoActivo?.color + "18", border: `1px solid ${tipoActivo?.color}44`, borderRadius: 4, padding: "0.2rem 0.5rem", fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", color: tipoActivo?.color }}>
                {tipoActivo?.icono} {tipoActivo?.label}
              </div>
            </div>

            {/* Etiqueta */}
            <div>
              <label style={LABEL}>Etiqueta del nodo</label>
              <input style={INPUT} value={nodoActivo.data.label ?? ""} onChange={(e) => actualizarNodo("label", e.target.value)} placeholder="Nombre visible en el canvas" />
            </div>

            {/* Contenido según tipo */}
            {(nodoActivo.data.tipo === "mensaje" || nodoActivo.data.tipo === "inicio") && (
              <div>
                <label style={LABEL}>{nodoActivo.data.tipo === "inicio" ? "Trigger" : "Texto del mensaje"}</label>
                <textarea
                  style={{ ...INPUT, resize: "vertical", minHeight: 90 }}
                  value={nodoActivo.data.contenido ?? ""}
                  onChange={(e) => actualizarNodo("contenido", e.target.value)}
                  placeholder={nodoActivo.data.tipo === "inicio" ? "cualquier mensaje entrante" : "¡Hola! ¿En qué te puedo ayudar?"}
                />
              </div>
            )}

            {/* BOTONES — solo para nodo mensaje */}
            {nodoActivo.data.tipo === "mensaje" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                  <label style={{ ...LABEL, margin: 0 }}>Botones de respuesta</label>
                  <button
                    style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: 5, padding: "0.2rem 0.5rem", fontSize: "0.7rem", cursor: "pointer", fontWeight: 600 }}
                    onClick={agregarBoton}
                    disabled={(nodoActivo.data.botones?.length ?? 0) >= 6}
                  >
                    + Agregar
                  </button>
                </div>
                {(nodoActivo.data.botones ?? []).length === 0 ? (
                  <div style={{ fontSize: "0.6875rem", color: "#94a3b8", background: "#f8fafc", border: "1px dashed #e2e8f0", borderRadius: 6, padding: "0.5rem", textAlign: "center" }}>
                    Sin botones — el flujo continúa en línea recta
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {(nodoActivo.data.botones ?? []).map((btn, i) => (
                      <div key={btn.id} style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#3b82f6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", fontWeight: 700, flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <input
                          style={{ ...INPUT, flex: 1 }}
                          value={btn.texto}
                          onChange={(e) => actualizarBoton(btn.id, e.target.value)}
                          placeholder={`Botón ${i + 1}`}
                        />
                        <button
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.875rem", padding: "0.125rem", flexShrink: 0 }}
                          onClick={() => eliminarBoton(btn.id)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div style={{ fontSize: "0.6875rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                      Conectá cada botón al siguiente nodo arrastrando desde su ● en el canvas.
                    </div>
                  </div>
                )}
              </div>
            )}

            {nodoActivo.data.tipo === "condicion" && (
              <div>
                <label style={LABEL}>Keywords (separadas por coma)</label>
                <input style={INPUT} value={nodoActivo.data.keywords ?? ""} onChange={(e) => actualizarNodo("keywords", e.target.value)} placeholder="turno, consulta, reclamo" />
                <div style={{ fontSize: "0.6875rem", color: "#94a3b8", marginTop: "0.375rem" }}>
                  Si el mensaje contiene alguna de estas palabras, toma este camino.
                </div>
              </div>
            )}

            {nodoActivo.data.tipo === "espera" && (
              <div>
                <label style={LABEL}>Descripción</label>
                <input style={INPUT} value={nodoActivo.data.contenido ?? ""} onChange={(e) => actualizarNodo("contenido", e.target.value)} placeholder="Esperar respuesta del usuario" />
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
                </select>
              </div>
            )}

            {nodoActivo.data.tipo === "agente" && (
              <>
                <div>
                  <label style={LABEL}>Área</label>
                  <select style={INPUT} value={nodoActivo.data.area ?? ""} onChange={(e) => actualizarNodo("area", e.target.value)}>
                    <option value="">Seleccionar área…</option>
                    {AREAS_AGENTE.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={LABEL}>System prompt personalizado</label>
                  <textarea
                    style={{ ...INPUT, resize: "vertical", minHeight: 100, fontSize: "0.75rem" }}
                    value={nodoActivo.data.sistemaPrompt ?? ""}
                    onChange={(e) => actualizarNodo("sistemaPrompt", e.target.value)}
                    placeholder="Dejá vacío para usar el prompt por defecto del área…"
                  />
                </div>

                <div>
                  <label style={LABEL}>Herramientas habilitadas</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {HERRAMIENTAS_AGENTE.map((h) => {
                      const activas = nodoActivo.data.herramientas ?? []
                      const checked = activas.includes(h.value)
                      return (
                        <label key={h.value} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? activas.filter((v) => v !== h.value)
                                : [...activas, h.value]
                              actualizarNodo("herramientas", next)
                            }}
                          />
                          {h.label}
                        </label>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Eliminar nodo */}
            <button
              style={{ marginTop: "auto", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, padding: "0.4rem 0.75rem", fontSize: "0.8125rem", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.375rem" }}
              onClick={eliminarNodo}
            >
              <IcoTrash size={14} /> Eliminar nodo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
