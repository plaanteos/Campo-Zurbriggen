import { useMemo, useState } from "react"
import type { Remito } from "../lib/types"
import { useApiData } from "../lib/useApiData"
import { ETIQUETA_ESTADO_REMITO, fecha, money, num } from "../lib/format"
import {
  Badge,
  ErrorState,
  Filters,
  Icon,
  Loading,
  PageHeader,
  Pagination,
  type BadgeTone,
} from "../components/ui"
import { RemitoForm } from "../components/forms"

const TONO: Record<string, BadgeTone> = {
  PENDIENTE_FACTURA: "warning",
  FACTURADO: "success",
  ANULADO: "neutral",
}

const TIPO: Record<string, string> = {
  COMPRA: "Compra",
  ENTREGA: "Entrega",
  TRASLADO: "Traslado",
}

export function Remitos() {
  const { data, loading, error, reload } = useApiData<Remito[]>("/remitos")
  const [busqueda, setBusqueda] = useState("")
  const [nuevo, setNuevo] = useState(false)

  const remitos = useMemo(
    () =>
      (data ?? []).filter((r) =>
        `${r.numero} ${r.tercero?.nombre ?? ""} ${r.tercero?.cuit ?? ""}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()),
      ),
    [data, busqueda],
  )

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const delMes = remitos.filter((r) => new Date(r.fecha) >= inicioMes).length
  const sinFacturar = remitos.filter((r) => r.estado === "PENDIENTE_FACTURA").length
  const facturados = remitos.filter((r) => r.estado === "FACTURADO").length
  const montoPendiente = remitos
    .filter((r) => r.estado === "PENDIENTE_FACTURA")
    .reduce((acc, r) => acc + num(r.importe), 0)

  return (
    <div className="content">
      <PageHeader
        eyebrow="ADMINISTRACIÓN"
        title="Remitos"
        subtitle="Comprobantes de compra, entrega y traslado"
        action="Nuevo remito"
        onAction={() => setNuevo(true)}
      />
      <div className="summary-line compact-summary">
        <div>
          <span>Remitos del mes</span>
          <strong>{delMes}</strong>
        </div>
        <div>
          <span>Sin facturar</span>
          <strong>{sinFacturar}</strong>
        </div>
        <div>
          <span>Facturados</span>
          <strong>{facturados}</strong>
        </div>
        <div>
          <span>Monto sin facturar</span>
          <strong>{money(montoPendiente)}</strong>
        </div>
      </div>
      <div className="table-panel">
        <Filters
          search="Buscar número, proveedor o CUIT..."
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
                  <th>NÚMERO</th>
                  <th>FECHA</th>
                  <th>TIPO</th>
                  <th>PROVEEDOR / DESTINO</th>
                  <th className="right">IMPORTE</th>
                  <th>ESTADO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {remitos.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.numero}</strong>
                    </td>
                    <td>{fecha(r.fecha)}</td>
                    <td>{TIPO[r.tipo]}</td>
                    <td>
                      <strong className="regular">{r.tercero?.nombre ?? "—"}</strong>
                      <small>{r.tercero?.cuit}</small>
                    </td>
                    <td className="right amount">{money(r.importe)}</td>
                    <td>
                      <Badge tone={TONO[r.estado]}>{ETIQUETA_ESTADO_REMITO[r.estado]}</Badge>
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
            {remitos.length === 0 && <p className="table-empty">No hay remitos para mostrar.</p>}
          </div>
        )}
        <Pagination total={`Mostrando ${remitos.length} remitos`} />
      </div>
      {nuevo && (
        <RemitoForm
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
