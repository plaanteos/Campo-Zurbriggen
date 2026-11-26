import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

const diasAtras = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

async function seedUsuarios() {
  const email = process.env.ADMIN_EMAIL ?? "admin@campo.local";
  const password = process.env.ADMIN_PASSWORD ?? "cambiar-esta-clave";

  await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: {
      nombre: "Administrador",
      email,
      passwordHash: await bcrypt.hash(password, 12),
      rol: "ADMIN",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "encargado@campo.local" },
    update: {},
    create: {
      nombre: "Encargado de campo",
      email: "encargado@campo.local",
      passwordHash: await bcrypt.hash("encargado1234", 12),
      rol: "ENCARGADO",
    },
  });

  console.log(`Usuarios listos: ${email} y encargado@campo.local`);
}

async function seedDemo() {
  if ((await prisma.tercero.count()) > 0) {
    console.log("Datos de demostración ya existentes, se omite la carga.");
    return;
  }

  const [agroinsumos, ypf, transporte, semillas, coop, molinos] = await Promise.all([
    prisma.tercero.create({ data: { nombre: "Agroinsumos del Centro S.A.", cuit: "30-71284564-9" } }),
    prisma.tercero.create({ data: { nombre: "YPF Agro", cuit: "30-54668997-8" } }),
    prisma.tercero.create({ data: { nombre: "Transporte El Resero S.R.L.", cuit: "30-71884920-1" } }),
    prisma.tercero.create({ data: { nombre: "Semillas Pampeanas S.A.", cuit: "30-69874532-2" } }),
    prisma.tercero.create({ data: { nombre: "Cooperativa Agrícola Unión", cuit: "30-52234567-1" } }),
    prisma.tercero.create({ data: { nombre: "Molinos del Plata", cuit: "30-70998877-4" } }),
  ]);

  const establecimiento = await prisma.establecimiento.create({
    data: {
      nombre: "Establecimiento Los Aromos",
      localidad: "San Cristóbal, Santa Fe",
      hectareas: "1280.00",
      lotes: {
        create: [
          { nombre: "Lote 01", hectareas: "186.00" },
          { nombre: "Lote 02", hectareas: "224.00" },
          { nombre: "Lote 03", hectareas: "148.00" },
          { nombre: "Lote 04", hectareas: "206.00" },
          { nombre: "Lote 05", hectareas: "192.00" },
          { nombre: "Lote 06", hectareas: "208.00" },
        ],
      },
    },
    include: { lotes: true },
  });

  const campania = await prisma.campania.create({ data: { nombre: "2025/2026", activa: true } });

  const cultivos = ["SOJA", "MAIZ", "TRIGO", "SOJA", "MAIZ", "GIRASOL"] as const;
  const lotesCampania = [];
  for (const [i, lote] of establecimiento.lotes.entries()) {
    lotesCampania.push(
      await prisma.loteCampania.create({
        data: {
          loteId: lote.id,
          campaniaId: campania.id,
          cultivo: cultivos[i],
          sembradoHa: lote.hectareas,
          fechaSiembra: diasAtras(180 - i * 5),
        },
      }),
    );
  }

  const insumosData = [
    { nombre: "Glifosato 66%", categoria: "AGROQUIMICO", unidad: "l" },
    { nombre: "Urea granulada", categoria: "FERTILIZANTE", unidad: "kg" },
    { nombre: "Semilla Soja DM 46i20", categoria: "SEMILLA", unidad: "bolsas" },
    { nombre: "Atrazina 90% WG", categoria: "AGROQUIMICO", unidad: "kg" },
    { nombre: "Semilla Maíz DK 72-10", categoria: "SEMILLA", unidad: "bolsas" },
  ] as const;

  const insumos = [];
  for (const [i, data] of insumosData.entries()) {
    insumos.push(
      await prisma.insumo.create({
        data: {
          ...data,
          movimientos: {
            create: [
              {
                fecha: diasAtras(30),
                tipo: "ENTRADA",
                cantidad: "1000.000",
                deposito: i % 2 === 0 ? "Depósito Norte" : "Galpón Principal",
              },
              {
                fecha: diasAtras(5),
                tipo: "SALIDA",
                cantidad: "160.000",
                deposito: i % 2 === 0 ? "Depósito Norte" : "Galpón Principal",
                referencia: "Aplicación Lote 04",
              },
            ],
          },
        },
      }),
    );
  }

  const remito1 = await prisma.remito.create({
    data: {
      tipo: "COMPRA",
      numero: "0003-008421",
      fecha: diasAtras(20),
      terceroId: agroinsumos.id,
      importe: "2000000.00",
    },
  });
  const remito2 = await prisma.remito.create({
    data: {
      tipo: "COMPRA",
      numero: "0001-002983",
      fecha: diasAtras(12),
      terceroId: agroinsumos.id,
      importe: "1550000.00",
    },
  });
  await prisma.remito.create({
    data: {
      tipo: "COMPRA",
      numero: "0001-003001",
      fecha: diasAtras(4),
      terceroId: ypf.id,
      importe: "936200.00",
    },
  });
  await prisma.remito.create({
    data: {
      tipo: "ENTREGA",
      numero: "0008-001294",
      fecha: diasAtras(2),
      terceroId: coop.id,
      importe: "684500.00",
      estado: "FACTURADO",
    },
  });
  await prisma.remito.create({
    data: {
      tipo: "COMPRA",
      numero: "0002-009104",
      fecha: diasAtras(45),
      terceroId: semillas.id,
      importe: "1924800.00",
      estado: "FACTURADO",
    },
  });

  const facturaCompra = await prisma.factura.create({
    data: {
      direccion: "COMPRA",
      clase: "FACTURA",
      tipo: "A",
      puntoVenta: "0004",
      numero: "00001829",
      fecha: diasAtras(20),
      vencimiento: diasAtras(-3),
      terceroId: agroinsumos.id,
      neto: "3550000.00",
      iva: "745500.00",
      total: "4295500.00",
      pagado: "1500000.00",
      estado: "PARCIAL",
      remitos: { create: [{ remitoId: remito1.id }, { remitoId: remito2.id }] },
    },
  });
  await prisma.remito.updateMany({
    where: { id: { in: [remito1.id, remito2.id] } },
    data: { estado: "FACTURADO" },
  });

  const facturaCompra2 = await prisma.factura.create({
    data: {
      direccion: "COMPRA",
      clase: "FACTURA",
      tipo: "A",
      puntoVenta: "0021",
      numero: "00008423",
      fecha: diasAtras(45),
      vencimiento: diasAtras(-25),
      terceroId: semillas.id,
      neto: "1924800.00",
      iva: "404208.00",
      total: "2329008.00",
      estado: "PENDIENTE",
    },
  });

  const facturaVenta = await prisma.factura.create({
    data: {
      direccion: "VENTA",
      clase: "FACTURA",
      tipo: "A",
      puntoVenta: "0003",
      numero: "00000982",
      fecha: diasAtras(15),
      vencimiento: diasAtras(-15),
      terceroId: molinos.id,
      neto: "3000000.00",
      iva: "630000.00",
      total: "3630000.00",
      pagado: "3630000.00",
      estado: "PAGADA",
    },
  });

  await prisma.factura.create({
    data: {
      direccion: "VENTA",
      clase: "FACTURA",
      tipo: "B",
      puntoVenta: "0003",
      numero: "00001004",
      fecha: diasAtras(6),
      vencimiento: diasAtras(-10),
      terceroId: transporte.id,
      neto: "684500.00",
      iva: "0.00",
      total: "684500.00",
      estado: "PENDIENTE",
    },
  });

  const pagoEmitido = await prisma.pago.create({
    data: {
      numero: "OP-000001",
      fecha: diasAtras(8),
      sentido: "EMITIDO",
      terceroId: agroinsumos.id,
      monto: "1500000.00",
      medio: "TRANSFERENCIA",
      observaciones: "Pago parcial factura A 0004-001829",
      imputaciones: {
        create: [{ facturaId: facturaCompra.id, monto: "1500000.00" }],
      },
    },
  });

  const pagoRecibido = await prisma.pago.create({
    data: {
      numero: "RC-000001",
      fecha: diasAtras(5),
      sentido: "RECIBIDO",
      terceroId: molinos.id,
      monto: "3630000.00",
      medio: "TRANSFERENCIA",
      observaciones: "Cobro factura A 0003-000982",
      imputaciones: {
        create: [{ facturaId: facturaVenta.id, monto: "3630000.00" }],
      },
    },
  });

  await prisma.cheque.createMany({
    data: [
      {
        tipo: "PROPIO",
        numero: "008412",
        banco: "Banco Nación",
        importe: "1500000.00",
        fechaEmision: diasAtras(10),
        fechaPago: diasAtras(-8),
        librador: "Los Aromos S.A.",
        estado: "ENTREGADO",
        pagoId: pagoEmitido.id,
      },
      {
        tipo: "TERCERO",
        numero: "193842",
        banco: "Banco Provincia",
        importe: "2120000.00",
        fechaEmision: diasAtras(6),
        fechaPago: diasAtras(-12),
        librador: "Molinos del Plata",
        cuitLibrador: "30-70998877-4",
        estado: "EN_CARTERA",
        pagoId: pagoRecibido.id,
      },
      {
        tipo: "TERCERO",
        numero: "004291",
        banco: "Santander",
        importe: "1280000.00",
        fechaEmision: diasAtras(3),
        fechaPago: diasAtras(-20),
        librador: "Cooperativa Agrícola Unión",
        cuitLibrador: "30-52234567-1",
        estado: "EN_CARTERA",
      },
    ],
  });

  const cargas = [
    { lote: 0, patente: "AC482QZ", kg: "28420.00", estado: "ENTREGADA" as const, destino: coop.id, transportista: transporte.id },
    { lote: 1, patente: "AF129KL", kg: "31880.00", estado: "ENTREGADA" as const, destino: coop.id, transportista: transporte.id },
    { lote: 2, patente: "AE743RT", kg: "27960.00", estado: "ENTREGADA" as const, destino: coop.id, transportista: transporte.id },
    { lote: 3, patente: "AD092NV", kg: "29200.00", estado: "EN_TRANSITO" as const, destino: molinos.id, transportista: transporte.id },
  ];

  for (const [i, c] of cargas.entries()) {
    const camion = await prisma.camion.upsert({
      where: { patente: c.patente },
      update: {},
      create: { patente: c.patente },
    });
    const creada = await prisma.cargaCosecha.create({
      data: {
        fecha: diasAtras(10 - i),
        loteCampaniaId: lotesCampania[c.lote].id,
        camionId: camion.id,
        transportistaId: c.transportista,
        destinoId: c.destino,
        kg: c.kg,
        estado: c.estado,
      },
    });
    if (c.estado === "ENTREGADA") {
      await prisma.movimientoCereal.create({
        data: {
          fecha: creada.fecha,
          cultivo: cultivos[c.lote],
          tipo: "INGRESO",
          kg: c.kg,
          cargaId: creada.id,
        },
      });
    }
  }

  await prisma.servicioAgro.createMany({
    data: [
      {
        fecha: diasAtras(4),
        labor: "Pulverización",
        tipo: "CONTRATADO",
        estado: "FINALIZADO",
        costo: "824000.00",
        loteCampaniaId: lotesCampania[3].id,
        terceroId: coop.id,
      },
      {
        fecha: diasAtras(6),
        labor: "Fertilización",
        tipo: "CONTRATADO",
        estado: "FINALIZADO",
        costo: "1568000.00",
        loteCampaniaId: lotesCampania[1].id,
        terceroId: transporte.id,
      },
      {
        fecha: diasAtras(8),
        labor: "Siembra",
        tipo: "PROPIO",
        estado: "EN_EJECUCION",
        costo: "592000.00",
        loteCampaniaId: lotesCampania[2].id,
      },
      {
        fecha: diasAtras(11),
        labor: "Labranza",
        tipo: "CONTRATADO",
        estado: "PENDIENTE",
        costo: "486000.00",
        loteCampaniaId: lotesCampania[4].id,
        terceroId: coop.id,
      },
    ],
  });

  await prisma.secuencia.upsert({
    where: { clave: "pago-EMITIDO" },
    update: { valor: 1 },
    create: { clave: "pago-EMITIDO", valor: 1 },
  });
  await prisma.secuencia.upsert({
    where: { clave: "pago-RECIBIDO" },
    update: { valor: 1 },
    create: { clave: "pago-RECIBIDO", valor: 1 },
  });

  console.log("Datos de demostración cargados.");
}

async function main() {
  await seedUsuarios();
  await seedDemo();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
