import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/errors.js";
import { ALICUOTA_IVA, D, TOLERANCIA, montoSchema } from "../lib/dinero.js";

export const facturaSchema = z
  .object({
    direccion: z.enum(["COMPRA", "VENTA"]).default("COMPRA"),
    clase: z.enum(["FACTURA", "NOTA_CREDITO", "NOTA_DEBITO"]).default("FACTURA"),
    tipo: z.enum(["A", "B", "C"]),
    puntoVenta: z.string().regex(/^\d{1,4}$/, "Punto de venta inválido"),
    numero: z.string().regex(/^\d{1,8}$/, "Número de comprobante inválido"),
    fecha: z.coerce.date(),
    vencimiento: z.coerce.date().optional(),
    terceroId: z.string().min(1),
    neto: montoSchema,
    iva: montoSchema.default("0"),
    remitoIds: z.array(z.string()).default([]),
  })
  .superRefine((d, ctx) => {
    if (d.clase === "FACTURA" && d.remitoIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["remitoIds"],
        message: "Una factura debe vincular al menos un remito",
      });
    }
    if (d.clase !== "FACTURA" && d.remitoIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["remitoIds"],
        message: "Solo las facturas pueden vincular remitos",
      });
    }
  });

/** Factura A: el IVA debe ser el 21% del neto (con tolerancia de centavos). */
function validarIva(tipo: "A" | "B" | "C", neto: Prisma.Decimal, iva: Prisma.Decimal) {
  if (tipo === "A") {
    const esperado = neto.mul(ALICUOTA_IVA);
    if (iva.minus(esperado).abs().gt(TOLERANCIA)) {
      throw new HttpError(422, "El IVA no corresponde al 21% del neto", {
        esperado: esperado.toFixed(2),
        recibido: iva.toFixed(2),
      });
    }
  } else if (!iva.isZero()) {
    throw new HttpError(422, `La factura tipo ${tipo} no discrimina IVA`);
  }
}

/**
 * Crea una factura y la vincula a sus remitos.
 * Reglas: el neto debe coincidir con la suma de los remitos, cada remito se factura una sola vez
 * y todos deben ser del mismo tercero.
 */
export async function crearFactura(payload: unknown, usuarioId: string) {
  const d = facturaSchema.parse(payload);
  const neto = D(d.neto);
  const iva = D(d.iva);
  const total = neto.plus(iva);

  validarIva(d.tipo, neto, iva);

  return prisma.$transaction(async (tx) => {
    const tercero = await tx.tercero.findUnique({ where: { id: d.terceroId } });
    if (!tercero) throw new HttpError(404, "Tercero no encontrado");

    if (d.remitoIds.length > 0) {
      // Bloqueo de fila: evita que dos facturas concurrentes tomen el mismo remito.
      await tx.$queryRaw`SELECT id FROM "Remito" WHERE id IN (${Prisma.join(d.remitoIds)}) FOR UPDATE`;

      const remitos = await tx.remito.findMany({ where: { id: { in: d.remitoIds } } });
      if (remitos.length !== new Set(d.remitoIds).size) {
        throw new HttpError(404, "Alguno de los remitos no existe");
      }
      if (remitos.some((r) => r.terceroId !== d.terceroId)) {
        throw new HttpError(422, "Los remitos pertenecen a otro tercero");
      }

      const yaFacturados = remitos.filter((r) => r.estado !== "PENDIENTE_FACTURA");
      if (yaFacturados.length > 0) {
        throw new HttpError(409, "Hay remitos que ya fueron facturados", {
          remitos: yaFacturados.map((r) => r.numero),
        });
      }

      const sumaRemitos = remitos.reduce((acc, r) => acc.plus(r.importe), D(0));
      if (sumaRemitos.minus(neto).abs().gt(TOLERANCIA)) {
        throw new HttpError(422, "El neto no coincide con la suma de los remitos vinculados", {
          netoFactura: neto.toFixed(2),
          sumaRemitos: sumaRemitos.toFixed(2),
        });
      }
    }

    const factura = await tx.factura.create({
      data: {
        direccion: d.direccion,
        clase: d.clase,
        tipo: d.tipo,
        puntoVenta: d.puntoVenta.padStart(4, "0"),
        numero: d.numero.padStart(8, "0"),
        fecha: d.fecha,
        vencimiento: d.vencimiento,
        terceroId: d.terceroId,
        neto,
        iva,
        total,
        estado: "PENDIENTE",
        remitos: { create: d.remitoIds.map((remitoId) => ({ remitoId })) },
      },
    });

    if (d.remitoIds.length > 0) {
      await tx.remito.updateMany({
        where: { id: { in: d.remitoIds } },
        data: { estado: "FACTURADO" },
      });
    }

    await tx.auditoria.create({
      data: { usuarioId, accion: "CREAR", entidad: "Factura", entidadId: factura.id },
    });

    return factura;
  });
}

/** Anula una factura sin pagos imputados y libera sus remitos. */
export async function anularFactura(id: string, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const factura = await tx.factura.findUnique({ where: { id } });
    if (!factura) throw new HttpError(404, "Factura no encontrada");
    if (factura.estado === "ANULADA") throw new HttpError(409, "La factura ya está anulada");
    if (D(factura.pagado).gt(0)) {
      throw new HttpError(409, "No se puede anular una factura con pagos imputados");
    }

    const vinculos = await tx.facturaRemito.findMany({
      where: { facturaId: id },
      select: { remitoId: true },
    });

    await tx.factura.update({ where: { id }, data: { estado: "ANULADA" } });
    await tx.remito.updateMany({
      where: { id: { in: vinculos.map((v) => v.remitoId) } },
      data: { estado: "PENDIENTE_FACTURA" },
    });
    await tx.auditoria.create({
      data: { usuarioId, accion: "ANULAR", entidad: "Factura", entidadId: id },
    });

    return { ok: true };
  });
}

export function listarFacturas(filtros: { terceroId?: string }) {
  return prisma.factura.findMany({
    where: { terceroId: filtros.terceroId },
    include: {
      tercero: { select: { nombre: true, cuit: true } },
      remitos: { include: { remito: { select: { numero: true, importe: true } } } },
    },
    orderBy: { fecha: "desc" },
  });
}
