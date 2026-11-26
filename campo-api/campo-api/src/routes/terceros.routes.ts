import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authorize } from "../middleware/auth.js";

const router = Router();

const terceroSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  cuit: z.string().regex(/^\d{2}-?\d{8}-?\d$/, "CUIT inválido (11 dígitos)"),
});

router.get("/", authorize("ADMIN", "ENCARGADO"), async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  const terceros = await prisma.tercero.findMany({
    where: q
      ? { OR: [{ nombre: { contains: q, mode: "insensitive" } }, { cuit: { contains: q } }] }
      : undefined,
    orderBy: { nombre: "asc" },
  });
  res.json(terceros);
});

router.post("/", authorize("ADMIN", "ENCARGADO"), async (req, res) => {
  const d = terceroSchema.parse(req.body);
  const tercero = await prisma.tercero.create({ data: d });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "CREAR", entidad: "Tercero", entidadId: tercero.id },
  });
  res.status(201).json(tercero);
});

router.patch("/:id", authorize("ADMIN"), async (req, res) => {
  const d = terceroSchema.partial().parse(req.body);
  const tercero = await prisma.tercero.update({ where: { id: String(req.params.id) }, data: d });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "EDITAR", entidad: "Tercero", entidadId: tercero.id },
  });
  res.json(tercero);
});

export default router;
