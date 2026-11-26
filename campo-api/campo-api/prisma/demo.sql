-- Antes de ejecutar, sustituya ambos marcadores por contraseñas propias.
-- Escriba literales SQL válidos (duplique las comillas simples internas).
BEGIN;

-- Impide inserciones concurrentes entre la comprobación y la carga.
LOCK TABLE "Usuario", "Auditoria", "Secuencia", "Tercero", "Establecimiento",
  "Lote", "Campania", "LoteCampania", "ServicioAgro", "Camion",
  "CargaCosecha", "MovimientoCereal", "Insumo", "MovimientoInsumo",
  "Remito", "Factura", "FacturaRemito", "Pago", "ImputacionPago", "Cheque"
  IN SHARE ROW EXCLUSIVE MODE;

DO $guardia$
DECLARE
  tabla text;
  ocupada boolean;
BEGIN
  FOREACH tabla IN ARRAY ARRAY[
    'Usuario', 'Auditoria', 'Secuencia', 'Tercero', 'Establecimiento',
    'Lote', 'Campania', 'LoteCampania', 'ServicioAgro', 'Camion',
    'CargaCosecha', 'MovimientoCereal', 'Insumo', 'MovimientoInsumo',
    'Remito', 'Factura', 'FacturaRemito', 'Pago', 'ImputacionPago', 'Cheque'
  ] LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I LIMIT 1)', tabla) INTO ocupada;
    IF ocupada THEN
      RAISE EXCEPTION 'Carga cancelada: la tabla % no está vacía', tabla;
    END IF;
  END LOOP;
END
$guardia$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $usuarios$
DECLARE
  clave_admin text := 'REEMPLAZAR_CLAVE_ADMIN';
  clave_encargado text := 'REEMPLAZAR_CLAVE_ENCARGADO';
BEGIN
  IF clave_admin LIKE '%REEMPLAZAR_CLAVE_%' OR clave_encargado LIKE '%REEMPLAZAR_CLAVE_%'
     OR octet_length(clave_admin) NOT BETWEEN 12 AND 72
     OR octet_length(clave_encargado) NOT BETWEEN 12 AND 72
     OR btrim(clave_admin) = '' OR btrim(clave_encargado) = ''
     OR clave_admin = clave_encargado THEN
    RAISE EXCEPTION 'Defina dos contraseñas distintas de 12 a 72 bytes y sustituya ambos marcadores';
  END IF;
  INSERT INTO "Usuario" ("id", "nombre", "email", "passwordHash", "rol") VALUES
    ('demo-usuario-admin', 'Administrador', 'admin@campo.local', crypt(clave_admin, gen_salt('bf', 12)), 'ADMIN'),
    ('demo-usuario-encargado', 'Encargado de campo', 'encargado@campo.local', crypt(clave_encargado, gen_salt('bf', 12)), 'ENCARGADO');
END
$usuarios$;

INSERT INTO "Tercero" ("id", "nombre", "cuit") VALUES
  ('demo-tercero-agroinsumos', 'Agroinsumos del Centro S.A.', '30-71284564-9'),
  ('demo-tercero-ypf', 'YPF Agro', '30-54668997-8'),
  ('demo-tercero-transporte', 'Transporte El Resero S.R.L.', '30-71884920-1'),
  ('demo-tercero-semillas', 'Semillas Pampeanas S.A.', '30-69874532-2'),
  ('demo-tercero-coop', 'Cooperativa Agrícola Unión', '30-52234567-1'),
  ('demo-tercero-molinos', 'Molinos del Plata', '30-70998877-4');

INSERT INTO "Establecimiento" ("id", "nombre", "localidad", "hectareas") VALUES
  ('demo-establecimiento', 'Establecimiento Los Aromos', 'San Cristóbal, Santa Fe', 1280.00);

INSERT INTO "Lote" ("id", "establecimientoId", "nombre", "hectareas") VALUES
  ('demo-lote-01', 'demo-establecimiento', 'Lote 01', 186.00),
  ('demo-lote-02', 'demo-establecimiento', 'Lote 02', 224.00),
  ('demo-lote-03', 'demo-establecimiento', 'Lote 03', 148.00),
  ('demo-lote-04', 'demo-establecimiento', 'Lote 04', 206.00),
  ('demo-lote-05', 'demo-establecimiento', 'Lote 05', 192.00),
  ('demo-lote-06', 'demo-establecimiento', 'Lote 06', 208.00);

