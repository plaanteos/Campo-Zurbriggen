import { useMemo, useState } from "react"
import type { Cheque } from "../lib/types"
import { useApiData } from "../lib/useApiData"
import { ETIQUETA_ESTADO_CHEQUE, fecha, money, num } from "../lib/format"
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
import { ChequeForm } from "../components/forms"

const TONO: Record<string, BadgeTone> = {
  EN_CARTERA: "warning",
  DEPOSITADO: "success",
  COBRADO: "success",
  RECHAZADO: "danger",
  ENTREGADO: "info",
  ANULADO: "neutral",
}

export function Cheques() {
  const { data, loading, error, reload } = useApiData<Cheque[]>("/cheques")
  const [busqueda, setBusqueda] = useState("")
  const [nuevo, setNuevo] = useState(false)

  const cheques = useMemo(
    () =>
      (data ?? []).filter((c) =>
        `${c.numero} ${c.banco} ${c.librador ?? ""}`.toLowerCase().includes(busqueda.toLowerCase()),
      ),
    [data, busqueda],
  )

  const suma = (estado: string) =>
    cheques.filter((c) => c.estado === estado).reduce((acc, c) => acc + num(c.importe), 0)

  const enCartera = suma("EN_CARTERA")
  const depositados = suma("DEPOSITADO")
  const rechazados = cheques.filter((c) => c.estado === "RECHAZADO").length
  const limite = new Date()
  limite.setDate(limite.getDate() + 15)
  const porVencer = cheques
    .filter((c) => c.estado === "EN_CARTERA" && new Date(c.fechaPago) <= limite)
    .reduce((acc, c) => acc + num(c.importe), 0)

  return (
    <div className="content">
      <PageHeader
        eyebrow="FINANZAS"
        title="Gestión de cheques"
        subtitle="Cheques propios y de terceros · cartera y vencimientos"
        action="Registrar cheque"
        onAction={() => setNuevo(true)}
      />
      <div className="summary-line compact-summary">
        <div>
          <span>En cartera</span>
          <strong>{money(enCartera)}</strong>
        </div>
        <div>
          <span>A vencer (15 días)</span>
          <strong>{money(porVencer)}</strong>
        </div>
        <div>
          <span>Depositados</span>
          <strong>{money(depositados)}</strong>
        </div>
        <div>
          <span>Rechazados</span>
          <strong>{rechazados}</strong>
        </div>
      </div>
      <div className="table-panel">
        <Filters search="Buscar número, banco o librador..." value={busqueda} onChange={setBusqueda} />
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
                  <th>BANCO</th>
                  <th>TITULAR</th>
                  <th>TIPO</th>
                  <th>EMISIÓN</th>
                  <th>VENCIMIENTO</th>
                  <th className="right">IMPORTE</th>
                  <th>ESTADO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cheques.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.numero}</strong>
                    </td>
                    <td>{c.banco}</td>
                    <td>{c.librador ?? c.pago?.tercero.nombre ?? "—"}</td>
                    <td>{c.tipo === "PROPIO" ? "Propio" : "Tercero"}</td>
                    <td>{fecha(c.fechaEmision)}</td>
                    <td>{fecha(c.fechaPago)}</td>
                    <td className="right amount">{money(c.importe)}</td>
                    <td>
                      <Badge tone={TONO[c.estado]}>{ETIQUETA_ESTADO_CHEQUE[c.estado]}</Badge>
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
            {cheques.length === 0 && <p className="table-empty">No hay cheques registrados.</p>}
          </div>
        )}
        <Pagination total={`Mostrando ${cheques.length} cheques`} />
      </div>
      {nuevo && (
        <ChequeForm
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
