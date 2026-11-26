import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { D, montoSchema } from "../lib/dinero.js";
import { authorize } from "../middleware/auth.js";

const router = Router();

router.use(authorize("ADMIN", "ENCARGADO"));

const servicioSchema = z.object({
  fecha: z.coerce.date(),
  labor: z.string().min(1),
  tipo: z.enum(["PROPIO", "CONTRATADO"]),
  estado: z.enum(["PENDIENTE", "EN_EJECUCION", "FINALIZADO"]).optional(),
  costo: montoSchema,
  loteCampaniaId: z.string().min(1).optional(),
  terceroId: z.string().min(1).optional(),
  observaciones: z.string().optional(),
});

const include = {
  loteCampania: { include: { lote: { include: { establecimiento: true } }, campania: true } },
  tercero: { select: { id: true, nombre: true } },
} as const;

router.get("/", async (req, res) => {
  const { loteCampaniaId } = req.query;
  const servicios = await prisma.servicioAgro.findMany({
    where: { loteCampaniaId: typeof loteCampaniaId === "string" ? loteCampaniaId : undefined },
    include,
    orderBy: { fecha: "desc" },
  });
  res.json(servicios);
});

router.post("/", async (req, res) => {
  const d = servicioSchema.parse(req.body);
  const servicio = await prisma.servicioAgro.create({
    data: { ...d, costo: D(d.costo) },
    include,
  });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "CREAR", entidad: "ServicioAgro", entidadId: servicio.id },
  });
  res.status(201).json(servicio);
});

router.patch("/:id", async (req, res) => {
  const d = servicioSchema.partial().parse(req.body);
  const servicio = await prisma.servicioAgro.update({
    where: { id: req.params.id },
    data: { ...d, costo: d.costo ? D(d.costo) : undefined },
    include,
  });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "EDITAR", entidad: "ServicioAgro", entidadId: servicio.id },
  });
  res.json(servicio);
});

router.delete("/:id", async (req, res) => {
  await prisma.servicioAgro.delete({ where: { id: req.params.id } });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "BORRAR", entidad: "ServicioAgro", entidadId: req.params.id },
  });
  res.json({ ok: true });
});

export default router;
