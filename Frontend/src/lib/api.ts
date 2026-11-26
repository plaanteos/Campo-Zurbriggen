const BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/api";

const TOKEN_KEY = "campo.token";
const SESION_KEY = "campo.sesion";

export class ApiError extends Error {
  status: number;
  detalles?: unknown;

  constructor(status: number, message: string, detalles?: unknown) {
    super(message);
    this.status = status;
    this.detalles = detalles;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESION_KEY);
}

export function guardarSesion(sesion: unknown, token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
}

export function leerSesion<T>(): T | null {
  const raw = localStorage.getItem(SESION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const texto = await res.text();
  const data = texto ? (JSON.parse(texto) as unknown) : {};

  if (!res.ok) {
    if (res.status === 401 && path !== "/auth/login") {
      clearSesion();
      window.dispatchEvent(new Event("campo:sesion-expirada"));
    }
    const cuerpo = data as { error?: string; detalles?: unknown };
    throw new ApiError(res.status, cuerpo.error ?? "Error de servidor", cuerpo.detalles);
  }

  return data as T;
}

export const apiGet = <T>(path: string) => api<T>(path);

export const apiPost = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });

export const apiPatch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });

export const apiDelete = <T>(path: string) => api<T>(path, { method: "DELETE" });
