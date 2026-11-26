-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'ENCARGADO');

-- CreateEnum
CREATE TYPE "Cultivo" AS ENUM ('SOJA', 'MAIZ', 'TRIGO', 'CEBADA', 'GIRASOL', 'SORGO', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoServicio" AS ENUM ('PROPIO', 'CONTRATADO');

-- CreateEnum
CREATE TYPE "EstadoServicio" AS ENUM ('PENDIENTE', 'EN_EJECUCION', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "EstadoCarga" AS ENUM ('EN_TRANSITO', 'ENTREGADA');

-- CreateEnum
CREATE TYPE "TipoMovCereal" AS ENUM ('INGRESO', 'EGRESO');

-- CreateEnum
CREATE TYPE "CategoriaInsumo" AS ENUM ('AGROQUIMICO', 'FERTILIZANTE', 'SEMILLA', 'COMBUSTIBLE', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoMovInsumo" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "TipoRemito" AS ENUM ('COMPRA', 'ENTREGA', 'TRASLADO');

-- CreateEnum
CREATE TYPE "EstadoRemito" AS ENUM ('PENDIENTE_FACTURA', 'FACTURADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "DireccionComprobante" AS ENUM ('COMPRA', 'VENTA');

-- CreateEnum
CREATE TYPE "ClaseComprobante" AS ENUM ('FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO');

-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "SentidoPago" AS ENUM ('EMITIDO', 'RECIBIDO');

-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUES', 'MIXTO');

-- CreateEnum
CREATE TYPE "TipoCheque" AS ENUM ('PROPIO', 'TERCERO');

-- CreateEnum
CREATE TYPE "EstadoCheque" AS ENUM ('EN_CARTERA', 'DEPOSITADO', 'COBRADO', 'RECHAZADO', 'ENTREGADO', 'ANULADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ENCARGADO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Secuencia" (
    "clave" TEXT NOT NULL,
    "valor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Secuencia_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "Tercero" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,

    CONSTRAINT "Tercero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Establecimiento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "hectareas" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "Establecimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lote" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "hectareas" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campania" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Campania_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoteCampania" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "campaniaId" TEXT NOT NULL,
    "cultivo" "Cultivo" NOT NULL,
    "sembradoHa" DECIMAL(10,2) NOT NULL,
    "fechaSiembra" TIMESTAMP(3),

    CONSTRAINT "LoteCampania_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicioAgro" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "labor" TEXT NOT NULL,
    "tipo" "TipoServicio" NOT NULL,
    "estado" "EstadoServicio" NOT NULL DEFAULT 'PENDIENTE',
    "costo" DECIMAL(14,2) NOT NULL,
    "loteCampaniaId" TEXT,
    "terceroId" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicioAgro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camion" (
    "id" TEXT NOT NULL,
    "patente" TEXT NOT NULL,

    CONSTRAINT "Camion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CargaCosecha" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "loteCampaniaId" TEXT NOT NULL,
    "camionId" TEXT NOT NULL,
    "transportistaId" TEXT,
    "destinoId" TEXT,
    "kg" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoCarga" NOT NULL DEFAULT 'EN_TRANSITO',
    "remitoId" TEXT,

    CONSTRAINT "CargaCosecha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCereal" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cultivo" "Cultivo" NOT NULL,
    "tipo" "TipoMovCereal" NOT NULL,
    "kg" DECIMAL(12,2) NOT NULL,
    "cargaId" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoCereal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insumo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaInsumo" NOT NULL,
    "unidad" TEXT NOT NULL,

    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInsumo" (
    "id" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoMovInsumo" NOT NULL,
    "cantidad" DECIMAL(14,3) NOT NULL,
    "deposito" TEXT NOT NULL,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoInsumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Remito" (
    "id" TEXT NOT NULL,
    "tipo" "TipoRemito" NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "terceroId" TEXT NOT NULL,
    "importe" DECIMAL(14,2) NOT NULL,
    "estado" "EstadoRemito" NOT NULL DEFAULT 'PENDIENTE_FACTURA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Remito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL,
    "direccion" "DireccionComprobante" NOT NULL DEFAULT 'COMPRA',
    "clase" "ClaseComprobante" NOT NULL DEFAULT 'FACTURA',
    "tipo" "TipoComprobante" NOT NULL,
    "puntoVenta" VARCHAR(4) NOT NULL,
    "numero" VARCHAR(8) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "vencimiento" TIMESTAMP(3),
    "terceroId" TEXT NOT NULL,
    "neto" DECIMAL(14,2) NOT NULL,
    "iva" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "pagado" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "estado" "EstadoFactura" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaRemito" (
    "facturaId" TEXT NOT NULL,
    "remitoId" TEXT NOT NULL,

    CONSTRAINT "FacturaRemito_pkey" PRIMARY KEY ("facturaId","remitoId")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "sentido" "SentidoPago" NOT NULL,
    "terceroId" TEXT NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "medio" "MedioPago" NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImputacionPago" (
    "id" TEXT NOT NULL,
    "pagoId" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "ImputacionPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cheque" (
    "id" TEXT NOT NULL,
    "tipo" "TipoCheque" NOT NULL,
    "numero" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "importe" DECIMAL(14,2) NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "librador" TEXT,
    "cuitLibrador" TEXT,
    "estado" "EstadoCheque" NOT NULL,
    "pagoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cheque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Auditoria_entidad_entidadId_idx" ON "Auditoria"("entidad", "entidadId");

-- CreateIndex
CREATE UNIQUE INDEX "Tercero_cuit_key" ON "Tercero"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "Lote_establecimientoId_nombre_key" ON "Lote"("establecimientoId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Campania_nombre_key" ON "Campania"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "LoteCampania_loteId_campaniaId_key" ON "LoteCampania"("loteId", "campaniaId");

-- CreateIndex
CREATE UNIQUE INDEX "Camion_patente_key" ON "Camion"("patente");

-- CreateIndex
CREATE UNIQUE INDEX "CargaCosecha_remitoId_key" ON "CargaCosecha"("remitoId");

-- CreateIndex
CREATE UNIQUE INDEX "Remito_terceroId_numero_key" ON "Remito"("terceroId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_terceroId_clase_tipo_puntoVenta_numero_key" ON "Factura"("terceroId", "clase", "tipo", "puntoVenta", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_numero_key" ON "Pago"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Cheque_tipo_banco_numero_key" ON "Cheque"("tipo", "banco", "numero");

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "Establecimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteCampania" ADD CONSTRAINT "LoteCampania_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteCampania" ADD CONSTRAINT "LoteCampania_campaniaId_fkey" FOREIGN KEY ("campaniaId") REFERENCES "Campania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioAgro" ADD CONSTRAINT "ServicioAgro_loteCampaniaId_fkey" FOREIGN KEY ("loteCampaniaId") REFERENCES "LoteCampania"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioAgro" ADD CONSTRAINT "ServicioAgro_terceroId_fkey" FOREIGN KEY ("terceroId") REFERENCES "Tercero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaCosecha" ADD CONSTRAINT "CargaCosecha_loteCampaniaId_fkey" FOREIGN KEY ("loteCampaniaId") REFERENCES "LoteCampania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaCosecha" ADD CONSTRAINT "CargaCosecha_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "Camion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaCosecha" ADD CONSTRAINT "CargaCosecha_transportistaId_fkey" FOREIGN KEY ("transportistaId") REFERENCES "Tercero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaCosecha" ADD CONSTRAINT "CargaCosecha_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "Tercero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaCosecha" ADD CONSTRAINT "CargaCosecha_remitoId_fkey" FOREIGN KEY ("remitoId") REFERENCES "Remito"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCereal" ADD CONSTRAINT "MovimientoCereal_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "CargaCosecha"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInsumo" ADD CONSTRAINT "MovimientoInsumo_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remito" ADD CONSTRAINT "Remito_terceroId_fkey" FOREIGN KEY ("terceroId") REFERENCES "Tercero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_terceroId_fkey" FOREIGN KEY ("terceroId") REFERENCES "Tercero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaRemito" ADD CONSTRAINT "FacturaRemito_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaRemito" ADD CONSTRAINT "FacturaRemito_remitoId_fkey" FOREIGN KEY ("remitoId") REFERENCES "Remito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_terceroId_fkey" FOREIGN KEY ("terceroId") REFERENCES "Tercero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImputacionPago" ADD CONSTRAINT "ImputacionPago_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImputacionPago" ADD CONSTRAINT "ImputacionPago_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cheque" ADD CONSTRAINT "Cheque_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
