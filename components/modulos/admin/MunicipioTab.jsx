"use client"
import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api-client"
import { IcoSave } from "@/components/ui/Icons"

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const INPUT  = { width: "100%", border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.375rem 0.5rem", fontSize: "0.8125rem", fontFamily: "inherit", background: "#f8fafc", color: "#0f172a" }
const LABEL  = { fontSize: "0.6875rem", fontWeight: 700, display: "block", marginBottom: "0.25rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em" }
const GRID2  = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }
const GRID3  = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }

const VACIO = {
  nombre: "", localidad: "", provincia: "", pais: "Argentina",
  direccion: "", telefono: "", email: "", web: "", intendente: "",
  descripcion: "",
  redesSociales: { facebook: "", instagram: "", twitter: "", youtube: "" },
}

export default function MunicipioTab() {
  const [form,      setForm]      = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const [ok,        setOk]        = useState(false)
  const [loading,   setLoading]   = useState(true)

  const fetchConfig = useCallback(async () => {
    try {
      const d = await api.get("/api/admin/municipio")
      if (d?.id) {
        setForm({
          nombre:      d.nombre       ?? "",
          localidad:   d.localidad    ?? "",
          provincia:   d.provincia    ?? "",
          pais:        d.pais         ?? "Argentina",
          direccion:   d.direccion    ?? "",
          telefono:    d.telefono     ?? "",
          email:       d.email        ?? "",
          web:         d.web          ?? "",
          intendente:  d.intendente   ?? "",
          descripcion: d.descripcion  ?? "",
          redesSociales: {
            facebook:  d.redesSociales?.facebook  ?? "",
            instagram: d.redesSociales?.instagram ?? "",
            twitter:   d.redesSociales?.twitter   ?? "",
            youtube:   d.redesSociales?.youtube   ?? "",
          },
        })
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })) }
  function setRedes(key, val) { setForm((f) => ({ ...f, redesSociales: { ...f.redesSociales, [key]: val } })) }

  async function guardar() {
    setGuardando(true)
    setOk(false)
    try {
      await api.put("/api/admin/municipio", form)
      setOk(true)
      setTimeout(() => setOk(false), 3000)
    } catch (e) { alert(e.message) }
    finally { setGuardando(false) }
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
          <span className="card__title">Configuración del municipio</span>
          <p className="text-sm text-muted" style={{ marginTop: "0.25rem" }}>
            Esta información se inyecta automáticamente en todos los agentes IA
          </p>
        </div>
        <button
          className="btn btn--primary btn--sm"
          onClick={guardar}
          disabled={guardando}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
        >
          <IcoSave size={13} /> {guardando ? "Guardando…" : ok ? "✓ Guardado" : "Guardar cambios"}
        </button>
      </div>

      <div style={{ padding: "0 1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Identidad */}
        <section>
          <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#7c3aed", marginBottom: "0.75rem" }}>
            Identidad
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={LABEL}>Nombre del municipio</label>
              <input style={INPUT} value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Municipio de San Martín de los Andes" />
            </div>
            <div style={GRID3}>
              <div>
                <label style={LABEL}>Localidad</label>
                <input style={INPUT} value={form.localidad} onChange={(e) => set("localidad", e.target.value)} placeholder="San Martín de los Andes" />
              </div>
              <div>
                <label style={LABEL}>Provincia</label>
                <input style={INPUT} value={form.provincia} onChange={(e) => set("provincia", e.target.value)} placeholder="Neuquén" />
              </div>
              <div>
                <label style={LABEL}>País</label>
                <input style={INPUT} value={form.pais} onChange={(e) => set("pais", e.target.value)} placeholder="Argentina" />
              </div>
            </div>
            <div>
              <label style={LABEL}>Intendente / Jefe de gobierno</label>
              <input style={INPUT} value={form.intendente} onChange={(e) => set("intendente", e.target.value)} placeholder="Nombre del intendente" />
            </div>
            <div>
              <label style={LABEL}>Descripción / Presentación</label>
              <textarea
                style={{ ...INPUT, resize: "vertical", minHeight: 80, lineHeight: 1.5 }}
                value={form.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
                placeholder="El Municipio de San Martín de los Andes es la autoridad local encargada de…"
              />
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section>
          <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#7c3aed", marginBottom: "0.75rem" }}>
            Contacto
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={LABEL}>Dirección</label>
              <input style={INPUT} value={form.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Av. San Martín 123" />
            </div>
            <div style={GRID3}>
              <div>
                <label style={LABEL}>Teléfono</label>
                <input style={INPUT} value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+54 294 4427000" />
              </div>
              <div>
                <label style={LABEL}>Email</label>
                <input style={INPUT} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="info@municipio.gob.ar" />
              </div>
              <div>
                <label style={LABEL}>Sitio web</label>
                <input style={INPUT} value={form.web} onChange={(e) => set("web", e.target.value)} placeholder="www.municipio.gob.ar" />
              </div>
            </div>
          </div>
        </section>

        {/* Redes sociales */}
        <section>
          <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#7c3aed", marginBottom: "0.75rem" }}>
            Redes sociales
          </div>
          <div style={GRID2}>
            {[
              { key: "facebook",  label: "Facebook",  placeholder: "facebook.com/municipio" },
              { key: "instagram", label: "Instagram",  placeholder: "@municipio" },
              { key: "twitter",   label: "X / Twitter", placeholder: "@municipio" },
              { key: "youtube",   label: "YouTube",    placeholder: "youtube.com/@municipio" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={LABEL}>{label}</label>
                <input style={INPUT} value={form.redesSociales[key]} onChange={(e) => setRedes(key, e.target.value)} placeholder={placeholder} />
              </div>
            ))}
          </div>
        </section>

        {/* Preview contexto IA */}
        <section>
          <div style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: "0.5rem" }}>
            Preview — lo que ven los agentes IA
          </div>
          <pre style={{ background: "#0f172a", color: "#e2e8f0", borderRadius: 10, padding: "0.875rem 1rem", fontSize: "0.6875rem", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", overflow: "hidden" }}>
{`## Contexto del municipio
Municipio: ${form.nombre || "(sin nombre)"}
Localidad: ${form.localidad}${form.provincia ? `, ${form.provincia}` : ""}${form.pais ? `, ${form.pais}` : ""}${form.intendente ? `\nIntendente: ${form.intendente}` : ""}${form.direccion ? `\nDirección: ${form.direccion}` : ""}${form.telefono ? `\nTeléfono: ${form.telefono}` : ""}${form.email ? `\nEmail: ${form.email}` : ""}${form.web ? `\nWeb: ${form.web}` : ""}${form.descripcion ? `\n${form.descripcion}` : ""}`}
          </pre>
        </section>
      </div>
    </div>
  )
}
