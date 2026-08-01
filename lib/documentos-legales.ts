// ============================================================
// lib/documentos-legales.ts — Motor de DOCUMENTOS LEGALES.
//
// QUÉ hace: toma una plantilla editable (con marcadores {{MASCOTA}},
//   {{CEDULA}}, etc.), sustituye los marcadores con los datos reales
//   del paciente y genera el documento listo para imprimir o guardar
//   como PDF desde el navegador.
// PARA QUÉ: que la clínica pueda redactar y ajustar sus propios
//   formatos SIN tocar código — solo edita el texto en /formatos.
// CÓMO SE CONECTA A SUPABASE: no accede a datos. Recibe la plantilla
//   (tabla `plantillas_documento`) y los datos ya cargados por quien
//   lo llama. Es una función pura + una de impresión.
// ============================================================

import type { PlantillaDocumento, ConfiguracionClinica } from "@/types";

/**
 * DatosDocumento: todo lo que se puede sustituir en una plantilla.
 * Si agregas un campo aquí, agrégalo también a MARCADORES para que
 * aparezca en la ayuda del editor.
 */
export interface DatosDocumento {
  /**
   * Fecha del documento en ISO (YYYY-MM-DD). Es EDITABLE: a veces hay
   * que expedir un certificado con fecha distinta a la de hoy (se
   * reimprime, se emitió en papel otro día, etc.). El sistema anterior
   * no lo permitía y era una molestia constante.
   */
  fecha: string;
  /** Ciudad y estado que encabezan el documento */
  lugar: string;
  // --- Paciente ---
  mascota: string;
  especie: string;
  raza: string;
  sexo: string;
  edad: string;
  peso: string;
  color: string;
  // --- Propietario ---
  dueno: string;
  telefonoDueno: string;
  direccionDueno: string;
  colonia: string;
  localidad: string;
  municipio: string;
  // --- Médico que firma ---
  veterinario: string;
  cedula: string;
  especialidad: string;
  // --- Campos libres del formato ---
  /** Motivo, hallazgos, diagnóstico o servicio solicitado */
  motivo: string;
  /** Observaciones, indicaciones, destino del cuerpo, esquema de vacunas… */
  observaciones: string;
  /** Solo para certificados de traslado: de dónde y a dónde viaja */
  origen: string;
  destino: string;
}

/**
 * fechaLarga: convierte "2026-08-01" en "1 de agosto de 2026".
 * POR QUÉ propia y no formatoFecha(): los documentos legales se
 * redactan con el mes en letra y completo. (El sistema anterior lo
 * imprimía en inglés — "1 de Aug de 2026" — por usar el formato
 * predeterminado del servidor.)
 */
