import { Router } from "express";
import { HttpError } from "../lib/errors.js";
import { authorize } from "../middleware/auth.js";
import { cuentaCorriente, listarPagos, registrarPago } from "../services/pagos.service.js";

const router = Router();

// Módulo financiero: solo administrador.
router.use(authorize("ADMIN"));

router.get("/", async (req, res) => {
  const { terceroId, sentido } = req.query;
  res.json(
    await listarPagos({
      terceroId: typeof terceroId === "string" ? terceroId : undefined,
      sentido: sentido === "EMITIDO" || sentido === "RECIBIDO" ? sentido : undefined,
    }),
  );
});

router.post("/", async (req, res) => {
  const pago = await registrarPago(req.body, req.usuario!.id);
  res.status(201).json(pago);
});

router.get("/cuenta-corriente", async (req, res) => {
  const { terceroId, direccion } = req.query;
  if (typeof terceroId !== "string") throw new HttpError(400, "terceroId es requerido");
  const dir = direccion === "VENTA" ? "VENTA" : "COMPRA";
  res.json(await cuentaCorriente(terceroId, dir));
});

export default router;
