import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/errors.js";
import { D, montoSchema } from "../lib/dinero.js";
const chequeSchema = z.object({
    numero: z.string().min(1),
    banco: z.string().min(1),
    importe: montoSchema,
    fechaEmision: z.coerce.date(),
    fechaPago: z.coerce.date(),
    librador: z.string().optional(),
    cuitLibrador: z.string().optional(),
});
export const pagoSchema = z.object({
    sentido: z.enum(["EMITIDO", "RECIBIDO"]),
    terceroId: z.string().min(1),
    fecha: z.coerce.date(),
    medio: z.enum(["EFECTIVO", "TRANSFERENCIA", "CHEQUES", "MIXTO"]),
    monto: montoSchema,
    observaciones: z.string().optional(),
    imputaciones: z
        .array(z.object({ facturaId: z.string().min(1), monto: montoSchema }))
        .min(1, "Debe imputar el pago a al menos una factura"),
    cheques: z.array(chequeSchema).default([]),
});
// Un pago emitido cancela facturas de compra; uno recibido cancela facturas de venta.
const DIRECCION_POR_SENTIDO = { EMITIDO: "COMPRA", RECIBIDO: "VENTA" };
const PREFIJO_POR_SENTIDO = { EMITIDO: "OP", RECIBIDO: "RC" };
function validarMedio(medio, cantidadCheques, sumaCheques, monto) {
    if (sumaCheques.gt(monto)) {
        throw new HttpError(422, "La suma de los cheques supera el monto del pago");
    }
    if ((medio === "EFECTIVO" || medio === "TRANSFERENCIA") && cantidadCheques > 0) {
        throw new HttpError(422, `El medio ${medio} no admite cheques`);
    }
    if (medio === "CHEQUES" && !sumaCheques.eq(monto)) {
        throw new HttpError(422, "Con medio CHEQUES, la suma de los cheques debe igualar el monto");
    }
    if (medio === "MIXTO" && (cantidadCheques === 0 || sumaCheques.gte(monto))) {
        throw new HttpError(422, "Pago mixto: debe haber cheques por un monto menor al total");
    }
}
async function siguienteNumero(tx, sentido) {
    const clave = `pago-${sentido}`;
    const seq = await tx.secuencia.upsert({
        where: { clave },
        update: { valor: { increment: 1 } },
        create: { clave, valor: 1 },
    });
    return `${PREFIJO_POR_SENTIDO[sentido]}-${String(seq.valor).padStart(6, "0")}`;
}
/**
 * Registra un pago o cobro imputado a una o más facturas.
 * Reglas: la suma de imputaciones = monto; cada imputación no supera el saldo de su factura;
 * la factura es del mismo tercero y del sentido correcto; los cheques se crean junto al pago.
 */
