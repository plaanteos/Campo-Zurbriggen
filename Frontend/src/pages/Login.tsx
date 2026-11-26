import { useState } from "react"
import { ApiError, apiPost } from "../lib/api"
import type { Sesion } from "../lib/types"
import { Icon } from "../components/ui"

const BENEFICIOS = [
  "Remitos, facturas y cuentas corrientes sin planillas",
  "Pagos y cobros imputados con control de saldos",
  "Cosechas, servicios e inventario en tiempo real",
]

export function Login({ onLogin }: { onLogin: (sesion: Sesion, token: string) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [verClave, setVerClave] = useState(false)

  const ingresar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    try {
      const res = await apiPost<{ token: string; usuario: Sesion }>("/auth/login", {
        email,
        password,
      })
      onLogin(res.usuario, res.token)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-shell">
        <section className="login-hero">
          <div className="login-hero-pattern" aria-hidden="true" />
          <div className="login-logo">
            <span className="login-logo-mark">
              <Icon name="wheat" size={26} />
            </span>
            <div>
              <strong>AGROGESTIÓN</strong>
              <span>ERP Agropecuario</span>
            </div>
          </div>

          <div className="login-hero-body">
            <span className="login-kicker">GESTIÓN INTEGRAL DEL CAMPO</span>
            <h1>
              Tu campo,
              <br />
              ordenado de punta a punta.
            </h1>
            <p>
              Compras, remitos, facturación, pagos, cosechas y stock de cereal en un
              único sistema, pensado para el trabajo diario en el campo.
            </p>
            <ul className="login-benefits">
              {BENEFICIOS.map((b) => (
                <li key={b}>
                  <span>
                    <Icon name="check" size={13} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="login-hero-footer">
            <span>
              <Icon name="map" size={14} /> Gestión agropecuaria
            </span>
          </div>
        </section>

        <section className="login-form-side">
          <form className="login-card" onSubmit={ingresar}>
            <div className="login-card-head">
              <span className="login-kicker">ACCESO AL SISTEMA</span>
              <h2>Iniciar sesión</h2>
              <p>Ingresá con tu usuario para acceder a la gestión del campo.</p>
            </div>

            <label>
              Correo electrónico
              <div className="login-field">
                <span className="login-field-icon">
                  <Icon name="mail" size={17} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="usuario@campo.local"
                  required
                />
              </div>
            </label>

            <label>
              Contraseña
              <div className="login-field">
                <span className="login-field-icon">
                  <Icon name="lock" size={17} />
                </span>
                <input
                  type={verClave ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setVerClave(!verClave)}
                  title={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <Icon name="eye" size={17} />
                </button>
              </div>
            </label>

            <div className="login-row">
              <label className="login-check">
                <input type="checkbox" defaultChecked />
                <span>Recordarme</span>
              </label>
              <button
                type="button"
                className="login-link"
                onClick={() => setError("Contactá al administrador para restablecer tu clave.")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button className="btn login-submit" type="submit" disabled={cargando}>
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>

            <small className="login-copy">Agrogestión · Sistema de gestión agropecuaria</small>
          </form>
        </section>
      </div>
    </div>
  )
}