INSERT INTO "Campania" ("id", "nombre", "activa") VALUES ('demo-campania', '2025/2026', true);
INSERT INTO "LoteCampania" ("id", "loteId", "campaniaId", "cultivo", "sembradoHa", "fechaSiembra") VALUES
  ('demo-lc-01', 'demo-lote-01', 'demo-campania', 'SOJA', 186.00, (now() AT TIME ZONE 'UTC') - interval '180 days'),
  ('demo-lc-02', 'demo-lote-02', 'demo-campania', 'MAIZ', 224.00, (now() AT TIME ZONE 'UTC') - interval '175 days'),
  ('demo-lc-03', 'demo-lote-03', 'demo-campania', 'TRIGO', 148.00, (now() AT TIME ZONE 'UTC') - interval '170 days'),
  ('demo-lc-04', 'demo-lote-04', 'demo-campania', 'SOJA', 206.00, (now() AT TIME ZONE 'UTC') - interval '165 days'),
  ('demo-lc-05', 'demo-lote-05', 'demo-campania', 'MAIZ', 192.00, (now() AT TIME ZONE 'UTC') - interval '160 days'),
  ('demo-lc-06', 'demo-lote-06', 'demo-campania', 'GIRASOL', 208.00, (now() AT TIME ZONE 'UTC') - interval '155 days');

INSERT INTO "Insumo" ("id", "nombre", "categoria", "unidad") VALUES
  ('demo-insumo-1', 'Glifosato 66%', 'AGROQUIMICO', 'l'),
  ('demo-insumo-2', 'Urea granulada', 'FERTILIZANTE', 'kg'),
  ('demo-insumo-3', 'Semilla Soja DM 46i20', 'SEMILLA', 'bolsas'),
  ('demo-insumo-4', 'Atrazina 90% WG', 'AGROQUIMICO', 'kg'),
  ('demo-insumo-5', 'Semilla Maíz DK 72-10', 'SEMILLA', 'bolsas');

INSERT INTO "MovimientoInsumo" ("id", "insumoId", "fecha", "tipo", "cantidad", "deposito", "referencia") VALUES
  ('demo-mi-1-e', 'demo-insumo-1', (now() AT TIME ZONE 'UTC') - interval '30 days', 'ENTRADA', 1000.000, 'Depósito Norte', NULL),
  ('demo-mi-1-s', 'demo-insumo-1', (now() AT TIME ZONE 'UTC') - interval '5 days', 'SALIDA', 160.000, 'Depósito Norte', 'Aplicación Lote 04'),
  ('demo-mi-2-e', 'demo-insumo-2', (now() AT TIME ZONE 'UTC') - interval '30 days', 'ENTRADA', 1000.000, 'Galpón Principal', NULL),
  ('demo-mi-2-s', 'demo-insumo-2', (now() AT TIME ZONE 'UTC') - interval '5 days', 'SALIDA', 160.000, 'Galpón Principal', 'Aplicación Lote 04'),
  ('demo-mi-3-e', 'demo-insumo-3', (now() AT TIME ZONE 'UTC') - interval '30 days', 'ENTRADA', 1000.000, 'Depósito Norte', NULL),
  ('demo-mi-3-s', 'demo-insumo-3', (now() AT TIME ZONE 'UTC') - interval '5 days', 'SALIDA', 160.000, 'Depósito Norte', 'Aplicación Lote 04'),
  ('demo-mi-4-e', 'demo-insumo-4', (now() AT TIME ZONE 'UTC') - interval '30 days', 'ENTRADA', 1000.000, 'Galpón Principal', NULL),
  ('demo-mi-4-s', 'demo-insumo-4', (now() AT TIME ZONE 'UTC') - interval '5 days', 'SALIDA', 160.000, 'Galpón Principal', 'Aplicación Lote 04'),
  ('demo-mi-5-e', 'demo-insumo-5', (now() AT TIME ZONE 'UTC') - interval '30 days', 'ENTRADA', 1000.000, 'Depósito Norte', NULL),
  ('demo-mi-5-s', 'demo-insumo-5', (now() AT TIME ZONE 'UTC') - interval '5 days', 'SALIDA', 160.000, 'Depósito Norte', 'Aplicación Lote 04');

