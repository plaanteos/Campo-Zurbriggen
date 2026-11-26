import { useMemo, useState } from "react"
import type { Servicio } from "../lib/types"
import { useApiData } from "../lib/useApiData"
import { ETIQUETA_CULTIVO, ETIQUETA_ESTADO_SERVICIO, fecha, money, num, numero } from "../lib/format"
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
import { ServicioForm } from "../components/forms"

const TONO: Record<string, BadgeTone> = {
  PENDIENTE: "warning",
  EN_EJECUCION: "info",
  FINALIZADO: "success",
}

export function Servicios() {
  const { data, loading, error, reload } = useApiData<Servicio[]>("/servicios")
  const [busqueda, setBusqueda] = useState("")
  const [nuevo, setNuevo] = useState(false)

  const servicios = useMemo(
    () =>
      (data ?? []).filter((s) =>
        `${s.labor} ${s.loteCampania?.lote.establecimiento.nombre ?? ""} ${s.tercero?.nombre ?? ""}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()),
      ),
    [data, busqueda],
  )

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const delMes = servicios.filter((s) => new Date(s.fecha) >= inicioMes)
  const costoTotal = servicios.reduce((acc, s) => acc + num(s.costo), 0)
  const superficie = servicios.reduce(
    (acc, s) => acc + num(s.loteCampania?.sembradoHa ?? 0),
    0,
  )

  return (
    <div className="content">
      <PageHeader
        eyebrow="OPERACIONES"
        title="Servicios agropecuarios"
        subtitle="Planificación y control de labores propias y contratadas"
        action="Nuevo servicio"
        onAction={() => setNuevo(true)}
      />
      <div className="summary-line compact-summary">
        <div>
          <span>Trabajos del mes</span>
          <strong>{delMes.length}</strong>
        </div>
        <div>
          <span>Costo acumulado</span>
          <strong>{money(costoTotal)}</strong>
        </div>
        <div>
          <span>En ejecución</span>
          <strong>{servicios.filter((s) => s.estado === "EN_EJECUCION").length}</strong>
        </div>
        <div>
          <span>Superficie intervenida</span>
          <strong>{numero(superficie, 0)} ha</strong>
        </div>
      </div>
      <div className="table-panel">
        <Filters search="Buscar labor, campo o proveedor..." value={busqueda} onChange={setBusqueda} />
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
                  <th>LABOR</th>
                  <th>CAMPO / LOTE</th>
                  <th>PROVEEDOR</th>
                  <th className="right">SUPERFICIE</th>
                  <th className="right">COSTO</th>
                  <th>TIPO</th>
                  <th>ESTADO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((s) => (
                  <tr key={s.id}>
                    <td>{fecha(s.fecha)}</td>
                    <td>
                      <strong>{s.labor}</strong>
                    </td>
                    <td>
                      {s.loteCampania
                        ? `${s.loteCampania.lote.establecimiento.nombre} · ${s.loteCampania.lote.nombre}`
                        : "Sin asignar"}
                      {s.loteCampania && (
                        <small>{ETIQUETA_CULTIVO[s.loteCampania.cultivo] ?? s.loteCampania.cultivo}</small>
                      )}
                    </td>
                    <td>{s.tercero?.nombre ?? "Equipo propio"}</td>
                    <td className="right amount">
                      {s.loteCampania ? `${numero(s.loteCampania.sembradoHa, 0)} ha` : "—"}
                    </td>
                    <td className="right amount">{money(s.costo)}</td>
                    <td>{s.tipo === "PROPIO" ? "Propio" : "Contratado"}</td>
                    <td>
                      <Badge tone={TONO[s.estado]}>{ETIQUETA_ESTADO_SERVICIO[s.estado]}</Badge>
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
            {servicios.length === 0 && <p className="table-empty">No hay servicios registrados.</p>}
          </div>
        )}
        <Pagination total={`Mostrando ${servicios.length} servicios`} />
      </div>
      {nuevo && (
        <ServicioForm
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
