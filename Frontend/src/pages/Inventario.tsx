import { useMemo, useState } from "react"
import type { Insumo, MovimientoInsumo, StockCereal } from "../lib/types"
import { useApiData } from "../lib/useApiData"
import { ETIQUETA_CATEGORIA, ETIQUETA_CULTIVO, fecha, kg, numero, tn } from "../lib/format"
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
import { Modal } from "../components/Modal"
import { InsumoForm, MovimientoCerealForm, MovimientoInsumoForm } from "../components/forms"

function estadoStock(stock: number): { label: string; tone: BadgeTone } {
  if (stock <= 0) return { label: "Reponer", tone: "danger" }
  if (stock < 200) return { label: "Stock bajo", tone: "warning" }
  return { label: "Stock normal", tone: "success" }
}

function HistorialInsumos({ onClose }: { onClose: () => void }) {
  const { data, loading, error } = useApiData<(MovimientoInsumo & { insumo: { nombre: string; unidad: string } })[]>(
    "/insumos/movimientos",
  )
  return (
    <Modal title="Historial de movimientos" eyebrow="STOCK" onClose={onClose} wide>
      <div className="table-scroll">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>FECHA</th>
                <th>INSUMO</th>
                <th>TIPO</th>
                <th className="right">CANTIDAD</th>
                <th>DEPÓSITO</th>
                <th>REFERENCIA</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((m) => (
                <tr key={m.id}>
                  <td>{fecha(m.fecha)}</td>
                  <td>
                    <strong>{m.insumo.nombre}</strong>
                  </td>
                  <td>{m.tipo}</td>
                  <td className="right amount">
                    {numero(m.cantidad, 0)} {m.insumo.unidad}
                  </td>
                  <td>{m.deposito}</td>
                  <td>{m.referencia ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {(data ?? []).length === 0 && !loading && <p className="table-empty">Sin movimientos.</p>}
      </div>
    </Modal>
  )
}

export function Inventario({ cereal = false }: { cereal?: boolean }) {
  const insumos = useApiData<Insumo[]>(cereal ? null : "/insumos")
  const stock = useApiData<StockCereal>(cereal ? "/cereal/stock" : null)
  const [busqueda, setBusqueda] = useState("")
  const [nuevo, setNuevo] = useState(false)
  const [movimiento, setMovimiento] = useState<Insumo | null>(null)
  const [historial, setHistorial] = useState(false)

  const insumosFiltrados = useMemo(
    () =>
      (insumos.data ?? []).filter((i) =>
        `${i.nombre} ${ETIQUETA_CATEGORIA[i.categoria]} ${i.deposito ?? ""}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()),
      ),
    [insumos.data, busqueda],
  )

  const cultivos = useMemo(
    () =>
      (stock.data?.porCultivo ?? []).filter((c) =>
        `${ETIQUETA_CULTIVO[c.cultivo] ?? c.cultivo}`.toLowerCase().includes(busqueda.toLowerCase()),
      ),
    [stock.data, busqueda],
  )

  const totalStock = Number(stock.data?.totalKg ?? 0) / 1000
  const normal = (insumos.data ?? []).filter((i) => Number(i.stock) >= 200).length
  const bajo = (insumos.data ?? []).filter((i) => Number(i.stock) > 0 && Number(i.stock) < 200).length
  const reponer = (insumos.data ?? []).filter((i) => Number(i.stock) <= 0).length

  return (
    <div className="content">
      <PageHeader
        eyebrow="STOCK"
        title={cereal ? "Stock de cereal" : "Inventario de insumos"}
        subtitle={
          cereal
            ? "Existencias disponibles, comprometidas y entregadas por ubicación"
            : "Control de existencias y trazabilidad de movimientos"
        }
        action={cereal ? "Registrar movimiento" : "Nuevo insumo"}
        onAction={() => setNuevo(true)}
      />
      <div className="inventory-layout">
        <aside className="inventory-aside">
          <h3>{cereal ? "Resumen por cultivo" : "Estado del inventario"}</h3>
          <div className="donut">
            <div>
              <strong>{cereal ? numero(totalStock, 0) : `${insumos.data?.length ?? 0}`}</strong>
              <span>{cereal ? "tn totales" : "insumos"}</span>
            </div>
          </div>
          <ul>
            {cereal ? (
              cultivos.slice(0, 5).map((c) => (
                <li key={c.cultivo}>
                  <i className="green" />
                  {ETIQUETA_CULTIVO[c.cultivo] ?? c.cultivo} <b>{tn(c.stockKg)}</b>
                </li>
              ))
            ) : (
              <>
                <li>
                  <i className="green" />
                  Stock normal <b>{normal}</b>
                </li>
                <li>
                  <i className="amber" />
                  Stock bajo <b>{bajo}</b>
                </li>
                <li>
                  <i className="red" />
                  Reponer urgente <b>{reponer}</b>
                </li>
              </>
            )}
          </ul>
          {!cereal && (
            <button className="full-link" onClick={() => setHistorial(true)}>
              Ver historial de movimientos <Icon name="arrow" size={14} />
            </button>
          )}
        </aside>
        <div className="table-panel inventory-table">
          <Filters
            search={cereal ? "Buscar cultivo..." : "Buscar insumo, categoría o depósito..."}
            extra={false}
            value={busqueda}
            onChange={setBusqueda}
          />
          {cereal ? (
            stock.loading && !stock.data ? (
              <Loading />
            ) : stock.error ? (
              <ErrorState error={stock.error} onRetry={stock.reload} />
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>CULTIVO</th>
                      <th className="right">INGRESOS</th>
                      <th className="right">EGRESOS</th>
                      <th className="right">EXISTENCIA</th>
                      <th>ESTADO</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cultivos.map((c) => (
                      <tr key={c.cultivo}>
                        <td>
                          <strong>{ETIQUETA_CULTIVO[c.cultivo] ?? c.cultivo}</strong>
                        </td>
                        <td className="right amount">{kg(c.ingresosKg)}</td>
                        <td className="right amount">{kg(c.egresosKg)}</td>
                        <td className="right amount">{kg(c.stockKg)}</td>
                        <td>
                          <Badge tone={Number(c.stockKg) > 0 ? "success" : "danger"}>
                            {Number(c.stockKg) > 0 ? "Disponible" : "Sin stock"}
                          </Badge>
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
                {cultivos.length === 0 && <p className="table-empty">No hay movimientos de cereal.</p>}
              </div>
            )
          ) : insumos.loading && !insumos.data ? (
            <Loading />
          ) : insumos.error ? (
            <ErrorState error={insumos.error} onRetry={insumos.reload} />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>INSUMO</th>
                    <th>CATEGORÍA</th>
                    <th>UBICACIÓN</th>
                    <th className="right">EXISTENCIA</th>
                    <th className="right">MOVIMIENTOS</th>
                    <th>ESTADO</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {insumosFiltrados.map((i) => {
                    const est = estadoStock(Number(i.stock))
                    return (
                      <tr key={i.id}>
                        <td>
                          <strong>{i.nombre}</strong>
                        </td>
                        <td>{ETIQUETA_CATEGORIA[i.categoria]}</td>
                        <td>{i.deposito ?? "—"}</td>
                        <td className="right amount">
                          {numero(i.stock, 0)} {i.unidad}
                        </td>
                        <td className="right">{i.movimientos.length}</td>
                        <td>
                          <Badge tone={est.tone}>{est.label}</Badge>
                        </td>
                        <td>
                          <button
                            className="icon-button"
                            title="Registrar movimiento"
                            onClick={() => setMovimiento(i)}
                          >
                            <Icon name="plus" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {insumosFiltrados.length === 0 && <p className="table-empty">No hay insumos cargados.</p>}
            </div>
          )}
          <Pagination
            total={`Mostrando ${cereal ? cultivos.length : insumosFiltrados.length} registros`}
          />
        </div>
      </div>
      {nuevo && !cereal && (
        <InsumoForm
          onClose={() => setNuevo(false)}
          onDone={() => {
            setNuevo(false)
            void insumos.reload()
          }}
        />
      )}
      {nuevo && cereal && (
        <MovimientoCerealForm
          onClose={() => setNuevo(false)}
          onDone={() => {
            setNuevo(false)
            void stock.reload()
          }}
        />
      )}
      {movimiento && (
        <MovimientoInsumoForm
          insumoId={movimiento.id}
          insumoNombre={movimiento.nombre}
          onClose={() => setMovimiento(null)}
          onDone={() => {
            setMovimiento(null)
            void insumos.reload()
          }}
        />
      )}
      {historial && <HistorialInsumos onClose={() => setHistorial(false)} />}
    </div>
  )
}
