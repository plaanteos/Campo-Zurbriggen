import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  const claveOk = usuario ? await bcrypt.compare(password, usuario.passwordHash) : false;
  if (!usuario || !usuario.activo || !claveOk) {
    throw new HttpError(401, "Credenciales inválidas");
  }

  const token = jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    process.env.JWT_SECRET!,
    { expiresIn: "12h" },
  );

  res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } });
});

router.get("/me", requireAuth, (req, res) => {
  res.json(req.usuario);
});

export default router;
