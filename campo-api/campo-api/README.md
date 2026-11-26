# Sistema de gestión agropecuaria

Aplicación completa: **frontend React + Vite + Tailwind** (`Frontend/`) y **backend Node.js + Express + TypeScript + Prisma + PostgreSQL** (`campo-api/campo-api/`).

## Puesta en marcha

### 1. Base de datos

Requiere PostgreSQL local (probado con PostgreSQL 18). Crear la base:

```sql
CREATE DATABASE campo;
```

### 2. Backend

```bash
cd campo-api/campo-api
npm install
# Configurar .env según .env.example
npx prisma migrate deploy
npm run dev          # API en http://localhost:3000
```

### Datos de demostración opcionales

Solo para una base **vacía y dedicada a pruebas**, aplique primero las migraciones
con `npx prisma migrate deploy` usando la conexión deseada. En el editor SQL de
Neon, abra y copie `campo-api/campo-api/prisma/demo.sql` completo; sustituya
`REEMPLAZAR_CLAVE_ADMIN` y `REEMPLAZAR_CLAVE_ENCARGADO` dentro de los literales
SQL por dos contraseñas propias, fuertes y distintas de 12 a 72 bytes UTF-8.
Duplique cualquier comilla simple dentro de la contraseña. Ejecute todo el
script en una única sesión; necesita permisos para crear `pgcrypto`. La
transacción bloquea y comprueba todas las tablas de negocio (incluidos usuarios y
auditoría) y cancela la carga si alguna contiene datos. Ante un error, ejecute
`ROLLBACK` en esa sesión antes de reintentar.

El script crea `admin@campo.local` (ADMIN) y `encargado@campo.local`
(ENCARGADO), con hashes bcrypt de coste 12; no hay contraseñas predeterminadas.
Los demás datos son ficticios, incluidos estados y relaciones del seed original;
no deben usarse en producción. No guarde ni publique el SQL editado con
contraseñas, y evite exponerlo en historial de consultas, registros o capturas.
Use un canal y un cliente confiables, y proteja el acceso a la base.

### 3. Frontend

```bash
cd Frontend
npm install
npm run dev          # Vite en http://localhost:8443
```

El front lee `VITE_API_URL` (por defecto `http://localhost:3000/api`) desde `Frontend/.env`.
El backend acepta CORS desde `http://localhost:5173`, `http://localhost:8443` y `http://127.0.0.1:8443` (configurable con `FRONTEND_URL` separado por comas).

## Roles

| Módulo / acción                    | ADMIN | ENCARGADO |
|------------------------------------|:-----:|:---------:|
| Login, perfil, dashboard           |   ✔   |     ✔     |
| Campos, lotes y campañas           |   ✔   |     ✔     |
| Servicios agropecuarios            |   ✔   |     ✔     |
| Cosechas, cargas y entregas        |   ✔   |     ✔     |
| Inventario de insumos y cereal     |   ✔   |     ✔     |
| Remitos: listar y cargar           |   ✔   |     ✔     |
| Facturas: listar, cargar, anular   |   ✔   |     ✘     |
| Pagos y cobros, cuenta corriente   |   ✔   |     ✘     |
| Cheques                            |   ✔   |     ✘     |
| Informes y usuarios                |   ✔   |     ✘     |

El menú del front oculta los módulos financieros y de sistema para el rol ENCARGADO, y el backend responde 403 si se intenta acceder igualmente.

## Reglas de negocio implementadas

- **Factura ↔ remito:** una factura tipo FACTURA debe vincular al menos un remito. El neto debe coincidir con la suma de los remitos (tolerancia de 1 centavo). Cada remito se factura una sola vez y todos deben ser del mismo tercero.
- **IVA:** la factura tipo A debe tener IVA del 21% del neto. Las B y C no discriminan IVA.
- **Pagos y cobros:** la suma de imputaciones debe igualar el monto. Ninguna factura se paga por encima de su saldo. El pago debe ser del mismo tercero y del sentido correcto (un pago emitido cancela compras; un cobro cancela ventas). Las notas de crédito no se imputan como pago.
- **Cheques:** al pagar con cheques propios se crean como ENTREGADO. Los de terceros se crean EN_CARTERA. Con medio CHEQUES la suma de cheques debe igualar el monto; con MIXTO debe ser menor.
- **Cuenta corriente:** saldo = facturas y notas de débito − notas de crédito − pagos, con saldo corrido por movimiento.
- **Cosechas:** una carga ENTREGADA genera automáticamente el movimiento de ingreso de cereal del cultivo del lote.
- **Concurrencia:** remitos y facturas se bloquean con `SELECT … FOR UPDATE` dentro de la transacción.
- **Auditoría:** cada alta, edición y anulación queda registrada en la tabla `Auditoria` con el usuario.

