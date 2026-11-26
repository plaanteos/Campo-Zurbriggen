import { useEffect, useRef, useState } from "react"
import { FacturaForm, RemitoForm } from "../components/forms"
import { Button, Icon, PageHeader } from "../components/ui"
import type { DocumentoLeido } from "../lib/leerPdf"

export function Documentos() {
  const [documento, setDocumento] = useState<DocumentoLeido | null>(null)
  const [urlPdf, setUrlPdf] = useState<string | null>(null)
  const [nombre, setNombre] = useState("")
  const [progreso, setProgreso] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [forzarOcr, setForzarOcr] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [tipo, setTipo] = useState<"" | "factura" | "remito">("")
  const [formulario, setFormulario] = useState<"" | "factura" | "remito">("")
  const activo = useRef(true)
  const leyendo = useRef(false)

  useEffect(() => {
    activo.current = true
    return () => { activo.current = false }
  }, [])
  useEffect(() => () => { if (urlPdf) URL.revokeObjectURL(urlPdf) }, [urlPdf])

  const cargar = async (archivo: File) => {
    if (leyendo.current) return
    leyendo.current = true
    setDocumento(null)
    setUrlPdf(null)
    setConfirmado(false)
    setTipo("")
    setGuardado(false)
    setError(null)
    setNombre(archivo.name)
    setProgreso("Preparando documento...")
    try {
      const { leerPdf } = await import("../lib/leerPdf")
      const resultado = await leerPdf(archivo, (mensaje) => {
        if (activo.current) setProgreso(mensaje)
      }, forzarOcr)
      if (activo.current) {
        setDocumento(resultado)
        setUrlPdf(URL.createObjectURL(archivo))
      }
    } catch (err) {
      if (activo.current) setError(err instanceof Error ? err.message : "No se pudo leer el PDF.")
    } finally {
      leyendo.current = false
      if (activo.current) setProgreso("")
    }
  }

  const finalizar = () => {
    setFormulario("")
    setDocumento(null)
    setUrlPdf(null)
    setNombre("")
    setConfirmado(false)
    setTipo("")
    setGuardado(true)
  }

  return (
    <div className="content document-page">
      <PageHeader
        eyebrow="ADMINISTRACIÓN"
        title="Procesamiento de documentos"
        subtitle="Leé facturas y remitos en PDF y revisá los datos antes de registrarlos"
      />
      <div className="human-alert">
        <Icon name="warning" size={19} />
        <div>
          <strong>Revisión humana obligatoria</strong>
          <span>El PDF se procesa en tu navegador y no se envía al servidor. Verificá todos los datos antes de guardar.</span>
        </div>
      </div>
      {guardado && <p className="document-success" role="status">Registro guardado correctamente.</p>}
      {error && <div className="form-error" role="alert">{error}</div>}
      {!documento ? (
        <div
          className="document-upload"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const archivo = e.dataTransfer.files[0]
            if (archivo) void cargar(archivo)
          }}
        >
          <Icon name="upload" size={28} />
          <h2>Cargar factura o remito</h2>
          <p>Seleccioná o arrastrá un PDF de hasta 15 MB y 20 páginas.</p>
          <label className="document-check document-ocr">
            <input type="checkbox" checked={forzarOcr} disabled={Boolean(progreso)} onChange={(e) => setForzarOcr(e.target.checked)} />
            Usar OCR en todas las páginas (para documentos escaneados)
          </label>
          <label className="btn secondary document-file">
            Seleccionar PDF
            <input
              type="file"
              accept=".pdf,application/pdf"
              disabled={Boolean(progreso)}
              onChange={(e) => {
                const archivo = e.target.files?.[0]
                e.target.value = ""
                if (archivo) void cargar(archivo)
              }}
            />
          </label>
          {progreso && <p role="status" aria-live="polite">{progreso}</p>}
        </div>
      ) : (
        <div className="review-workspace document-review">
          <section className="pdf-preview">
            <div className="pdf-toolbar">
              <span>{nombre} · {documento.paginas} página(s)</span>
              {urlPdf && <a href={urlPdf} target="_blank" rel="noopener noreferrer">Abrir PDF completo</a>}
            </div>
            <img className="document-preview" src={documento.vista} alt="Primera página del PDF" />
          </section>
          <section className="extracted">
            <div className="extracted-head">
              <div>
                <h2>Datos detectados</h2>
                <p>{documento.usoOcr ? "Incluye reconocimiento de páginas escaneadas." : "Texto extraído del PDF."} Los valores pueden contener errores.</p>
              </div>
            </div>
            <dl className="document-detected">
              <div><dt>Número</dt><dd>{documento.datos.numero ?? "No detectado"}</dd></div>
              <div><dt>Fecha</dt><dd>{documento.datos.fecha ?? "No detectada"}</dd></div>
              <div><dt>Tipo de factura</dt><dd>{documento.datos.tipoFactura ?? "No detectado"}</dd></div>
              <div><dt>Importe total</dt><dd>{documento.datos.importe ?? "No detectado"}</dd></div>
              <div><dt>CUIT encontrados</dt><dd>{documento.datos.cuits.join(", ") || "No detectados"}</dd></div>
            </dl>
            {!documento.texto.trim() && <p className="document-warning">No se reconoció texto. Podés completar los datos manualmente.</p>}
            <details className="document-text">
              <summary>Ver texto reconocido</summary>
              <pre>{documento.texto || "Sin texto reconocido."}</pre>
            </details>
            <div className="document-confirm">
              <label>
                Tipo de documento
                <select value={tipo} onChange={(e) => setTipo(e.target.value as "" | "factura" | "remito")}>
                  <option value="">Seleccionar</option>
                  <option value="factura">Factura o nota</option>
                  <option value="remito">Remito</option>
                </select>
              </label>
              <label className="document-check">
                <input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />
                Revisaré los datos y seleccionaré el tercero antes de guardar.
              </label>
              <div className="document-actions">
                <Button variant="secondary" onClick={() => { setDocumento(null); setUrlPdf(null); setConfirmado(false); setTipo("") }}>
                  Elegir otro PDF
                </Button>
                <Button disabled={!confirmado || !tipo} onClick={() => setFormulario(tipo)}>
                  Continuar al registro
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
      {documento && formulario === "factura" && (
        <FacturaForm initial={documento.datos} onClose={() => setFormulario("")} onDone={finalizar} />
      )}
      {documento && formulario === "remito" && (
        <RemitoForm initial={documento.datos} onClose={() => setFormulario("")} onDone={finalizar} />
      )}
    </div>
  )
}
