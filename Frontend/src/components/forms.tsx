import { useMemo, useState } from "react"
import { ApiError, apiPatch, apiPost } from "../lib/api"
import { ETIQUETA_CULTIVO, fechaInput, num } from "../lib/format"
import { useApiData } from "../lib/useApiData"
import type { Campania, Factura, LoteCampania, Tercero } from "../lib/types"
import { FormError, Modal } from "./Modal"
import { Button } from "./ui"

const hoy = () => new Date().toISOString().slice(0, 10)
const dec = (v: number | string, digits = 2) => num(v).toFixed(digits)
const limpiarMonto = (v: string) => v.replace(/\./g, "").replace(",", ".").trim()
const errorDe = (e: unknown) => (e instanceof ApiError ? e.message : "No se pudo guardar el registro")

function Footer({
  onClose,
  guardando,
  label = "Guardar registro",
}: {
  onClose: () => void
  guardando: boolean
  label?: string
}) {
  return (
    <>
      <span>* Campos obligatorios</span>
      <div>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" form="campo-form" disabled={guardando}>
          {guardando ? "Guardando..." : label}
        </Button>
      </div>
    </>
  )
}

export function RemitoForm({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const terceros = useApiData<Tercero[]>("/terceros")
  const [tipo, setTipo] = useState("COMPRA")
  const [numero, setNumero] = useState("")
  const [fecha, setFecha] = useState(hoy())
  const [terceroId, setTerceroId] = useState("")
  const [importe, setImporte] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      const [pv, nro] = numero.split("-")
      const normalizado = `${(pv ?? "").padStart(4, "0")}-${(nro ?? "").padStart(8, "0")}`
      await apiPost("/remitos", {
        tipo,
        numero: normalizado,
        fecha,
        terceroId,
        importe: dec(limpiarMonto(importe)),
      })
      onDone()
    } catch (err) {
      setError(errorDe(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal title="Nuevo remito" onClose={onClose} footer={<Footer onClose={onClose} guardando={guardando} />}>
      <form id="campo-form" className="form-section" onSubmit={guardar}>
        <h3>Datos del remito</h3>
        <div className="form-grid">
          <label>
            Tipo *
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="COMPRA">Compra</option>
              <option value="ENTREGA">Entrega</option>
              <option value="TRASLADO">Traslado</option>
            </select>
          </label>
          <label>
            Número *
            <input
              placeholder="0003-00008421"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
            />
          </label>
          <label>
            Fecha *
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </label>
          <label>
            Proveedor / destino *
            <select value={terceroId} onChange={(e) => setTerceroId(e.target.value)} required>
              <option value="">Seleccionar</option>
              {terceros.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="full">
            Importe *
            <input
              placeholder="0.00"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              required
            />
          </label>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

export function FacturaForm({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const terceros = useApiData<Tercero[]>("/terceros")
  const remitos = useApiData<import("../lib/types").Remito[]>("/remitos?pendientes=true")
  const [direccion, setDireccion] = useState("COMPRA")
  const [clase, setClase] = useState("FACTURA")
  const [tipo, setTipo] = useState("A")
  const [puntoVenta, setPuntoVenta] = useState("")
  const [numeroFactura, setNumeroFactura] = useState("")
  const [fecha, setFecha] = useState(hoy())
  const [vencimiento, setVencimiento] = useState("")
  const [terceroId, setTerceroId] = useState("")
  const [seleccion, setSeleccion] = useState<string[]>([])
  const [netoManual, setNetoManual] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const disponibles = useMemo(
    () => (remitos.data ?? []).filter((r) => !terceroId || r.terceroId === terceroId),
    [remitos.data, terceroId],
  )

  const neto = useMemo(() => {
    if (clase !== "FACTURA") return num(limpiarMonto(netoManual))
    return disponibles
      .filter((r) => seleccion.includes(r.id))
      .reduce((acc, r) => acc + num(r.importe), 0)
  }, [clase, disponibles, seleccion, netoManual])

  const iva = tipo === "A" && clase === "FACTURA" ? neto * 0.21 : 0

  const alternar = (id: string) => {
    setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await apiPost("/facturas", {
        direccion,
        clase,
        tipo,
        puntoVenta,
        numero: numeroFactura,
        fecha,
        vencimiento: vencimiento || undefined,
        terceroId,
        neto: dec(neto),
        iva: dec(iva),
        remitoIds: clase === "FACTURA" ? seleccion : [],
      })
      onDone()
    } catch (err) {
      setError(errorDe(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      title="Nueva factura"
      onClose={onClose}
      wide
      footer={<Footer onClose={onClose} guardando={guardando} />}
    >
      <form id="campo-form" className="form-section" onSubmit={guardar}>
        <h3>Comprobante</h3>
        <div className="form-grid">
          <label>
            Dirección *
            <select value={direccion} onChange={(e) => setDireccion(e.target.value)}>
              <option value="COMPRA">Compra (recibida)</option>
              <option value="VENTA">Venta (emitida)</option>
            </select>
          </label>
          <label>
            Clase *
            <select value={clase} onChange={(e) => setClase(e.target.value)}>
              <option value="FACTURA">Factura</option>
              <option value="NOTA_CREDITO">Nota de crédito</option>
              <option value="NOTA_DEBITO">Nota de débito</option>
            </select>
          </label>
          <label>
            Tipo *
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </label>
          <label>
            Punto de venta *
            <input
              placeholder="0004"
              value={puntoVenta}
              onChange={(e) => setPuntoVenta(e.target.value)}
              required
            />
          </label>
          <label>
            Número *
            <input
              placeholder="00001829"
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(e.target.value)}
              required
            />
          </label>
          <label>
            Fecha *
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </label>
          <label>
            Vencimiento
            <input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} />
          </label>
          <label>
            Proveedor / cliente *
            <select value={terceroId} onChange={(e) => setTerceroId(e.target.value)} required>
              <option value="">Seleccionar</option>
              {terceros.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        {clase === "FACTURA" && (
          <>
            <h3 style={{ marginTop: 18 }}>Remitos vinculados</h3>
            {!terceroId ? (
              <p className="hint">Seleccioná el proveedor para ver sus remitos pendientes.</p>
            ) : disponibles.length === 0 ? (
              <p className="hint">El tercero no tiene remitos pendientes de facturar.</p>
            ) : (
              <div className="check-list">
                {disponibles.map((r) => (
                  <label key={r.id}>
                    <input
                      type="checkbox"
                      checked={seleccion.includes(r.id)}
                      onChange={() => alternar(r.id)}
                    />
                    <span>
                      {r.numero} · {r.tipo} · {new Date(r.fecha).toLocaleDateString("es-AR")}
                    </span>
                    <b>${dec(r.importe)}</b>
                  </label>
                ))}
              </div>
            )}
          </>
        )}

        <h3 style={{ marginTop: 18 }}>Importes</h3>
        <div className="form-grid">
          <label>
            Neto *
            <input
              value={clase === "FACTURA" ? dec(neto) : netoManual}
              onChange={(e) => setNetoManual(e.target.value)}
              readOnly={clase === "FACTURA"}
              required
              className={clase === "FACTURA" ? "total-input" : ""}
            />
          </label>
          <label>
            IVA {tipo === "A" && clase === "FACTURA" ? "(21%)" : ""}
            <input value={dec(iva)} readOnly className="total-input" />
          </label>
          <label className="full">
            Total
            <input value={dec(neto + iva)} readOnly className="total-input" />
          </label>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

interface ChequeFormRow {
  banco: string
  numero: string
  importe: string
  fechaEmision: string
  fechaPago: string
  librador: string
}

export function PagoForm({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const terceros = useApiData<Tercero[]>("/terceros")
  const facturas = useApiData<Factura[]>("/facturas")
  const [sentido, setSentido] = useState<"EMITIDO" | "RECIBIDO">("EMITIDO")
  const [terceroId, setTerceroId] = useState("")
  const [fecha, setFecha] = useState(hoy())
  const [medio, setMedio] = useState<"EFECTIVO" | "TRANSFERENCIA" | "CHEQUES" | "MIXTO">("TRANSFERENCIA")
  const [observaciones, setObservaciones] = useState("")
  const [imputaciones, setImputaciones] = useState<Record<string, string>>({})
  const [cheques, setCheques] = useState<ChequeFormRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const candidatas = useMemo(() => {
    const direccion = sentido === "EMITIDO" ? "COMPRA" : "VENTA"
    return (facturas.data ?? []).filter(
      (f) =>
        f.terceroId === terceroId &&
        f.direccion === direccion &&
        f.estado !== "ANULADA" &&
        num(f.total) - num(f.pagado) > 0,
    )
  }, [facturas.data, sentido, terceroId])

  const monto = Object.values(imputaciones).reduce((acc, v) => acc + num(limpiarMonto(v)), 0)
  const sumaCheques = cheques.reduce((acc, c) => acc + num(limpiarMonto(c.importe)), 0)

  const alternar = (f: Factura) => {
    setImputaciones((prev) => {
      const copia = { ...prev }
      if (copia[f.id]) delete copia[f.id]
      else copia[f.id] = dec(num(f.total) - num(f.pagado))
      return copia
    })
  }

  const agregarCheque = () =>
    setCheques((c) => [
      ...c,
      { banco: "", numero: "", importe: "", fechaEmision: hoy(), fechaPago: hoy(), librador: "" },
    ])

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      if (monto <= 0) throw new Error("Seleccioná al menos una factura e indicá el monto a imputar")
      await apiPost("/pagos", {
        sentido,
        terceroId,
        fecha,
        medio,
        monto: dec(monto),
        observaciones: observaciones || undefined,
        imputaciones: Object.entries(imputaciones).map(([facturaId, valor]) => ({
          facturaId,
          monto: dec(limpiarMonto(valor)),
        })),
        cheques: cheques.map((c) => ({
          banco: c.banco,
          numero: c.numero,
          importe: dec(limpiarMonto(c.importe)),
          fechaEmision: c.fechaEmision,
          fechaPago: c.fechaPago,
          librador: c.librador || undefined,
        })),
      })
      onDone()
    } catch (err) {
      setError(errorDe(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      title="Registrar pago o cobro"
      onClose={onClose}
      wide
      footer={<Footer onClose={onClose} guardando={guardando} />}
    >
      <form id="campo-form" className="form-section" onSubmit={guardar}>
        <h3>Operación</h3>
        <div className="form-grid">
          <label>
            Sentido *
            <select
              value={sentido}
              onChange={(e) => {
                setSentido(e.target.value as "EMITIDO" | "RECIBIDO")
                setImputaciones({})
              }}
            >
              <option value="EMITIDO">Pago emitido (compras)</option>
              <option value="RECIBIDO">Cobro recibido (ventas)</option>
            </select>
          </label>
          <label>
            Tercero *
            <select
              value={terceroId}
              onChange={(e) => {
                setTerceroId(e.target.value)
                setImputaciones({})
              }}
              required
            >
              <option value="">Seleccionar</option>
              {terceros.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha *
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </label>
          <label>
            Medio *
            <select value={medio} onChange={(e) => setMedio(e.target.value as typeof medio)}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="CHEQUES">Cheques</option>
              <option value="MIXTO">Mixto</option>
            </select>
          </label>
          <label className="full">
            Observaciones
            <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </label>
        </div>

        <h3 style={{ marginTop: 18 }}>Facturas a imputar</h3>
        {!terceroId ? (
          <p className="hint">Seleccioná el tercero para ver sus facturas con saldo.</p>
        ) : candidatas.length === 0 ? (
          <p className="hint">No hay facturas con saldo pendiente para este tercero.</p>
        ) : (
          <div className="check-list">
            {candidatas.map((f) => (
              <label key={f.id}>
                <input
                  type="checkbox"
                  checked={Boolean(imputaciones[f.id])}
                  onChange={() => alternar(f)}
                />
                <span>
                  {f.clase === "FACTURA" ? "FAC" : f.clase === "NOTA_CREDITO" ? "NC" : "ND"}-{f.tipo}{" "}
                  {f.puntoVenta}-{f.numero} · saldo ${dec(num(f.total) - num(f.pagado))}
                </span>
                <input
                  className="inline-amount"
                  value={imputaciones[f.id] ?? ""}
                  onChange={(e) => setImputaciones((p) => ({ ...p, [f.id]: e.target.value }))}
                  disabled={!imputaciones[f.id]}
                  placeholder="0.00"
                />
              </label>
            ))}
          </div>
        )}

        {(medio === "CHEQUES" || medio === "MIXTO") && (
          <>
            <h3 style={{ marginTop: 18 }}>Cheques</h3>
            {cheques.map((c, i) => (
              <div className="form-grid cheque-row" key={i}>
                <label>
                  Banco *
                  <input
                    value={c.banco}
                    onChange={(e) =>
                      setCheques((prev) => prev.map((x, j) => (j === i ? { ...x, banco: e.target.value } : x)))
                    }
                    required
                  />
                </label>
                <label>
                  Número *
                  <input
                    value={c.numero}
                    onChange={(e) =>
                      setCheques((prev) => prev.map((x, j) => (j === i ? { ...x, numero: e.target.value } : x)))
                    }
                    required
                  />
                </label>
                <label>
                  Importe *
                  <input
                    value={c.importe}
                    onChange={(e) =>
                      setCheques((prev) => prev.map((x, j) => (j === i ? { ...x, importe: e.target.value } : x)))
                    }
                    required
                  />
                </label>
                <label>
                  Librador
                  <input
                    value={c.librador}
                    onChange={(e) =>
                      setCheques((prev) => prev.map((x, j) => (j === i ? { ...x, librador: e.target.value } : x)))
                    }
                  />
                </label>
                <label>
                  Emisión *
                  <input
                    type="date"
                    value={c.fechaEmision}
                    onChange={(e) =>
                      setCheques((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, fechaEmision: e.target.value } : x)),
                      )
                    }
                    required
                  />
                </label>
                <label>
                  Pago *
                  <input
                    type="date"
                    value={c.fechaPago}
                    onChange={(e) =>
                      setCheques((prev) => prev.map((x, j) => (j === i ? { ...x, fechaPago: e.target.value } : x)))
                    }
                    required
                  />
                </label>
              </div>
            ))}
            <Button variant="secondary" icon="plus" onClick={agregarCheque}>
              Agregar cheque
            </Button>
            <p className="hint">
              Suma de cheques: ${dec(sumaCheques)} · Total del pago: ${dec(monto)}
            </p>
          </>
        )}

        <div className="form-total">
          <span>Monto total</span>
          <strong>${dec(monto)}</strong>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

export function ChequeForm({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [tipo, setTipo] = useState<"PROPIO" | "TERCERO">("TERCERO")
  const [numero, setNumero] = useState("")
  const [banco, setBanco] = useState("")
  const [importe, setImporte] = useState("")
  const [fechaEmision, setFechaEmision] = useState(hoy())
  const [fechaPago, setFechaPago] = useState(hoy())
  const [librador, setLibrador] = useState("")
  const [cuitLibrador, setCuitLibrador] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await apiPost("/cheques", {
        tipo,
        numero,
        banco,
        importe: dec(limpiarMonto(importe)),
        fechaEmision,
        fechaPago,
        librador: librador || undefined,
        cuitLibrador: cuitLibrador || undefined,
      })
      onDone()
    } catch (err) {
      setError(errorDe(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal title="Registrar cheque" onClose={onClose} footer={<Footer onClose={onClose} guardando={guardando} />}>
      <form id="campo-form" className="form-section" onSubmit={guardar}>
        <h3>Datos del cheque</h3>
        <div className="form-grid">
          <label>
            Tipo *
            <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
              <option value="TERCERO">De tercero</option>
              <option value="PROPIO">Propio</option>
            </select>
          </label>
          <label>
            Banco *
            <input value={banco} onChange={(e) => setBanco(e.target.value)} required />
          </label>
          <label>
            Número *
            <input value={numero} onChange={(e) => setNumero(e.target.value)} required />
          </label>
          <label>
            Importe *
            <input value={importe} onChange={(e) => setImporte(e.target.value)} required />
          </label>
          <label>
            Emisión *
            <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} required />
          </label>
          <label>
            Pago *
            <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} required />
          </label>
          <label>
            Librador
            <input value={librador} onChange={(e) => setLibrador(e.target.value)} />
          </label>
          <label>
            CUIT del librador
            <input value={cuitLibrador} onChange={(e) => setCuitLibrador(e.target.value)} />
          </label>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

export function UsuarioForm({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rol, setRol] = useState<"ADMIN" | "ENCARGADO">("ENCARGADO")
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await apiPost("/usuarios", { nombre, email, password, rol })
      onDone()
    } catch (err) {
      setError(errorDe(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal title="Nuevo usuario" onClose={onClose} footer={<Footer onClose={onClose} guardando={guardando} />}>
      <form id="campo-form" className="form-section" onSubmit={guardar}>
        <h3>Datos del usuario</h3>
        <div className="form-grid">
          <label className="full">
            Nombre y apellido *
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
          <label>
            Correo *
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Rol *
            <select value={rol} onChange={(e) => setRol(e.target.value as typeof rol)}>
              <option value="ENCARGADO">Encargado</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
          <label className="full">
            Clave inicial *
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

export function ServicioForm({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const lotes = useApiData<LoteCampania[]>("/campos/lotes-campania")
  const terceros = useApiData<Tercero[]>("/terceros")
  const [fecha, setFecha] = useState(hoy())
  const [labor, setLabor] = useState("")
  const [tipo, setTipo] = useState("CONTRATADO")
  const [estado, setEstado] = useState("PENDIENTE")
  const [costo, setCosto] = useState("")
  const [loteCampaniaId, setLoteCampaniaId] = useState("")
  const [terceroId, setTerceroId] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await apiPost("/servicios", {
        fecha,
        labor,
        tipo,
        estado,
        costo: dec(limpiarMonto(costo)),
        loteCampaniaId: loteCampaniaId || undefined,
        terceroId: terceroId || undefined,
        observaciones: observaciones || undefined,
      })
      onDone()
    } catch (err) {
      setError(errorDe(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal title="Nuevo servicio" onClose={onClose} footer={<Footer onClose={onClose} guardando={guardando} />}>
      <form id="campo-form" className="form-section" onSubmit={guardar}>
        <h3>Datos del servicio</h3>
        <div className="form-grid">
          <label>
            Fecha *
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </label>
          <label>
            Labor *
            <input value={labor} onChange={(e) => setLabor(e.target.value)} required />
          </label>
          <label>
            Tipo *
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="CONTRATADO">Contratado</option>
              <option value="PROPIO">Propio</option>
            </select>
          </label>
          <label>
            Estado *
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_EJECUCION">En ejecución</option>
              <option value="FINALIZADO">Finalizado</option>
            </select>
          </label>
          <label>
            Costo *
            <input value={costo} onChange={(e) => setCosto(e.target.value)} required />
          </label>
          <label>
            Campo / lote
            <select value={loteCampaniaId} onChange={(e) => setLoteCampaniaId(e.target.value)}>
              <option value="">Sin asignar</option>
              {lotes.data?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.lote.establecimiento.nombre} · {l.lote.nombre} · {ETIQUETA_CULTIVO[l.cultivo]}
                </option>
              ))}
            </select>
          </label>
          <label className="full">
            Proveedor
            <select value={terceroId} onChange={(e) => setTerceroId(e.target.value)}>
              <option value="">Equipo propio</option>
              {terceros.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="full">
            Observaciones
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </label>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

export function CosechaForm({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const lotes = useApiData<LoteCampania[]>("/campos/lotes-campania")
  const terceros = useApiData<Tercero[]>("/terceros")
  const [fecha, setFecha] = useState(hoy())
  const [loteCampaniaId, setLoteCampaniaId] = useState("")
  const [patente, setPatente] = useState("")
  const [kgCarga, setKgCarga] = useState("")
  const [transportistaId, setTransportistaId] = useState("")
  const [destinoId, setDestinoId] = useState("")
  const [estado, setEstado] = useState("EN_TRANSITO")
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await apiPost("/cosechas", {
        fecha,
        loteCampaniaId,
        patente,
        kg: dec(limpiarMonto(kgCarga)),
        transportistaId: transportistaId || undefined,
        destinoId: destinoId || undefined,
        estado,
      })
      onDone()
    } catch (err) {
      setError(errorDe(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal title="Registrar carga" onClose={onClose} footer={<Footer onClose={onClose} guardando={guardando} />}>
      <form id="campo-form" className="form-section" onSubmit={guardar}>
        <h3>Datos de la carga</h3>
        <div className="form-grid">
          <label>
            Fecha *
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </label>
          <label>
            Campo / lote *
            <select value={loteCampaniaId} onChange={(e) => setLoteCampaniaId(e.target.value)} required>
              <option value="">Seleccionar</option>
              {lotes.data?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.lote.establecimiento.nombre} · {l.lote.nombre} · {ETIQUETA_CULTIVO[l.cultivo]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Patente del camión *
            <input
              placeholder="AC 482 QZ"
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              required
            />
          </label>
          <label>
            Kilogramos *
            <input value={kgCarga} onChange={(e) => setKgCarga(e.target.value)} required />
          </label>
          <label>
            Transportista
            <select value={transportistaId} onChange={(e) => setTransportistaId(e.target.value)}>
              <option value="">Sin asignar</option>
              {terceros.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Destino
            <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)}>
              <option value="">Sin asignar</option>
              {terceros.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado *
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="EN_TRANSITO">En tránsito</option>
              <option value="ENTREGADA">Entregada</option>
            </select>
          </label>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

export function InsumoForm({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [nombre, setNombre] = useState("")
  const [categoria, setCategoria] = useState("AGROQUIMICO")
  const [unidad, setUnidad] = useState("l")
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await apiPost("/insumos", { nombre, categoria, unidad })
      onDone()
    } catch (err) {
      setError(errorDe(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal title="Nuevo insumo" onClose={onClose} footer={<Footer onClose={onClose} guardando={guardando} />}>
      <form id="campo-form" className="form-section" onSubmit={guardar}>
        <h3>Datos del insumo</h3>
        <div className="form-grid">
          <label className="full">
            Nombre *
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
          <label>
            Categoría *
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="AGROQUIMICO">Agroquímico</option>
              <option value="FERTILIZANTE">Fertilizante</option>
              <option value="SEMILLA">Semilla</option>
              <option value="COMBUSTIBLE">Combustible</option>
              <option value="OTRO">Otro</option>
            </select>
          </label>
          <label>
            Unidad *
            <input value={unidad} onChange={(e) => setUnidad(e.target.value)} required />
          </label>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

export function MovimientoInsumoForm({
  insumoId,
  insumoNombre,
  onDone,
  onClose,
}: {
  insumoId: string
  insumoNombre: string
  onDone: () => void
  onClose: () => void
}) {
  const [fecha, setFecha] = useState(hoy())
  const [tipo, setTipo] = useState("ENTRADA")
  const [cantidad, setCantidad] = useState("")
  const [deposito, setDeposito] = useState("Depósito Norte")
  const [referencia, setReferencia] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await apiPost(`/insumos/${insumoId}/movimientos`, {
        fecha,
        tipo,
        cantidad: dec(limpiarMonto(cantidad), 3),
        deposito,
        referencia: referencia || undefined,
      })
      onDone()
    } catch (err) {
      setError(errorDe(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      title={`Movimiento · ${insumoNombre}`}
      onClose={onClose}
      footer={<Footer onClose={onClose} guardando={guardando} />}
    >
      <form id="campo-form" className="form-section" onSubmit={guardar}>
        <h3>Datos del movimiento</h3>
        <div className="form-grid">
          <label>
            Fecha *
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </label>
          <label>
            Tipo *
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="AJUSTE">Ajuste</option>
            </select>
          </label>
          <label>
            Cantidad *
            <input value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
          </label>
          <label>
            Depósito *
            <input value={deposito} onChange={(e) => setDeposito(e.target.value)} required />
          </label>
          <label className="full">
            Referencia
            <input value={referencia} onChange={(e) => setReferencia(e.target.value)} />
          </label>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

export function MovimientoCerealForm({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [fecha, setFecha] = useState(hoy())
  const [cultivo, setCultivo] = useState("SOJA")
  const [tipo, setTipo] = useState("INGRESO")
  const [kgMov, setKgMov] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await apiPost("/cereal/movimientos", {
        fecha,
        cultivo,
        tipo,
        kg: dec(limpiarMonto(kgMov)),
        observaciones: observaciones || undefined,
      })
      onDone()
    } catch (err) {
      setError(errorDe(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      title="Movimiento de cereal"
      onClose={onClose}
      footer={<Footer onClose={onClose} guardando={guardando} />}
    >
      <form id="campo-form" className="form-section" onSubmit={guardar}>
        <h3>Datos del movimiento</h3>
        <div className="form-grid">
          <label>
            Fecha *
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </label>
          <label>
            Cultivo *
            <select value={cultivo} onChange={(e) => setCultivo(e.target.value)}>
              {Object.entries(ETIQUETA_CULTIVO).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo *
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="INGRESO">Ingreso</option>
              <option value="EGRESO">Egreso</option>
            </select>
          </label>
          <label>
            Kilogramos *
            <input value={kgMov} onChange={(e) => setKgMov(e.target.value)} required />
          </label>
          <label className="full">
            Observaciones
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </label>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

export function EstablecimientoForm({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [nombre, setNombre] = useState("")
  const [localidad, setLocalidad] = useState("")
  const [hectareas, setHectareas] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await apiPost("/campos/establecimientos", {
        nombre,
        localidad,
        hectareas: dec(limpiarMonto(hectareas)),
      })
      onDone()
    } catch (err) {
      setError(errorDe(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal title="Nuevo campo" onClose={onClose} footer={<Footer onClose={onClose} guardando={guardando} />}>
      <form id="campo-form" className="form-section" onSubmit={guardar}>
        <h3>Datos del establecimiento</h3>
        <div className="form-grid">
          <label className="full">
            Nombre *
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
          <label>
            Localidad *
            <input value={localidad} onChange={(e) => setLocalidad(e.target.value)} required />
          </label>
          <label>
            Hectáreas *
            <input value={hectareas} onChange={(e) => setHectareas(e.target.value)} required />
          </label>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

export function LoteForm({
  establecimientoId,
  onDone,
  onClose,
}: {
  establecimientoId: string
  onDone: () => void
  onClose: () => void
}) {
  const campanias = useApiData<Campania[]>("/campos/campanias")
  const [nombre, setNombre] = useState("")
  const [hectareas, setHectareas] = useState("")
  const [campaniaId, setCampaniaId] = useState("")
  const [cultivo, setCultivo] = useState("SOJA")
  const [sembradoHa, setSembradoHa] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      const lote = await apiPost<{ id: string }>(`/campos/establecimientos/${establecimientoId}/lotes`, {
        nombre,
        hectareas: dec(limpiarMonto(hectareas)),
      })
      if (campaniaId) {
        await apiPost(`/campos/lotes/${lote.id}/campanias`, {
          campaniaId,
          cultivo,
          sembradoHa: dec(limpiarMonto(sembradoHa || hectareas)),
        })
      }
      onDone()
    } catch (err) {
      setError(errorDe(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal title="Asociar lote" onClose={onClose} footer={<Footer onClose={onClose} guardando={guardando} />}>
      <form id="campo-form" className="form-section" onSubmit={guardar}>
        <h3>Datos del lote</h3>
        <div className="form-grid">
          <label className="full">
            Nombre *
            <input placeholder="Lote 07" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
          <label>
            Superficie (ha) *
            <input value={hectareas} onChange={(e) => setHectareas(e.target.value)} required />
          </label>
          <label>
            Campaña
            <select value={campaniaId} onChange={(e) => setCampaniaId(e.target.value)}>
              <option value="">Sin asignar</option>
              {campanias.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cultivo
            <select value={cultivo} onChange={(e) => setCultivo(e.target.value)} disabled={!campaniaId}>
              {Object.entries(ETIQUETA_CULTIVO).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Hectáreas sembradas
            <input
              value={sembradoHa}
              onChange={(e) => setSembradoHa(e.target.value)}
              disabled={!campaniaId}
              placeholder={hectareas || "0"}
            />
          </label>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

export function NuevoCampaniaForm({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [nombre, setNombre] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await apiPost("/campos/campanias", { nombre })
      onDone()
    } catch (err) {
      setError(errorDe(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal title="Nueva campaña" onClose={onClose} footer={<Footer onClose={onClose} guardando={guardando} />}>
      <form id="campo-form" className="form-section" onSubmit={guardar}>
        <div className="form-grid">
          <label className="full">
            Nombre *
            <input
              placeholder="2026/2027"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </label>
        </div>
        <FormError error={error} />
      </form>
    </Modal>
  )
}

export function ToggleUsuario({ id, activo, onDone }: { id: string; activo: boolean; onDone: () => void }) {
  const [cargando, setCargando] = useState(false)
  const alternar = async () => {
    setCargando(true)
    try {
      await apiPatch(`/usuarios/${id}`, { activo: !activo })
      onDone()
    } finally {
      setCargando(false)
    }
  }
  return (
    <button className="text-action" onClick={alternar} disabled={cargando}>
      {activo ? "Desactivar" : "Activar"}
    </button>
  )
}