## Endpoints

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/auth/login` | público | Devuelve JWT |
| GET | `/api/auth/me` | autenticado | Usuario de la sesión |
| GET | `/api/dashboard` | autenticado | Resumen consolidado del inicio |
| GET/POST | `/api/terceros` | ADMIN, ENCARGADO | Proveedores y clientes |
| PATCH | `/api/terceros/:id` | ADMIN | Editar tercero |
| GET | `/api/remitos?terceroId=&pendientes=true` | ADMIN, ENCARGADO | Lista remitos |
| POST | `/api/remitos` | ADMIN, ENCARGADO | Carga un remito |
| GET | `/api/facturas?terceroId=` | ADMIN | Lista facturas con remitos |
| POST | `/api/facturas` | ADMIN | Carga factura con remitos |
| POST | `/api/facturas/:id/anular` | ADMIN | Anula y libera remitos |
| GET/POST | `/api/pagos` | ADMIN | Lista / registra pago o cobro |
| GET | `/api/pagos/cuenta-corriente?terceroId=&direccion=COMPRA\|VENTA` | ADMIN | Cuenta corriente |
| GET/POST | `/api/cheques` | ADMIN | Cartera de cheques |
| PATCH | `/api/cheques/:id/estado` | ADMIN | Cambiar estado de un cheque |
| GET/POST | `/api/usuarios` | ADMIN | Usuarios y roles |
| PATCH | `/api/usuarios/:id` | ADMIN | Editar usuario / activar / desactivar |
| GET | `/api/campos/establecimientos` | ADMIN, ENCARGADO | Campos con lotes |
| POST | `/api/campos/establecimientos` | ADMIN, ENCARGADO | Nuevo campo |
| POST | `/api/campos/establecimientos/:id/lotes` | ADMIN, ENCARGADO | Nuevo lote |
| GET/POST | `/api/campos/campanias` | ADMIN, ENCARGADO | Campañas |
| GET | `/api/campos/lotes-campania` | ADMIN, ENCARGADO | Lotes por campaña |
| POST | `/api/campos/lotes/:id/campanias` | ADMIN, ENCARGADO | Asociar lote y cultivo |
| GET/POST | `/api/servicios` | ADMIN, ENCARGADO | Labores agropecuarias |
| PATCH/DELETE | `/api/servicios/:id` | ADMIN, ENCARGADO | Editar / borrar servicio |
| GET/POST | `/api/cosechas` | ADMIN, ENCARGADO | Cargas de cosecha |
| PATCH | `/api/cosechas/:id/entregar` | ADMIN, ENCARGADO | Marcar entregada e ingresar cereal |
| GET/POST | `/api/insumos` | ADMIN, ENCARGADO | Insumos con stock calculado |
| GET/POST | `/api/insumos/movimientos`, `/api/insumos/:id/movimientos` | ADMIN, ENCARGADO | Movimientos de insumos |
| GET | `/api/cereal/stock` | ADMIN, ENCARGADO | Stock por cultivo |
| GET/POST | `/api/cereal/movimientos` | ADMIN, ENCARGADO | Movimientos de cereal |

Los errores responden `{ "error": "...", "detalles": ... }`. Las validaciones devuelven 400, las reglas de negocio 422, los conflictos 409 y los permisos 403.

## Frontend conectado

- `src/lib/api.ts`: cliente HTTP con JWT y manejo de sesión expirada.
- `src/pages/Login.tsx`: pantalla de login que guarda token y usuario en `localStorage`.
- Cada módulo (`Facturas`, `Remitos`, `Pagos`, `Cuentas`, `Cheques`, `Usuarios`, `Campos`, `Servicios`, `Cosechas`, `Inventario`, `Dashboard`) consulta la API y muestra estados de carga y error.
- Formularios de alta reales para todos los módulos operativos y financieros.
- El menú se filtra según el rol del usuario logueado.

## Roadmap

- **Hecho:** auth y roles, dashboard, remitos, facturas con matching, pagos imputados, cuenta corriente, cheques, usuarios, campos/lotes/campañas, servicios, cosechas, insumos y stock de cereal.
- **Pendiente (fase 2/3):** procesamiento de documentos PDF con IA, informes exportables a Excel/PDF, integración con factura electrónica AFIP (WSFEv1), multi-empresa.
