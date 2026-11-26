import { Icon, PageHeader } from "../components/ui"

export function Documentos() {
  return (
    <div className="content document-page">
      <PageHeader
        eyebrow="ADMINISTRACIÓN"
        title="Procesamiento inteligente de documentos"
        subtitle="Extraé datos de facturas y remitos con asistencia de IA y validación humana"
      />
      <div className="human-alert">
        <Icon name="scan" size={19} />
        <div>
          <strong>Módulo en preparación</strong>
          <span>
            La lectura automática de PDF todavía no está disponible. Podés cargar
            facturas y remitos desde sus módulos.
          </span>
        </div>
      </div>
    </div>
  )
}
