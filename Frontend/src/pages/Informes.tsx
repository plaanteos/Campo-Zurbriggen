import type { Dashboard } from "../lib/types"
import { useApiData } from "../lib/useApiData"
import { money } from "../lib/format"
import { ErrorState, Loading, PageHeader } from "../components/ui"

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
        <p className="hint">La exportación de informes todavía no está disponible.</p>
      )}
    </div>
  )
}
