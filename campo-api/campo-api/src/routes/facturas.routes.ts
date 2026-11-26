import { Router } from "express";
import { authorize } from "../middleware/auth.js";
import { anularFactura, crearFactura, listarFacturas } from "../services/facturas.service.js";

const router = Router();

// Módulo financiero: solo administrador.
router.use(authorize("ADMIN"));

router.get("/", async (req, res) => {
  const terceroId = typeof req.query.terceroId === "string" ? req.query.terceroId : undefined;
  res.json(await listarFacturas({ terceroId }));
});

router.post("/", async (req, res) => {
  const factura = await crearFactura(req.body, req.usuario!.id);
  res.status(201).json(factura);
});

router.post("/:id/anular", async (req, res) => {
  res.json(await anularFactura(req.params.id, req.usuario!.id));
});

export default router;
