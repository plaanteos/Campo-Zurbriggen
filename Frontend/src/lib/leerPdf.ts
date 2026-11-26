import { getDocument, GlobalWorkerOptions, InvalidPDFException, PasswordException } from "pdfjs-dist"
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { createWorker } from "tesseract.js"
import { extraerDatos, type DatosDocumento } from "./documento"

GlobalWorkerOptions.workerSrc = pdfWorker

export interface DocumentoLeido {
  texto: string
  datos: DatosDocumento
  vista: string
  paginas: number
  usoOcr: boolean
}

export async function leerPdf(archivo: File, progreso: (mensaje: string) => void, forzarOcr = false): Promise<DocumentoLeido> {
  if (!archivo.name.toLowerCase().endsWith(".pdf")) throw new Error("Seleccioná un archivo PDF.")
  if (archivo.size === 0 || archivo.size > 15 * 1024 * 1024) throw new Error("El PDF debe tener un tamaño de hasta 15 MB.")

  const tarea = getDocument({ data: await archivo.arrayBuffer() })
  let ocr: Awaited<ReturnType<typeof createWorker>> | undefined
  try {
    const pdf = await tarea.promise
    if (pdf.numPages > 20) throw new Error("El PDF no puede superar las 20 páginas.")
    let texto = ""
    let vista = ""
    let usoOcr = false
    for (let i = 1; i <= pdf.numPages; i++) {
      progreso(`Leyendo página ${i} de ${pdf.numPages}...`)
      const pagina = await pdf.getPage(i)
      const contenido = await pagina.getTextContent()
      let textoPagina = contenido.items.map((item) => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join("")
      const necesitaOcr = forzarOcr || textoPagina.replace(/\s/g, "").length < 20
      if (i === 1 || necesitaOcr) {
        const base = pagina.getViewport({ scale: 1 })
        const escala = Math.min(necesitaOcr ? 2 : 1.2, 4096 / Math.max(base.width, base.height))
        const viewport = pagina.getViewport({ scale: escala })
        const canvas = document.createElement("canvas")
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        const contexto = canvas.getContext("2d")
        if (!contexto) throw new Error("El navegador no pudo preparar la vista del documento.")
        await pagina.render({ canvas, canvasContext: contexto, viewport }).promise
        if (i === 1) vista = canvas.toDataURL("image/png")
        if (necesitaOcr) {
          progreso(`Reconociendo texto de la página ${i} de ${pdf.numPages}...`)
          if (!ocr) {
            const baseUrl = new URL(`${import.meta.env.BASE_URL}ocr/`, window.location.href).href
            ocr = await createWorker("spa", 1, {
              workerPath: `${baseUrl}worker.min.js`,
              corePath: `${baseUrl}tesseract-core-lstm.wasm.js`,
              langPath: baseUrl.replace(/\/$/, ""),
              workerBlobURL: false,
              cacheMethod: "none",
            })
          }
          textoPagina = (await ocr.recognize(canvas)).data.text
          usoOcr = true
        }
        canvas.width = 0
        canvas.height = 0
      }
      texto += `${textoPagina}\n`
      pagina.cleanup()
    }
    return { texto, datos: extraerDatos(texto), vista, paginas: pdf.numPages, usoOcr }
  } catch (error) {
    if (error instanceof PasswordException) throw new Error("El PDF está protegido. Desbloquealo antes de cargarlo.")
    if (error instanceof InvalidPDFException) throw new Error("El archivo no es un PDF válido.")
    throw error
  } finally {
    if (ocr) await ocr.terminate()
    await tarea.destroy()
  }
}
