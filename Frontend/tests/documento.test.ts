import { strict as assert } from "node:assert"
import { test } from "node:test"
import { extraerDatos } from "../src/lib/documento.ts"

test("detecta datos identificados y normaliza el número y la fecha", () => {
  const datos = extraerDatos("FACTURA A N° 4-1829\nFecha de emisión: 03/06/2026\nCUIT 30-71284564-9\nTOTAL $ 2.845.300,00")
  assert.equal(datos.numero, "0004-00001829")
  assert.equal(datos.fecha, "2026-06-03")
  assert.equal(datos.tipoFactura, "A")
  assert.equal(datos.importe, "2.845.300,00")
  assert.deepEqual(datos.cuits, ["30-71284564-9"])
})

test("no elige valores ambiguos ni fechas imposibles", () => {
  const datos = extraerDatos("Factura A N° 1-2\nRemito N° 3-4\nFecha: 31/02/2026\nTOTAL $ 1.000,00\nTOTAL $ 2.000,00")
  assert.equal(datos.numero, undefined)
  assert.equal(datos.fecha, undefined)
  assert.equal(datos.importe, undefined)
})

test("no inventa datos cuando no hay texto reconocible", () => {
  assert.deepEqual(extraerDatos(""), { numero: undefined, fecha: undefined, tipoFactura: undefined, importe: undefined, cuits: [] })
})
