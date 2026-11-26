import { useMemo, useState } from "react"
import type { Factura } from "../lib/types"
import { useApiData } from "../lib/useApiData"
import { comprobante, fecha, money, num } from "../lib/format"
import { Badge, Button, ErrorState, Filters, Icon, Loading, PageHeader, Pagination, type BadgeTone } from "../components/ui"
import { FacturaForm } from "../components/forms"

function estadoFactura(f: Factura): { label: string; tone: BadgeTone } {
  if (f.estado === "ANULADA") return { label: "Anulada", tone: "neutral" }
  const saldo = num(f.total) - num(f.pagado)
  if (saldo > 0 && f.vencimiento && new Date(f.vencimiento) < new Date()) {
    return { label: "Vencida", tone: "danger" }
  }
  if (f.estado === "PAGADA") return { label: "Pagada", tone: "success" }
  if (f.estado === "PARCIAL") return { label: "Parcial", tone: "info" }
  return { label: "Pendiente", tone: "warning" }
}

function Drawer({ factura, onClose }: { factura: Factura; onClose: () => void }) {
  const estado = estadoFactura(factura)
  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer">
        <div className="drawer-head">
          <div>
            <span>DETALLE DE COMPROBANTE</span>
            <h2>{comprobante(factura)}</h2>
          </div>
          <button onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-status">
          <Badge tone={estado.tone}>{estado.label}</Badge>
          <span>Emitida el {fecha(factura.fecha)}</span>
        </div>
        <div className="drawer-body">
          <h3>Datos del tercero</h3>
          <dl>
            <div>
              <dt>Razón social</dt>
              <dd>{factura.tercero?.nombre ?? "—"}</dd>
            </div>
            <div>
              <dt>CUIT</dt>
              <dd>{factura.tercero?.cuit ?? "—"}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>{factura.direccion === "COMPRA" ? "Compra" : "Venta"}</dd>
            </div>
            <div>
              <dt>Vencimiento</dt>
              <dd className={factura.vencimiento && new Date(factura.vencimiento) < new Date() ? "danger-text" : ""}>
                {fecha(factura.vencimiento)}
              </dd>
            </div>
          </dl>
          <h3>Importes</h3>
          <dl>
            <div>
              <dt>Importe neto</dt>
              <dd>{money(factura.neto)}</dd>
            </div>
            <div>
              <dt>IVA</dt>
              <dd>{money(factura.iva)}</dd>
            </div>
            <div>
              <dt>Pagado</dt>
              <dd>{money(factura.pagado)}</dd>
            </div>
            <div className="drawer-total">
              <dt>Total</dt>
              <dd>{money(factura.total)}</dd>
            </div>
          </dl>
          <h3>Remitos vinculados</h3>
          {(factura.remitos ?? []).length === 0 ? (
            <p className="hint">Sin remitos vinculados.</p>
          ) : (
            factura.remitos?.map((r) => (
              <div className="file-row" key={r.remito.numero}>
                <Icon name="file" />
                <span>
                  <strong>{r.remito.numero}</strong>
                  <small>{money(r.remito.importe)}</small>
                </span>
              </div>
            ))
          )}
        </div>
        <div className="drawer-foot">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </aside>
    </div>
  )
}