INSERT INTO "Remito" ("id", "tipo", "numero", "fecha", "terceroId", "importe", "estado") VALUES
  ('demo-remito-1', 'COMPRA', '0003-008421', (now() AT TIME ZONE 'UTC') - interval '20 days', 'demo-tercero-agroinsumos', 2000000.00, 'FACTURADO'),
  ('demo-remito-2', 'COMPRA', '0001-002983', (now() AT TIME ZONE 'UTC') - interval '12 days', 'demo-tercero-agroinsumos', 1550000.00, 'FACTURADO'),
  ('demo-remito-3', 'COMPRA', '0001-003001', (now() AT TIME ZONE 'UTC') - interval '4 days', 'demo-tercero-ypf', 936200.00, 'PENDIENTE_FACTURA'),
  ('demo-remito-4', 'ENTREGA', '0008-001294', (now() AT TIME ZONE 'UTC') - interval '2 days', 'demo-tercero-coop', 684500.00, 'FACTURADO'),
  ('demo-remito-5', 'COMPRA', '0002-009104', (now() AT TIME ZONE 'UTC') - interval '45 days', 'demo-tercero-semillas', 1924800.00, 'FACTURADO');

INSERT INTO "Factura" ("id", "direccion", "clase", "tipo", "puntoVenta", "numero", "fecha", "vencimiento", "terceroId", "neto", "iva", "total", "pagado", "estado") VALUES
  ('demo-factura-1', 'COMPRA', 'FACTURA', 'A', '0004', '00001829', (now() AT TIME ZONE 'UTC') - interval '20 days', (now() AT TIME ZONE 'UTC') + interval '3 days', 'demo-tercero-agroinsumos', 3550000.00, 745500.00, 4295500.00, 1500000.00, 'PARCIAL'),
  ('demo-factura-2', 'COMPRA', 'FACTURA', 'A', '0021', '00008423', (now() AT TIME ZONE 'UTC') - interval '45 days', (now() AT TIME ZONE 'UTC') + interval '25 days', 'demo-tercero-semillas', 1924800.00, 404208.00, 2329008.00, 0, 'PENDIENTE'),
  ('demo-factura-3', 'VENTA', 'FACTURA', 'A', '0003', '00000982', (now() AT TIME ZONE 'UTC') - interval '15 days', (now() AT TIME ZONE 'UTC') + interval '15 days', 'demo-tercero-molinos', 3000000.00, 630000.00, 3630000.00, 3630000.00, 'PAGADA'),
  ('demo-factura-4', 'VENTA', 'FACTURA', 'B', '0003', '00001004', (now() AT TIME ZONE 'UTC') - interval '6 days', (now() AT TIME ZONE 'UTC') + interval '10 days', 'demo-tercero-transporte', 684500.00, 0.00, 684500.00, 0, 'PENDIENTE');

INSERT INTO "FacturaRemito" ("facturaId", "remitoId") VALUES
  ('demo-factura-1', 'demo-remito-1'), ('demo-factura-1', 'demo-remito-2');

INSERT INTO "Pago" ("id", "numero", "fecha", "sentido", "terceroId", "monto", "medio", "observaciones") VALUES
  ('demo-pago-emitido', 'OP-000001', (now() AT TIME ZONE 'UTC') - interval '8 days', 'EMITIDO', 'demo-tercero-agroinsumos', 1500000.00, 'TRANSFERENCIA', 'Pago parcial factura A 0004-001829'),
  ('demo-pago-recibido', 'RC-000001', (now() AT TIME ZONE 'UTC') - interval '5 days', 'RECIBIDO', 'demo-tercero-molinos', 3630000.00, 'TRANSFERENCIA', 'Cobro factura A 0003-000982');

INSERT INTO "ImputacionPago" ("id", "pagoId", "facturaId", "monto") VALUES
  ('demo-imputacion-1', 'demo-pago-emitido', 'demo-factura-1', 1500000.00),
  ('demo-imputacion-2', 'demo-pago-recibido', 'demo-factura-3', 3630000.00);

