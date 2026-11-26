import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../lib/errors.js";

export type Rol = "ADMIN" | "ENCARGADO";

export interface SesionUsuario {
  id: string;
  nombre: string;
  rol: Rol;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: SesionUsuario;
    }
  }
}

/** Verifica el JWT del header Authorization: Bearer <token>. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, "Token requerido"));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as SesionUsuario;
    req.usuario = { id: payload.id, nombre: payload.nombre, rol: payload.rol };
    next();
  } catch {
    next(new HttpError(401, "Sesión inválida o vencida"));
  }
}

/** Restringe una ruta a los roles indicados. Debe ir después de requireAuth. */
export function authorize(...roles: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario) return next(new HttpError(401, "No autenticado"));
    if (!roles.includes(req.usuario.rol)) {
      return next(new HttpError(403, "No tenés permisos para esta acción"));
    }
    next();
  };
}
