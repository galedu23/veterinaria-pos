"use client";

// ============================================================
// hooks/use-pago.ts — Lógica de COBRO del punto de venta.
//
// QUÉ hace: administra cómo se cubre el total de una venta:
//   el método elegido, cuánto se paga con cada forma (pago mixto),
//   con cuánto efectivo paga el cliente y CUÁNTO CAMBIO se devuelve.
// PARA QUÉ sirve: sacar toda la aritmética del componente visual. El
//   carrito solo PINTA lo que este hook calcula, así el día que
//   cambien las reglas de cobro se toca un solo archivo.
// CÓMO SE GUARDA EN SUPABASE: el resultado (`desglose`, `cambio`) se
//   escribirá en las columnas pago_efectivo / pago_tarjeta /
//   pago_transferencia / efectivo_recibido / cambio de `ventas`.
// ============================================================

import * as React from "react";
import type { MetodoPago, DesglosePago } from "@/types";

/**
 * aNumero: convierte el texto de un input a número seguro.
 * Un input vacío o con letras devuelve 0 en vez de NaN (que
 * contagiaría de NaN todas las sumas siguientes).
 */
function aNumero(texto: string): number {
  const valor = Number(texto);
  return isNaN(valor) || valor < 0 ? 0 : valor;
}

/**
 * redondear: deja el número en 2 decimales (centavos).
 * POR QUÉ es necesario: en JavaScript 0.1 + 0.2 da 0.30000000000000004.
 * Sin redondear, una venta "cubierta exactamente" podría marcar un
 * faltante de 0.0000001 y bloquear el cobro.
 */
function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function usePago(totalACobrar: number) {
  // Método elegido por el cajero ("mixto" habilita los tres montos)
  const [metodo, setMetodo] = React.useState<MetodoPago>("efectivo");

  // Montos capturados SOLO en modo mixto (strings: vienen de inputs)
  const [montoEfectivo, setMontoEfectivo] = React.useState("");
  const [montoTarjeta, setMontoTarjeta] = React.useState("");
  const [montoTransferencia, setMontoTransferencia] = React.useState("");

  // Con cuánto efectivo paga el cliente (para calcular el cambio).
  // Vacío = pagó justo, no hay cambio que devolver.
  const [efectivoRecibido, setEfectivoRecibido] = React.useState("");

  /**
   * desglose: cuánto del total cubre cada forma de pago.
   * - Método único: TODO el total se le asigna a ese método.
   * - Mixto: se usan los montos que capturó el cajero.
   */
  const desglose: DesglosePago = React.useMemo(() => {
    if (metodo === "mixto") {
      return {
        efectivo: redondear(aNumero(montoEfectivo)),
        tarjeta: redondear(aNumero(montoTarjeta)),
        transferencia: redondear(aNumero(montoTransferencia)),
      };
    }
    return {
      efectivo: metodo === "efectivo" ? totalACobrar : 0,
      tarjeta: metodo === "tarjeta" ? totalACobrar : 0,
      transferencia: metodo === "transferencia" ? totalACobrar : 0,
    };
  }, [metodo, montoEfectivo, montoTarjeta, montoTransferencia, totalACobrar]);

  // Suma de lo cubierto y cuánto falta para llegar al total
  const totalCubierto = redondear(
    desglose.efectivo + desglose.tarjeta + desglose.transferencia
  );
  const faltante = redondear(totalACobrar - totalCubierto); // >0 = falta dinero

  /**
   * cambio: solo aplica sobre la PARTE EN EFECTIVO.
   * Si el cajero no captura con cuánto pagan, se asume pago justo (0).
   * Una tarjeta nunca genera cambio, por eso se resta desglose.efectivo
   * y no el total de la venta.
   */
  const recibido = redondear(aNumero(efectivoRecibido));
  const cambio = recibido > 0 ? redondear(recibido - desglose.efectivo) : 0;

  /**
   * error: mensaje que impide cobrar. Se revisan dos cosas:
   *   1. Que la suma de los montos cubra el total (modo mixto).
   *   2. Que el efectivo recibido alcance para la parte en efectivo.
   */
  let error = "";
  if (metodo === "mixto" && faltante > 0) {
    error = `Faltan $${faltante.toFixed(2)} por cubrir entre las formas de pago.`;
  } else if (metodo === "mixto" && faltante < 0) {
    error = `Los montos exceden el total por $${Math.abs(faltante).toFixed(2)}.`;
  } else if (recibido > 0 && cambio < 0) {
    error = `El efectivo recibido no cubre $${desglose.efectivo.toFixed(2)}.`;
  }

  /** puedeCobrar: hay algo que cobrar y no hay errores pendientes */
  const puedeCobrar = totalACobrar > 0 && error === "";

  /** limpiar: reinicia el cobro después de guardar una venta */
  const limpiar = React.useCallback(() => {
    setMetodo("efectivo"); // el efectivo es el caso más común
    setMontoEfectivo("");
    setMontoTarjeta("");
    setMontoTransferencia("");
    setEfectivoRecibido("");
  }, []);

  return {
    // Estado y sus modificadores (los usa el panel de pago)
    metodo, setMetodo,
    montoEfectivo, setMontoEfectivo,
    montoTarjeta, setMontoTarjeta,
    montoTransferencia, setMontoTransferencia,
    efectivoRecibido, setEfectivoRecibido,
    // Valores calculados (solo lectura)
    desglose,
    efectivoRecibidoNumero: recibido,
    cambio,
    faltante,
    error,
    puedeCobrar,
    limpiar,
  };
}
