import type { Dashboard } from "../lib/types"
import { useApiData } from "../lib/useApiData"
import { money, numero } from "../lib/format"
import { Badge, ErrorState, Loading, PageHeader, Pagination } from "../components/ui"

const REPORTES = [
  ["Ingresos y egresos", "Finanzas", "Período en curso", "Excel · PDF", "Disponible"],
  ["Costos por campaña", "Operaciones", "Campaña 2025/2026", "Excel", "Disponible"],
  ["Existencias de cereal", "Stock", "Al día de hoy", "PDF", "Disponible"],
  ["Cuentas por pagar", "Finanzas", "Próximos 30 días", "Excel · PDF", "Disponible"],
] as const

export function Informes() {
  const { data, loading, error, reload } = useApiData<Dashboard>("/dashboard")

  return (
    <div className="content">
      <PageHeader
        eyebrow="SISTEMA"
        title="Informes y reportes"
        subtitle="Análisis consolidado para gestión y auditoría"
      />
      <div className="summary-line">
        <div>
          <span>Cobranzas del mes</span>
          <strong>{money(data?.ingresosMes ?? 0)}</strong>
          <small>Pagos recibidos</small>
        </div>
        <div>
          <span>Pagos del mes</span>
          <strong>{money(data?.egresosMes ?? 0)}</strong>
          <small>Pagos emitidos</small>
        </div>
        <div>
          <span>Saldo a cobrar</span>
          <strong>{money(data?.porCobrar ?? 0)}</strong>
          <small>Facturas de venta</small>
        </div>
        <div>
          <span>Saldo a pagar</span>
          <strong>{money(data?.porPagar ?? 0)}</strong>
          <small>{data?.vencidas ?? 0} comprobantes vencidos</small>
        </div>
      </div>
      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <div className="table-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>INFORME</th>
                  <th>CATEGORÍA</th>
                  <th>PERÍODO</th>
                  <th>FORMATO</th>
                  <th>ESTADO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {REPORTES.map((r) => (
                  <tr key={r[0]}>
                    <td>
                      <strong>{r[0]}</strong>
                    </td>
                    <td>{r[1]}</td>
                    <td>{r[2]}</td>
                    <td>{r[3]}</td>
                    <td>
                      <Badge tone="success">{r[4]}</Badge>
                    </td>
                    <td>
                      <button className="btn secondary" onClick={() => window.print()}>
                        Exportar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={`Superficie implantada: ${numero(data?.superficieHa ?? 0, 0)} ha`} />
        </div>
      )}
    </div>
  )
}
