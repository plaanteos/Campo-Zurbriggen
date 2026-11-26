import type { Dashboard as DashboardData } from "../lib/types"
import { useApiData } from "../lib/useApiData"
import { ETIQUETA_CULTIVO, fechaCorta, hora, money, num, numero, tn } from "../lib/format"
import { Badge, Button, ErrorState, Icon, Loading, type IconName } from "../components/ui"

const ICONO_ENTIDAD: Record<string, IconName> = {
  Factura: "invoice",
  Pago: "wallet",
  Remito: "file",
  Cheque: "cheque",
  CargaCosecha: "truck",
  MovimientoInsumo: "box",
  MovimientoCereal: "wheat",
  ServicioAgro: "tractor",
  Usuario: "users",
}

const ACCION: Record<string, string> = {
  CREAR: "Alta registrada",
  EDITAR: "Modificación",
  ANULAR: "Anulación",
  BORRAR: "Baja registrada",
}

function diasHasta(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

export function Dashboard({
  onNavigate,
  nombre,
  rol,
}: {
  onNavigate: (id: string) => void
  nombre: string
  rol: "ADMIN" | "ENCARGADO"
}) {
  const { data, loading, error, reload } = useApiData<DashboardData>("/dashboard")

  if (loading && !data) return <div className="content"><Loading /></div>
  if (error && !data) return <div className="content"><ErrorState error={error} onRetry={reload} /></div>

  const d = data
  const flujo = d?.flujo ?? []
  const maxFlujo = Math.max(1, ...flujo.map((f) => Math.max(num(f.ingresos), num(f.egresos))))
  const stock = d?.stockCereal
  const totalTn = num(stock?.totalKg) / 1000
  const cultivos = (stock?.porCultivo ?? []).slice(0, 3)
  const fechaLarga = new Date()
    .toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
    .replace(",", "")
    .toUpperCase()
  const pendientes = d?.remitosPendientes ?? 0

  return (
    <div className="content">
      <section className="home-banner">
        <div className="home-banner-left">
          <span className="home-banner-date">{fechaLarga} · SAN CRISTÓBAL, SANTA FE</span>
          <h1>
            Buen día, {nombre.split(" ")[0]}.
            <br />
            <em>
              El campo está al día.
            </em>
          </h1>
          <p>
            Tenés una jornada activa: {d?.cargasTransito ?? 0} cargas en tránsito,{" "}
            {d?.vencimientos.length ?? 0} vencimientos próximos y {pendientes} remitos por
            facturar.
          </p>
          <div className="home-banner-actions">
            <button className="home-banner-primary" onClick={() => onNavigate("cereal")}>
              <Icon name="plus" size={16} /> Registrar movimiento
            </button>
            <button
              className="home-banner-link"
              onClick={() => onNavigate(rol === "ADMIN" ? "pagos" : "remitos")}
            >
              Revisar pendientes <Icon name="arrow" size={14} />
            </button>
          </div>
        </div>
        <div className="home-banner-right">
          <svg className="home-banner-lines" viewBox="0 0 570 440" preserveAspectRatio="none" aria-hidden="true">
            <path d="M-20 305 C85 224 180 260 270 198 S410 148 590 96" />
            <path d="M-20 360 C75 275 180 300 285 232 S430 185 590 143" />
            <path d="M120 360 C190 270 260 280 340 301 S430 300 490 202" />
          </svg>
          <div className="home-banner-marker" aria-hidden="true" />
          <div className="home-weather">
            <div className="home-weather-temp">18°</div>
            <div>
              <strong>Despejado</strong>
              <span>Viento NE 12 km/h</span>
            </div>
          </div>
          <div className="home-campaign">
            <span>CAMPAÑA 2025/2026</span>
            <strong>{numero(d?.superficieHa ?? 0, 0)} ha</strong>
            <small>Implantadas · {d?.cargasMes ?? 0} cargas del mes</small>
          </div>
        </div>
      </section>
      <section className="financial-overview">
        <div className="section-head">
          <div>
            <h2>Posición financiera</h2>
            <p>Valores del período en curso</p>
          </div>
          <button className="text-action" onClick={() => onNavigate("informes")}>
            Ver informe financiero <Icon name="arrow" size={14} />
          </button>
        </div>
        <div className="metric-row">
          <div className="metric">
            <span>Ingresos del mes</span>
            <strong>{money(d?.ingresosMes ?? 0)}</strong>
            <small>Cobranzas registradas</small>
          </div>
          <div className="metric">
            <span>Egresos del mes</span>
            <strong>{money(d?.egresosMes ?? 0)}</strong>
            <small>Pagos realizados</small>
          </div>
          <div className="metric">
            <span>Por cobrar</span>
            <strong>{money(d?.porCobrar ?? 0)}</strong>
            <small className="warning-text">Saldo de facturas de venta</small>
          </div>
          <div className="metric">
            <span>Por pagar</span>
            <strong>{money(d?.porPagar ?? 0)}</strong>
            <small>{d?.vencidas ?? 0} comprobantes vencidos</small>
          </div>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="panel cash-panel">
          <div className="section-head">
            <div>
              <h2>Flujo de fondos</h2>
              <p>Ingresos y egresos de los últimos 6 meses</p>
            </div>
          </div>
          <div className="chart-legend">
            <span>
              <i className="income" />
              Ingresos
            </span>
            <span>
              <i className="expense" />
              Egresos
            </span>
          </div>
          <div className="bar-chart">
            {flujo.map((f) => (
              <div className="bar-set" key={f.mes}>
                <div className="bars">
                  <i className="income" style={{ height: `${(num(f.ingresos) / maxFlujo) * 100}%` }} />
                  <i className="expense" style={{ height: `${(num(f.egresos) / maxFlujo) * 100}%` }} />
                </div>
                <span>{f.mes}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel due-panel">
          <div className="section-head">
            <div>
              <h2>Próximos vencimientos</h2>
              <p>Facturas con saldo pendiente</p>
            </div>
            <span className="count-badge">{d?.vencimientos.length ?? 0} pendientes</span>
          </div>
          {(d?.vencimientos ?? []).length === 0 ? (
            <p className="hint">No hay vencimientos pendientes.</p>
          ) : (
            d?.vencimientos.map((v) => {
              const dias = diasHasta(v.vencimiento)
              const tone = dias < 0 ? "danger" : dias <= 7 ? "warning" : "neutral"
              return (
                <div className="due-row" key={v.id}>
                  <div className="date-box">
                    <b>{fechaCorta(v.vencimiento).split(" ")[0]}</b>
                    <span>{fechaCorta(v.vencimiento).split(" ")[1]}</span>
                  </div>
                  <div>
                    <strong>{v.tercero}</strong>
                    <span>{v.comprobante}</span>
                  </div>
                  <div className="due-value">
                    <b>{money(v.saldo)}</b>
                    <Badge tone={tone as "danger" | "warning" | "neutral"}>
                      {dias < 0 ? "Vencida" : dias <= 7 ? "Vence pronto" : "Programada"}
                    </Badge>
                  </div>
                </div>
              )
            })
          )}
          <button className="full-link" onClick={() => onNavigate("pagos")}>
            Ver pagos y cobranzas <Icon name="arrow" size={14} />
          </button>
        </section>
        <section className="panel stock-summary">
          <div className="section-head">
            <div>
              <h2>Existencias y campaña</h2>
              <p>Resumen operativo actualizado</p>
            </div>
            <button className="icon-button" onClick={() => onNavigate("cereal")}>
              <Icon name="more" />
            </button>
          </div>
          <div className="stock-block">
            <div className="stock-icon">
              <Icon name="wheat" />
            </div>
            <div>
              <span>Stock total de cereal</span>
              <strong>{tn(stock?.totalKg ?? 0)}</strong>
            </div>
            <div className="stock-parts">
              <span>
                <i style={{ width: "100%" }} />
                En existencia <b>{numero(totalTn, 1)} tn</b>
              </span>
            </div>
          </div>
          <div className="crop-grid">
            {cultivos.map((c) => (
              <div key={c.cultivo}>
                <span>{ETIQUETA_CULTIVO[c.cultivo] ?? c.cultivo}</span>
                <strong>{tn(c.kg)}</strong>
                <small>
                  {totalTn > 0 ? `${numero((num(c.kg) / 1000 / totalTn) * 100, 1)}% del total` : "Sin stock"}
                </small>
              </div>
            ))}
          </div>
          <div className="campaign-line">
            <div>
              <span>Superficie implantada</span>
              <strong>{numero(d?.superficieHa ?? 0, 0)} ha</strong>
            </div>
            <div>
              <span>Facturas del mes</span>
              <strong>{d?.facturasMes ?? 0}</strong>
            </div>
            <div>
              <span>Remitos sin facturar</span>
              <strong>{d?.remitosPendientes ?? 0}</strong>
            </div>
          </div>
        </section>
        <section className="panel recent-panel">
          <div className="section-head">
            <div>
              <h2>Actividad reciente</h2>
              <p>Últimos movimientos registrados</p>
            </div>
            <Button variant="ghost">Ver historial</Button>
          </div>
          {(d?.actividades ?? []).length === 0 ? (
            <p className="hint">Todavía no hay actividad registrada.</p>
          ) : (
            d?.actividades.map((a) => (
              <div className="activity" key={a.id}>
                <div className="activity-icon">
                  <Icon name={ICONO_ENTIDAD[a.entidad] ?? "file"} />
                </div>
                <div>
                  <strong>{ACCION[a.accion] ?? a.accion}</strong>
                  <span>
                    {a.entidad} · {a.usuario}
                  </span>
                </div>
                <div>
                  <b>{fechaCorta(a.createdAt)}</b>
                  <span>{hora(a.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  )
}
