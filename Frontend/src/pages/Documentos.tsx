import { useState } from "react"
import { Badge, Button, Icon, PageHeader } from "../components/ui"

export function Documentos() {
  const [processed, setProcessed] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  return (
    <div className="content document-page">
      <PageHeader
        eyebrow="ADMINISTRACIÓN"
        title="Procesamiento inteligente de documentos"
        subtitle="Extraé datos de facturas y remitos con asistencia de IA y validación humana"
      />
      <div className="human-alert">
        <Icon name="warning" size={19} />
        <div>
          <strong>Control humano obligatorio</strong>
          <span>
            La información extraída nunca se registra automáticamente. Deberás
            revisar y confirmar todos los datos antes de guardarlos.
          </span>
        </div>
      </div>
      <div className="human-alert" style={{ background: "#f4f6f4", borderColor: "#d5ddd6" }}>
        <Icon name="scan" size={19} />
        <div>
          <strong>Módulo en preparación</strong>
          <span>
            La lectura automática de PDF se habilitará en la próxima fase. Mientras
            tanto podés cargar facturas y remitos desde sus módulos.
          </span>
        </div>
      </div>
      <div className="stepper">
        {[
          "Cargar documento",
          "Procesar con IA",
          "Revisar datos",
          "Confirmar registro",
        ].map((x, i) => (
          <div
            className={`${
              processed ? (i < 3 ? "done" : "active") : i === 0 ? "active" : ""
            }`}
            key={x}
          >
            <i>
              {processed && i < 2 ? <Icon name="check" size={13} /> : i + 1}
            </i>
            <span>{x}</span>
          </div>
        ))}
      </div>
      {!processed ? (
        <div className="upload-workspace">
          <div className="upload-zone">
            <div className="upload-icon">
              <Icon name="upload" size={28} />
            </div>
            <h2>Arrastrá una factura o remito aquí</h2>
            <p>Admite archivos PDF de hasta 15 MB</p>
            <Button variant="secondary" onClick={() => setProcessed(true)}>
              Seleccionar archivo
            </Button>
            <span>o arrastrá el archivo desde tu computadora</span>
          </div>
          <aside>
            <h3>¿Cómo funciona?</h3>
            <ol>
              <li>
                <i>1</i>
                <div>
                  <strong>Cargá el documento</strong>
                  <span>Factura o remito en formato PDF.</span>
                </div>
              </li>
              <li>
                <i>2</i>
                <div>
                  <strong>La IA extrae los datos</strong>
                  <span>Identifica emisor, fechas, importes e ítems.</span>
                </div>
              </li>
              <li>
                <i>3</i>
                <div>
                  <strong>Revisá campo por campo</strong>
                  <span>Los datos dudosos se marcan para controlar.</span>
                </div>
              </li>
              <li>
                <i>4</i>
                <div>
                  <strong>Confirmá el registro</strong>
                  <span>Vos decidís cuándo guardar la información.</span>
                </div>
              </li>
            </ol>
          </aside>
        </div>
      ) : (
        <div className="review-workspace">
          <section className="pdf-preview">
            <div className="pdf-toolbar">
              <span>
                <Icon name="file" size={16} /> factura_agroinsumos_1829.pdf
              </span>
              <div>
                <button>−</button>
                <span>85%</span>
                <button>+</button>
              </div>
            </div>
            <div className="paper">
              <div className="fake-logo">
                AGROINSUMOS
                <br />
                <b>DEL CENTRO</b>
              </div>
              <h3>FACTURA A</h3>
              <p>Cod. 01 · N° 0004-001829</p>
              <hr />
              <div className="paper-grid">
                <span>Razón Social</span>
                <b>Establecimiento Los Aromos S.A.</b>
                <span>CUIT</span>
                <b>30-70882144-3</b>
                <span>Fecha</span>
                <b>12/06/2026</b>
              </div>
              <table>
                <tbody>
                  <tr>
                    <td>Urea granulada</td>
                    <td>8.000 kg</td>
                    <td>$ 2.351.487</td>
                  </tr>
                  <tr>
                    <td>IVA 21%</td>
                    <td></td>
                    <td>$ 493.813</td>
                  </tr>
                </tbody>
              </table>
              <strong className="paper-total">TOTAL $ 2.845.300</strong>
            </div>
          </section>
          <section className="extracted">
            <div className="extracted-head">
              <div>
                <h2>Datos extraídos</h2>
                <p>
                  Confianza general de lectura: <b>94%</b>
                </p>
              </div>
              <Badge tone="warning">2 campos a revisar</Badge>
            </div>
            <div className="form-grid">
              <label>
                Tipo de documento
                <select defaultValue="Factura A">
                  <option>Factura A</option>
                </select>
                <small className="confidence good">
                  <Icon name="check" size={12} /> 99% de confianza
                </small>
              </label>
              <label>
                Número de comprobante
                <input defaultValue="0004-001829" />
                <small className="confidence good">
                  <Icon name="check" size={12} /> 98% de confianza
                </small>
              </label>
              <label>
                CUIT del emisor
                <input defaultValue="30-71284564-9" />
                <small className="confidence good">
                  <Icon name="check" size={12} /> 97% de confianza
                </small>
              </label>
              <label>
                Razón social
                <input defaultValue="Agroinsumos del Centro S.A." />
                <small className="confidence good">
                  <Icon name="check" size={12} /> 96% de confianza
                </small>
              </label>
              <label>
                Fecha de emisión
                <input defaultValue="12/06/2026" />
                <small className="confidence warn">
                  <Icon name="warning" size={12} /> Revisar dato
                </small>
              </label>
              <label>
                Fecha de vencimiento
                <input className="needs-review" defaultValue="18/06/2026" />
                <small className="confidence warn">
                  <Icon name="warning" size={12} /> 71% de confianza
                </small>
              </label>
              <label>
                Importe neto
                <input defaultValue="$ 2.351.487,60" />
              </label>
              <label>
                IVA 21%
                <input defaultValue="$ 493.812,40" />
              </label>
              <label className="full">
                Importe total
                <input className="total-input" defaultValue="$ 2.845.300,00" />
              </label>
            </div>
            <div className="confirmation">
              <label>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>
                  Revisé el documento original y confirmo que la información
                  ingresada es correcta.
                </span>
              </label>
            </div>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setProcessed(false)}>
                Cancelar
              </Button>
              <Button variant="secondary">Guardar borrador</Button>
              <Button
                icon="check"
                onClick={() => confirmed && alert("Documento confirmado")}
              >
                Confirmar y registrar
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
