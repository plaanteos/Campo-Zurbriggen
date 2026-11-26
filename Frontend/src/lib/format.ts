export const num = (v: string | number | null | undefined) => Number(v ?? 0);

export const money = (value: string | number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(num(value));

export const money2 = (value: string | number) =>
  new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num(value));

export const numero = (value: string | number, decimals = 0) =>
  new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num(value));

export const kg = (value: string | number) => `${numero(value, 0)} kg`;

export const tn = (value: string | number) => `${numero(num(value) / 1000, 1)} tn`;

export const fecha = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const fechaCorta = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }).toUpperCase();
};

export const hora = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
};

export const fechaInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export const comprobante = (f: {
  clase?: string;
  tipo: string;
  puntoVenta: string;
  numero: string;
}) => {
  const prefijo = f.clase === "NOTA_CREDITO" ? "NC" : f.clase === "NOTA_DEBITO" ? "ND" : "FAC";
  return `${prefijo}-${f.tipo} ${f.puntoVenta}-${f.numero}`;
};

export const ETIQUETA_CULTIVO: Record<string, string> = {
  SOJA: "Soja",
  MAIZ: "Maíz",
  TRIGO: "Trigo",
  CEBADA: "Cebada",
  GIRASOL: "Girasol",
  SORGO: "Sorgo",
  OTRO: "Otro",
};

export const ETIQUETA_CATEGORIA: Record<string, string> = {
  AGROQUIMICO: "Agroquímicos",
  FERTILIZANTE: "Fertilizantes",
  SEMILLA: "Semillas",
  COMBUSTIBLE: "Combustible",
  OTRO: "Otros",
};

export const ETIQUETA_ESTADO_SERVICIO: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_EJECUCION: "En ejecución",
  FINALIZADO: "Finalizado",
};

export const ETIQUETA_ESTADO_CARGA: Record<string, string> = {
  EN_TRANSITO: "En tránsito",
  ENTREGADA: "Entregada",
};

export const ETIQUETA_MEDIO: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  CHEQUES: "Cheques",
  MIXTO: "Mixto",
};

export const ETIQUETA_ESTADO_CHEQUE: Record<string, string> = {
  EN_CARTERA: "En cartera",
  DEPOSITADO: "Depositado",
  COBRADO: "Cobrado",
  RECHAZADO: "Rechazado",
  ENTREGADO: "Entregado",
  ANULADO: "Anulado",
};

export const ETIQUETA_ESTADO_REMITO: Record<string, string> = {
  PENDIENTE_FACTURA: "Sin facturar",
  FACTURADO: "Facturado",
  ANULADO: "Anulado",
};
