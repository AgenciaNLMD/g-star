"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { api } from "@/lib/api-client"
import { IcoSparkles, IcoBrain, IcoPencil, IcoTrash, IcoSave, IcoFileText } from "@/components/ui/Icons"

// ── Constantes ────────────────────────────────────────────────────────────────

const PROVEEDORES = [
  {
    id:          "anthropic",
    nombre:      "Anthropic Claude",
    Icon:        IcoSparkles,
    color:       "#d97706",
    modelos:     ["claude-haiku-4-5-20251001", "claude-sonnet-4-5", "claude-opus-4-5"],
    placeholder: "sk-ant-api03-...",
  },
  {
    id:          "openai",
    nombre:      "OpenAI / ChatGPT",
    Icon:        IcoBrain,
    color:       "#16a34a",
    modelos:     ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
    placeholder: "sk-proj-...",
  },
]

const HERRAMIENTAS_DISP = [
  {
    value:       "solicitar_turno",
    label:       "Agendar turno",
    descripcion: "El agente puede solicitar un turno para el vecino",
  },
  {
    value:       "crear_reclamo",
    label:       "Registrar reclamo",
    descripcion: "El agente puede crear un reclamo en el sistema",
  },
  {
    value:       "transferir_a_area",
    label:       "Derivar a otro agente",
    descripcion: "El agente puede pasar la conversación a otro agente de área",
  },
  {
    value:       "transferir_a_humano",
    label:       "Derivar a un operador",
    descripcion: "El agente puede pasar la conversación a un agente humano",
  },
  {
    value:       "sin_cobertura",
    label:       "Registrar consulta sin cobertura",
    descripcion: "Registra preguntas sin respuesta para que el equipo pueda agregar cobertura",
  },
  {
    value:       "fin_conversacion",
    label:       "Finalizar conversación",
    descripcion: "El agente puede cerrar la atención cuando el vecino se despide",
  },
]

const AGENTE_VACIO = {
  nombre:                 "",
  proveedor:              "anthropic",
  modelo:                 "",
  sistemaPrompt:          "",
  conocimiento:           "",
  keywords:               "",
  herramientas:           ["transferir_a_humano", "fin_conversacion"],
  esOrquestador:          false,
  activo:                 true,
  timeoutRecordatorioMin: 10,
  timeoutCierreMin:       20,
  mensajeRecordatorio:    "",
  mensajeCierre:          "",
}

