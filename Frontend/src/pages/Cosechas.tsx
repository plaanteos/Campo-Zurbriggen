import { useMemo, useState } from "react"
import { apiPatch } from "../lib/api"
import type { Cosecha } from "../lib/types"
import { useApiData } from "../lib/useApiData"
import { ETIQUETA_CULTIVO, ETIQUETA_ESTADO_CARGA, fecha, kg, num, tn } from "../lib/format"
import {
  Badge,
  Button,
  ErrorState,
  Filters,
  Icon,
  Loading,
  PageHeader,
  Pagination,
} from "../components/ui"
import { CosechaForm } from "../components/forms"

export function Cosechas() {
  const { data, loading, error, reload } = useApiData<Cosecha[]>("/cosechas")
  const [busqueda, setBusqueda] = useState("")
  const [nueva, setNueva] = useState(false)
  const [entregando, setEntregando] = useState<string | null>(null)

  const cargas = useMemo(
    () =>
      (data ?? []).filter((c) =>
        `${c.camion.patente} ${c.transportista?.nombre ?? ""} ${c.destino?.nombre ?? ""} ${c.loteCampania?.lote.nombre ?? ""}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()),
      ),
    [data, busqueda],
  )

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const delMes = cargas.filter((c) => new Date(c.fecha) >= inicioMes)
  const volumen = cargas.reduce((acc, c) => acc + num(c.kg), 0)
  const enTransito = cargas.filter((c) => c.estado === "EN_TRANSITO").length
  const entregadas = cargas.filter((c) => c.estado === "ENTREGADA").length

  const entregar = async (id: string) => {
    setEntregando(id)
    try {
      await apiPatch(`/cosechas/${id}/entregar`, {})
      await reload()
    } finally {
      setEntregando(null)
    }
  }

  return (
    <div className="content">
      <PageHeader
        eyebrow="OPERACIONES"
        title="Cosechas, cargas y entregas"
        subtitle="Seguimiento operativo de movimientos de cereal"
        action="Registrar carga"
        onAction={() => setNueva(true)}
      />
      <div className="operation-band">
        <div>
          <span>Cargas este mes</span>
          <strong>{delMes.length}</strong>
        </div>
        <div>
          <span>Volumen transportado</span>
          <strong>{tn(volumen)}</strong>
        </div>
        <div>
          <span>En tránsito</span>
          <strong>{enTransito} cargas</strong>
        </div>
        <div>
          <span>Entregadas</span>
          <strong>{entregadas} cargas</strong>
        </div>
        <div className="band-action">
          <Icon name="truck" size={30} />
          <span>
            Última carga registrada
            <strong>{cargas[0] ? fecha(cargas[0].fecha) : "—"}</strong>
          </span>
        </div>
      </div>
      <div className="table-panel">
        <Filters search="Buscar patente, transportista o destino..." value={busqueda} onChange={setBusqueda} />
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
                  <th>ORIGEN</th>
                  <th>CULTIVO</th>
                  <th>PATENTE</th>
                  <th>TRANSPORTISTA</th>
                  <th className="right">CANTIDAD</th>
                  <th>DESTINO</th>
                  <th>ESTADO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cargas.map((c) => (
                  <tr key={c.id}>
                    <td>{fecha(c.fecha)}</td>
                    <td>
                      <strong>
                        {c.loteCampania.lote.establecimiento.nombre} · {c.loteCampania.lote.nombre}
                      </strong>
                      <small>Campaña {c.loteCampania.campania.nombre}</small>
                    </td>
                    <td>
                      <span className={`crop-dot ${c.loteCampania.cultivo.toLowerCase()}`} />
                      {ETIQUETA_CULTIVO[c.loteCampania.cultivo] ?? c.loteCampania.cultivo}
                    </td>
                    <td>
                      <span className="plate">{c.camion.patente}</span>
                    </td>
                    <td>{c.transportista?.nombre ?? "—"}</td>
                    <td className="right amount">{kg(c.kg)}</td>
                    <td>{c.destino?.nombre ?? "—"}</td>
                    <td>
                      <Badge tone={c.estado === "ENTREGADA" ? "success" : "info"}>
                        {ETIQUETA_ESTADO_CARGA[c.estado]}
                      </Badge>
                    </td>
                    <td>
                      {c.estado === "EN_TRANSITO" ? (
                        <Button
                          variant="ghost"
                          onClick={() => void entregar(c.id)}
                          disabled={entregando === c.id}
                        >
                          {entregando === c.id ? "..." : "Entregar"}
                        </Button>
                      ) : (
                        <button className="icon-button">
                          <Icon name="more" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cargas.length === 0 && <p className="table-empty">No hay cargas registradas.</p>}
          </div>
        )}
        <Pagination total={`Mostrando ${cargas.length} movimientos`} />
      </div>
      {nueva && (
        <CosechaForm
          onClose={() => setNueva(false)}
          onDone={() => {
            setNueva(false)
            void reload()
          }}
        />
      )}
    </div>
  )
}
