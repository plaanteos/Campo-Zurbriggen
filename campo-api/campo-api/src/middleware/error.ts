import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Datos inválidos", detalles: err.flatten() });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, detalles: err.details });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    res.status(409).json({ error: "Ya existe un registro con esos datos únicos" });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    res.status(404).json({ error: "El registro no existe" });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
    res.status(409).json({ error: "El registro tiene movimientos asociados" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
};
