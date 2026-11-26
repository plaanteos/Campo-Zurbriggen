import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/errors.js";
import { authorize } from "../middleware/auth.js";
const router = Router();
router.use(authorize("ADMIN"));
const crearSchema = z.object({
    nombre: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6, "La clave debe tener al menos 6 caracteres"),
    rol: z.enum(["ADMIN", "ENCARGADO"]).default("ENCARGADO"),
});
const editarSchema = z.object({
    nombre: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    rol: z.enum(["ADMIN", "ENCARGADO"]).optional(),
    activo: z.boolean().optional(),
});
const seleccion = {
    id: true,
    nombre: true,
    email: true,
    rol: true,
    activo: true,
    createdAt: true,
};
router.get("/", async (_req, res) => {
    res.json(await prisma.usuario.findMany({ select: seleccion, orderBy: { nombre: "asc" } }));
});
router.post("/", async (req, res) => {
    const d = crearSchema.parse(req.body);
    const usuario = await prisma.usuario.create({
        data: { nombre: d.nombre, email: d.email, rol: d.rol, passwordHash: await bcrypt.hash(d.password, 12) },
        select: seleccion,
    });
    await prisma.auditoria.create({
        data: { usuarioId: req.usuario.id, accion: "CREAR", entidad: "Usuario", entidadId: usuario.id },
    });
    res.status(201).json(usuario);
});
router.patch("/:id", async (req, res) => {
    const d = editarSchema.parse(req.body);
    if (req.params.id === req.usuario.id && d.activo === false) {
        throw new HttpError(422, "No podés desactivar tu propio usuario");
    }
    const usuario = await prisma.usuario.update({
        where: { id: req.params.id },
        data: {
            nombre: d.nombre,
            email: d.email,
            rol: d.rol,
            activo: d.activo,
            passwordHash: d.password ? await bcrypt.hash(d.password, 12) : undefined,
        },
        select: seleccion,
    });
    await prisma.auditoria.create({
        data: { usuarioId: req.usuario.id, accion: "EDITAR", entidad: "Usuario", entidadId: usuario.id },
    });
    res.json(usuario);
});
export default router;
