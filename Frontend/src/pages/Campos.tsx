import { useEffect, useMemo, useState } from "react"
import type { Establecimiento } from "../lib/types"
import { useApiData } from "../lib/useApiData"
import { ETIQUETA_CULTIVO, numero } from "../lib/format"
import { Badge, Button, ErrorState, Icon, Loading, PageHeader } from "../components/ui"
import { EstablecimientoForm, LoteForm } from "../components/forms"

export function Campos() {
  const { data, loading, error, reload } = useApiData<Establecimiento[]>("/campos/establecimientos")
  const [selected, setSelected] = useState(0)
  const [nuevo, setNuevo] = useState(false)
  const [nuevoLote, setNuevoLote] = useState(false)

  useEffect(() => {
    if (selected >= (data?.length ?? 0)) setSelected(0)
  }, [data, selected])

  const establecimientos = data ?? []
  const f = establecimientos[selected]

  const totalHa = useMemo(
    () => establecimientos.reduce((acc, e) => acc + Number(e.hectareas), 0),
    [establecimientos],
  )

  const lotes = f?.lotes ?? []
  const superficies = lotes.reduce((acc, l) => acc + Number(l.hectareas), 0)
  const implantada = lotes.reduce(
    (acc, l) => acc + (l.campanias ?? []).reduce((a, c) => a + Number(c.sembradoHa), 0),
    0,
  )
  const campania = lotes.flatMap((l) => l.campanias ?? [])[0]?.campania.nombre

  if (loading && !data) return <div className="content"><Loading /></div>
  if (error) return <div className="content"><ErrorState error={error} onRetry={reload} /></div>

  return (
    <div className="content">
      <PageHeader
        eyebrow="OPERACIONES"
        title="Campos, lotes y campañas"
        subtitle="Administración territorial y planificación agrícola"
        action="Nuevo campo"
        onAction={() => setNuevo(true)}
      />
      <div className="fields-layout">
        <div className="field-list">
          <div className="field-list-head">
            <strong>Establecimientos</strong>
            <span>
              {establecimientos.length} campos · {numero(totalHa, 0)} ha
            </span>
          </div>
          {establecimientos.map((x, i) => (
            <button
              key={x.id}
              className={`field-card ${selected === i ? "active" : ""}`}
              onClick={() => setSelected(i)}
            >
              <div className="field-thumb">
                <Icon name="map" size={24} />
              </div>
              <div>
                <strong>{x.nombre}</strong>
                <span>{x.localidad}</span>
                <small>
                  {numero(x.hectareas, 0)} ha · {x.lotes.length} lotes
                </small>
              </div>
              <Icon name="arrow" size={16} />
            </button>
          ))}
          {establecimientos.length === 0 && <p className="hint">Todavía no hay campos cargados.</p>}
        </div>
        <section className="field-detail">
          {f ? (
            <>
              <div className="field-hero">
                <div>
                  <div className="eyebrow">FICHA DEL ESTABLECIMIENTO</div>
                  <h2>{f.nombre}</h2>
                  <p>{f.localidad}</p>
                </div>
                <Button variant="secondary" onClick={() => setNuevoLote(true)}>
                  Asociar lote
                </Button>
              </div>
              <div className="field-stats">
                <div>
                  <span>Superficie total</span>
                  <strong>{numero(f.hectareas, 0)} ha</strong>
                </div>
                <div>
                  <span>Superficie implantada</span>
                  <strong>{numero(implantada, 0)} ha</strong>
                </div>
                <div>
                  <span>Lotes activos</span>
                  <strong>{lotes.length}</strong>
                </div>
                <div>
                  <span>Campaña</span>
                  <strong>{campania ?? "—"}</strong>
                </div>
              </div>
              <div className="detail-section-head">
                <div>
                  <h3>Lotes y cultivos</h3>
                  <p>{campania ? `Campaña agrícola ${campania}` : "Sin campaña asignada"}</p>
                </div>
                <Button variant="secondary" icon="plus" onClick={() => setNuevoLote(true)}>
                  Asociar lote
                </Button>
              </div>
              <div className="lot-grid">
                {lotes.map((l) => {
                  const siembra = (l.campanias ?? [])[0]
                  return (
                    <div className="lot" key={l.id}>
                      <div>
                        <strong>{l.nombre}</strong>
                        <Badge tone="success">
                          {siembra ? ETIQUETA_CULTIVO[siembra.cultivo] ?? siembra.cultivo : "Sin cultivo"}
                        </Badge>
                      </div>
                      <span>
                        Superficie <b>{numero(l.hectareas, 0)} ha</b>
                      </span>
                      <span>
                        Sembrado <b>{siembra ? `${numero(siembra.sembradoHa, 0)} ha` : "—"}</b>
                      </span>
                      <div className="progress">
                        <i
                          style={{
                            width: `${
                              Number(l.hectareas) > 0 && siembra
                                ? Math.min(100, (Number(siembra.sembradoHa) / Number(l.hectareas)) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
                {lotes.length === 0 && <p className="hint">El establecimiento no tiene lotes.</p>}
              </div>
              <p className="hint">
                Superficie de lotes: {numero(superficies, 0)} ha · Implantada: {numero(implantada, 0)} ha
              </p>
            </>
          ) : (
            <p className="hint">Seleccioná o creá un establecimiento para ver el detalle.</p>
          )}
        </section>
      </div>
      {nuevo && (
        <EstablecimientoForm
          onClose={() => setNuevo(false)}
          onDone={() => {
            setNuevo(false)
            void reload()
          }}
        />
      )}
      {nuevoLote && f && (
        <LoteForm
          establecimientoId={f.id}
          onClose={() => setNuevoLote(false)}
          onDone={() => {
            setNuevoLote(false)
            void reload()
          }}
        />
      )}
    </div>
  )
}
