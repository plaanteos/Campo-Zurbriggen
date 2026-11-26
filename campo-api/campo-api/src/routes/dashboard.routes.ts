import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { D } from "../lib/dinero.js";

const router = Router();

function inicioMes(offset = 0) {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth() + offset, 1);
}

const ETIQUETAS_MES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

router.get("/", async (_req, res) => {
  const desde = inicioMes();
  const desdeFlujo = inicioMes(-5);

  const [pagosMes, pagosFlujo, facturas, vencimientos, movimientosCereal, lotesCampania, auditoria, remitosPendientes, cargasTransito, cargasMes] =
    await Promise.all([
      prisma.pago.findMany({ where: { fecha: { gte: desde } }, select: { sentido: true, monto: true } }),
      prisma.pago.findMany({
        where: { fecha: { gte: desdeFlujo } },
        select: { fecha: true, sentido: true, monto: true },
      }),
      prisma.factura.findMany({
        where: { estado: { not: "ANULADA" } },
        select: { direccion: true, total: true, pagado: true, fecha: true, vencimiento: true },
      }),
      prisma.factura.findMany({
        where: { estado: { in: ["PENDIENTE", "PARCIAL"] }, vencimiento: { not: null } },
        include: { tercero: { select: { nombre: true } } },
        orderBy: { vencimiento: "asc" },
        take: 5,
      }),
      prisma.movimientoCereal.findMany(),
      prisma.loteCampania.findMany({ where: { campania: { activa: true } }, select: { sembradoHa: true } }),
      prisma.auditoria.findMany({
        include: { usuario: { select: { nombre: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.remito.count({ where: { estado: "PENDIENTE_FACTURA" } }),
      prisma.cargaCosecha.count({ where: { estado: "EN_TRANSITO" } }),
      prisma.cargaCosecha.count({ where: { fecha: { gte: desde } } }),
    ]);

  const ingresosMes = pagosMes
    .filter((p) => p.sentido === "RECIBIDO")
    .reduce((acc, p) => acc.plus(p.monto), D(0));
  const egresosMes = pagosMes
    .filter((p) => p.sentido === "EMITIDO")
    .reduce((acc, p) => acc.plus(p.monto), D(0));

  const saldoDe = (direccion: "COMPRA" | "VENTA") =>
    facturas
      .filter((f) => f.direccion === direccion)
      .reduce((acc, f) => acc.plus(f.total).minus(f.pagado), D(0));

  const porCobrar = saldoDe("VENTA");
  const porPagar = saldoDe("COMPRA");

  const hoy = new Date();
  const vencidas = facturas.filter(
    (f) =>
      f.direccion === "COMPRA" &&
      D(f.total).gt(f.pagado) &&
      f.vencimiento !== null &&
      f.vencimiento < hoy,
  ).length;

  const flujo = Array.from({ length: 6 }, (_, i) => {
    const inicio = inicioMes(-5 + i);
    const fin = inicioMes(-4 + i);
    const mes = pagosFlujo.filter((p) => p.fecha >= inicio && p.fecha < fin);
    return {
      mes: ETIQUETAS_MES[inicio.getMonth()],
      ingresos: mes
        .filter((p) => p.sentido === "RECIBIDO")
        .reduce((acc, p) => acc.plus(p.monto), D(0))
        .toFixed(2),
      egresos: mes
        .filter((p) => p.sentido === "EMITIDO")
        .reduce((acc, p) => acc.plus(p.monto), D(0))
        .toFixed(2),
    };
  });

  const stockPorCultivo = new Map<string, number>();
  for (const m of movimientosCereal) {
    const kg = Number(D(m.kg).toString()) * (m.tipo === "INGRESO" ? 1 : -1);
    stockPorCultivo.set(m.cultivo, (stockPorCultivo.get(m.cultivo) ?? 0) + kg);
  }
  const stockCereal = [...stockPorCultivo.entries()]
    .map(([cultivo, kg]) => ({ cultivo, kg: kg.toFixed(2) }))
    .sort((a, b) => Number(b.kg) - Number(a.kg));
  const stockTotal = stockCereal.reduce((acc, s) => acc + Number(s.kg), 0);

  const superficie = lotesCampania.reduce((acc, l) => acc + Number(l.sembradoHa), 0);

  res.json({
    periodo: { desde: desde.toISOString(), hasta: hoy.toISOString() },
    ingresosMes: ingresosMes.toFixed(2),
    egresosMes: egresosMes.toFixed(2),
    porCobrar: porCobrar.toFixed(2),
    porPagar: porPagar.toFixed(2),
    vencidas,
    facturasMes: facturas.filter((f) => f.fecha >= desde).length,
    remitosPendientes,
    cargasTransito,
    cargasMes,
    flujo,
    vencimientos: vencimientos.map((f) => ({
      id: f.id,
      vencimiento: f.vencimiento,
      tercero: f.tercero.nombre,
      comprobante: `${f.clase === "FACTURA" ? "FAC" : f.clase === "NOTA_CREDITO" ? "NC" : "ND"}-${f.tipo} ${f.puntoVenta}-${f.numero}`,
      saldo: D(f.total).minus(f.pagado).toFixed(2),
    })),
    stockCereal: { totalKg: stockTotal.toFixed(2), porCultivo: stockCereal },
    superficieHa: superficie.toFixed(2),
    actividades: auditoria.map((a) => ({
      id: a.id,
      accion: a.accion,
      entidad: a.entidad,
      usuario: a.usuario.nombre,
      createdAt: a.createdAt,
    })),
  });
});

export default router;