export function Facturas() {
  const { data, loading, error, reload } = useApiData<Factura[]>("/facturas")
  const [tab, setTab] = useState<"Recibidas" | "Emitidas">("Recibidas")
  const [busqueda, setBusqueda] = useState("")
  const [detalle, setDetalle] = useState<Factura | null>(null)
  const [nueva, setNueva] = useState(false)

  const facturas = useMemo(() => (data ?? []).filter((f) => f.estado !== "ANULADA"), [data])

  const recibidas = facturas.filter((f) => f.direccion === "COMPRA")
  const emitidas = facturas.filter((f) => f.direccion === "VENTA")
  const visibles = (tab === "Recibidas" ? recibidas : emitidas).filter((f) => {
    const texto = `${comprobante(f)} ${f.tercero?.nombre ?? ""} ${f.tercero?.cuit ?? ""}`.toLowerCase()
    return texto.includes(busqueda.toLowerCase())
  })

  const total = visibles.reduce((acc, f) => acc + num(f.total), 0)
  const pendiente = visibles.reduce((acc, f) => acc + Math.max(0, num(f.total) - num(f.pagado)), 0)
  const vencido = visibles
    .filter((f) => f.vencimiento && new Date(f.vencimiento) < new Date() && num(f.total) > num(f.pagado))
    .reduce((acc, f) => acc + num(f.total) - num(f.pagado), 0)
  const ivaCompras = tab === "Recibidas" ? visibles.reduce((acc, f) => acc + num(f.iva), 0) : 0

  return (
    <div className="content">
      <PageHeader
        eyebrow="ADMINISTRACIÓN"
        title="Facturación"
        subtitle="Gestión de comprobantes recibidos y emitidos"
        action="Nueva factura"
        onAction={() => setNueva(true)}
      />
      <div className="summary-line">
        <div>
          <span>Total del período</span>
          <strong>{money(total)}</strong>
          <small>{visibles.length} comprobantes</small>
        </div>
        <div>
          <span>Pendiente de pago</span>
          <strong>{money(pendiente)}</strong>
          <small>{visibles.filter((f) => num(f.total) > num(f.pagado)).length} comprobantes</small>
        </div>
        <div>
          <span>Vencido</span>
          <strong className="danger-text">{money(vencido)}</strong>
          <small>
            {
              visibles.filter(
                (f) =>
                  f.vencimiento && new Date(f.vencimiento) < new Date() && num(f.total) > num(f.pagado),
              ).length
            }{" "}
            comprobantes
          </small>
        </div>
        <div>
          <span>Crédito fiscal IVA</span>
          <strong>{money(ivaCompras)}</strong>
          <small>{tab === "Recibidas" ? "Compras del período" : "No aplica a ventas"}</small>
        </div>
      </div>
      <div className="table-panel">
        <div className="tabs">
          <button
            className={tab === "Recibidas" ? "active" : ""}
            onClick={() => setTab("Recibidas")}
          >
            Facturas recibidas <span>{recibidas.length}</span>
          </button>
          <button className={tab === "Emitidas" ? "active" : ""} onClick={() => setTab("Emitidas")}>
            Facturas emitidas <span>{emitidas.length}</span>
          </button>
        </div>
        <Filters
          search="Buscar por comprobante, proveedor o CUIT..."
          value={busqueda}
          onChange={setBusqueda}
        />
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>COMPROBANTE</th>
                  <th>FECHA</th>
                  <th>PROVEEDOR / RAZÓN SOCIAL</th>
                  <th>CUIT</th>
                  <th className="right">NETO</th>
                  <th className="right">TOTAL</th>
                  <th className="right">SALDO</th>
                  <th>ESTADO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((f) => {
                  const estado = estadoFactura(f)
                  return (
                    <tr key={f.id} onClick={() => setDetalle(f)}>
                      <td>
                        <strong>{comprobante(f)}</strong>
                      </td>
                      <td>{fecha(f.fecha)}</td>
                      <td>
                        <strong className="regular">{f.tercero?.nombre ?? "—"}</strong>
                      </td>
                      <td className="mono">{f.tercero?.cuit ?? "—"}</td>
                      <td className="right amount">{money(f.neto)}</td>
                      <td className="right amount">{money(f.total)}</td>
                      <td className="right amount">{money(num(f.total) - num(f.pagado))}</td>
                      <td>
                        <Badge tone={estado.tone}>{estado.label}</Badge>
                      </td>
                      <td>
                        <button className="icon-button">
                          <Icon name="more" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {visibles.length === 0 && <p className="table-empty">No hay comprobantes para mostrar.</p>}
          </div>
        )}
        <Pagination total={`Mostrando ${visibles.length} comprobantes`} />
      </div>
      {nueva && (
        <FacturaForm
          onClose={() => setNueva(false)}
          onDone={() => {
            setNueva(false)
            void reload()
          }}
        />
      )}
      {detalle && <Drawer factura={detalle} onClose={() => setDetalle(null)} />}
    </div>
  )
}