function fechaLarga(iso: string): string {
  // Se parte la fecha a mano para evitar el corrimiento de zona horaria
  // que provoca new Date("2026-08-01") al interpretarla como UTC.
  const [anio, mes, dia] = iso.split("-").map(Number);
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${dia} de ${meses[mes - 1]} de ${anio}`;
}

/**
 * MARCADORES: catálogo de etiquetas disponibles. Se muestra como ayuda
 * en el editor de plantillas para que quien redacta sepa qué puede usar.
 */
export const MARCADORES: Array<{ etiqueta: string; descripcion: string }> = [
  { etiqueta: "{{FECHA}}", descripcion: "Fecha del documento, en letra y EDITABLE" },
  { etiqueta: "{{LUGAR}}", descripcion: "Ciudad y estado (Configuración)" },
  { etiqueta: "{{MASCOTA}}", descripcion: "Nombre del paciente" },
  { etiqueta: "{{ESPECIE}}", descripcion: "Perro, Gato, Ave…" },
  { etiqueta: "{{RAZA}}", descripcion: "Raza del paciente" },
  { etiqueta: "{{SEXO}}", descripcion: "Macho o Hembra" },
  { etiqueta: "{{EDAD}}", descripcion: "Edad calculada de su fecha de nacimiento" },
  { etiqueta: "{{PESO}}", descripcion: "Peso de la última consulta" },
  { etiqueta: "{{COLOR}}", descripcion: "Color y señas particulares" },
  { etiqueta: "{{DUENO}}", descripcion: "Nombre completo del propietario" },
  { etiqueta: "{{TELEFONO_DUENO}}", descripcion: "Celular del propietario" },
  { etiqueta: "{{DIRECCION_DUENO}}", descripcion: "Calle y número del propietario" },
  { etiqueta: "{{COLONIA}}", descripcion: "Colonia o fraccionamiento" },
  { etiqueta: "{{LOCALIDAD}}", descripcion: "Localidad" },
  { etiqueta: "{{MUNICIPIO}}", descripcion: "Municipio" },
  { etiqueta: "{{ORIGEN}}", descripcion: "Dirección de origen (certificados de traslado)" },
  { etiqueta: "{{DESTINO}}", descripcion: "Dirección destino (certificados de traslado)" },
  { etiqueta: "{{VETERINARIO}}", descripcion: "Médico que firma" },
  { etiqueta: "{{CEDULA}}", descripcion: "Cédula profesional del médico" },
  { etiqueta: "{{ESPECIALIDAD}}", descripcion: "Especialidad del médico" },
  { etiqueta: "{{CLINICA}}", descripcion: "Nombre de la clínica (Configuración)" },
  { etiqueta: "{{DIRECCION_CLINICA}}", descripcion: "Dirección de la clínica" },
  { etiqueta: "{{TELEFONO_CLINICA}}", descripcion: "Teléfono de la clínica" },
  { etiqueta: "{{MOTIVO}}", descripcion: "Campo libre 1: motivo, servicio, diagnóstico" },
  { etiqueta: "{{OBSERVACIONES}}", descripcion: "Campo libre 2: observaciones e indicaciones" },
];

/**
 * escaparHtml: neutraliza los caracteres que el navegador interpretaría
 * como etiquetas. POR QUÉ: el contenido lo escribe un usuario; sin esto,
 * un texto con "<" rompería el documento impreso.
 */
function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * rellenarPlantilla: cambia cada {{MARCADOR}} por su valor real.
 * Los marcadores que queden sin dato se sustituyen por una línea
 * "__________" para que se puedan llenar a mano sobre el papel.
 */
export function rellenarPlantilla(
  contenido: string,
  datos: DatosDocumento,
  config: ConfiguracionClinica | null
): string {
  // Tabla marcador -> valor. El orden no importa: se reemplaza por nombre.
  const valores: Record<string, string> = {
    // La fecha viene de `datos`, NO del reloj: el usuario puede cambiarla
    FECHA: fechaLarga(datos.fecha),
    LUGAR: datos.lugar,
    MASCOTA: datos.mascota,
    ESPECIE: datos.especie,
    RAZA: datos.raza,
    SEXO: datos.sexo,
    EDAD: datos.edad,
    PESO: datos.peso,
    COLOR: datos.color,
    DUENO: datos.dueno,
    TELEFONO_DUENO: datos.telefonoDueno,
    DIRECCION_DUENO: datos.direccionDueno,
    COLONIA: datos.colonia,
    LOCALIDAD: datos.localidad,
    MUNICIPIO: datos.municipio,
    ORIGEN: datos.origen,
    DESTINO: datos.destino,
    VETERINARIO: datos.veterinario,
    CEDULA: datos.cedula,
    ESPECIALIDAD: datos.especialidad,
    CLINICA: config?.nombre ?? "",
    DIRECCION_CLINICA: config?.direccion ?? "",
    TELEFONO_CLINICA: config?.telefono ?? "",
    MOTIVO: datos.motivo,
    OBSERVACIONES: datos.observaciones,
  };

  // \{\{\s*(\w+)\s*\}\} tolera espacios: {{ MASCOTA }} también funciona
  return contenido.replace(/\{\{\s*(\w+)\s*\}\}/g, (_coincidencia, clave: string) => {
    const valor = valores[clave];
    return valor && valor.trim() !== "" ? valor : "__________";
  });
}

/**
 * imprimirDocumento: arma el HTML final (membrete + cuerpo + firmas) y
 * abre el diálogo de impresión del navegador, desde donde se puede
 * "Guardar como PDF".
 * POR QUÉ una ventana nueva: no hereda el CSS de la app, así el
 * documento sale limpio en tamaño carta.
 */
export function imprimirDocumento(
  plantilla: PlantillaDocumento,
  datos: DatosDocumento,
  config: ConfiguracionClinica | null
): void {
  // 1) Sustituir marcadores y 2) escapar para que nada rompa el HTML
  const cuerpo = escaparHtml(rellenarPlantilla(plantilla.contenido, datos, config));

  // Bloques de firma: solo los que la plantilla declara necesarios
  const firmas: string[] = [];
  if (plantilla.requiereFirmaPropietario) {
    firmas.push(`
      <div class="firma">
        <hr>
        <p><strong>${escaparHtml(datos.dueno || "Propietario")}</strong></p>
        <p class="rol">Nombre y firma del propietario o responsable</p>
      </div>`);
  }
  if (plantilla.requiereFirmaVeterinario) {
    firmas.push(`
      <div class="firma">
        <hr>
        <p><strong>${escaparHtml(datos.veterinario || "Médico Veterinario")}</strong></p>
        <p class="rol">Médico Veterinario Zootecnista${datos.cedula ? ` · Céd. Prof. ${escaparHtml(datos.cedula)}` : ""}</p>
      </div>`);
  }

  const html = `<!DOCTYPE html>
    <html lang="es"><head><meta charset="utf-8">
    <title>${escaparHtml(plantilla.nombre)}</title>
    <style>
      @page { size: letter; margin: 20mm; }
      body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 12px; line-height: 1.5; }
      .membrete { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #111; padding-bottom: 10px; }
      .membrete img { height: 60px; width: 60px; object-fit: contain; }
      .membrete h1 { font-size: 16px; margin: 0; }
      .membrete p { margin: 2px 0; font-size: 11px; color: #555; }
      h2 { font-size: 14px; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin: 18px 0 4px; }
      .fundamento { text-align: center; font-size: 10px; color: #666; margin-bottom: 14px; font-style: italic; }
      /* pre-wrap conserva los saltos de línea que escribió el usuario */
      .cuerpo { white-space: pre-wrap; text-align: justify; }
      .firmas { display: flex; justify-content: space-around; gap: 30px; margin-top: 70px; }
      .firma { text-align: center; flex: 1; }
      .firma hr { border: none; border-top: 1px solid #333; margin-bottom: 4px; }
      .firma p { margin: 0; font-size: 11px; }
      .firma .rol { color: #555; font-size: 10px; }
      .pie { margin-top: 26px; border-top: 1px solid #ccc; padding-top: 6px; font-size: 9px; color: #777; text-align: center; }
    </style></head><body>
      <div class="membrete">
        ${config?.logoUrl ? `<img src="${config.logoUrl}" alt="Logo">` : ""}
        <div>
          <h1>${escaparHtml(config?.nombre || "Clínica Veterinaria")}</h1>
          ${config?.direccion ? `<p>${escaparHtml(config.direccion)}</p>` : ""}
          ${config?.telefono ? `<p>Tel: ${escaparHtml(config.telefono)}</p>` : ""}
        </div>
      </div>

      <h2>${escaparHtml(plantilla.nombre)}</h2>
      ${plantilla.fundamentoLegal ? `<p class="fundamento">Fundamento: ${escaparHtml(plantilla.fundamentoLegal)}</p>` : ""}

      <div class="cuerpo">${cuerpo}</div>

      ${firmas.length > 0 ? `<div class="firmas">${firmas.join("")}</div>` : ""}

      <div class="pie">Documento expedido por ${escaparHtml(config?.nombre || "la clínica")} · ${escaparHtml(fechaLarga(datos.fecha))}</div>
    </body></html>`;

  const ventana = window.open("", "_blank", "width=900,height=700");
  if (!ventana) return; // bloqueador de pop-ups activo
  ventana.document.write(html);
  ventana.document.close();
  ventana.onload = () => ventana.print();
}
