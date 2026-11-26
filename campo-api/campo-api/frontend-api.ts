// Cliente HTTP para el frontend: copiar a Frontend/src/lib/api.ts
const BASE_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  status: number;
  detalles?: unknown;

  constructor(status: number, message: string, detalles?: unknown) {
    super(message);
    this.status = status;
    this.detalles = detalles;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Error de servidor", data.detalles);
  return data as T;
}
