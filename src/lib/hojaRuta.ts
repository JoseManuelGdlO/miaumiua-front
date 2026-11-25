import jsPDF from "jspdf";

export type Bultos = { costal: number; plus: number; bolsa: number; perlas: number };

export type HojaParada = {
  orden: number;
  telefono: string;
  cliente: string;
  direccion: string;
  bultos: Bultos;
  metodo: string;
  estatus: string;
  pago: string;
  subtotal: number;
  total: number;
  efectivo: number;
  transferencia: number;
  credito: number;
  comentarios: string;
};

export type HojaRutaDatos = {
  fecha: string;
  repartidor: string;
  ciudad: string;
  km_esperados: number | null;
  km_recorridos: number | null;
  paradas: HojaParada[];
};

type CobroMini = {
  metodo?: string | null;
  monto_efectivo?: number | null;
  monto_transferencia?: number | null;
  comprobante_path?: string | null;
  tiene_comprobante?: boolean;
} | null;

type LineaProducto = { nombre?: string | null; cantidad?: number | null; precio_unidad?: number | null };

const BULTOS_VACIOS: Bultos = { costal: 0, plus: 0, bolsa: 0, perlas: 0 };

function dinero(n: number) {
  if (!n) return "";
  return `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function esCredito(metodo?: string | null) {
  const m = String(metodo || "").toLowerCase();
  return m === "tarjeta" || m === "credito" || m === "crédito" || m === "terminal";
}

function codigoPago(metodo?: string | null, cobro?: CobroMini) {
  const m = String(cobro?.metodo || metodo || "").toLowerCase();
  if (esCredito(m)) return "C";
  if (m === "transferencia" || m === "mixto") return "T";
  if (m === "efectivo") return "E";
  return "";
}

function codigoEstatus(estado?: string | null, estadoEntrega?: string | null) {
  if (estado === "entregado" || estadoEntrega === "entregado") return "E";
  if (estado === "no_entregado" || estado === "cancelado" || estadoEntrega === "fallido") return "NE";
  return "";
}

export function tipoBulto(nombre?: string | null): keyof Bultos {
  const n = String(nombre || "").toLowerCase();
  if (n.includes("perla")) return "perlas";
  if (n.includes("plus")) return "plus";
  if (n.includes("bolsa")) return "bolsa";
  return "costal";
}

export function bultosDe(lineas?: LineaProducto[] | null): Bultos {
  const out = { ...BULTOS_VACIOS };
  for (const linea of lineas || []) {
    out[tipoBulto(linea.nombre)] += Number(linea.cantidad) || 0;
  }
  return out;
}

function subtotalDe(lineas?: LineaProducto[] | null, fallback = 0) {
  const suma = (lineas || []).reduce((acc, linea) => acc + (Number(linea.cantidad) || 0) * (Number(linea.precio_unidad) || 0), 0);
  return suma || fallback;
}

function comentariosDe(opts: {
  estado?: string | null;
  estado_entrega?: string | null;
  notas?: string | null;
  fecha_propuesta?: string | null;
  estado_cobro?: string | null;
}) {
  const notas = String(opts.notas || "");
  const codes: string[] = [];
  if (opts.estado === "cancelado" || /cancelad/i.test(notas)) codes.push("4");
  if (opts.fecha_propuesta || /reagend/i.test(notas)) codes.push("3");
  if (/direcci[oó]n err[oó]nea|direccion mala/i.test(notas)) codes.push("2");
  if (opts.estado === "no_entregado" || opts.estado_entrega === "fallido" || /no se encuentra|no estaba|no contest/i.test(notas)) {
    if (!codes.includes("4") && !codes.includes("2")) codes.push("1");
  }
  if (opts.estado_cobro === "falta comprobante") codes.push("Falta comprobante");
  return codes.join(" ");
}

function montosDe(metodo?: string | null, cobro?: CobroMini, total = 0) {
  if (cobro) {
    return {
      efectivo: Number(cobro.monto_efectivo) || 0,
      transferencia: Number(cobro.monto_transferencia) || 0,
      credito: esCredito(cobro.metodo) ? (Number(cobro.monto_efectivo) || total) : 0,
    };
  }
  return { efectivo: 0, transferencia: 0, credito: 0 };
}

function fechaHoja(value?: string | null) {
  const raw = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return value || "";
  const [y, m, d] = raw.split("-");
  return `${d}/${m}/${y}`;
}

function lineasDePedido(pedido?: {
  productos?: Array<{ cantidad?: number; precio_unidad?: number; producto?: { nombre?: string } | null }>;
  paquetes?: Array<{ cantidad?: number; precio_unidad?: number; paquete?: { nombre?: string } | null }>;
} | null): LineaProducto[] {
  return [
    ...(pedido?.productos || []).map((linea) => ({
      nombre: linea.producto?.nombre,
      cantidad: linea.cantidad,
      precio_unidad: linea.precio_unidad,
    })),
    ...(pedido?.paquetes || []).map((linea) => ({
      nombre: linea.paquete?.nombre,
      cantidad: linea.cantidad,
      precio_unidad: linea.precio_unidad,
    })),
  ];
}

function sumarBultos(paradas: HojaParada[], soloEntregadas = false) {
  const out = { ...BULTOS_VACIOS };
  for (const parada of paradas) {
    if (soloEntregadas && parada.estatus !== "E") continue;
    out.costal += parada.bultos.costal;
    out.plus += parada.bultos.plus;
    out.bolsa += parada.bultos.bolsa;
    out.perlas += parada.bultos.perlas;
  }
  return out;
}

function restarBultos(inicial: Bultos, entregado: Bultos): Bultos {
  return {
    costal: Math.max(0, inicial.costal - entregado.costal),
    plus: Math.max(0, inicial.plus - entregado.plus),
    bolsa: Math.max(0, inicial.bolsa - entregado.bolsa),
    perlas: Math.max(0, inicial.perlas - entregado.perlas),
  };
}

export function hojaDesdeRuta(route: {
  fecha_ruta: string;
  distancia_estimada?: number | null;
  ciudad?: { nombre?: string; departamento?: string } | null;
  repartidor?: { nombre_completo?: string } | null;
  pedidos?: Array<{
    orden_entrega?: number;
    estado_entrega?: string;
    notas_entrega?: string | null;
    pedido?: {
      estado?: string;
      notas?: string | null;
      fecha_propuesta?: string | null;
      telefono_referencia?: string;
      direccion_entrega?: string;
      total?: number;
      metodo_pago?: string;
      cobro_entrega?: CobroMini;
      cliente?: { nombre_completo?: string; telefono?: string } | null;
      productos?: Array<{ cantidad?: number; precio_unidad?: number; producto?: { nombre?: string } | null }>;
      paquetes?: Array<{ cantidad?: number; precio_unidad?: number; paquete?: { nombre?: string } | null }>;
    } | null;
  }>;
}): HojaRutaDatos {
  const paradas = [...(route.pedidos || [])]
    .sort((a, b) => (a.orden_entrega || 0) - (b.orden_entrega || 0))
    .map((stop, index) => {
      const pedido = stop.pedido;
      const lineas = lineasDePedido(pedido);
      const total = Number(pedido?.total) || 0;
      const cobro = pedido?.cobro_entrega || null;
      return {
        orden: stop.orden_entrega || index + 1,
        telefono: pedido?.telefono_referencia || pedido?.cliente?.telefono || "",
        cliente: pedido?.cliente?.nombre_completo || "Cliente",
        direccion: pedido?.direccion_entrega || "",
        bultos: bultosDe(lineas),
        metodo: codigoPago(pedido?.metodo_pago),
        estatus: codigoEstatus(pedido?.estado, stop.estado_entrega),
        pago: codigoPago(pedido?.metodo_pago, cobro),
        subtotal: subtotalDe(lineas, total),
        total,
        ...montosDe(pedido?.metodo_pago, cobro, total),
        comentarios: comentariosDe({
          estado: pedido?.estado,
          estado_entrega: stop.estado_entrega,
          notas: stop.notas_entrega || pedido?.notas,
          fecha_propuesta: pedido?.fecha_propuesta,
        }),
      };
    });
  const ciudad = [route.ciudad?.nombre, route.ciudad?.departamento].filter(Boolean).join(", ");
  return {
    fecha: String(route.fecha_ruta || "").slice(0, 10),
    repartidor: route.repartidor?.nombre_completo || "Sin asignar",
    ciudad,
    km_esperados: route.distancia_estimada != null ? Number(route.distancia_estimada) : null,
    km_recorridos: null,
    paradas,
  };
}

export function hojaDesdeParadas(opts: {
  fecha: string;
  repartidor: string;
  ciudad?: string;
  km_esperados?: number | null;
  km_recorridos?: number | null;
  paradas: Array<{
    orden_entrega?: number | null;
    telefono?: string | null;
    cliente?: string | null;
    direccion?: string | null;
    total?: number;
    subtotal?: number;
    metodo_pago?: string | null;
    estado?: string | null;
    estado_entrega?: string | null;
    estado_cobro?: string | null;
    notas?: string | null;
    fecha_propuesta?: string | null;
    cobro?: CobroMini;
    productos?: LineaProducto[] | null;
  }>;
}): HojaRutaDatos {
  return {
    fecha: String(opts.fecha || "").slice(0, 10),
    repartidor: opts.repartidor || "Sin asignar",
    ciudad: opts.ciudad || "",
    km_esperados: opts.km_esperados ?? null,
    km_recorridos: opts.km_recorridos ?? null,
    paradas: [...opts.paradas]
      .sort((a, b) => (a.orden_entrega || 0) - (b.orden_entrega || 0))
      .map((parada, index) => {
        const total = Number(parada.total) || 0;
        return {
          orden: parada.orden_entrega || index + 1,
          telefono: parada.telefono || "",
          cliente: parada.cliente || "Cliente",
          direccion: parada.direccion || "",
          bultos: bultosDe(parada.productos),
          metodo: codigoPago(parada.metodo_pago),
          estatus: codigoEstatus(parada.estado, parada.estado_entrega),
          pago: codigoPago(parada.metodo_pago, parada.cobro),
          subtotal: Number(parada.subtotal) || subtotalDe(parada.productos, total),
          total,
          ...montosDe(parada.metodo_pago, parada.cobro, total),
          comentarios: comentariosDe(parada),
        };
      }),
  };
}

function recuadros(doc: jsPDF, x: number, y: number, titulo: string, bultos: Bultos | null) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(titulo, x, y);
  const labels: Array<[keyof Bultos, string]> = [
    ["costal", "Costal"],
    ["plus", "Plus"],
    ["bolsa", "Bolsa"],
    ["perlas", "Perlas"],
  ];
  labels.forEach(([key, label], i) => {
    const bx = x + i * 22;
    doc.rect(bx, y + 2, 20, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(label, bx + 1.5, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(bultos ? String(bultos[key] || 0) : "", bx + 1.5, y + 12);
  });
}

export function descargarHoja(hoja: HojaRutaDatos, modo: "salida" | "corte") {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 8;
  const corte = modo === "corte";
  const inicial = sumarBultos(hoja.paradas);
  const final = corte ? restarBultos(inicial, sumarBultos(hoja.paradas, true)) : null;

  let y = 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(hoja.ciudad || "Ciudad", margin, y);
  doc.text(fechaHoja(hoja.fecha), pageWidth - margin, y, { align: "right" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Repartidor: ${hoja.repartidor}`, margin, y);
  doc.text(modo === "salida" ? "Hoja de salida" : "Corte del día", pageWidth - margin, y, { align: "right" });
  y += 6;
  recuadros(doc, margin, y, "Inventario inicial", inicial);
  recuadros(doc, pageWidth - margin - 88, y, corte ? "Inventario final" : "Inventario final", corte ? final : null);
  y += 18;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const kmEsp = hoja.km_esperados != null ? `${Number(hoja.km_esperados).toFixed(1)} km` : "";
  const kmRec = hoja.km_recorridos != null ? `${Number(hoja.km_recorridos).toFixed(1)} km` : "";
  doc.text(`Km esperados: ${kmEsp}`, margin, y);
  doc.text(`Km recorridos: ${kmRec}`, pageWidth - margin, y, { align: "right" });
  y += 6;
  doc.setFontSize(6.5);
  doc.text("Estatus: E = entregado · NE = no entregado.  Pago: E = efectivo · T = transferencia · C = crédito.", margin, y);
  y += 3.5;
  doc.text("Comentario: 1 cliente no se encuentra · 2 dirección errónea · 3 reagendada · 4 cancelado.", margin, y);
  y += 5;

  const cols = [
    { key: "n", label: "#", w: 7 },
    { key: "telefono", label: "Teléfono", w: 22 },
    { key: "cliente", label: "Cliente", w: 32 },
    { key: "costal", label: "Costal", w: 12 },
    { key: "plus", label: "Plus", w: 12 },
    { key: "bolsa", label: "Bolsa", w: 12 },
    { key: "perlas", label: "Perlas", w: 12 },
    { key: "direccion", label: "Dirección", w: 48 },
    { key: "metodo", label: "Método", w: 12 },
    { key: "estatus", label: "Estatus", w: 14 },
    { key: "pago", label: "Pago", w: 12 },
    { key: "subtotal", label: "Subtotal", w: 20 },
    { key: "total", label: "Total", w: 20 },
    { key: "comentarios", label: "Comentarios", w: 36 },
  ];
  let x = margin;
  const placed = cols.map((col) => {
    const item = { ...col, x };
    x += col.w;
    return item;
  });

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 3.5, pageWidth - margin * 2, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  for (const col of placed) doc.text(col.label, col.x, y);
  y += 5;
  doc.setFont("helvetica", "normal");

  let efectivo = 0;
  let transferencia = 0;
  let credito = 0;
  let suma = 0;

  hoja.paradas.forEach((parada) => {
    if (y > 188) {
      doc.addPage();
      y = 12;
    }
    const celdas: Record<string, string> = {
      n: String(parada.orden),
      telefono: parada.telefono,
      cliente: parada.cliente,
      costal: parada.bultos.costal ? String(parada.bultos.costal) : "",
      plus: parada.bultos.plus ? String(parada.bultos.plus) : "",
      bolsa: parada.bultos.bolsa ? String(parada.bultos.bolsa) : "",
      perlas: parada.bultos.perlas ? String(parada.bultos.perlas) : "",
      direccion: parada.direccion,
      metodo: parada.metodo,
      estatus: corte ? parada.estatus : "",
      pago: corte ? parada.pago : "",
      subtotal: dinero(parada.subtotal),
      total: dinero(parada.total),
      comentarios: corte ? parada.comentarios : "",
    };
    for (const col of placed) {
      doc.text(String(celdas[col.key] || ""), col.x, y, { maxWidth: col.w - 1.5 });
    }
    y += 7;
    suma += parada.total;
    efectivo += parada.efectivo;
    transferencia += parada.transferencia;
    credito += parada.credito;
  });

  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Pedidos: ${hoja.paradas.length}`, margin, y);
  doc.text(`Suma ${dinero(suma) || "$0.00"}`, margin + 40, y);
  if (corte) {
    doc.text(`E ${dinero(efectivo) || "$0.00"}`, margin + 90, y);
    doc.text(`T ${dinero(transferencia) || "$0.00"}`, margin + 130, y);
    doc.text(`C ${dinero(credito) || "$0.00"}`, margin + 170, y);
    y += 6;
    doc.text(`Efectivo a depositar: ${dinero(efectivo) || "$0.00"}`, margin, y);
  }

  const slug = `${modo}-${hoja.fecha || "ruta"}-${hoja.repartidor}`.replace(/[^\w.-]+/g, "_");
  doc.save(`${slug}.pdf`);
}
