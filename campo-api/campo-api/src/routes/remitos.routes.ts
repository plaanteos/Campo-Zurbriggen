import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { D, montoSchema } from "../lib/dinero.js";
import { authorize } from "../middleware/auth.js";

const router = Router();

// El encargado puede cargar y consultar remitos; no los modifica ni anula.
router.use(authorize("ADMIN", "ENCARGADO"));

const remitoSchema = z.object({
  tipo: z.enum(["COMPRA", "ENTREGA", "TRASLADO"]),
  numero: z.string().regex(/^\d{4}-\d{8}$/, "Formato esperado 0000-00000000"),
  fecha: z.coerce.date(),
  terceroId: z.string().min(1),
  importe: montoSchema,
});

router.get("/", async (req, res) => {
  const { terceroId, pendientes } = req.query;
  const remitos = await prisma.remito.findMany({
    where: {
      terceroId: typeof terceroId === "string" ? terceroId : undefined,
      estado: pendientes === "true" ? "PENDIENTE_FACTURA" : undefined,
    },
    include: { tercero: { select: { nombre: true, cuit: true } } },
    orderBy: { fecha: "desc" },
  });
  res.json(remitos);
});

router.post("/", async (req, res) => {
  const d = remitoSchema.parse(req.body);
  const remito = await prisma.remito.create({
    data: { ...d, importe: D(d.importe) },
  });
  await prisma.auditoria.create({
    data: { usuarioId: req.usuario!.id, accion: "CREAR", entidad: "Remito", entidadId: remito.id },
  });
  res.status(201).json(remito);
});

export default router;
