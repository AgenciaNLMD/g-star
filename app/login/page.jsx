import { signIn } from "@/lib/auth"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Ingresar — g-start",
}

export default async function LoginPage() {
  // Si ya hay sesión activa, ir directo al panel
  const session = await auth()
  if (session?.user) redirect("/panel")

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-card__logo">
          <div className="login-card__logo-mark">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="login-card__title">g-start</h1>
          <p className="login-card__subtitle">
            Ingresá con tu cuenta Google institucional para acceder al panel municipal.
          </p>
        </div>

        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/panel" })
          }}
        >
          <button type="submit" className="btn btn--google">
            <GoogleIcon />
            Continuar con Google
          </button>
        </form>

        <p className="login-card__notice">
          El acceso está restringido a usuarios registrados por el administrador del sistema.
        </p>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
