// ============================================================
// lib/imprimir-receta.ts — Utilidad COMPARTIDA de impresión.
//
// QUÉ: genera el HTML imprimible de una receta (membrete, tabla de
//   medicamentos, firma) y abre el diálogo de impresión del navegador,
//   desde donde se puede "Guardar como PDF".
// POR QUÉ vive en lib/: la usan DOS vistas (el expediente de la
//   mascota y el listado global /recetas); si estuviera dentro de un
//   componente habría que duplicarla.
// TODO: para un PDF con diseño corporativo exacto, reemplazar esta
//   función por @react-pdf/renderer o jsPDF — solo se toca este archivo.
// ============================================================

import { formatoFecha } from "@/lib/utils";
import { getConfiguracionClinica } from "@/services/config";
import type { Receta } from "@/types";

/**
 * imprimirReceta: abre una ventana nueva solo con la receta y lanza
 * window.print(). La ventana no hereda el CSS de la app, por eso los
 * estilos van embebidos en el propio HTML.
 * POR QUÉ es async y lee la configuración AQUÍ dentro: el membrete
 * (logo + nombre + dirección + teléfono) debe salir idéntico se
 * imprima desde el expediente, el listado /recetas o el editor —
 * si cada vista pasara sus propios datos, tarde o temprano divergirían.
 */
export async function imprimirReceta(receta: Receta, nombreMascota: string, nombreDueno: string): Promise<void> {
  // Datos de la clínica capturados en /configuracion (con defaults)
  const config = await getConfiguracionClinica();
  const filas = receta.medicamentos
    .map(
      (m) => `
      <tr>
        <td>${m.nombre}</td>
        <td>${m.dosis}</td>
        <td>${m.frecuencia}</td>
        <td>${m.duracion || "—"}</td>
        <td>${m.indicaciones || "—"}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
    <html lang="es"><head><meta charset="utf-8"><title>Receta ${receta.id}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
      h1 { font-size: 20px; margin: 0; } .sub { color: #555; font-size: 12px; }
      .datos { margin: 16px 0; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
      th { background: #eee; }
      .obs { margin-top: 16px; font-size: 13px; }
      .firma { margin-top: 60px; text-align: center; font-size: 13px; }
      .firma hr { width: 220px; }
      .membrete { display: flex; align-items: center; gap: 12px; }
      .membrete img { height: 56px; width: 56px; object-fit: contain; }
    </style></head><body>
      <div class="membrete">
        ${config.logoUrl ? `<img src="${config.logoUrl}" alt="Logo">` : ""}
        <div>
          <h1>${config.logoUrl ? "" : "🐾 "}${config.nombre} — Receta Médica</h1>
          <p class="sub">
            ${config.direccion ? config.direccion + " · " : ""}
            ${config.telefono ? "Tel: " + config.telefono : ""}
          </p>
        </div>
      </div>
      <div class="datos">
        <strong>Paciente:</strong> ${nombreMascota} &nbsp;·&nbsp;
        <strong>Propietario:</strong> ${nombreDueno} &nbsp;·&nbsp;
        <strong>Fecha:</strong> ${formatoFecha(receta.fecha)}
      </div>
      <table>
        <thead><tr><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th><th>Duración</th><th>Indicaciones</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      ${receta.observaciones ? `<p class="obs"><strong>Observaciones:</strong> ${receta.observaciones}</p>` : ""}
      <div class="firma"><hr><p>Firma del Médico Veterinario</p></div>
    </body></html>`;

  const ventana = window.open("", "_blank", "width=800,height=600");
  if (!ventana) return; // bloqueador de pop-ups activo
  ventana.document.write(html);
  ventana.document.close();
  ventana.onload = () => ventana.print();
}
