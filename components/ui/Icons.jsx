// Shared SVG icon components — stroke-based, Lucide-style
// Usage: <IcoFlow size={16} /> — size defaults to 16, color inherits from CSS "currentColor"

function Ico({ size = 16, children, style, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "inline-block", flexShrink: 0, verticalAlign: "middle", ...style }}
      {...rest}
    >
      {children}
    </svg>
  )
}

// ── Tabs del módulo flows ──────────────────────────────────────────
export function IcoFlow({ size }) {
  return (
    <Ico size={size}>
      <rect x="3" y="3" width="5" height="5" rx="1" />
      <rect x="16" y="3" width="5" height="5" rx="1" />
      <rect x="9.5" y="16" width="5" height="5" rx="1" />
      <path d="M5.5 8v3c0 1.1.9 2 2 2h9a2 2 0 0 0 2-2V8" />
      <path d="M12 13v3" />
    </Ico>
  )
}

export function IcoCampos({ size }) {
  return (
    <Ico size={size}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </Ico>
  )
}

export function IcoCpu({ size }) {
  return (
    <Ico size={size}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M15 2v2M15 20v2M9 2v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2" />
    </Ico>
  )
}

// ── Tipos de nodo ─────────────────────────────────────────────────
export function IcoPlay({ size }) {
  return (
    <Ico size={size}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </Ico>
  )
}

export function IcoStop({ size }) {
  return (
    <Ico size={size}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </Ico>
  )
}

export function IcoMessageSquare({ size }) {
  return (
    <Ico size={size}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Ico>
  )
}

export function IcoLayoutGrid({ size }) {
  return (
    <Ico size={size}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </Ico>
  )
}

export function IcoGitBranch({ size }) {
  return (
    <Ico size={size}>
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </Ico>
  )
}

export function IcoHourglass({ size }) {
  return (
    <Ico size={size}>
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </Ico>
  )
}

export function IcoClock({ size }) {
  return (
    <Ico size={size}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Ico>
  )
}

export function IcoZap({ size }) {
  return (
    <Ico size={size}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </Ico>
  )
}

export function IcoSparkles({ size }) {
  return (
    <Ico size={size}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
      <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
    </Ico>
  )
}

// ── Acciones ──────────────────────────────────────────────────────
export function IcoPencil({ size }) {
  return (
    <Ico size={size}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </Ico>
  )
}

export function IcoTrash({ size }) {
  return (
    <Ico size={size}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Ico>
  )
}

export function IcoSave({ size }) {
  return (
    <Ico size={size}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </Ico>
  )
}

export function IcoPause({ size }) {
  return (
    <Ico size={size}>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </Ico>
  )
}

// ── Proveedores IA ────────────────────────────────────────────────
export function IcoBrain({ size }) {
  return (
    <Ico size={size}>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04z" />
    </Ico>
  )
}

// ── Campos ────────────────────────────────────────────────────────
export function IcoCalendar({ size }) {
  return (
    <Ico size={size}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Ico>
  )
}

// ── Inbox / Templates ────────────────────────────────────────────
export function IcoInbox({ size }) {
  return (
    <Ico size={size}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </Ico>
  )
}

export function IcoFileText({ size }) {
  return (
    <Ico size={size}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8M16 13H8M16 17H8" />
    </Ico>
  )
}

export function IcoCopy({ size }) {
  return (
    <Ico size={size}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Ico>
  )
}

// ── Personas / Sistema ────────────────────────────────────────────
export function IcoUser({ size }) {
  return (
    <Ico size={size}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Ico>
  )
}

export function IcoLock({ size }) {
  return (
    <Ico size={size}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Ico>
  )
}

export function IcoClipboard({ size }) {
  return (
    <Ico size={size}>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </Ico>
  )
}

// ── Grip / drag handle ───────────────────────────────────────────
export function IcoGrip({ size = 16, style, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      style={{ display: "inline-block", flexShrink: 0, verticalAlign: "middle", ...style }} {...rest}>
      {[8, 16].flatMap((x) => [6, 12, 18].map((y) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill="currentColor" />
      )))}
    </svg>
  )
}

// ── Nota / lock ───────────────────────────────────────────────────
export function IcoNote({ size }) {
  return (
    <Ico size={size}>
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </Ico>
  )
}

export function IcoUnlock({ size }) {
  return (
    <Ico size={size}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </Ico>
  )
}

// ── Canales / redes sociales ──────────────────────────────────────
export function IcoWhatsApp({ size }) {
  return (
    <Ico size={size}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Ico>
  )
}

export function IcoInstagram({ size }) {
  return (
    <Ico size={size}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </Ico>
  )
}

export function IcoFacebook({ size }) {
  return (
    <Ico size={size}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </Ico>
  )
}

export function IcoTikTok({ size }) {
  return (
    <Ico size={size}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </Ico>
  )
}

export function IcoMail({ size }) {
  return (
    <Ico size={size}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Ico>
  )
}

export function IcoGlobe({ size }) {
  return (
    <Ico size={size}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Ico>
  )
}

export function IcoUndo({ size }) {
  return (
    <Ico size={size}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </Ico>
  )
}

export function IcoRedo({ size }) {
  return (
    <Ico size={size}>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </Ico>
  )
}

export function IcoServer({ size }) {
  return (
    <Ico size={size}>
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </Ico>
  )
}

export function IcoCopy2({ size }) {
  return (
    <Ico size={size}>
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </Ico>
  )
}

// ── Triggers ──────────────────────────────────────────────────────
export function IcoMessageCircle({ size }) {
  return (
    <Ico size={size}>
      <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
    </Ico>
  )
}

export function IcoHash({ size }) {
  return (
    <Ico size={size}>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </Ico>
  )
}

export function IcoCursor({ size }) {
  return (
    <Ico size={size}>
      <path d="m4 4 7.07 17 2.51-7.39L21 11.07z" />
    </Ico>
  )
}

export function IcoSubflow({ size }) {
  return (
    <Ico size={size}>
      <polyline points="7 16 12 12 7 8" />
      <polyline points="13 16 18 12 13 8" />
    </Ico>
  )
}

export function IcoMap({ size }) {
  return (
    <Ico size={size}>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </Ico>
  )
}

export function IcoButtons({ size }) {
  return (
    <Ico size={size}>
      <rect x="2" y="5" width="20" height="6" rx="2" />
      <rect x="2" y="14" width="20" height="6" rx="2" />
    </Ico>
  )
}

export function IcoSun({ size }) {
  return (
    <Ico size={size}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Ico>
  )
}

export function IcoMoon({ size }) {
  return (
    <Ico size={size}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Ico>
  )
}

export function IcoChevronDown({ size }) {
  return (
    <Ico size={size}>
      <polyline points="6 9 12 15 18 9" />
    </Ico>
  )
}

export function IcoChevronUp({ size }) {
  return (
    <Ico size={size}>
      <polyline points="18 15 12 9 6 15" />
    </Ico>
  )
}

export function IcoSettings({ size }) {
  return (
    <Ico size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Ico>
  )
}
