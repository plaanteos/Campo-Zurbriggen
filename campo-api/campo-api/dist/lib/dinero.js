import { Prisma } from "@prisma/client";
import { z } from "zod";
/** Decimal exacto para todo cálculo monetario. Nunca usar number para plata. */
export const D = (v) => new Prisma.Decimal(v);
/** Diferencia máxima tolerada al comparar importes (1 centavo). */
export const TOLERANCIA = D("0.01");
/** Alícuota general de IVA en Argentina. */
export const ALICUOTA_IVA = D("0.21");
/** Monto como string con hasta 2 decimales: "1234.50". */
export const montoSchema = z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Monto inválido (use punto y hasta 2 decimales)");
