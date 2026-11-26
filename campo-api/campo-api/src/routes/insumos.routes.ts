import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { D } from "../lib/dinero.js";
import { authorize } from "../middleware/auth.js";

const router = Router();

router.use(authorize("ADMIN", "ENCARGADO"));

const insumoSchema = z.object({
  nombre: z.string().min(1),
  categoria: z.enum(["AGROQUIMICO", "FERTILIZANTE", "SEMILLA", "COMBUSTIBLE", "OTRO"]),
  unidad: z.string().min(1),
});

const movimientoSchema = z.object({
  fecha: z.coerce.date(),
  tipo: z.enum(["ENTRADA", "SALIDA", "AJUSTE"]),
  cantidad: z.coerce.number().positive(),
  deposito: z.string().min(1),
  referencia: z.string().optional(),
});

function calcularStock(movimientos: { tipo: string; cantidad: unknown }[]) {
  let stock = D(0);
  for (const m of movimientos) {
    const cantidad = D(m.cantidad as never);
    if (m.tipo === "ENTRADA") stock = stock.plus(cantidad);
    else if (m.tipo === "SALIDA") stock = stock.minus(cantidad);
    else stock = stock.plus(cantidad);
  }
  return stock;
}

router.get("/", async (_req, res) => {
  const insumos = await prisma.insumo.findMany({
    include: { movimientos: { orderBy: { fecha: "desc" } } },
    orderBy: { nombre: "asc" },
  });
  res.json(
    insumos.map((i) => {
      const stock = calcularStock(i.movimientos);
      const ultimo = i.movimientos[0];
      return {
        id: i.id,
        nombre: i.nombre,
        categoria: i.categoria,
        unidad: i.unidad,
        stock: stock.toFixed(3),
        deposito: ultimo?.deposito ?? null,
        movimientos: i.movimientos,
      };
    }),
  );
});

router.post("/", async (req, res) => {
  const d = insumoSchema.parse(req.body);
  const insumo = await prisma.insumo.create({ data: d });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "CREAR", entidad: "Insumo", entidadId: insumo.id },
  });
  res.status(201).json(insumo);
});

router.get("/movimientos", async (req, res) => {
  const { insumoId } = req.query;
  const movimientos = await prisma.movimientoInsumo.findMany({
    where: { insumoId: typeof insumoId === "string" ? insumoId : undefined },
    include: { insumo: { select: { nombre: true, unidad: true } } },
    orderBy: { fecha: "desc" },
    take: 200,
  });
  res.json(movimientos);
});

router.post("/:id/movimientos", async (req, res) => {
  const d = movimientoSchema.parse(req.body);
  const movimiento = await prisma.movimientoInsumo.create({
    data: { insumoId: req.params.id, ...d, cantidad: D(d.cantidad.toFixed(3)) },
    include: { insumo: { select: { nombre: true, unidad: true } } },
  });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "CREAR", entidad: "MovimientoInsumo", entidadId: movimiento.id },
  });
  res.status(201).json(movimiento);
});

export default router;
