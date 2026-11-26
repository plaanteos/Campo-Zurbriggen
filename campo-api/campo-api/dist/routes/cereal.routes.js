import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { D, montoSchema } from "../lib/dinero.js";
import { authorize } from "../middleware/auth.js";
const router = Router();
router.use(authorize("ADMIN", "ENCARGADO"));
const movimientoSchema = z.object({
    fecha: z.coerce.date(),
    cultivo: z.enum(["SOJA", "MAIZ", "TRIGO", "CEBADA", "GIRASOL", "SORGO", "OTRO"]),
    tipo: z.enum(["INGRESO", "EGRESO"]),
    kg: montoSchema,
    observaciones: z.string().optional(),
});
router.get("/movimientos", async (req, res) => {
    const { cultivo } = req.query;
    const movimientos = await prisma.movimientoCereal.findMany({
        where: { cultivo: typeof cultivo === "string" ? cultivo : undefined },
        orderBy: { fecha: "desc" },
        take: 200,
    });
    res.json(movimientos);
});
router.get("/stock", async (_req, res) => {
    const movimientos = await prisma.movimientoCereal.findMany();
    const porCultivo = new Map();
    for (const m of movimientos) {
        const fila = porCultivo.get(m.cultivo) ?? { ingresos: 0, egresos: 0 };
        const kg = Number(D(m.kg).toString());
        if (m.tipo === "INGRESO")
            fila.ingresos += kg;
        else
            fila.egresos += kg;
        porCultivo.set(m.cultivo, fila);
    }
    const filas = [...porCultivo.entries()].map(([cultivo, f]) => ({
        cultivo,
        ingresosKg: f.ingresos.toFixed(2),
        egresosKg: f.egresos.toFixed(2),
        stockKg: (f.ingresos - f.egresos).toFixed(2),
    }));
    const total = filas.reduce((acc, f) => acc + Number(f.stockKg), 0);
    res.json({ totalKg: total.toFixed(2), porCultivo: filas });
});
router.post("/movimientos", async (req, res) => {
    const d = movimientoSchema.parse(req.body);
    const movimiento = await prisma.movimientoCereal.create({
        data: { ...d, kg: D(d.kg) },
    });
    await prisma.auditoria.create({
        data: { usuarioId: req.usuario.id, accion: "CREAR", entidad: "MovimientoCereal", entidadId: movimiento.id },
    });
    res.status(201).json(movimiento);
});
export default router;