const INPUT  = { width: "100%", border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.375rem 0.5rem", fontSize: "0.8125rem", fontFamily: "inherit", background: "#f8fafc", color: "#0f172a" }
const LABEL  = { fontSize: "0.6875rem", fontWeight: 700, display: "block", marginBottom: "0.25rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em" }

// ── Modal de Agente ───────────────────────────────────────────────────────────

function ModalAgente({ agente, proveedoresDisp, onGuardar, onCerrar }) {
  const [form,      setForm]      = useState(() => agente
    ? {
        nombre:                 agente.nombre,
        proveedor:              agente.proveedor,
        modelo:                 agente.modelo ?? "",
        sistemaPrompt:          agente.sistemaPrompt,
        conocimiento:           agente.conocimiento ?? "",
        keywords:               agente.keywords ?? "",
        herramientas:           agente.herramientas ?? [],
        esOrquestador:          agente.esOrquestador ?? false,
        activo:                 agente.activo,
        timeoutRecordatorioMin: agente.timeoutRecordatorioMin ?? 10,
        timeoutCierreMin:       agente.timeoutCierreMin ?? 20,
        mensajeRecordatorio:    agente.mensajeRecordatorio ?? "",
        mensajeCierre:          agente.mensajeCierre ?? "",
      }
    : { ...AGENTE_VACIO, proveedor: proveedoresDisp[0]?.id ?? "anthropic" }
  )
  const esOrq = form.esOrquestador
  const [guardando, setGuardando] = useState(false)
  const fileRef                   = useRef(null)

  const esNuevo = !agente

  function toggleHerramienta(val) {
    setForm((f) => ({
      ...f,
      herramientas: f.herramientas.includes(val)
        ? f.herramientas.filter((h) => h !== val)
        : [...f.herramientas, val],
    }))
  }

  function onArchivoChange(e) {
    const files = Array.from(e.target.files ?? [])
    files.forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (!["txt", "md"].includes(ext)) {
        alert(`Solo se aceptan archivos .txt y .md`)
        return
      }
      const reader = new FileReader()
      reader.onload = (ev) => {
        const contenido = ev.target?.result ?? ""
        setForm((f) => ({
          ...f,
          conocimiento: f.conocimiento
            ? `${f.conocimiento}\n\n--- ${file.name} ---\n${contenido}`
            : `--- ${file.name} ---\n${contenido}`,
        }))
      }
      reader.readAsText(file)
    })
    e.target.value = ""
  }

  async function guardar() {
    if (!form.nombre.trim())        { alert("El nombre es requerido"); return }
    if (!form.sistemaPrompt.trim()) { alert("Las instrucciones son requeridas"); return }
    setGuardando(true)
    try {
      const payload = {
        ...form,
        modelo:       form.modelo || null,
        conocimiento: form.conocimiento.trim() || null,
        keywords:     form.keywords.trim() || null,
      }
      if (esNuevo) {
        await api.post("/api/flows/agentes", payload)
      } else {
        await api.put(`/api/flows/agentes/${agente.id}`, payload)
      }
      onGuardar()
    } catch (e) { alert(e.message) }
    finally { setGuardando(false) }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#7c3aed" }}>
            {esNuevo ? "Nuevo agente" : `Editar: ${agente.nombre}`}
          </div>
          <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1.25rem", lineHeight: 1 }}>✕</button>
        </div>

        {/* Body scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Tipo de agente */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[{ v: false, label: "Agente de área", desc: "Atiende un área específica (ANSES, Reclamos, etc.)" }, { v: true, label: "Orquestador", desc: "Recibe todos los mensajes y deriva al área correcta" }].map(({ v, label, desc }) => {
              const sel = form.esOrquestador === v
              return (
                <label key={String(v)} style={{ flex: 1, border: `1.5px solid ${sel ? "#7c3aed" : "#e2e8f0"}`, borderRadius: 8, padding: "0.5rem 0.75rem", cursor: "pointer", background: sel ? "#faf5ff" : "#fff" }}>
                  <input type="radio" name="esOrquestador" checked={sel} onChange={() => setForm((f) => ({ ...f, esOrquestador: v }))} style={{ display: "none" }} />
                  <div style={{ fontWeight: 700, fontSize: "0.8rem", color: sel ? "#7c3aed" : "#374151" }}>{label}</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.15rem" }}>{desc}</div>
                </label>
              )
            })}
          </div>

          {/* Nombre + Proveedor */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={LABEL}>Nombre del agente</label>
              <input style={INPUT} value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Agente ANSES" />
            </div>
            <div>
              <label style={LABEL}>Proveedor de IA</label>
              <select style={INPUT} value={form.proveedor} onChange={(e) => setForm((f) => ({ ...f, proveedor: e.target.value }))}>
                {proveedoresDisp.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Modelo (opcional) */}
          <div>
            <label style={LABEL}>Modelo <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional — sobreescribe el del proveedor)</span></label>
            <select style={INPUT} value={form.modelo} onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}>
              <option value="">Default del proveedor</option>
              {(PROVEEDORES.find((p) => p.id === form.proveedor)?.modelos ?? []).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Instrucciones */}
          <div>
            <label style={LABEL}>Instrucciones para el agente</label>
            <textarea
              style={{ ...INPUT, resize: "vertical", minHeight: 130, fontSize: "0.8rem", lineHeight: 1.5 }}
              value={form.sistemaPrompt}
              onChange={(e) => setForm((f) => ({ ...f, sistemaPrompt: e.target.value }))}
              placeholder={"Sos un asistente municipal especializado en ANSES.\nTu rol es orientar a vecinos sobre jubilaciones, asignaciones familiares, AUH y trámites en general.\nRespondé de forma clara, amigable y en español rioplatense.\nSi el vecino necesita un turno, agendalo. Si no podés resolver el problema, derivalo a un operador."}
            />
          </div>

          {/* Keywords — solo para agentes de área */}
          {!esOrq && <div>
            <label style={LABEL}>Keywords de activación <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(separadas por coma)</span></label>
            <input
              style={INPUT}
              value={form.keywords}
              onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
              placeholder="anses, jubilación, asignación, AUH"
            />
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.25rem" }}>
              El orquestador usa estas palabras para derivar al vecino a este agente.
            </p>
          </div>}

          {/* Conocimiento del área */}
          <div>
            <label style={LABEL}>Conocimiento del área</label>
            <textarea
              style={{ ...INPUT, resize: "vertical", minHeight: 110, fontSize: "0.75rem", lineHeight: 1.5 }}
              value={form.conocimiento}
              onChange={(e) => setForm((f) => ({ ...f, conocimiento: e.target.value }))}
              placeholder={"Pegá aquí la información que el agente debe conocer sobre esta área.\nPuede incluir preguntas frecuentes, requisitos de trámites, horarios, etc."}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.375rem" }}>
              <p style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                También podés cargar un archivo .txt o .md
              </p>
              <div>
                <input ref={fileRef} type="file" accept=".txt,.md" multiple style={{ display: "none" }} onChange={onArchivoChange} />
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.2rem 0.6rem", fontSize: "0.7rem", cursor: "pointer", color: "#7c3aed", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                >
                  <IcoFileText size={11} /> Cargar archivo
                </button>
              </div>
            </div>
          </div>

          {/* Capacidades — solo para agentes de área */}
          {!esOrq && <div>
            <label style={LABEL}>Capacidades del agente</label>
            <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.5rem" }}>
              Qué acciones puede realizar el agente durante la conversación.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {HERRAMIENTAS_DISP.map((h) => {
                const activa = form.herramientas.includes(h.value)
                return (
                  <label
                    key={h.value}
                    style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", padding: "0.5rem 0.625rem", border: `1px solid ${activa ? "#a855f744" : "#e2e8f0"}`, borderRadius: 8, cursor: "pointer", background: activa ? "#faf5ff" : "#fff", transition: "all 0.12s" }}
                  >
                    <input type="checkbox" checked={activa} onChange={() => toggleHerramienta(h.value)} style={{ marginTop: "0.15rem", accentColor: "#7c3aed" }} />
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: activa ? "#7c3aed" : "#374151" }}>{h.label}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{h.descripcion}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>}

          {/* Inactividad / timeout */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.875rem" }}>
            <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "0.625rem" }}>
              Inactividad de conversación
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.625rem" }}>
              <div>
                <label style={LABEL}>Recordatorio a los</label>
                <select style={INPUT} value={form.timeoutRecordatorioMin} onChange={(e) => setForm((f) => ({ ...f, timeoutRecordatorioMin: Number(e.target.value) }))}>
                  {[5, 10, 15, 20, 30, 60].map((m) => <option key={m} value={m}>{m} minutos</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL}>Cerrar consulta a los</label>
                <select style={INPUT} value={form.timeoutCierreMin} onChange={(e) => setForm((f) => ({ ...f, timeoutCierreMin: Number(e.target.value) }))}>
                  {[10, 15, 20, 30, 60, 120].map((m) => <option key={m} value={m}>{m} minutos</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <label style={LABEL}>Mensaje de recordatorio</label>
              <input
                style={INPUT}
                value={form.mensajeRecordatorio}
                onChange={(e) => setForm((f) => ({ ...f, mensajeRecordatorio: e.target.value }))}
                placeholder="¿Seguís ahí? 😊 Tu consulta sigue abierta."
              />
            </div>
            <div>
              <label style={LABEL}>Mensaje de cierre por inactividad</label>
              <input
                style={INPUT}
                value={form.mensajeCierre}
                onChange={(e) => setForm((f) => ({ ...f, mensajeCierre: e.target.value }))}
                placeholder="Cerramos tu consulta por inactividad. ¡Hasta pronto! 👋"
              />
            </div>
          </div>

          {/* Activo */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", cursor: "pointer" }}>
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} style={{ accentColor: "#7c3aed" }} />
            Activo (disponible en flows)
          </label>
        </div>

        {/* Footer */}
        <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid #e2e8f0", display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="btn btn--ghost btn--sm" onClick={onCerrar}>Cancelar</button>
          <button
            className="btn btn--primary btn--sm"
            onClick={guardar}
            disabled={guardando}
            style={{ background: "#7c3aed", borderColor: "#7c3aed", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
          >
            <IcoSave size={13} /> {guardando ? "Guardando…" : "Guardar agente"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sección Providers ─────────────────────────────────────────────────────────

function ProveedoresSection({ configs, onActualizar }) {
  const [configurando, setConfigurando] = useState(null)
  const [form,         setForm]         = useState({ apiKey: "", modelo: "", activo: true })
  const [guardando,    setGuardando]    = useState(false)

  function abrirConfig(prov) {
    const existing = configs.find((c) => c.proveedor === prov.id)
    setForm({ apiKey: "", modelo: existing?.modelo ?? prov.modelos[0], activo: existing?.activo ?? true })
    setConfigurando(prov.id)
  }

  function cancelar() { setConfigurando(null) }

  async function guardar(prov) {
    if (!form.apiKey.trim()) { alert("La API Key es requerida"); return }
    setGuardando(true)
    try {
      await api.post("/api/flows/config", { proveedor: prov.id, apiKey: form.apiKey.trim(), modelo: form.modelo || null, activo: form.activo })
      onActualizar()
      cancelar()
    } catch (e) { alert(e.message) }
    finally { setGuardando(false) }
  }

  async function eliminar(id, nombre) {
    if (!confirm(`¿Eliminar la conexión con ${nombre}?`)) return
    try { await api.del("/api/flows/config", { id }); onActualizar() }
    catch (e) { alert(e.message) }
  }

  return (
    <div>
      <div style={{ padding: "1rem 1.25rem 0.625rem", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
        Proveedores de IA
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", padding: "0 1.25rem 1.25rem" }}>
        {PROVEEDORES.map((prov) => {
          const config    = configs.find((c) => c.proveedor === prov.id)
          const conectado = !!config
          const abierto   = configurando === prov.id
          const ProvIcon  = prov.Icon

          return (
            <div key={prov.id} style={{ border: `1.5px solid ${conectado ? prov.color + "44" : "#e2e8f0"}`, borderRadius: 12, overflow: "hidden", background: "#fff" }}>
              <div style={{ padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: abierto ? "1px solid #e2e8f0" : "none" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: prov.color + "15", border: `1.5px solid ${prov.color}33`, display: "flex", alignItems: "center", justifyContent: "center", color: prov.color, flexShrink: 0 }}>
                  <ProvIcon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a" }}>{prov.nombre}</div>
                  {conectado ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.15rem" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: config.activo ? "#22c55e" : "#94a3b8" }} />
                      <span style={{ fontSize: "0.6875rem", color: "#64748b" }}>{config.activo ? "Conectado" : "Desactivado"} — {config.modelo ?? "default"}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.6875rem", color: "#94a3b8", marginTop: "0.15rem" }}>Sin configurar</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.3rem" }}>
                  {conectado && !abierto && (
                    <button className="btn btn--ghost btn--sm" onClick={() => eliminar(config.id, prov.nombre)} style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center" }}>
                      <IcoTrash size={13} />
                    </button>
                  )}
                  <button className="btn btn--secondary btn--sm" onClick={() => abierto ? cancelar() : abrirConfig(prov)} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    {abierto ? "Cancelar" : conectado ? <><IcoPencil size={13} /> Editar</> : "Configurar"}
                  </button>
                </div>
              </div>

              {abierto && (
                <div style={{ padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.625rem", background: "#fafafa" }}>
                  <div>
                    <label style={LABEL}>API Key</label>
                    <input type="password" style={INPUT} value={form.apiKey} onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))} placeholder={prov.placeholder} autoComplete="off" />
                  </div>
                  <div>
                    <label style={LABEL}>Modelo</label>
                    <select style={INPUT} value={form.modelo} onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}>
                      {prov.modelos.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} />
                    Activo
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button className="btn btn--ghost btn--sm" onClick={cancelar}>Cancelar</button>
                    <button className="btn btn--primary btn--sm" onClick={() => guardar(prov)} disabled={guardando} style={{ background: prov.color, borderColor: prov.color, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <IcoSave size={13} /> {guardando ? "Guardando…" : "Guardar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Sección Agentes ───────────────────────────────────────────────────────────

function AgentesSection({ proveedoresConectados }) {
  const [agentes,    setAgentes]    = useState([])
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editAgente, setEditAgente] = useState(null) // null = nuevo

  const fetchAgentes = useCallback(async () => {
    try { const d = await api.get("/api/flows/agentes"); setAgentes(Array.isArray(d) ? d : []) }
    catch (e) { console.error(e) }
  }, [])

  useEffect(() => { fetchAgentes() }, [fetchAgentes])

  function abrirNuevo()    { setEditAgente(null); setModalOpen(true) }
  function abrirEditar(ag) { setEditAgente(ag);   setModalOpen(true) }

  async function onGuardar() { await fetchAgentes(); setModalOpen(false) }

  async function eliminar(agente) {
    if (!confirm(`¿Eliminar el agente "${agente.nombre}"?`)) return
    try { await api.del(`/api/flows/agentes/${agente.id}`); await fetchAgentes() }
    catch (e) { alert(e.message) }
  }

  const sinProveedores = proveedoresConectados.length === 0

  return (
    <div style={{ borderTop: "1px solid #e2e8f0" }}>
      <div style={{ padding: "1rem 1.25rem 0.625rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
          Agentes configurados
        </div>
        <button className="btn btn--primary btn--sm" onClick={abrirNuevo} disabled={sinProveedores} title={sinProveedores ? "Configurá un proveedor primero" : ""}>
          + Nuevo agente
        </button>
      </div>

      {sinProveedores && (
        <div style={{ margin: "0 1.25rem 1rem", padding: "0.75rem 1rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: "0.75rem", color: "#92400e" }}>
          Configurá al menos un proveedor de IA antes de crear agentes.
        </div>
      )}

      <div style={{ padding: "0 1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {agentes.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "0.8125rem", border: "1px dashed #e2e8f0", borderRadius: 10 }}>
            Sin agentes — creá uno y usalo en tus flows
          </div>
        ) : agentes.map((agente) => {
          const prov     = PROVEEDORES.find((p) => p.id === agente.proveedor)
          const ProvIcon = prov?.Icon ?? IcoBrain

          return (
            <div key={agente.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff" }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#a855f715", border: "1.5px solid #a855f733", display: "flex", alignItems: "center", justifyContent: "center", color: "#a855f7", flexShrink: 0 }}>
                <IcoBrain size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a" }}>{agente.nombre}</span>
                  <span className={`badge ${agente.activo ? "badge--success" : "badge--muted"}`} style={{ fontSize: "0.6rem" }}>{agente.activo ? "activo" : "inactivo"}</span>
                  {agente.esOrquestador && <span className="badge" style={{ fontSize: "0.6rem", background: "#7c3aed15", color: "#7c3aed", border: "1px solid #7c3aed33" }}>orquestador</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "0.15rem", flexWrap: "wrap" }}>
                  <ProvIcon size={11} style={{ color: prov?.color ?? "#94a3b8" }} />
                  <span style={{ fontSize: "0.6875rem", color: "#64748b" }}>{prov?.nombre ?? agente.proveedor}</span>
                  {agente.herramientas?.length > 0 && (
                    <span style={{ fontSize: "0.6875rem", color: "#94a3b8" }}>· {agente.herramientas.length} capacidad{agente.herramientas.length !== 1 ? "es" : ""}</span>
                  )}
                  {agente.keywords && (
                    <span style={{ fontSize: "0.6875rem", color: "#94a3b8" }}>· keywords: {agente.keywords}</span>
                  )}
                  {agente.conocimiento && (
                    <span style={{ fontSize: "0.6875rem", color: "#94a3b8" }}>· {agente.conocimiento.length.toLocaleString()} chars</span>
                  )}
                </div>
                <div style={{ fontSize: "0.625rem", color: "#94a3b8", marginTop: "0.1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {agente.sistemaPrompt?.slice(0, 90)}{agente.sistemaPrompt?.length > 90 ? "…" : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
                <button className="btn btn--secondary btn--sm" onClick={() => abrirEditar(agente)} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                  <IcoPencil size={13} /> Editar
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => eliminar(agente)} style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center" }}>
                  <IcoTrash size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {modalOpen && (
        <ModalAgente
          agente={editAgente}
          proveedoresDisp={proveedoresConectados}
          onGuardar={onGuardar}
          onCerrar={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function ConexionesConfig({ configs, onActualizar }) {
  const proveedoresConectados = PROVEEDORES.filter((p) => configs.some((c) => c.proveedor === p.id && c.activo))

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <div>
          <span className="card__title">Conexiones</span>
          <p className="text-sm text-muted" style={{ marginTop: "0.25rem" }}>
            Conectá proveedores de IA y configurá los agentes que usarás en tus flows
          </p>
        </div>
      </div>

      <ProveedoresSection configs={configs} onActualizar={onActualizar} />
      <AgentesSection proveedoresConectados={proveedoresConectados} />
    </div>
  )
}
