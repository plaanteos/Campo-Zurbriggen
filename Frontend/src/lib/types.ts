export type Rol = "ADMIN" | "ENCARGADO";

export interface Sesion {
  id: string;
  nombre: string;
  rol: Rol;
}

export interface Tercero {
  id: string;
  nombre: string;
  cuit: string;
}

export interface Remito {
  id: string;
  tipo: "COMPRA" | "ENTREGA" | "TRASLADO";
  numero: string;
  fecha: string;
  terceroId: string;
  importe: string;
  estado: "PENDIENTE_FACTURA" | "FACTURADO" | "ANULADO";
  tercero?: { nombre: string; cuit: string };
}

export interface Factura {
  id: string;
  direccion: "COMPRA" | "VENTA";
  clase: "FACTURA" | "NOTA_CREDITO" | "NOTA_DEBITO";
  tipo: "A" | "B" | "C";
  puntoVenta: string;
  numero: string;
  fecha: string;
  vencimiento: string | null;
  terceroId: string;
  neto: string;
  iva: string;
  total: string;
  pagado: string;
  estado: "PENDIENTE" | "PARCIAL" | "PAGADA" | "ANULADA";
  tercero?: { nombre: string; cuit: string };
  remitos?: { remito: { numero: string; importe: string } }[];
}

export interface Imputacion {
  id: string;
  monto: string;
  factura: { clase: string; tipo: string; puntoVenta: string; numero: string; total: string };
}

export interface Cheque {
  id: string;
  tipo: "PROPIO" | "TERCERO";
  numero: string;
  banco: string;
  importe: string;
  fechaEmision: string;
  fechaPago: string;
  librador: string | null;
  cuitLibrador: string | null;
  estado: "EN_CARTERA" | "DEPOSITADO" | "COBRADO" | "RECHAZADO" | "ENTREGADO" | "ANULADO";
  pago?: { tercero: { nombre: string } } | null;
}

export interface Pago {
  id: string;
  numero: string;
  fecha: string;
  sentido: "EMITIDO" | "RECIBIDO";
  terceroId: string;
  monto: string;
  medio: "EFECTIVO" | "TRANSFERENCIA" | "CHEQUES" | "MIXTO";
  observaciones: string | null;
  tercero: { nombre: string };
  imputaciones: Imputacion[];
  cheques: Cheque[];
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
}

export interface Lote {
  id: string;
  nombre: string;
  hectareas: string;
  campanias?: LoteCampania[];
}

export interface Establecimiento {
  id: string;
  nombre: string;
  localidad: string;
  hectareas: string;
  lotes: Lote[];
}

export interface LoteCampania {
  id: string;
  loteId: string;
  campaniaId: string;
  cultivo: string;
  sembradoHa: string;
  fechaSiembra?: string | null;
  lote: { nombre: string; establecimiento: { nombre: string } };
  campania: { nombre: string };
}

export interface Campania {
  id: string;
  nombre: string;
  activa: boolean;
}

export interface Servicio {
  id: string;
  fecha: string;
  labor: string;
  tipo: "PROPIO" | "CONTRATADO";
  estado: "PENDIENTE" | "EN_EJECUCION" | "FINALIZADO";
  costo: string;
  loteCampaniaId: string | null;
  terceroId: string | null;
  observaciones: string | null;
  loteCampania?: LoteCampania | null;
  tercero?: { id: string; nombre: string } | null;
}

export interface Cosecha {
  id: string;
  fecha: string;
  loteCampaniaId: string;
  kg: string;
  estado: "EN_TRANSITO" | "ENTREGADA";
  loteCampania: LoteCampania;
  camion: { patente: string };
  transportista?: { id: string; nombre: string } | null;
  destino?: { id: string; nombre: string } | null;
}

export interface MovimientoInsumo {
  id: string;
  fecha: string;
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
  cantidad: string;
  deposito: string;
  referencia: string | null;
}

export interface Insumo {
  id: string;
  nombre: string;
  categoria: "AGROQUIMICO" | "FERTILIZANTE" | "SEMILLA" | "COMBUSTIBLE" | "OTRO";
  unidad: string;
  stock: string;
  deposito: string | null;
  movimientos: MovimientoInsumo[];
}

export interface MovimientoCereal {
  id: string;
  fecha: string;
  cultivo: string;
  tipo: "INGRESO" | "EGRESO";
  kg: string;
  observaciones: string | null;
}

export interface StockCereal {
  totalKg: string;
  porCultivo: { cultivo: string; ingresosKg: string; egresosKg: string; stockKg: string }[];
}

export interface CuentaCorriente {
  saldo: string;
  movimientos: { fecha: string; comprobante: string; debe: string; haber: string; saldo: string }[];
}

export interface Dashboard {
  ingresosMes: string;
  egresosMes: string;
  porCobrar: string;
  porPagar: string;
  vencidas: number;
  facturasMes: number;
  remitosPendientes: number;
  cargasTransito: number;
  cargasMes: number;
  flujo: { mes: string; ingresos: string; egresos: string }[];
  vencimientos: { id: string; vencimiento: string; tercero: string; comprobante: string; saldo: string }[];
  stockCereal: { totalKg: string; porCultivo: { cultivo: string; kg: string }[] };
  superficieHa: string;
  actividades: { id: string; accion: string; entidad: string; usuario: string; createdAt: string }[];
}
