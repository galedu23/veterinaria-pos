"use client";

// ============================================================
// app/(dashboard)/ventas/page.tsx — Página del PUNTO DE VENTA.
//
// QUÉ: orquesta el POS. Carga productos/clientes, es dueña del
//   carrito (hook useCarrito) y coordina a los tres componentes:
//   - CatalogoProductos (izquierda: buscador + rejilla)
//   - CarritoVenta      (derecha: líneas, total, cobrar)
//   - TicketVenta       (dialog con el ticket tras cobrar)
// POR QUÉ la página es dueña del carrito: al cobrar necesita
//   limpiarlo y refrescar el stock; si el carrito viviera dentro
//   del componente hijo, la página no podría controlarlo.
// CÓMO SE CONECTA A SUPABASE: solo a través de services/db.ts
//   (getProductos, getClientes, registrarVenta).
// ============================================================

import * as React from "react";
import { Receipt, Calculator, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogoProductos } from "@/components/ventas/catalogo-productos";
import { CarritoVenta } from "@/components/ventas/carrito-venta";
import { TicketVenta } from "@/components/ventas/ticket-venta";
import { CorteCaja } from "@/components/ventas/corte-caja";
import { HistorialVentas } from "@/components/ventas/historial-ventas";
import { useAuth } from "@/hooks/use-auth";
import { useCarrito } from "@/hooks/use-carrito";
import { getProductos, getClientes, registrarVenta } from "@/services/db";
import { getConfiguracionClinica } from "@/services/config";
import type {
  Producto, Cliente, Venta, MetodoPago, ConfiguracionClinica, TipoDescuento,
} from "@/types";

