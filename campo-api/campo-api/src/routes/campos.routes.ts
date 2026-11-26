import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { D } from "../lib/dinero.js";
import { authorize } from "../middleware/auth.js";

const router = Router();

router.use(authorize("ADMIN", "ENCARGADO"));

const establecimientoSchema = z.object({
  nombre: z.string().min(1),
  localidad: z.string().min(1),
  hectareas: z.coerce.number().positive(),
});

const loteSchema = z.object({
  nombre: z.string().min(1),
  hectareas: z.coerce.number().positive(),
});

const campaniaSchema = z.object({
  nombre: z.string().min(1),
});

const asociarSchema = z.object({
  campaniaId: z.string().min(1),
  cultivo: z.enum(["SOJA", "MAIZ", "TRIGO", "CEBADA", "GIRASOL", "SORGO", "OTRO"]),
  sembradoHa: z.coerce.number().nonnegative(),
  fechaSiembra: z.coerce.date().optional(),
});

const loteCampaniaInclude = {
  lote: { include: { establecimiento: true } },
  campania: { select: { nombre: true } },
} as const;

router.get("/establecimientos", async (_req, res) => {
  const establecimientos = await prisma.establecimiento.findMany({
    include: { lotes: { include: { campanias: { include: loteCampaniaInclude } } } },
    orderBy: { nombre: "asc" },
  });
  res.json(establecimientos);
});

router.post("/establecimientos", async (req, res) => {
  const d = establecimientoSchema.parse(req.body);
  const creado = await prisma.establecimiento.create({
    data: { ...d, hectareas: D(d.hectareas.toFixed(2)) },
    include: { lotes: true },
  });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "CREAR", entidad: "Establecimiento", entidadId: creado.id },
  });
  res.status(201).json(creado);
});

router.patch("/establecimientos/:id", async (req, res) => {
  const d = establecimientoSchema.partial().parse(req.body);
  const actualizado = await prisma.establecimiento.update({
    where: { id: req.params.id },
    data: { ...d, hectareas: d.hectareas ? D(d.hectareas.toFixed(2)) : undefined },
    include: { lotes: true },
  });
  res.json(actualizado);
});

router.post("/establecimientos/:id/lotes", async (req, res) => {
  const d = loteSchema.parse(req.body);
  const lote = await prisma.lote.create({
    data: {
      establecimientoId: req.params.id,
      nombre: d.nombre,
      hectareas: D(d.hectareas.toFixed(2)),
    },
  });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "CREAR", entidad: "Lote", entidadId: lote.id },
  });
  res.status(201).json(lote);
});

router.get("/campanias", async (_req, res) => {
  res.json(await prisma.campania.findMany({ orderBy: { nombre: "desc" } }));
});

router.post("/campanias", async (req, res) => {
  const d = campaniaSchema.parse(req.body);
  const campania = await prisma.campania.create({ data: d });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "CREAR", entidad: "Campania", entidadId: campania.id },
  });
  res.status(201).json(campania);
});

router.get("/lotes-campania", async (_req, res) => {
  const filas = await prisma.loteCampania.findMany({
    include: loteCampaniaInclude,
    orderBy: [{ lote: { nombre: "asc" } }],
  });
  res.json(filas);
});

router.post("/lotes/:id/campanias", async (req, res) => {
  const d = asociarSchema.parse(req.body);
  const fila = await prisma.loteCampania.upsert({
    where: { loteId_campaniaId: { loteId: req.params.id, campaniaId: d.campaniaId } },
    update: { cultivo: d.cultivo, sembradoHa: D(d.sembradoHa.toFixed(2)), fechaSiembra: d.fechaSiembra },
    create: {
      loteId: req.params.id,
      campaniaId: d.campaniaId,
      cultivo: d.cultivo,
      sembradoHa: D(d.sembradoHa.toFixed(2)),
      fechaSiembra: d.fechaSiembra,
    },
    include: loteCampaniaInclude,
  });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "CREAR", entidad: "LoteCampania", entidadId: fila.id },
  });
  res.status(201).json(fila);
});

export default router;
