import { useEffect, useMemo, useState } from "react"
import { clearSesion, guardarSesion, leerSesion } from "./lib/api"
import type { Sesion } from "./lib/types"
import { Icon, type IconName } from "./components/ui"
import { Login } from "./pages/Login"
import { Dashboard } from "./pages/Dashboard"
import { Facturas } from "./pages/Facturas"
import { Remitos } from "./pages/Remitos"
import { Pagos } from "./pages/Pagos"
import { Cuentas } from "./pages/Cuentas"
import { Cheques } from "./pages/Cheques"
import { Usuarios } from "./pages/Usuarios"
import { Campos } from "./pages/Campos"
import { Servicios } from "./pages/Servicios"
import { Cosechas } from "./pages/Cosechas"
import { Inventario } from "./pages/Inventario"
import { Documentos } from "./pages/Documentos"
import { Informes } from "./pages/Informes"

type NavItem = { id: string; label: string; icon: IconName; group: string; adminOnly?: boolean }

const navItems: NavItem[] = [
  { id: "dashboard", label: "Inicio", icon: "home", group: "GENERAL" },
  { id: "campos", label: "Campos y campañas", icon: "map", group: "OPERACIONES" },
  { id: "servicios", label: "Servicios agropecuarios", icon: "tractor", group: "OPERACIONES" },
  { id: "cosechas", label: "Cosechas y entregas", icon: "truck", group: "OPERACIONES" },
  { id: "insumos", label: "Inventario de insumos", icon: "box", group: "STOCK" },
  { id: "cereal", label: "Stock de cereal", icon: "wheat", group: "STOCK" },
  { id: "remitos", label: "Remitos", icon: "file", group: "ADMINISTRACIÓN" },
  { id: "facturas", label: "Facturación", icon: "invoice", group: "ADMINISTRACIÓN", adminOnly: true },
  { id: "documentos", label: "Procesar documentos", icon: "scan", group: "ADMINISTRACIÓN", adminOnly: true },
  { id: "pagos", label: "Pagos y cobranzas", icon: "wallet", group: "FINANZAS", adminOnly: true },
  { id: "cheques", label: "Gestión de cheques", icon: "cheque", group: "FINANZAS", adminOnly: true },
  { id: "cuentas", label: "Cuentas corrientes", icon: "ledger", group: "FINANZAS", adminOnly: true },
  { id: "informes", label: "Informes y reportes", icon: "chart", group: "SISTEMA", adminOnly: true },
  { id: "usuarios", label: "Usuarios y permisos", icon: "users", group: "SISTEMA", adminOnly: true },
]

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() ?? "")
    .join("")

export default function App() {
  const [sesion, setSesion] = useState<Sesion | null>(() => leerSesion<Sesion>())
  const [active, setActive] = useState("dashboard")
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState(false)

  useEffect(() => {
    const cerrar = () => setSesion(null)
    window.addEventListener("campo:sesion-expirada", cerrar)
    return () => window.removeEventListener("campo:sesion-expirada", cerrar)
  }, [])

  const visibles = useMemo(
    () => navItems.filter((n) => !n.adminOnly || sesion?.rol === "ADMIN"),
    [sesion],
  )

  const current = useMemo(
    () => visibles.find((n) => n.id === active) ?? visibles[0],
    [visibles, active],
  )

  if (!sesion) {
    return (
      <Login
        onLogin={(usuario, token) => {
          guardarSesion(usuario, token)
          setSesion(usuario)
          setActive("dashboard")
        }}
      />
    )
  }

  const groups = [...new Set(visibles.map((n) => n.group))]

  const navigate = (id: string) => {
    if (!visibles.some((n) => n.id === id)) return
    setActive(id)
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cerrarSesion = () => {
    clearSesion()
    setSesion(null)
    setActive("dashboard")
  }

  const render = () => {
    switch (current.id) {
      case "dashboard":
        return <Dashboard onNavigate={navigate} nombre={sesion.nombre} rol={sesion.rol} />
      case "campos":
        return <Campos />
      case "servicios":
        return <Servicios />
      case "cosechas":
        return <Cosechas />
      case "insumos":
        return <Inventario />
      case "cereal":
        return <Inventario cereal />
      case "remitos":
        return <Remitos />
      case "facturas":
        return <Facturas />
      case "documentos":
        return <Documentos />
      case "pagos":
        return <Pagos />
      case "cheques":
        return <Cheques />
      case "cuentas":
        return <Cuentas />
      case "informes":
        return <Informes />
      case "usuarios":
        return <Usuarios />
      default:
        return <Dashboard onNavigate={navigate} nombre={sesion.nombre} rol={sesion.rol} />
    }
  }

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Icon name="wheat" size={22} />
          </div>
          <div>
            <strong>AGROGESTIÓN</strong>
            <span>ERP Agropecuario</span>
          </div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <nav>
          {groups.map((g) => (
            <div className="nav-group" key={g}>
              <span className="group-title">{g}</span>
              {visibles
                .filter((n) => n.group === g)
                .map((n) => (
                  <button
                    title={n.label}
                    className={current.id === n.id ? "active" : ""}
                    onClick={() => navigate(n.id)}
                    key={n.id}
                  >
                    <Icon name={n.icon} />
                    <span>{n.label}</span>
                    {current.id === n.id && <i />}
                  </button>
                ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-user">
          <div>{iniciales(sesion.nombre)}</div>
          <span>
            <strong>{sesion.nombre}</strong>
            <small>{sesion.rol === "ADMIN" ? "Administrador" : "Encargado"}</small>
          </span>
          <button title="Cerrar sesión" onClick={cerrarSesion}>
            <Icon name="logout" size={17} />
          </button>
        </div>
      </aside>
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <main>
        <header className="topbar">
          <button className="collapse-button desktop-only" onClick={() => setCollapsed(!collapsed)}>
            <Icon name="menu" />
          </button>
          <button className="collapse-button mobile-only" onClick={() => setMobileOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            <span>Agrogestión</span>
            <Icon name="arrow" size={13} />
            <strong>{current.label}</strong>
          </div>
          <label className="global-search">
            <Icon name="search" size={17} />
            <input placeholder="Buscar en todo el sistema..." />
            <kbd>⌘ K</kbd>
          </label>
          <div className="top-actions">
            <button
              className="notification-button"
              onClick={() => setNotifications(!notifications)}
            >
              <Icon name="bell" />
              <i />
            </button>
            <div className="top-user">
              <div>{iniciales(sesion.nombre)}</div>
              <span>
                <strong>{sesion.nombre}</strong>
                <small>{sesion.rol === "ADMIN" ? "Administrador" : "Encargado"}</small>
              </span>
              <b>⌄</b>
            </div>
          </div>
          {notifications && (
            <div className="notification-popover">
              <div>
                <strong>Notificaciones</strong>
                <button onClick={() => setNotifications(false)}>
                  <Icon name="close" size={16} />
                </button>
              </div>
              <article>
                <i className="critical">
                  <Icon name="warning" size={15} />
                </i>
                <span>
                  <strong>Revisá vencimientos</strong>
                  <small>Consultá las facturas impagas en el inicio.</small>
                </span>
              </article>
              <article>
                <i>
                  <Icon name="box" size={15} />
                </i>
                <span>
                  <strong>Control de stock</strong>
                  <small>Verificá los insumos marcados para reposición.</small>
                </span>
              </article>
              <button className="full-link" onClick={() => navigate("dashboard")}>
                Ver el resumen general
              </button>
            </div>
          )}
        </header>
        {render()}
      </main>
    </div>
  )
}
