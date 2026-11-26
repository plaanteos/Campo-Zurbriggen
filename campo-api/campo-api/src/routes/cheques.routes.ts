import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { D, montoSchema } from "../lib/dinero.js";
import { authorize } from "../middleware/auth.js";

const router = Router();

router.use(authorize("ADMIN"));

const chequeSchema = z.object({
  tipo: z.enum(["PROPIO", "TERCERO"]),
  numero: z.string().min(1),
  banco: z.string().min(1),
  importe: montoSchema,
  fechaEmision: z.coerce.date(),
  fechaPago: z.coerce.date(),
  librador: z.string().optional(),
  cuitLibrador: z.string().optional(),
  estado: z.enum(["EN_CARTERA", "DEPOSITADO", "COBRADO", "RECHAZADO", "ENTREGADO", "ANULADO"]).optional(),
});

router.get("/", async (req, res) => {
  const { estado, tipo } = req.query;
  const cheques = await prisma.cheque.findMany({
    where: {
      estado: typeof estado === "string" ? (estado as never) : undefined,
      tipo: typeof tipo === "string" ? (tipo as never) : undefined,
    },
    include: { pago: { include: { tercero: { select: { nombre: true } } } } },
    orderBy: { fechaPago: "asc" },
  });
  res.json(cheques);
});

router.post("/", async (req, res) => {
  const d = chequeSchema.parse(req.body);
  const cheque = await prisma.cheque.create({
    data: {
      ...d,
      importe: D(d.importe),
      estado: d.estado ?? (d.tipo === "TERCERO" ? "EN_CARTERA" : "ENTREGADO"),
    },
  });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "CREAR", entidad: "Cheque", entidadId: cheque.id },
  });
  res.status(201).json(cheque);
});

router.patch("/:id/estado", async (req, res) => {
  const { estado } = z
    .object({
      estado: z.enum(["EN_CARTERA", "DEPOSITADO", "COBRADO", "RECHAZADO", "ENTREGADO", "ANULADO"]),
    })
    .parse(req.body);
  const cheque = await prisma.cheque.update({ where: { id: req.params.id }, data: { estado } });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "EDITAR", entidad: "Cheque", entidadId: cheque.id },
  });
  res.json(cheque);
});

export default router;