export default function PaginaVentas() {
  const { usuario } = useAuth();
  // El carrito vive en la página (estado elevado) para poder
  // limpiarlo después de cobrar.
  const carrito = useCarrito();

  // ---- Estado de datos ----
  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [cargando, setCargando] = React.useState(true);

  // ---- Estado de la interfaz ----
  const [clienteId, setClienteId] = React.useState(""); // "" = público general
  const [metodoPago, setMetodoPago] = React.useState<MetodoPago>("efectivo");
  const [cobrando, setCobrando] = React.useState(false);
  const [error, setError] = React.useState("");
  const [ticket, setTicket] = React.useState<Venta | null>(null);
  const [corteAbierto, setCorteAbierto] = React.useState(false);
  const [historialAbierto, setHistorialAbierto] = React.useState(false);
  // Datos de la clínica (de /configuracion) para el encabezado del ticket
  const [config, setConfig] = React.useState<ConfiguracionClinica | null>(null);

  // ---- Descuento de la venta en curso ----
  // tipo "" = sin descuento; el valor se captura como string (viene de un input)
  const [tipoDescuento, setTipoDescuento] = React.useState<TipoDescuento | "">("");
  const [valorDescuento, setValorDescuento] = React.useState("");

  /**
   * montoDescuento: el CÁLCULO del descuento vive aquí (un solo lugar).
   * Reglas de caja: un % se limita a 100 y un monto fijo nunca puede
   * superar el subtotal (no existen los totales negativos).
   */
  const montoDescuento = React.useMemo(() => {
    const valor = Number(valorDescuento);
    if (!tipoDescuento || isNaN(valor) || valor <= 0) return 0;
    if (tipoDescuento === "porcentaje") {
      // (total * %) / 100, redondeado a centavos; el % se limita a 100
      return Math.round(carrito.total * Math.min(valor, 100)) / 100;
    }
    return Math.min(valor, carrito.total); // monto fijo con tope = subtotal
  }, [tipoDescuento, valorDescuento, carrito.total]);

  // Total a cobrar = subtotal de líneas - descuento
  const totalFinal = carrito.total - montoDescuento;

  /** cargarDatos: productos, clientes y configuración del ticket en paralelo */
  const cargarDatos = React.useCallback(async () => {
    setCargando(true);
    const [prods, clis, cfg] = await Promise.all([
      getProductos(), getClientes(), getConfiguracionClinica(),
    ]);
    setProductos(prods);
    setClientes(clis);
    setConfig(cfg);
    setCargando(false);
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  /** enCarrito: unidades de un producto ya apartadas en el carrito */
  const enCarrito = (productoId: string) =>
    carrito.items.find((i) => i.productoId === productoId)?.cantidad ?? 0;

  /** agregarAlCarrito: valida stock disponible antes de agregar la unidad */
  const agregarAlCarrito = (p: Producto) => {
    setError("");
    if (enCarrito(p.id) >= p.stock) {
      setError(`No hay más stock de "${p.nombre}" (disponible: ${p.stock}).`);
      return;
    }
    carrito.agregar(p, p.precioVenta); // en POS siempre precio de VENTA
  };

  /**
   * cobrar: registra la venta en el servicio (que descuenta el stock),
   * muestra el ticket y deja todo listo para la siguiente venta.
   */
  const cobrar = async () => {
    if (!usuario || carrito.items.length === 0) return;
    setError("");
    setCobrando(true);
    try {
      const venta = await registrarVenta({
        clienteId: clienteId || undefined,
        usuarioId: usuario.id,
        fecha: new Date().toISOString().slice(0, 10),
        items: carrito.items,
        subtotal: carrito.total,   // suma de líneas antes del descuento
        descuento: montoDescuento, // monto ya calculado (con topes)
        total: totalFinal,         // lo que realmente se cobró
        metodoPago,                // queda registrado para el corte de caja
        estado: "completada",
      });
      setTicket(venta);
      carrito.limpiar();
      setClienteId("");
      setMetodoPago("efectivo"); // el efectivo es el caso más común
      setTipoDescuento("");      // el descuento NO se arrastra a la siguiente venta
      setValorDescuento("");
      await cargarDatos(); // refresca el stock visible en el catálogo
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cobrar");
    } finally {
      setCobrando(false);
    }
  };

  /** nombreCliente: resuelve el nombre a mostrar en el ticket */
  const nombreCliente = (id?: string) => {
    if (!id) return "Público general";
    const c = clientes.find((x) => x.id === id);
    return c ? `${c.nombre} ${c.apellidos}` : "Público general";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Receipt className="h-6 w-6 text-blue-600" /> Punto de Venta
        </h2>
        <div className="flex gap-2">
          {/* Historial del día: reimprimir y cancelar tickets */}
          <Button variant="outline" onClick={() => setHistorialAbierto(true)}>
            <History /> Historial
          </Button>
          {/* Corte del día (Reporte Z): total vendido + desglose por pago */}
          <Button variant="outline" onClick={() => setCorteAbierto(true)}>
            <Calculator /> Corte del Día
          </Button>
        </div>
      </div>

      {/* 2 columnas en escritorio; apiladas en móvil */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CatalogoProductos
            productos={productos}
            cargando={cargando}
            enCarrito={enCarrito}
            onAgregar={agregarAlCarrito}
          />
        </div>
        <div className="lg:col-span-2">
          <CarritoVenta
            carrito={carrito}
            clientes={clientes}
            productos={productos}
            clienteId={clienteId}
            onClienteChange={setClienteId}
            metodoPago={metodoPago}
            onMetodoPagoChange={setMetodoPago}
            tipoDescuento={tipoDescuento}
            valorDescuento={valorDescuento}
            onDescuentoChange={(tipo, valor) => {
              setTipoDescuento(tipo);
              setValorDescuento(tipo ? valor : ""); // al quitar el tipo se limpia el valor
            }}
            montoDescuento={montoDescuento}
            totalFinal={totalFinal}
            error={error}
            cobrando={cobrando}
            onCobrar={cobrar}
          />
        </div>
      </div>

      {/* Ticket interno tras el cobro (con los datos de /configuracion) */}
      <TicketVenta
        venta={ticket}
        nombreAtendio={usuario?.nombre ?? ""}
        nombreCliente={nombreCliente(ticket?.clienteId)}
        config={config}
        onCerrar={() => setTicket(null)}
      />

      {/* Modal del corte de caja */}
      <CorteCaja abierto={corteAbierto} onCerrar={() => setCorteAbierto(false)} />

      {/* Historial del día: reimprimir reutiliza el mismo modal TicketVenta
          (setTicket) y cancelar refresca el stock del catálogo (cargarDatos) */}
      <HistorialVentas
        abierto={historialAbierto}
        clientes={clientes}
        onCerrar={() => setHistorialAbierto(false)}
        onReimprimir={(venta) => {
          setHistorialAbierto(false);
          setTicket(venta);
        }}
        onVentaCancelada={cargarDatos}
      />
    </div>
  );
}
