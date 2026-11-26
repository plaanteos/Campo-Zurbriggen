import { useMemo, useState } from "react"
import type { Pago } from "../lib/types"
import { useApiData } from "../lib/useApiData"
import { ETIQUETA_MEDIO, fecha, money, num } from "../lib/format"
import {
  Badge,
  ErrorState,
  Filters,
  Icon,
  Loading,
  PageHeader,
  Pagination,
} from "../components/ui"
import { PagoForm } from "../components/forms"

export function Pagos() {
  const { data, loading, error, reload } = useApiData<Pago[]>("/pagos")
  const [busqueda, setBusqueda] = useState("")
  const [nuevo, setNuevo] = useState(false)

  const pagos = useMemo(
    () =>
      (data ?? []).filter((p) =>
        `${p.numero} ${p.tercero.nombre} ${p.medio}`.toLowerCase().includes(busqueda.toLowerCase()),
      ),
    [data, busqueda],
  )

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const delMes = pagos.filter((p) => new Date(p.fecha) >= inicioMes)
  const emitidos = delMes.filter((p) => p.sentido === "EMITIDO").reduce((a, p) => a + num(p.monto), 0)
  const recibidos = delMes.filter((p) => p.sentido === "RECIBIDO").reduce((a, p) => a + num(p.monto), 0)
  const conCheques = pagos.filter((p) => p.cheques.length > 0).length

  return (
    <div className="content">
      <PageHeader
        eyebrow="FINANZAS"
        title="Pagos y cobranzas"
        subtitle="Aplicación de operaciones a facturas y cuentas corrientes"
        action="Registrar operación"
        onAction={() => setNuevo(true)}
      />
      <div className="summary-line compact-summary">
        <div>
          <span>Pagos del mes</span>
          <strong>{money(emitidos)}</strong>
        </div>
        <div>
          <span>Cobranzas del mes</span>
          <strong>{money(recibidos)}</strong>
        </div>
        <div>
          <span>Operaciones</span>
          <strong>{delMes.length}</strong>
        </div>
        <div>
          <span>Con cheques</span>
          <strong>{conCheques}</strong>
        </div>
      </div>
      <div className="table-panel">
        <Filters
          search="Buscar número, tercero o medio..."
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
                  <th>FECHA</th>
                  <th>OPERACIÓN</th>
                  <th>TERCERO</th>
                  <th>MEDIO</th>
                  <th>COMPROBANTES</th>
                  <th className="right">IMPORTE</th>
                  <th>ESTADO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td>{fecha(p.fecha)}</td>
                    <td>
                      <strong>{p.numero}</strong>
                      <small>{p.sentido === "EMITIDO" ? "Pago" : "Cobro"}</small>
                    </td>
                    <td>
                      <strong className="regular">{p.tercero.nombre}</strong>
                    </td>
                    <td>{ETIQUETA_MEDIO[p.medio]}</td>
                    <td>
                      {p.imputaciones.length === 1
                        ? `${p.imputaciones[0].factura.clase === "FACTURA" ? "FAC" : "ND"}-${p.imputaciones[0].factura.tipo} ${p.imputaciones[0].factura.numero}`
                        : `${p.imputaciones.length} facturas`}
                    </td>
                    <td className="right amount">{money(p.monto)}</td>
                    <td>
                      <Badge tone="success">Aplicado</Badge>
                    </td>
                    <td>
                      <button className="icon-button">
                        <Icon name="more" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagos.length === 0 && <p className="table-empty">No hay pagos para mostrar.</p>}
          </div>
        )}
        <Pagination total={`Mostrando ${pagos.length} operaciones`} />
      </div>
      {nuevo && (
        <PagoForm
          onClose={() => setNuevo(false)}
          onDone={() => {
            setNuevo(false)
            void reload()
          }}
        />
      )}
    </div>
  )
}
