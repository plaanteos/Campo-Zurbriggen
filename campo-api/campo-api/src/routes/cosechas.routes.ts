import { Router } from "express";
import { Prisma, type Cultivo } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { D, montoSchema } from "../lib/dinero.js";
import { HttpError } from "../lib/errors.js";
import { authorize } from "../middleware/auth.js";

const router = Router();

router.use(authorize("ADMIN", "ENCARGADO"));

const cargaSchema = z.object({
  fecha: z.coerce.date(),
  loteCampaniaId: z.string().min(1),
  patente: z.string().min(3),
  transportistaId: z.string().min(1).optional(),
  destinoId: z.string().min(1).optional(),
  kg: montoSchema,
  estado: z.enum(["EN_TRANSITO", "ENTREGADA"]).default("EN_TRANSITO"),
});

const include = {
  loteCampania: { include: { lote: { include: { establecimiento: true } }, campania: true } },
  camion: true,
  transportista: { select: { id: true, nombre: true } },
  destino: { select: { id: true, nombre: true } },
} as const;

async function registrarIngreso(
  tx: Prisma.TransactionClient,
  carga: { id: string; fecha: Date; kg: Prisma.Decimal },
  cultivo: Cultivo,
) {
  await tx.movimientoCereal.create({
    data: {
      fecha: carga.fecha,
      cultivo,
      tipo: "INGRESO",
      kg: carga.kg,
      cargaId: carga.id,
      observaciones: "Ingreso automático por carga de cosecha entregada",
    },
  });
}

router.get("/", async (_req, res) => {
  const cargas = await prisma.cargaCosecha.findMany({ include, orderBy: { fecha: "desc" } });
  res.json(cargas);
});

router.post("/", async (req, res) => {
  const d = cargaSchema.parse(req.body);

  const carga = await prisma.$transaction(async (tx) => {
    const loteCampania = await tx.loteCampania.findUnique({
      where: { id: d.loteCampaniaId },
      include: { lote: { include: { establecimiento: true } }, campania: true },
    });
    if (!loteCampania) throw new HttpError(404, "Lote/campaña no encontrado");

    const camion = await tx.camion.upsert({
      where: { patente: d.patente.toUpperCase() },
      update: {},
      create: { patente: d.patente.toUpperCase() },
    });

    const creada = await tx.cargaCosecha.create({
      data: {
        fecha: d.fecha,
        loteCampaniaId: d.loteCampaniaId,
        camionId: camion.id,
        transportistaId: d.transportistaId,
        destinoId: d.destinoId,
        kg: D(d.kg),
        estado: d.estado,
      },
      include,
    });

    if (d.estado === "ENTREGADA") await registrarIngreso(tx, creada, loteCampania.cultivo);

    await tx.auditoria.create({
      data: { usuarioId: req.usuario!.id, accion: "CREAR", entidad: "CargaCosecha", entidadId: creada.id },
    });

    return creada;
  });

  res.status(201).json(carga);
});

router.patch("/:id/entregar", async (req, res) => {
  const carga = await prisma.$transaction(async (tx) => {
    const actual = await tx.cargaCosecha.findUnique({
      where: { id: req.params.id },
      include: { loteCampania: true },
    });
    if (!actual) throw new HttpError(404, "Carga no encontrada");
    if (actual.estado === "ENTREGADA") throw new HttpError(409, "La carga ya está entregada");

    const actualizada = await tx.cargaCosecha.update({
      where: { id: actual.id },
      data: { estado: "ENTREGADA" },
      include,
    });
    await registrarIngreso(tx, actualizada, actual.loteCampania.cultivo);
    await tx.auditoria.create({
      data: { usuarioId: req.usuario!.id, accion: "EDITAR", entidad: "CargaCosecha", entidadId: actual.id },
    });
    return actualizada;
  });
  res.json(carga);
});

export default router;