INSERT INTO "Cheque" ("id", "tipo", "numero", "banco", "importe", "fechaEmision", "fechaPago", "librador", "cuitLibrador", "estado", "pagoId") VALUES
  ('demo-cheque-1', 'PROPIO', '008412', 'Banco Nación', 1500000.00, (now() AT TIME ZONE 'UTC') - interval '10 days', (now() AT TIME ZONE 'UTC') + interval '8 days', 'Los Aromos S.A.', NULL, 'ENTREGADO', 'demo-pago-emitido'),
  ('demo-cheque-2', 'TERCERO', '193842', 'Banco Provincia', 2120000.00, (now() AT TIME ZONE 'UTC') - interval '6 days', (now() AT TIME ZONE 'UTC') + interval '12 days', 'Molinos del Plata', '30-70998877-4', 'EN_CARTERA', 'demo-pago-recibido'),
  ('demo-cheque-3', 'TERCERO', '004291', 'Santander', 1280000.00, (now() AT TIME ZONE 'UTC') - interval '3 days', (now() AT TIME ZONE 'UTC') + interval '20 days', 'Cooperativa Agrícola Unión', '30-52234567-1', 'EN_CARTERA', NULL);

INSERT INTO "Camion" ("id", "patente") VALUES
  ('demo-camion-1', 'AC482QZ'), ('demo-camion-2', 'AF129KL'),
  ('demo-camion-3', 'AE743RT'), ('demo-camion-4', 'AD092NV');

INSERT INTO "CargaCosecha" ("id", "fecha", "loteCampaniaId", "camionId", "transportistaId", "destinoId", "kg", "estado") VALUES
  ('demo-carga-1', (now() AT TIME ZONE 'UTC') - interval '10 days', 'demo-lc-01', 'demo-camion-1', 'demo-tercero-transporte', 'demo-tercero-coop', 28420.00, 'ENTREGADA'),
  ('demo-carga-2', (now() AT TIME ZONE 'UTC') - interval '9 days', 'demo-lc-02', 'demo-camion-2', 'demo-tercero-transporte', 'demo-tercero-coop', 31880.00, 'ENTREGADA'),
  ('demo-carga-3', (now() AT TIME ZONE 'UTC') - interval '8 days', 'demo-lc-03', 'demo-camion-3', 'demo-tercero-transporte', 'demo-tercero-coop', 27960.00, 'ENTREGADA'),
  ('demo-carga-4', (now() AT TIME ZONE 'UTC') - interval '7 days', 'demo-lc-04', 'demo-camion-4', 'demo-tercero-transporte', 'demo-tercero-molinos', 29200.00, 'EN_TRANSITO');

INSERT INTO "MovimientoCereal" ("id", "fecha", "cultivo", "tipo", "kg", "cargaId") VALUES
  ('demo-mc-1', (now() AT TIME ZONE 'UTC') - interval '10 days', 'SOJA', 'INGRESO', 28420.00, 'demo-carga-1'),
  ('demo-mc-2', (now() AT TIME ZONE 'UTC') - interval '9 days', 'MAIZ', 'INGRESO', 31880.00, 'demo-carga-2'),
  ('demo-mc-3', (now() AT TIME ZONE 'UTC') - interval '8 days', 'TRIGO', 'INGRESO', 27960.00, 'demo-carga-3');

INSERT INTO "ServicioAgro" ("id", "fecha", "labor", "tipo", "estado", "costo", "loteCampaniaId", "terceroId") VALUES
  ('demo-servicio-1', (now() AT TIME ZONE 'UTC') - interval '4 days', 'Pulverización', 'CONTRATADO', 'FINALIZADO', 824000.00, 'demo-lc-04', 'demo-tercero-coop'),
  ('demo-servicio-2', (now() AT TIME ZONE 'UTC') - interval '6 days', 'Fertilización', 'CONTRATADO', 'FINALIZADO', 1568000.00, 'demo-lc-02', 'demo-tercero-transporte'),
  ('demo-servicio-3', (now() AT TIME ZONE 'UTC') - interval '8 days', 'Siembra', 'PROPIO', 'EN_EJECUCION', 592000.00, 'demo-lc-03', NULL),
  ('demo-servicio-4', (now() AT TIME ZONE 'UTC') - interval '11 days', 'Labranza', 'CONTRATADO', 'PENDIENTE', 486000.00, 'demo-lc-05', 'demo-tercero-coop');

INSERT INTO "Secuencia" ("clave", "valor") VALUES ('pago-EMITIDO', 1), ('pago-RECIBIDO', 1);
COMMIT;