export async function registrarPago(payload, usuarioId) {
    const d = pagoSchema.parse(payload);
    const monto = D(d.monto);
    const sumaImputaciones = d.imputaciones.reduce((acc, i) => acc.plus(i.monto), D(0));
    if (!sumaImputaciones.eq(monto)) {
        throw new HttpError(422, "La suma de las imputaciones no coincide con el monto del pago", {
            monto: monto.toFixed(2),
            imputado: sumaImputaciones.toFixed(2),
        });
    }
    const ids = d.imputaciones.map((i) => i.facturaId);
    if (new Set(ids).size !== ids.length) {
        throw new HttpError(422, "No podés imputar dos veces la misma factura en un mismo pago");
    }
    const sumaCheques = d.cheques.reduce((acc, c) => acc.plus(c.importe), D(0));
    validarMedio(d.medio, d.cheques.length, sumaCheques, monto);
    return prisma.$transaction(async (tx) => {
        // Bloqueo de filas: evita sobrepagar una factura con dos pagos simultáneos.
        await tx.$queryRaw `SELECT id FROM "Factura" WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`;
        const facturas = await tx.factura.findMany({ where: { id: { in: ids } } });
        if (facturas.length !== ids.length)
            throw new HttpError(404, "Alguna factura no existe");
        const direccion = DIRECCION_POR_SENTIDO[d.sentido];
        const montoPorFactura = new Map(d.imputaciones.map((i) => [i.facturaId, D(i.monto)]));
        for (const f of facturas) {
            if (f.terceroId !== d.terceroId) {
                throw new HttpError(422, `La factura ${f.numero} no pertenece al tercero indicado`);
            }
            if (f.direccion !== direccion) {
                throw new HttpError(422, `La factura ${f.numero} no corresponde a un pago ${d.sentido.toLowerCase()}`);
            }
            if (f.clase === "NOTA_CREDITO") {
                throw new HttpError(422, "Las notas de crédito no se imputan como pago");
            }
            if (f.estado === "ANULADA") {
                throw new HttpError(409, `La factura ${f.numero} está anulada`);
            }
            const saldo = D(f.total).minus(f.pagado);
            const aImputar = montoPorFactura.get(f.id);
            if (aImputar.gt(saldo)) {
                throw new HttpError(422, `El monto supera el saldo pendiente de la factura ${f.numero}`, {
                    saldo: saldo.toFixed(2),
                    intentado: aImputar.toFixed(2),
                });
            }
        }
        const pago = await tx.pago.create({
            data: {
                numero: await siguienteNumero(tx, d.sentido),
                fecha: d.fecha,
                sentido: d.sentido,
                terceroId: d.terceroId,
                monto,
                medio: d.medio,
                observaciones: d.observaciones,
                imputaciones: {
                    create: d.imputaciones.map((i) => ({ facturaId: i.facturaId, monto: D(i.monto) })),
                },
                cheques: {
                    create: d.cheques.map((c) => ({
                        tipo: d.sentido === "EMITIDO" ? "PROPIO" : "TERCERO",
                        numero: c.numero,
                        banco: c.banco,
                        importe: D(c.importe),
                        fechaEmision: c.fechaEmision,
                        fechaPago: c.fechaPago,
                        librador: c.librador,
                        cuitLibrador: c.cuitLibrador,
                        // Propio: ya entregado al proveedor. De tercero: queda en cartera hasta depositar o endosar.
                        estado: d.sentido === "EMITIDO" ? "ENTREGADO" : "EN_CARTERA",
                    })),
                },
            },
        });
        for (const f of facturas) {
            const nuevoPagado = D(f.pagado).plus(montoPorFactura.get(f.id));
            await tx.factura.update({
                where: { id: f.id },
                data: {
                    pagado: nuevoPagado,
                    estado: nuevoPagado.gte(f.total) ? "PAGADA" : "PARCIAL",
                },
            });
        }
        await tx.auditoria.create({
            data: { usuarioId, accion: "CREAR", entidad: "Pago", entidadId: pago.id },
        });
        return pago;
    });
}
export function listarPagos(filtros) {
    return prisma.pago.findMany({
        where: { terceroId: filtros.terceroId, sentido: filtros.sentido },
        include: {
            tercero: { select: { nombre: true } },
            imputaciones: {
                include: {
                    factura: { select: { clase: true, tipo: true, puntoVenta: true, numero: true, total: true } },
                },
            },
            cheques: true,
        },
        orderBy: { fecha: "desc" },
        take: 200,
    });
}
/**
 * Cuenta corriente de un tercero. Facturas y notas de débito suman (debe);
 * notas de crédito y pagos restan (haber). Saldo = debe − haber.
 */
export async function cuentaCorriente(terceroId, direccion) {
    const sentido = direccion === "COMPRA" ? "EMITIDO" : "RECIBIDO";
    const [facturas, pagos] = await Promise.all([
        prisma.factura.findMany({
            where: { terceroId, direccion, estado: { not: "ANULADA" } },
            select: { fecha: true, clase: true, tipo: true, puntoVenta: true, numero: true, total: true },
        }),
        prisma.pago.findMany({
            where: { terceroId, sentido },
            select: { fecha: true, numero: true, monto: true },
        }),
    ]);
    const movimientos = [
        ...facturas.map((f) => {
            const esNC = f.clase === "NOTA_CREDITO";
            const prefijo = esNC ? "NC" : f.clase === "NOTA_DEBITO" ? "ND" : "FAC";
            return {
                fecha: f.fecha,
                comprobante: `${prefijo}-${f.tipo} ${f.puntoVenta}-${f.numero}`,
                debe: esNC ? D(0) : D(f.total),
                haber: esNC ? D(f.total) : D(0),
            };
        }),
        ...pagos.map((p) => ({
            fecha: p.fecha,
            comprobante: p.numero,
            debe: D(0),
            haber: D(p.monto),
        })),
    ].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    let saldo = D(0);
    const filas = movimientos.map((m) => {
        saldo = saldo.plus(m.debe).minus(m.haber);
        return {
            fecha: m.fecha,
            comprobante: m.comprobante,
            debe: m.debe.toFixed(2),
            haber: m.haber.toFixed(2),
            saldo: saldo.toFixed(2),
        };
    });
    return { saldo: saldo.toFixed(2), movimientos: filas };
}
