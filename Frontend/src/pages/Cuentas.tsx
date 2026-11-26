import { useEffect, useMemo, useState } from "react"
import type { CuentaCorriente, Tercero } from "../lib/types"
import { useApiData } from "../lib/useApiData"
import { fecha, money, num } from "../lib/format"
import { Button, ErrorState, Icon, Loading, PageHeader, Pagination } from "../components/ui"
import { PagoForm } from "../components/forms"

export function Cuentas() {
  const terceros = useApiData<Tercero[]>("/terceros")
  const [terceroId, setTerceroId] = useState("")
  const [direccion, setDireccion] = useState<"COMPRA" | "VENTA">("COMPRA")
  const [nuevoPago, setNuevoPago] = useState(false)

  useEffect(() => {
    if (!terceroId && terceros.data && terceros.data.length > 0) {
      setTerceroId(terceros.data[0].id)
    }
  }, [terceroId, terceros.data])

  const { data, loading, error, reload } = useApiData<CuentaCorriente>(
    terceroId
      ? `/pagos/cuenta-corriente?terceroId=${encodeURIComponent(terceroId)}&direccion=${direccion}`
      : null,
  )

  const tercero = useMemo(
    () => terceros.data?.find((t) => t.id === terceroId),
    [terceros.data, terceroId],
  )

  const totalDebe = (data?.movimientos ?? []).reduce((acc, m) => acc + num(m.debe), 0)
  const totalHaber = (data?.movimientos ?? []).reduce((acc, m) => acc + num(m.haber), 0)

  return (
    <div className="content">
      <PageHeader
        eyebrow="FINANZAS"
        title="Cuentas corrientes"
        subtitle="Saldos y movimientos de clientes y proveedores"
      />
      <div className="account-selector">
        <div className="entity-mark">
          {(tercero?.nombre ?? "CC")
            .split(" ")
            .slice(0, 2)
            .map((x) => x[0])
            .join("")
            .toUpperCase()}
        </div>
        <div>
          <span>{direccion === "COMPRA" ? "PROVEEDOR SELECCIONADO" : "CLIENTE SELECCIONADO"}</span>
          <strong>{tercero?.nombre ?? "Seleccioná un tercero"}</strong>
          <small>CUIT {tercero?.cuit ?? "—"}</small>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="selectlike"
            onClick={() => setDireccion(direccion === "COMPRA" ? "VENTA" : "COMPRA")}
          >
            {direccion === "COMPRA" ? "Compras (a pagar)" : "Ventas (a cobrar)"} <span>⌄</span>
          </button>
          <select
            className="selectlike"
            value={terceroId}
            onChange={(e) => setTerceroId(e.target.value)}
          >
            {(terceros.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="account-balance">
        <div>
          <span>Saldo actual</span>
          <strong>{money(data?.saldo ?? 0)}</strong>
          <small>{direccion === "COMPRA" ? "Saldo a pagar" : "Saldo a cobrar"}</small>
        </div>
        <div>
          <span>Movimientos</span>
          <strong>{data?.movimientos.length ?? 0}</strong>
          <small>Débitos y créditos del período</small>
        </div>
        <div>
          <span>Último movimiento</span>
          <strong>{data?.movimientos.length ? fecha(data.movimientos[data.movimientos.length - 1].fecha) : "—"}</strong>
          <small>{data?.movimientos.length ? data.movimientos[data.movimientos.length - 1].comprobante : "Sin movimientos"}</small>
        </div>
        <div className="account-actions">
          <Button variant="secondary" icon="download" onClick={() => window.print()}>
            Exportar extracto
          </Button>
          <Button icon="plus" onClick={() => setNuevoPago(true)}>
            Registrar pago
          </Button>
        </div>
      </div>
      <div className="ledger">
        <div className="ledger-head">
          <div>
            <h2>Extracto de movimientos</h2>
            <p>Facturas, notas y pagos del tercero</p>
          </div>
          <div className="ledger-legend">
            <span>
              <i className="debit" />
              Débitos
            </span>
            <span>
              <i className="credit" />
              Créditos
            </span>
          </div>
        </div>
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>COMPROBANTE</th>
                  <th>CONCEPTO</th>
                  <th className="right">DÉBITO</th>
                  <th className="right">CRÉDITO</th>
                  <th className="right">SALDO</th>
                </tr>
              </thead>
              <tbody>
                {(data?.movimientos ?? []).map((m, i) => (
                  <tr key={`${m.comprobante}-${i}`}>
                    <td>{fecha(m.fecha)}</td>
                    <td>
                      <strong>{m.comprobante}</strong>
                    </td>
                    <td>{m.comprobante.startsWith("OP") ? "Pago" : m.comprobante.startsWith("RC") ? "Cobro" : "Comprobante"}</td>
                    <td className="right debit-value">{num(m.debe) ? money(m.debe) : "—"}</td>
                    <td className="right credit-value">{num(m.haber) ? money(m.haber) : "—"}</td>
                    <td className="right amount">{money(m.saldo)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>SALDOS DEL PERÍODO</td>
                  <td className="right">{money(totalDebe)}</td>
                  <td className="right">{money(totalHaber)}</td>
                  <td className="right">{money(data?.saldo ?? 0)}</td>
                </tr>
              </tfoot>
            </table>
            {(data?.movimientos ?? []).length === 0 && (
              <p className="table-empty">El tercero no tiene movimientos en esta cuenta.</p>
            )}
          </div>
        )}
        <Pagination total={`Mostrando ${data?.movimientos.length ?? 0} movimientos`} />
      </div>
      <p className="hint" style={{ marginTop: 8 }}>
        <Icon name="warning" size={13} /> El extracto incluye facturas, notas de crédito y pagos del tercero.
      </p>
      {nuevoPago && (
        <PagoForm
          onClose={() => setNuevoPago(false)}
          onDone={() => {
            setNuevoPago(false)
            void reload()
          }}
        />
      )}
    </div>
  )
}
