"use client"
import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { IcoPencil, IcoTrash, IcoSave } from "@/components/ui/Icons"

const DIAS_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const INPUT  = { width: "100%", border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.375rem 0.5rem", fontSize: "0.8125rem", fontFamily: "inherit", background: "#f8fafc", color: "#0f172a" }
const INPUTS = { ...INPUT, fontSize: "0.75rem", padding: "0.3rem 0.45rem" }
const LABEL  = { fontSize: "0.6875rem", fontWeight: 700, display: "block", marginBottom: "0.25rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em" }
const LABELS = { ...LABEL, fontSize: "0.6rem" }
const GRID2  = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }
const GRID3  = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }
const GRID4  = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }

function uid() { return Math.random().toString(36).slice(2) }

const SUCURSAL_VACIA = () => ({
  _id: uid(), nombre: "", localidad: "", direccion: "", telefono: "",
  email: "", web: "", horaInicio: "", horaFin: "", diasHabiles: [],
  turnosPorDia: "", intervaloMinutos: "",
  redesSociales: { facebook: "", instagram: "" },
})

const DEPENDENCIA_VACIA = () => ({
  _id: uid(), nombre: "", descripcion: "", horaInicio: "", horaFin: "", diasHabiles: [],
})

const ENTIDAD_VACIA = {
  nombre: "", tipo: "externa", provincia: "", partido: "", descripcion: "",
  localidad: "", direccion: "", telefono: "", email: "", web: "",
  horaInicio: "08:00", horaFin: "17:00", intervaloMinutos: 30,
  diasHabiles: [1, 2, 3, 4, 5], turnosPorDia: "",
  sucursales: [], redesSociales: { facebook: "", instagram: "" },
  activo: true,
}

// ── Sucursal de entidad externa ───────────────────────────────────────────────

