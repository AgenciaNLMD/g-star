"use client"

const ESTADOS = [
  { value: "",           label: "Todos los estados" },
  { value: "entrante",   label: "Entrante" },
  { value: "tomado",     label: "Tomado" },
  { value: "elevado",    label: "Elevado" },
  { value: "en_proceso", label: "En proceso" },
  { value: "resuelto",   label: "Resuelto" },
  { value: "cerrado",    label: "Cerrado" },
]

const CANALES = [
  { value: "",           label: "Todos los canales" },
  { value: "whatsapp",   label: "WhatsApp" },
  { value: "email",      label: "Email" },
  { value: "presencial", label: "Presencial" },
]

const ETIQUETAS = [
  "", "General", "Urgente", "Vialidad", "Iluminación",
  "Espacios verdes", "Saneamiento", "Seguridad", "Ruidos molestos", "Otro",
]

const LOCALIDADES = [
  "", "Aeropuerto", "Canning", "Ezeiza", "La Unión", "Spegazzini", "Suárez",
]

const FILTROS_VACIO = {
  busqueda: "", estado: "", etiqueta: "", localidad: "", canal: "", equipoId: "", fechaDesde: "", fechaHasta: "",
}

export default function ReclamosFilters({ filtros, onChange, total, equipos }) {
  function set(key, val) {
    onChange({ ...filtros, [key]: val })
  }

  function limpiar() { onChange(FILTROS_VACIO) }

  return (
    <aside className="reclamos-filters">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="text-sm font-semi">Filtros</span>
        <button className="btn btn--ghost btn--sm" onClick={limpiar}>Limpiar</button>
      </div>

      <div className="input-group">
        <label>Buscar</label>
        <input
          className="input input--sm"
          placeholder="Nombre, número, barrio…"
          value={filtros.busqueda}
          onChange={(e) => set("busqueda", e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Estado</label>
        <select className="select" value={filtros.estado} onChange={(e) => set("estado", e.target.value)}>
          {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </div>

      <div className="input-group">
        <label>Canal</label>
        <select className="select" value={filtros.canal} onChange={(e) => set("canal", e.target.value)}>
          {CANALES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {equipos?.length > 0 && (
        <div className="input-group">
          <label>Equipo</label>
          <select className="select" value={filtros.equipoId} onChange={(e) => set("equipoId", e.target.value)}>
            <option value="">Todos los equipos</option>
            {equipos.map((eq) => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
          </select>
        </div>
      )}

      <div className="input-group">
        <label>Etiqueta</label>
        <select className="select" value={filtros.etiqueta} onChange={(e) => set("etiqueta", e.target.value)}>
          {ETIQUETAS.map((e) => <option key={e} value={e}>{e || "Todas"}</option>)}
        </select>
      </div>

      <div className="input-group">
        <label>Localidad</label>
        <select className="select" value={filtros.localidad} onChange={(e) => set("localidad", e.target.value)}>
          {LOCALIDADES.map((l) => <option key={l} value={l}>{l || "Todas"}</option>)}
        </select>
      </div>

      <div className="input-group">
        <label>Desde</label>
        <input type="date" className="input input--sm" value={filtros.fechaDesde} onChange={(e) => set("fechaDesde", e.target.value)} />
      </div>

      <div className="input-group">
        <label>Hasta</label>
        <input type="date" className="input input--sm" value={filtros.fechaHasta} onChange={(e) => set("fechaHasta", e.target.value)} />
      </div>

      {total !== undefined && (
        <p className="text-xs text-muted" style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
          {total} reclamos encontrados
        </p>
      )}
    </aside>
  )
}
