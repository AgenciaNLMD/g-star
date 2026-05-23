import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="landing">
      <div className="landing__hero">
        <div className="landing__logo">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 className="landing__title">g-start</h1>
        <p className="landing__subtitle">Gestión Municipal Inteligente</p>
        <div className="landing__divider" />
        <Link href="/login" className="btn btn--primary landing__cta">
          Ingresar al panel
        </Link>
      </div>
    </main>
  )
}