function FilaSucursal({ suc, onChange, onRemove }) {
  const [open, setOpen] = useState(!suc.nombre)

  function set(key, val) { onChange({ ...suc, [key]: val }) }
  function setRed(key, val) { onChange({ ...suc, redesSociales: { ...suc.redesSociales, [key]: val } }) }
  function toggleDia(d) {
    const dias = suc.diasHabiles ?? []
    onChange({ ...suc, diasHabiles: dias.includes(d) ? dias.filter((x) => x !== d) : [...dias, d].sort() })
  }

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      <div
        style={{ display: "flex", alignItems: "center", padding: "0.5rem 0.75rem", cursor: "pointer", background: open ? "#faf5ff" : "#f8fafc", borderBottom: open ? "1px solid #e9d5ff" : "none" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span style={{ flex: 1, fontSize: "0.8rem", fontWeight: 600, color: suc.nombre ? "#0f172a" : "#94a3b8" }}>
          {suc.nombre || "Nueva sucursal"}
          {suc.localidad && <span style={{ fontWeight: 400, color: "#64748b", marginLeft: "0.4rem" }}>— {suc.localidad}</span>}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onRemove() }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "0.1rem 0.3rem" }}>
          <IcoTrash size={12} />
        </button>
        <span style={{ marginLeft: "0.4rem", fontSize: "0.65rem", color: "#94a3b8" }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.625rem", background: "#fefefe" }}>
          <div style={GRID2}>
            <div>
              <label style={LABELS}>Nombre de la sucursal</label>
              <input style={INPUTS} value={suc.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Sucursal Junín de los Andes" />
            </div>
            <div>
              <label style={LABELS}>Localidad</label>
              <input style={INPUTS} value={suc.localidad} onChange={(e) => set("localidad", e.target.value)} placeholder="Junín de los Andes" />
            </div>
          </div>

          <div>
            <label style={LABELS}>Dirección</label>
            <input style={INPUTS} value={suc.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Av. Antártida Argentina 123" />
          </div>

          <div style={GRID3}>
            <div>
              <label style={LABELS}>Teléfono</label>
              <input style={INPUTS} value={suc.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+54 294 4491234" />
            </div>
            <div>
              <label style={LABELS}>Email</label>
              <input style={INPUTS} value={suc.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="sucursal@anses.gob.ar" />
            </div>
            <div>
              <label style={LABELS}>Web</label>
              <input style={INPUTS} value={suc.web ?? ""} onChange={(e) => set("web", e.target.value)} placeholder="www.anses.gob.ar/turnos" />
            </div>
          </div>

          <div style={GRID2}>
            <div>
              <label style={LABELS}>Facebook</label>
              <input style={INPUTS} value={suc.redesSociales?.facebook ?? ""} onChange={(e) => setRed("facebook", e.target.value)} placeholder="facebook.com/anses" />
            </div>
            <div>
              <label style={LABELS}>Instagram</label>
              <input style={INPUTS} value={suc.redesSociales?.instagram ?? ""} onChange={(e) => setRed("instagram", e.target.value)} placeholder="@anses" />
            </div>
          </div>

          {/* Horarios */}
          <div>
            <label style={LABELS}>Días de atención</label>
            <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.5rem" }}>
              {DIAS_LABELS.map((d, i) => {
                const activo = (suc.diasHabiles ?? []).includes(i)
                return (
                  <button key={i} onClick={() => toggleDia(i)} style={{ width: 30, height: 30, borderRadius: 6, border: `1.5px solid ${activo ? "#7c3aed" : "#e2e8f0"}`, background: activo ? "#7c3aed" : "#fff", color: activo ? "#fff" : "#94a3b8", fontSize: "0.5625rem", fontWeight: 700, cursor: "pointer" }}>
                    {d}
                  </button>
                )
              })}
            </div>
            <div style={GRID4}>
              <div>
                <label style={LABELS}>Hora inicio</label>
                <input type="time" style={INPUTS} value={suc.horaInicio} onChange={(e) => set("horaInicio", e.target.value)} />
              </div>
              <div>
                <label style={LABELS}>Hora fin</label>
                <input type="time" style={INPUTS} value={suc.horaFin} onChange={(e) => set("horaFin", e.target.value)} />
              </div>
              <div>
                <label style={LABELS}>Turnos / día</label>
                <input type="number" style={INPUTS} value={suc.turnosPorDia ?? ""} onChange={(e) => set("turnosPorDia", e.target.value)} placeholder="5" min={1} />
              </div>
              <div>
                <label style={LABELS}>Cada (min)</label>
                <input type="number" style={INPUTS} value={suc.intervaloMinutos ?? ""} onChange={(e) => set("intervaloMinutos", e.target.value)} placeholder="60" min={5} step={5} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Dependencia municipal ─────────────────────────────────────────────────────

function FilaDependencia({ dep, onChange, onRemove }) {
  const [open, setOpen] = useState(!dep.nombre)

  function set(key, val) { onChange({ ...dep, [key]: val }) }
  function toggleDia(d) {
    const dias = dep.diasHabiles ?? []
    onChange({ ...dep, diasHabiles: dias.includes(d) ? dias.filter((x) => x !== d) : [...dias, d].sort() })
  }

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      <div
        style={{ display: "flex", alignItems: "center", padding: "0.5rem 0.75rem", cursor: "pointer", background: open ? "#f0fdf4" : "#f8fafc", borderBottom: open ? "1px solid #86efac" : "none" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span style={{ flex: 1, fontSize: "0.8rem", fontWeight: 600, color: dep.nombre ? "#0f172a" : "#94a3b8" }}>
          {dep.nombre || "Nueva dependencia"}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onRemove() }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "0.1rem 0.3rem" }}>
          <IcoTrash size={12} />
        </button>
        <span style={{ marginLeft: "0.4rem", fontSize: "0.65rem", color: "#94a3b8" }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.625rem", background: "#fefefe" }}>
          <div>
            <label style={LABELS}>Nombre del área o dependencia</label>
            <input style={INPUTS} value={dep.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Oficina de Tasas" />
          </div>
          <div>
            <label style={LABELS}>Descripción (qué trámites o servicios atiende)</label>
            <textarea style={{ ...INPUTS, resize: "vertical", minHeight: 56, lineHeight: 1.5 }} value={dep.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Liquidación y pago de tasas municipales, certificados de libre deuda…" />
          </div>
          <div>
            <label style={LABELS}>Horario propio <span style={{ fontWeight: 400, textTransform: "none" }}>(si difiere del horario general del municipio)</span></label>
            <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.5rem" }}>
              {DIAS_LABELS.map((d, i) => {
                const activo = (dep.diasHabiles ?? []).includes(i)
                return (
                  <button key={i} onClick={() => toggleDia(i)} style={{ width: 30, height: 30, borderRadius: 6, border: `1.5px solid ${activo ? "#15803d" : "#e2e8f0"}`, background: activo ? "#15803d" : "#fff", color: activo ? "#fff" : "#94a3b8", fontSize: "0.5625rem", fontWeight: 700, cursor: "pointer" }}>
                    {d}
                  </button>
                )
              })}
            </div>
            <div style={GRID2}>
              <div>
                <label style={LABELS}>Hora inicio</label>
                <input type="time" style={INPUTS} value={dep.horaInicio} onChange={(e) => set("horaInicio", e.target.value)} />
              </div>
              <div>
                <label style={LABELS}>Hora fin</label>
                <input type="time" style={INPUTS} value={dep.horaFin} onChange={(e) => set("horaFin", e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function ModalEntidad({ entidad, onGuardar, onCerrar }) {
  const [form,      setForm]      = useState(() => entidad ? {
    nombre:           entidad.nombre           ?? "",
    tipo:             entidad.tipo             ?? "externa",
    provincia:        entidad.provincia        ?? "",
    partido:          entidad.partido          ?? "",
    localidad:        entidad.localidad        ?? "",
    descripcion:      entidad.descripcion      ?? "",
    direccion:        entidad.direccion        ?? "",
    telefono:         entidad.telefono         ?? "",
    email:            entidad.email            ?? "",
    web:              entidad.web              ?? "",
    horaInicio:       entidad.horaInicio       ?? "08:00",
    horaFin:          entidad.horaFin          ?? "17:00",
    intervaloMinutos: entidad.intervaloMinutos ?? 30,
    diasHabiles:      entidad.diasHabiles      ?? [1, 2, 3, 4, 5],
    turnosPorDia:     entidad.turnosPorDia     ?? "",
    sucursales:       (entidad.sucursales ?? []).map((s) => ({
      _id: uid(),
      redesSociales: { facebook: "", instagram: "" },
      turnosPorDia: "", intervaloMinutos: "",
      diasHabiles: [], horaInicio: "", horaFin: "",
      descripcion: "",
      ...s,
    })),
    redesSociales:    { facebook: entidad.redesSociales?.facebook ?? "", instagram: entidad.redesSociales?.instagram ?? "" },
    activo:           entidad.activo           ?? true,
  } : { ...ENTIDAD_VACIA })
  const [guardando, setGuardando] = useState(false)

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })) }
  function setRedes(key, val) { setForm((f) => ({ ...f, redesSociales: { ...f.redesSociales, [key]: val } })) }
  function toggleDia(d) {
    setForm((f) => ({ ...f, diasHabiles: f.diasHabiles.includes(d) ? f.diasHabiles.filter((x) => x !== d) : [...f.diasHabiles, d].sort() }))
  }

  function addItem()         { setForm((f) => ({ ...f, sucursales: [...f.sucursales, esMunicipal(f) ? DEPENDENCIA_VACIA() : SUCURSAL_VACIA()] })) }
  function removeItem(id)    { setForm((f) => ({ ...f, sucursales: f.sucursales.filter((s) => s._id !== id) })) }
  function updateItem(id, d) { setForm((f) => ({ ...f, sucursales: f.sucursales.map((s) => s._id === id ? d : s) })) }

  function esMunicipal(f) { return (f ?? form).tipo === "municipal" }

  async function guardar() {
    if (!form.nombre.trim()) { alert("El nombre es requerido"); return }
    setGuardando(true)
    try {
      const payload = {
        ...form,
        turnosPorDia: form.turnosPorDia ? parseInt(form.turnosPorDia) : null,
        sucursales:   form.sucursales.map(({ _id, ...s }) => s),
      }
      if (entidad?.id) {
        await api.put(`/api/admin/entidades/${entidad.id}`, payload)
      } else {
        await api.post("/api/admin/entidades", payload)
      }
      onGuardar()
    } catch (e) { alert(e.message) }
    finally { setGuardando(false) }
  }

  const isMunicipal = esMunicipal()
  const itemLabel   = isMunicipal ? "dependencia" : "sucursal"
  const itemsLabel  = isMunicipal ? "Atención municipal / Dependencias" : "Sucursales"
  const itemsEmpty  = isMunicipal
    ? "Sin dependencias — agregá las áreas que atienden en el municipio (Tasas, Vivienda, Obras…)"
    : "Sin sucursales — agregá al menos una con los datos de contacto locales"

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 600, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0f172a" }}>
            {entidad ? `Editar: ${entidad.nombre}` : "Nueva entidad"}
          </div>
          <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1.25rem" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Tipo */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[
              { v: "externa",   label: "Entidad externa",  desc: "ANSES, PAMI, RENAPER, Migraciones…" },
              { v: "municipal", label: "Info Municipal",    desc: "Datos del municipio, horarios y dependencias" },
            ].map(({ v, label, desc }) => {
              const sel = form.tipo === v
              return (
                <label key={v} style={{ flex: 1, border: `1.5px solid ${sel ? "#7c3aed" : "#e2e8f0"}`, borderRadius: 8, padding: "0.5rem 0.75rem", cursor: "pointer", background: sel ? "#faf5ff" : "#fff" }}>
                  <input type="radio" name="tipo" checked={sel} onChange={() => set("tipo", v)} style={{ display: "none" }} />
                  <div style={{ fontWeight: 700, fontSize: "0.8rem", color: sel ? "#7c3aed" : "#374151" }}>{label}</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.15rem" }}>{desc}</div>
                </label>
              )
            })}
          </div>

          {/* ── EXTERNA ── */}
          {!isMunicipal && <>
            <div>
              <label style={LABEL}>Nombre del organismo</label>
              <input style={INPUT} value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="ANSES" />
            </div>
            <div style={GRID2}>
              <div>
                <label style={LABEL}>Provincia</label>
                <input style={INPUT} value={form.provincia} onChange={(e) => set("provincia", e.target.value)} placeholder="Neuquén" />
              </div>
              <div>
                <label style={LABEL}>Partido / Municipio</label>
                <input style={INPUT} value={form.partido} onChange={(e) => set("partido", e.target.value)} placeholder="San Martín de los Andes" />
              </div>
            </div>
            <div>
              <label style={LABEL}>Descripción</label>
              <textarea style={{ ...INPUT, resize: "vertical", minHeight: 80, lineHeight: 1.5 }} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Organismo que gestiona jubilaciones, pensiones y asignaciones familiares…" />
            </div>
            <div style={GRID2}>
              <div>
                <label style={LABEL}>Facebook</label>
                <input style={INPUT} value={form.redesSociales.facebook} onChange={(e) => setRedes("facebook", e.target.value)} placeholder="facebook.com/anses" />
              </div>
              <div>
                <label style={LABEL}>Instagram</label>
                <input style={INPUT} value={form.redesSociales.instagram} onChange={(e) => setRedes("instagram", e.target.value)} placeholder="@anses" />
              </div>
            </div>
          </>}

          {/* ── MUNICIPAL ── */}
          {isMunicipal && <>
            <div style={GRID2}>
              <div>
                <label style={LABEL}>Nombre del municipio</label>
                <input style={INPUT} value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Municipio de San Martín de los Andes" />
              </div>
              <div>
                <label style={LABEL}>Partido</label>
                <input style={INPUT} value={form.partido} onChange={(e) => set("partido", e.target.value)} placeholder="San Martín de los Andes" />
              </div>
            </div>
            <div style={GRID2}>
              <div>
                <label style={LABEL}>Localidad</label>
                <input style={INPUT} value={form.localidad} onChange={(e) => set("localidad", e.target.value)} placeholder="San Martín de los Andes" />
              </div>
              <div>
                <label style={LABEL}>Provincia</label>
                <input style={INPUT} value={form.provincia} onChange={(e) => set("provincia", e.target.value)} placeholder="Neuquén" />
              </div>
            </div>
            <div style={GRID3}>
              <div>
                <label style={LABEL}>Dirección</label>
                <input style={INPUT} value={form.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Av. San Martín 456" />
              </div>
              <div>
                <label style={LABEL}>Teléfono</label>
                <input style={INPUT} value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+54 294 4427000" />
              </div>
              <div>
                <label style={LABEL}>Email</label>
                <input style={INPUT} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="info@municipio.gob.ar" />
              </div>
            </div>
            <div>
              <label style={LABEL}>Descripción</label>
              <textarea style={{ ...INPUT, resize: "vertical", minHeight: 60, lineHeight: 1.5 }} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Municipio de la ciudad de…" />
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: "0.625rem" }}>Horario general de atención</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <div>
                  <label style={LABEL}>Días</label>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    {DIAS_LABELS.map((d, i) => {
                      const activo = form.diasHabiles.includes(i)
                      return (
                        <button key={i} onClick={() => toggleDia(i)} style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${activo ? "#15803d" : "#e2e8f0"}`, background: activo ? "#15803d" : "#fff", color: activo ? "#fff" : "#94a3b8", fontSize: "0.625rem", fontWeight: 700, cursor: "pointer" }}>
                          {d}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={GRID3}>
                  <div>
                    <label style={LABEL}>Hora inicio</label>
                    <input type="time" style={INPUT} value={form.horaInicio} onChange={(e) => set("horaInicio", e.target.value)} />
                  </div>
                  <div>
                    <label style={LABEL}>Hora fin</label>
                    <input type="time" style={INPUT} value={form.horaFin} onChange={(e) => set("horaFin", e.target.value)} />
                  </div>
                  <div>
                    <label style={LABEL}>Turnos por día</label>
                    <input type="number" style={INPUT} value={form.turnosPorDia} onChange={(e) => set("turnosPorDia", e.target.value)} placeholder="20" min={1} />
                  </div>
                </div>
              </div>
            </div>
          </>}

          {/* ── Items (sucursales / dependencias) ── */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                {itemsLabel} <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>({form.sucursales.length})</span>
              </div>
              <button onClick={addItem} style={{ background: "none", border: "1px solid #7c3aed", borderRadius: 6, padding: "0.2rem 0.6rem", fontSize: "0.7rem", color: "#7c3aed", fontWeight: 700, cursor: "pointer" }}>
                + Agregar {itemLabel}
              </button>
            </div>
            {form.sucursales.length === 0 ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "#94a3b8", fontSize: "0.75rem", border: "1px dashed #e2e8f0", borderRadius: 8 }}>
                {itemsEmpty}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {form.sucursales.map((item) => (
                  isMunicipal
                    ? <FilaDependencia key={item._id} dep={item} onChange={(d) => updateItem(item._id, d)} onRemove={() => removeItem(item._id)} />
                    : <FilaSucursal   key={item._id} suc={item} onChange={(d) => updateItem(item._id, d)} onRemove={() => removeItem(item._id)} />
                ))}
              </div>
            )}
          </div>

          {/* Activo */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", cursor: "pointer" }}>
            <input type="checkbox" checked={form.activo} onChange={(e) => set("activo", e.target.checked)} style={{ accentColor: "#7c3aed" }} />
            Activo
          </label>
        </div>

        {/* Footer */}
        <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid #e2e8f0", display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="btn btn--ghost btn--sm" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn--primary btn--sm" onClick={guardar} disabled={guardando} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <IcoSave size={13} /> {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Lista ─────────────────────────────────────────────────────────────────────

const TIPO_STYLE = {
  externa:   { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", label: "Externa"       },
  municipal: { bg: "#f0fdf4", color: "#15803d", border: "#86efac", label: "Info Municipal" },
}

export default function EntidadesTab() {
  const [entidades,   setEntidades]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editEntidad, setEditEntidad] = useState(null)

  const fetchEntidades = useCallback(async () => {
    try { const d = await api.get("/api/admin/entidades"); setEntidades(Array.isArray(d) ? d : []) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEntidades() }, [fetchEntidades])

  function abrirNueva()   { setEditEntidad(null); setModalOpen(true) }
  function abrirEditar(e) { setEditEntidad(e);    setModalOpen(true) }
  async function onGuardar() { await fetchEntidades(); setModalOpen(false) }

  async function eliminar(ent) {
    if (!confirm(`¿Eliminar "${ent.nombre}"?`)) return
    try { await api.del(`/api/admin/entidades/${ent.id}`); await fetchEntidades() }
    catch (e) { alert(e.message) }
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
    </div>
  )

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <div>
          <span className="card__title">Entidades</span>
          <p className="text-sm text-muted" style={{ marginTop: "0.25rem" }}>
            Organismos externos (ANSES, PAMI…) e info municipal con dependencias
          </p>
        </div>
        <button className="btn btn--primary btn--sm" onClick={abrirNueva}>+ Nueva entidad</button>
      </div>

      <div style={{ padding: "0 1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {entidades.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8", fontSize: "0.8125rem", border: "1px dashed #e2e8f0", borderRadius: 10 }}>
            Sin entidades — agregá una para que los agentes IA puedan dar información de contacto
          </div>
        ) : entidades.map((ent) => {
          const ts  = TIPO_STYLE[ent.tipo] ?? TIPO_STYLE.externa
          const suc = Array.isArray(ent.sucursales) ? ent.sucursales : []
          return (
            <div key={ent.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a" }}>{ent.nombre}</span>
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, borderRadius: 4, padding: "0.1rem 0.35rem" }}>{ts.label}</span>
                  <span className={`badge ${ent.activo ? "badge--success" : "badge--muted"}`} style={{ fontSize: "0.6rem" }}>{ent.activo ? "activa" : "inactiva"}</span>
                </div>
                <div style={{ fontSize: "0.6875rem", color: "#64748b", marginTop: "0.15rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {(ent.partido || ent.localidad) && <span>{ent.partido || ent.localidad}{ent.provincia ? `, ${ent.provincia}` : ""}</span>}
                  {ent.telefono && <span>📞 {ent.telefono}</span>}
                  {ent.email    && <span>✉️ {ent.email}</span>}
                  {suc.length > 0 && (
                    <span style={{ color: ent.tipo === "municipal" ? "#15803d" : "#7c3aed" }}>
                      🏢 {suc.length} {ent.tipo === "municipal" ? `dependencia${suc.length !== 1 ? "s" : ""}` : `sucursal${suc.length !== 1 ? "es" : ""}`}
                    </span>
                  )}
                </div>
                {ent.descripcion && (
                  <div style={{ fontSize: "0.625rem", color: "#94a3b8", marginTop: "0.1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ent.descripcion.slice(0, 100)}{ent.descripcion.length > 100 ? "…" : ""}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
                <button className="btn btn--secondary btn--sm" onClick={() => abrirEditar(ent)} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                  <IcoPencil size={13} /> Editar
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => eliminar(ent)} style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center" }}>
                  <IcoTrash size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {modalOpen && (
        <ModalEntidad entidad={editEntidad} onGuardar={onGuardar} onCerrar={() => setModalOpen(false)} />
      )}
    </div>
  )
}
