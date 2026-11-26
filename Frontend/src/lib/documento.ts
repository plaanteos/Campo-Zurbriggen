export interface DatosDocumento {
  numero?: string
  fecha?: string
  tipoFactura?: "A" | "B" | "C"
  importe?: string
  cuits: string[]
}

function fechaValida(valor: string): string | undefined {
  const [dia, mes, anio] = valor.split(/[/-]/).map(Number)
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
}

export function extraerDatos(texto: string): DatosDocumento {
  const limpio = texto.replace(/\u00a0/g, " ")
  const numeros = [...limpio.matchAll(/(?:factura|remito|comprobante|n[º°o.])\s*(?:[abc]\s*)?(?:n[º°o.]?\s*)?[:#]?\s*(\d{1,4})\s*[-–]\s*(\d{1,8})\b/gi)]
    .map((m) => `${m[1].padStart(4, "0")}-${m[2].padStart(8, "0")}`)
  const fechas = [...limpio.matchAll(/fecha(?:\s+de\s+emisi[oó]n)?\s*[:#]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})/gi)]
    .map((m) => fechaValida(m[1])).filter((f): f is string => Boolean(f))
  const tipos = [...limpio.matchAll(/\bfactura\s+([ABC])\b/gi)].map((m) => m[1].toUpperCase())
  const importes = [...limpio.matchAll(/(?:^|\n)\s*(?:importe\s+total|total\s+a\s+pagar|total)\s*[:$]?\s*\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:,\d{2}))/gim)]
    .map((m) => m[1])
  const cuits = [...new Set([...limpio.matchAll(/\b(\d{2})[-\s]?(\d{8})[-\s]?(\d)\b/g)].map((m) => `${m[1]}-${m[2]}-${m[3]}`))]
  const unico = (valores: string[]) => new Set(valores).size === 1 ? valores[0] : undefined
  const tipo = unico(tipos)
  return {
    numero: unico(numeros),
    fecha: unico(fechas),
    tipoFactura: tipo === "A" || tipo === "B" || tipo === "C" ? tipo : undefined,
    importe: unico(importes),
    cuits,
  }
}
