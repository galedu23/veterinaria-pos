// ============================================================
// services/db.ts — Capa de datos MOCKEADA (en memoria).
//
// Todas las funciones son async y devuelven Promesas para que,
// al conectar Supabase, solo haya que cambiar el cuerpo de cada
// función por la consulta real sin tocar los componentes.
//
// TODO: Conectar con Supabase. Ejemplo de reemplazo:
//   getClientes() -> supabase.from("clientes").select("*")
// ============================================================

import type {
  Cliente, Especie, Raza, Mascota, Consulta, Receta, Vacuna,
  Categoria, Producto, Venta, Compra, DashboardStats, ResultadoBusqueda,
  DocumentoMedico, CorteCaja, MetodoPago, DesglosePago, Antecedentes, Servicio,
  Veterinario, PlantillaDocumento,
} from "@/types";
import { diasHasta } from "@/lib/utils";

// ------------------------------------------------------------
// DATOS DE PRUEBA (simulan las tablas de la base de datos)
// ------------------------------------------------------------

const especies: Especie[] = [
  { id: "e-1", nombre: "Perro" },
  { id: "e-2", nombre: "Gato" },
  { id: "e-3", nombre: "Ave" },
];

const razas: Raza[] = [
  { id: "r-1", especieId: "e-1", nombre: "Labrador" },
  { id: "r-2", especieId: "e-1", nombre: "Pastor Alemán" },
  { id: "r-3", especieId: "e-1", nombre: "Chihuahua" },
  { id: "r-4", especieId: "e-1", nombre: "Criollo" },
  { id: "r-5", especieId: "e-2", nombre: "Siamés" },
  { id: "r-6", especieId: "e-2", nombre: "Persa" },
  { id: "r-7", especieId: "e-2", nombre: "Doméstico" },
  { id: "r-8", especieId: "e-3", nombre: "Periquito" },
];

const clientes: Cliente[] = [
  { id: "c-1", nombre: "María", apellidos: "García López", telefono: "555-101-2020", email: "maria@mail.com", direccion: "Av. Reforma 12", creadoEn: "2025-01-15" },
  { id: "c-2", nombre: "Juan", apellidos: "Pérez Soto", telefono: "555-303-4040", email: "juan@mail.com", direccion: "Calle 5 de Mayo 8", creadoEn: "2025-02-10" },
  { id: "c-3", nombre: "Ana", apellidos: "Ramírez Cruz", telefono: "555-505-6060", creadoEn: "2025-03-22" },
  { id: "c-4", nombre: "Pedro", apellidos: "Hernández Díaz", telefono: "555-707-8080", email: "pedro@mail.com", creadoEn: "2025-05-01" },
  { id: "c-5", nombre: "Lucía", apellidos: "Torres Vega", telefono: "555-909-1010", creadoEn: "2025-06-12" },
];

const mascotas: Mascota[] = [
  { id: "m-1", clienteId: "c-1", nombre: "Lobo", especieId: "e-1", razaId: "r-2", sexo: "macho", fechaNacimiento: "2021-04-10", color: "Negro y café", creadoEn: "2025-01-15" },
  { id: "m-2", clienteId: "c-2", nombre: "Lobo", especieId: "e-1", razaId: "r-4", sexo: "macho", fechaNacimiento: "2023-08-01", color: "Blanco", creadoEn: "2025-02-10" },
  { id: "m-3", clienteId: "c-1", nombre: "Michi", especieId: "e-2", razaId: "r-5", sexo: "hembra", fechaNacimiento: "2022-11-20", color: "Gris", creadoEn: "2025-01-20" },
  { id: "m-4", clienteId: "c-3", nombre: "Firulais", especieId: "e-1", razaId: "r-1", sexo: "macho", fechaNacimiento: "2020-02-14", color: "Dorado", creadoEn: "2025-03-22" },
  { id: "m-5", clienteId: "c-4", nombre: "Luna", especieId: "e-2", razaId: "r-7", sexo: "hembra", fechaNacimiento: "2024-01-05", color: "Negra", creadoEn: "2025-05-01" },
  { id: "m-6", clienteId: "c-5", nombre: "Kiwi", especieId: "e-3", razaId: "r-8", sexo: "macho", color: "Verde", creadoEn: "2025-06-12" },
];

const consultas: Consulta[] = [
  {
    id: "co-1", mascotaId: "m-1", veterinarioId: "u-2", fecha: "2026-06-20",
    motivo: "Vómito y decaimiento", diagnostico: "Gastroenteritis leve",
    tratamiento: "Dieta blanda 3 días", pesoKg: 32.4, temperaturaC: 38.9,
    notas: "Revisar en una semana si persiste",
    tipoServicio: "Consulta general", condicionCorporal: 5,
    proximaConsulta: "2026-07-01", progreso: "Primera visita por este cuadro",
    exploracion: {
      fc: "110 lpm", fr: "22 rpm", pulsoFemoral: "Fuerte y simétrico",
      deshidratacionPct: "5%", mucosas: "Rosadas, ligeramente secas", tllc: "<2 s",
      cabeza: "Sin alteraciones", pielPelaje: "Normal",
      ganglios: "No inflamados", sistemaRespiratorio: "Campos limpios",
      sistemaMusculoEsqueletico: "Normal", sistemaNervioso: "Alerta",
    },
  },
  {
    id: "co-2", mascotaId: "m-1", veterinarioId: "u-2", fecha: "2026-07-01",
    motivo: "Revisión de seguimiento", diagnostico: "Recuperado",
    pesoKg: 33.0, temperaturaC: 38.5,
    tipoServicio: "Seguimiento", condicionCorporal: 5,
    progreso: "Evolución favorable, alta del cuadro digestivo",
    exploracion: { fc: "105 lpm", fr: "20 rpm", mucosas: "Rosadas y húmedas", tllc: "<2 s" },
  },
  {
    id: "co-3", mascotaId: "m-3", veterinarioId: "u-2", fecha: "2026-06-25",
    motivo: "Estornudos frecuentes", diagnostico: "Rinotraqueitis felina",
    tratamiento: "Antibiótico + antiviral", pesoKg: 4.1, temperaturaC: 39.4,
    tipoServicio: "Consulta general", condicionCorporal: 4,
    proximaConsulta: "2026-07-09", progreso: "Inicio de tratamiento",
    exploracion: {
      fc: "180 lpm", fr: "32 rpm", mucosas: "Congestionadas",
      cabeza: "Secreción nasal serosa", sistemaRespiratorio: "Estornudos, sin estertores",
    },
  },
  {
    id: "co-4", mascotaId: "m-4", veterinarioId: "u-2", fecha: "2026-07-03",
    motivo: "Cojea de pata trasera", diagnostico: "Esguince leve",
    tratamiento: "Reposo y antiinflamatorio", pesoKg: 28.7, temperaturaC: 38.6,
    tipoServicio: "Urgencia", condicionCorporal: 6,
    proximaConsulta: "2026-07-10", progreso: "Dolor a la palpación, sin fractura aparente",
    exploracion: {
      fc: "95 lpm", fr: "18 rpm",
      sistemaMusculoEsqueletico: "Claudicación grado 2 miembro pélvico izq.",
    },
  },
];

// Catálogo de servicios de la clínica: alimenta el select "Tipo de
// servicio" del alta de consulta y se administra en /servicios.
const servicios: Servicio[] = [
  { id: "sv-1", nombre: "Consulta general", precio: 350 },
  { id: "sv-2", nombre: "Vacunación", precio: 250 },
  { id: "sv-3", nombre: "Desparasitación", precio: 150 },
  { id: "sv-4", nombre: "Cirugía", precio: 2500, descripcion: "Precio base; varía según procedimiento" },
  { id: "sv-5", nombre: "Estética y baño", precio: 300 },
  { id: "sv-6", nombre: "Corte de uñas", precio: 80 },
  { id: "sv-7", nombre: "Profilaxis dental", precio: 900 },
  { id: "sv-8", nombre: "Rayos X", precio: 600 },
  { id: "sv-9", nombre: "Urgencia", precio: 500 },
  { id: "sv-10", nombre: "Seguimiento", precio: 200 },
];

// Médicos que firman consultas, recetas y documentos legales.
// Se administran en /veterinarios (distinto de las cuentas de acceso).
const veterinarios: Veterinario[] = [
  {
    id: "vet-1", nombre: "MVZ Laura Méndez Ruiz",
    cedulaProfesional: "12345678", especialidad: "Medicina y cirugía de pequeñas especies",
    telefono: "961 100 2030", email: "laura@vetgram.mx", activo: true,
  },
];

// ------------------------------------------------------------
// PLANTILLAS DE DOCUMENTOS LEGALES
//
// Redactadas conforme a la normativa veterinaria mexicana vigente.
// SON EDITABLES desde /formatos: la clínica ajusta la redacción sin
// tocar código. Los {{MARCADORES}} se sustituyen con los datos reales
// al generar el documento (ver lib/documentos-legales.ts).
//
// IMPORTANTE: son formatos base de uso común en la práctica clínica.
// Antes de usarlos con clientes reales deben ser revisados y validados
// por el Médico Veterinario responsable y, de preferencia, por un
// asesor legal, ya que algunos requisitos varían por estado.
// ------------------------------------------------------------
const plantillas: PlantillaDocumento[] = [
  {
    id: "pl-1",
    nombre: "Consentimiento Informado para Eutanasia",
    descripcion: "Autorización del propietario para el procedimiento de eutanasia humanitaria.",
    fundamentoLegal: "NOM-033-SAG/ZOO-2014 · Ley Federal de Sanidad Animal",
    requiereFirmaVeterinario: true,
    requiereFirmaPropietario: true,
    activo: true,
    contenido: `Por medio del presente documento, yo, {{DUENO}}, en mi carácter de propietario(a) o responsable legal del animal de compañía descrito a continuación, manifiesto lo siguiente:

DATOS DEL PACIENTE
Nombre: {{MASCOTA}}
Especie: {{ESPECIE}}          Raza: {{RAZA}}
Sexo: {{SEXO}}          Edad: {{EDAD}}          Peso: {{PESO}}
Color y señas particulares: {{COLOR}}

MOTIVO MÉDICO QUE JUSTIFICA EL PROCEDIMIENTO
{{MOTIVO}}

DECLARACIONES
1. Declaro que he sido informado(a) de forma clara y comprensible por el Médico Veterinario Zootecnista {{VETERINARIO}}, con cédula profesional número {{CEDULA}}, sobre el estado de salud, el pronóstico y las alternativas terapéuticas disponibles para mi animal de compañía.

2. Entiendo que la eutanasia es un procedimiento IRREVERSIBLE que provoca la muerte del animal, y que se realizará mediante métodos que eviten dolor y sufrimiento innecesarios, conforme a la Norma Oficial Mexicana NOM-033-SAG/ZOO-2014, "Métodos para dar muerte a los animales domésticos y silvestres".

3. Manifiesto que esta decisión la tomo de manera libre, voluntaria y sin coacción alguna, y que tuve oportunidad de resolver todas mis dudas antes de firmar.

4. Declaro bajo protesta de decir verdad ser el propietario legítimo o el responsable autorizado del animal, y libero al Médico Veterinario y a esta clínica de cualquier responsabilidad derivada de la falsedad de esta declaración.

5. Autorizo expresamente que el procedimiento se realice en la fecha y hora acordadas.

DESTINO DEL CUERPO Y OBSERVACIONES
{{OBSERVACIONES}}

Fecha de expedición: {{FECHA}}`,
  },
  {
    id: "pl-2",
    nombre: "Certificado de Salud Animal",
    descripcion: "Hace constar el estado clínico del paciente. Para viajes internacionales se requiere además el certificado zoosanitario de SENASICA.",
    fundamentoLegal: "Ley Federal de Sanidad Animal · NOM-011-SSA2-2011 (rabia)",
    requiereFirmaVeterinario: true,
    requiereFirmaPropietario: false,
    activo: true,
    contenido: `El que suscribe, Médico Veterinario Zootecnista {{VETERINARIO}}, con cédula profesional número {{CEDULA}}, HACE CONSTAR que examinó clínicamente al animal de compañía cuyos datos se describen a continuación:

DATOS DEL PACIENTE
Nombre: {{MASCOTA}}
Especie: {{ESPECIE}}          Raza: {{RAZA}}
Sexo: {{SEXO}}          Edad: {{EDAD}}          Peso: {{PESO}}
Color y señas particulares: {{COLOR}}

DATOS DEL PROPIETARIO
Nombre: {{DUENO}}
Teléfono: {{TELEFONO_DUENO}}

HALLAZGOS DE LA EXPLORACIÓN CLÍNICA
{{MOTIVO}}

ESQUEMA DE VACUNACIÓN Y DESPARASITACIÓN
{{OBSERVACIONES}}

HACE CONSTAR QUE:
Al momento de la exploración, el animal descrito se encuentra clínicamente sano, sin signos aparentes de enfermedad infectocontagiosa, y cuenta con esquema de vacunación antirrábica conforme a la NOM-011-SSA2-2011, para la prevención y control de la rabia humana y en los perros y gatos.

Se extiende el presente certificado a petición del interesado, para los fines legales que al mismo convengan.

VIGENCIA: 15 días naturales contados a partir de la fecha de expedición.

Lugar y fecha: {{DIRECCION_CLINICA}}, a {{FECHA}}`,
  },
  {
    id: "pl-3",
    nombre: "Consentimiento para Servicio de Estética",
    descripcion: "Autorización y deslinde para el servicio de baño y corte.",
    fundamentoLegal: "Contrato de prestación de servicios · Ley Federal de Protección al Consumidor",
    requiereFirmaVeterinario: false,
    requiereFirmaPropietario: true,
    activo: true,
    contenido: `Yo, {{DUENO}}, autorizo a {{CLINICA}} a realizar el servicio de estética a mi animal de compañía:

DATOS DEL PACIENTE
Nombre: {{MASCOTA}}
Especie: {{ESPECIE}}          Raza: {{RAZA}}
Edad: {{EDAD}}          Color y señas particulares: {{COLOR}}

SERVICIO SOLICITADO
{{MOTIVO}}

ESTADO DEL PACIENTE AL INGRESO
{{OBSERVACIONES}}

DECLARACIONES
1. Manifiesto haber informado al personal sobre el estado de salud de mi mascota, incluyendo padecimientos, alergias, cirugías recientes y su temperamento.

2. Entiendo que durante el manejo estético pueden presentarse incidentes menores (irritación cutánea, pequeños cortes en zonas con nudos o piel flácida, o estrés), aun aplicando las mejores prácticas de manejo.

3. Comprendo que si el pelaje presenta nudos severos puede ser necesario el rasurado completo, por el bienestar del animal.

4. Autorizo que, en caso de una emergencia médica durante el servicio, se brinde la atención veterinaria inmediata que se considere necesaria, comprometiéndome a cubrir su costo.

5. Acepto que este servicio NO incluye sedación; de requerirse, deberá autorizarse por separado y previa valoración médica.

Fecha: {{FECHA}}`,
  },
  {
    id: "pl-4",
    nombre: "Consentimiento para Procedimiento Quirúrgico y Anestesia",
    descripcion: "Autorización informada para cirugía, con advertencia de riesgo anestésico.",
    fundamentoLegal: "NOM-062-ZOO-1999 (cuidado y uso de animales) · Código Civil Federal",
    requiereFirmaVeterinario: true,
    requiereFirmaPropietario: true,
    activo: true,
    contenido: `Yo, {{DUENO}}, en mi carácter de propietario(a) o responsable legal del paciente:

DATOS DEL PACIENTE
Nombre: {{MASCOTA}}
Especie: {{ESPECIE}}          Raza: {{RAZA}}
Sexo: {{SEXO}}          Edad: {{EDAD}}          Peso: {{PESO}}

PROCEDIMIENTO PROPUESTO
{{MOTIVO}}

DECLARACIONES
1. He sido informado(a) por el Médico Veterinario Zootecnista {{VETERINARIO}}, con cédula profesional número {{CEDULA}}, sobre la naturaleza del procedimiento, sus beneficios esperados, los riesgos que implica y las alternativas existentes.

2. Entiendo que TODO procedimiento anestésico conlleva riesgos, incluidas reacciones adversas a los fármacos y, en casos excepcionales, la muerte del paciente, aun cuando se apliquen los protocolos y cuidados adecuados.

3. Declaro haber informado con veracidad sobre el ayuno indicado, los medicamentos administrados, los padecimientos previos y las alergias conocidas del paciente.

4. Autorizo al equipo médico a realizar los procedimientos adicionales que resulten necesarios ante hallazgos imprevistos durante la intervención, cuando su omisión ponga en riesgo la vida del paciente.

5. Acepto que la medicina veterinaria no es una ciencia exacta, por lo que no se garantizan resultados específicos.

INDICACIONES Y OBSERVACIONES
{{OBSERVACIONES}}

Fecha: {{FECHA}}`,
  },
];

// Antecedentes: información BASE de cada paciente (una por mascota)
const antecedentes: Antecedentes[] = [
  {
    id: "ant-1", mascotaId: "m-1",
    enfermedadesPrevias: "Gastroenteritis (jun 2026), sin cirugías",
    lugarVive: "Casa con patio grande, zona urbana",
    otrasMascotas: "Convive con 1 gato (Michi)",
    vacunasDesparasitaciones: "Esquema completo de cachorro; desparasitación c/3 meses",
    prevencionParasitos: "Pipeta mensual contra ectoparásitos; sin preventivo de gusano del corazón",
    alergias: "Ninguna conocida",
    actualizadoEn: "2026-06-20",
  },
];

const recetas: Receta[] = [
  {
    id: "re-1", mascotaId: "m-3", consultaId: "co-3", veterinarioId: "u-2", fecha: "2026-06-25",
    medicamentos: [
      { nombre: "Amoxicilina", dosis: "50 mg", frecuencia: "cada 12 horas", duracion: "10 días", indicaciones: "Con alimento" },
      { nombre: "Lisina", dosis: "250 mg", frecuencia: "cada 24 horas", duracion: "30 días" },
    ],
    observaciones: "Mantener hidratación; volver si hay fiebre.",
  },
  {
    id: "re-2", mascotaId: "m-4", consultaId: "co-4", veterinarioId: "u-2", fecha: "2026-07-03",
    medicamentos: [
      { nombre: "Carprofeno", dosis: "75 mg", frecuencia: "cada 24 horas", duracion: "5 días", indicaciones: "Después de comer" },
    ],
  },
];

const vacunas: Vacuna[] = [
  { id: "v-1", mascotaId: "m-1", nombre: "Rabia", fechaAplicacion: "2025-07-10", proximaDosis: "2026-07-10", lote: "RB-2231", veterinarioId: "u-2" },
  { id: "v-2", mascotaId: "m-1", nombre: "Séxtuple", fechaAplicacion: "2026-01-15", proximaDosis: "2027-01-15", lote: "SX-1102", veterinarioId: "u-2" },
  { id: "v-3", mascotaId: "m-3", nombre: "Triple Felina", fechaAplicacion: "2026-05-30", proximaDosis: "2026-07-15", lote: "TF-0907", veterinarioId: "u-2" },
  { id: "v-4", mascotaId: "m-5", nombre: "Rabia", fechaAplicacion: "2026-06-01", proximaDosis: "2027-06-01", lote: "RB-3388", veterinarioId: "u-2" },
];

const categorias: Categoria[] = [
  { id: "cat-1", nombre: "Alimento" },
  { id: "cat-2", nombre: "Medicamento" },
  { id: "cat-3", nombre: "Accesorio" },
  { id: "cat-4", nombre: "Higiene" },
];

const productos: Producto[] = [
  { id: "p-1", categoriaId: "cat-1", codigo: "ALI-001", nombre: "Croquetas Premium Perro 20kg", precioCompra: 650, precioVenta: 890, stock: 14, stockMinimo: 5 },
  { id: "p-2", categoriaId: "cat-1", codigo: "ALI-002", nombre: "Alimento Gato Adulto 3kg", precioCompra: 180, precioVenta: 260, stock: 22, stockMinimo: 8 },
  { id: "p-3", categoriaId: "cat-2", codigo: "MED-001", nombre: "Desparasitante canino", precioCompra: 45, precioVenta: 85, stock: 3, stockMinimo: 10 },
  { id: "p-4", categoriaId: "cat-2", codigo: "MED-002", nombre: "Vacuna Séxtuple (dosis)", precioCompra: 120, precioVenta: 250, stock: 30, stockMinimo: 10 },
  { id: "p-5", categoriaId: "cat-3", codigo: "ACC-001", nombre: "Collar mediano", precioCompra: 60, precioVenta: 120, stock: 18, stockMinimo: 5 },
  { id: "p-6", categoriaId: "cat-4", codigo: "HIG-001", nombre: "Shampoo antipulgas 500ml", precioCompra: 70, precioVenta: 135, stock: 9, stockMinimo: 6 },
];

/**
 * fechaHace: fecha ISO de hace `dias` días. Las ventas semilla usan
 * fechas RELATIVAS a hoy para que el corte de caja y los reportes
 * mensuales siempre muestren datos de demostración, sin importar
 * cuándo pruebes la app. (Con Supabase esto desaparece: habrá datos reales.)
 */
function fechaHace(dias: number): string {
  const f = new Date();
  f.setDate(f.getDate() - dias);
  return f.toISOString().slice(0, 10);
}

/**
 * pagoSimple: arma el desglose de pago de una venta cubierta con UNA
 * sola forma de pago. Se usa en los datos semilla para no repetir el
 * objeto completo nueve veces.
 * (Las ventas reales del POS traen su desglose desde hooks/use-pago.ts,
 * que además soporta pago mixto y cálculo de cambio.)
 */
function pagoSimple(metodo: MetodoPago, total: number) {
  return {
    metodoPago: metodo,
    pago: {
      efectivo: metodo === "efectivo" ? total : 0,
      tarjeta: metodo === "tarjeta" ? total : 0,
      transferencia: metodo === "transferencia" ? total : 0,
    },
    efectivoRecibido: 0, // 0 = pagó justo, no hubo cambio
    cambio: 0,
  };
}

// Historial de ventas semilla: HOY (corte de caja), días recientes
// (reporte del mes) y ~1 mes atrás (comparativa vs mes anterior).
const ventas: Venta[] = [
  {
    id: "vt-1", folio: "V-0001", clienteId: "c-1", usuarioId: "u-3", fecha: fechaHace(0),
    items: [
      { productoId: "p-1", nombreProducto: "Croquetas Premium Perro 20kg", cantidad: 1, precioUnitario: 890 },
    ],
    subtotal: 890, descuento: 0, total: 890, ...pagoSimple("efectivo", 890), estado: "completada",
  },
  {
    id: "vt-2", folio: "V-0002", usuarioId: "u-3", fecha: fechaHace(0),
    items: [
      { productoId: "p-4", nombreProducto: "Vacuna Séxtuple (dosis)", cantidad: 2, precioUnitario: 250 },
      { productoId: "p-6", nombreProducto: "Shampoo antipulgas 500ml", cantidad: 1, precioUnitario: 135 },
    ],
    subtotal: 635, descuento: 0, total: 635, ...pagoSimple("tarjeta", 635), estado: "completada",
  },
  {
    id: "vt-3", folio: "V-0003", clienteId: "c-2", usuarioId: "u-3", fecha: fechaHace(1),
    items: [
      { productoId: "p-2", nombreProducto: "Alimento Gato Adulto 3kg", cantidad: 2, precioUnitario: 260 },
    ],
    subtotal: 520, descuento: 20, total: 500, ...pagoSimple("efectivo", 500), estado: "completada",
  },
  {
    id: "vt-4", folio: "V-0004", clienteId: "c-4", usuarioId: "u-1", fecha: fechaHace(2),
    items: [
      { productoId: "p-1", nombreProducto: "Croquetas Premium Perro 20kg", cantidad: 2, precioUnitario: 890 },
    ],
    subtotal: 1780, descuento: 0, total: 1780, ...pagoSimple("transferencia", 1780), estado: "completada",
  },
  {
    id: "vt-5", folio: "V-0005", usuarioId: "u-3", fecha: fechaHace(3),
    items: [
      { productoId: "p-5", nombreProducto: "Collar mediano", cantidad: 1, precioUnitario: 120 },
      { productoId: "p-6", nombreProducto: "Shampoo antipulgas 500ml", cantidad: 2, precioUnitario: 135 },
    ],
    subtotal: 390, descuento: 0, total: 390, ...pagoSimple("efectivo", 390), estado: "completada",
  },
  {
    id: "vt-6", folio: "V-0006", clienteId: "c-3", usuarioId: "u-3", fecha: fechaHace(4),
    items: [
      { productoId: "p-3", nombreProducto: "Desparasitante canino", cantidad: 3, precioUnitario: 85 },
    ],
    subtotal: 255, descuento: 0, total: 255, ...pagoSimple("tarjeta", 255), estado: "completada",
  },
  // ---- Mes anterior (para la comparativa del reporte) ----
  {
    id: "vt-7", folio: "V-0007", clienteId: "c-1", usuarioId: "u-3", fecha: fechaHace(31),
    items: [
      { productoId: "p-1", nombreProducto: "Croquetas Premium Perro 20kg", cantidad: 1, precioUnitario: 890 },
    ],
    subtotal: 890, descuento: 0, total: 890, ...pagoSimple("efectivo", 890), estado: "completada",
  },
  {
    id: "vt-8", folio: "V-0008", usuarioId: "u-3", fecha: fechaHace(33),
    items: [
      { productoId: "p-2", nombreProducto: "Alimento Gato Adulto 3kg", cantidad: 3, precioUnitario: 260 },
    ],
    subtotal: 780, descuento: 0, total: 780, ...pagoSimple("tarjeta", 780), estado: "completada",
  },
  {
    id: "vt-9", folio: "V-0009", clienteId: "c-5", usuarioId: "u-1", fecha: fechaHace(35),
    items: [
      { productoId: "p-4", nombreProducto: "Vacuna Séxtuple (dosis)", cantidad: 4, precioUnitario: 250 },
    ],
    subtotal: 1000, descuento: 0, total: 1000, ...pagoSimple("efectivo", 1000), estado: "completada",
  },
];

// Documentos médicos del expediente (PDFs y fotos de laboratorio)
const documentos: DocumentoMedico[] = [];

// Cortes de caja realizados (Reporte Z)
const cortesCaja: CorteCaja[] = [];

const compras: Compra[] = [
  {
    id: "cp-1", folio: "C-0001", proveedor: "Distribuidora VetMex", usuarioId: "u-1", fecha: "2026-06-28",
    items: [
      { productoId: "p-4", nombreProducto: "Vacuna Séxtuple (dosis)", cantidad: 30, precioUnitario: 120 },
    ],
    total: 3600,
  },
];

// ------------------------------------------------------------
// FUNCIONES DE ACCESO A DATOS (API interna de la app)
// ------------------------------------------------------------

/** simularRed: pequeña espera para imitar la latencia de un backend real */
async function simularRed() {
  await new Promise((r) => setTimeout(r, 150));
}

/** getDashboardStats: calcula las métricas de las tarjetas del dashboard */
export async function getDashboardStats(): Promise<DashboardStats> {
  await simularRed();
  const hoy = new Date().toISOString().slice(0, 10);
  return {
    usuarios: 3, // los 3 usuarios mock de services/auth.ts
    clientes: clientes.length,
    mascotas: mascotas.length,
    consultas: consultas.length,
    productos: productos.length,
    ventasHoy: ventas.filter((v) => v.fecha === hoy && v.estado === "completada").length,
    // Vacunas cuya próxima dosis vence en los próximos 30 días (o ya venció)
    vacunasProximas: vacunas.filter((v) => v.proximaDosis && diasHasta(v.proximaDosis) <= 30).length,
  };
}

/** getClientes: devuelve el listado completo de clientes */
export async function getClientes(): Promise<Cliente[]> {
  await simularRed();
  return [...clientes];
}

/** getClientePorId: busca un cliente por su id */
export async function getClientePorId(id: string): Promise<Cliente | undefined> {
  await simularRed();
  return clientes.find((c) => c.id === id);
}

/**
 * crearCliente: registra un dueño nuevo.
 * POR QUÉ: generamos el id con Date.now() solo en el mock; en producción
 * lo genera la base de datos (uuid).
 * TODO Supabase: supabase.from("clientes").insert(datos).select().single()
 */
export async function crearCliente(datos: Omit<Cliente, "id" | "creadoEn">): Promise<Cliente> {
  await simularRed();
  const nuevo: Cliente = {
    ...datos,
    id: `c-${Date.now()}`,
    creadoEn: new Date().toISOString().slice(0, 10),
  };
  clientes.push(nuevo);
  return nuevo;
}

/**
 * actualizarCliente: modifica los datos de un cliente existente.
 * TODO Supabase: supabase.from("clientes").update(datos).eq("id", id)
 */
export async function actualizarCliente(
  id: string,
  datos: Partial<Omit<Cliente, "id" | "creadoEn">>
): Promise<Cliente> {
  await simularRed();
  const indice = clientes.findIndex((c) => c.id === id);
  if (indice === -1) throw new Error("Cliente no encontrado");
  clientes[indice] = { ...clientes[indice], ...datos };
  return clientes[indice];
}

/**
 * eliminarCliente: borra un cliente SOLO si no tiene mascotas registradas.
 * POR QUÉ: si borráramos un cliente con mascotas, sus expedientes quedarían
 * huérfanos. Esta regla de negocio se replica en Supabase con una
 * foreign key con ON DELETE RESTRICT.
 */
export async function eliminarCliente(id: string): Promise<void> {
  await simularRed();
  if (mascotas.some((m) => m.clienteId === id)) {
    throw new Error("No se puede eliminar: el cliente tiene mascotas registradas.");
  }
  const indice = clientes.findIndex((c) => c.id === id);
  if (indice === -1) throw new Error("Cliente no encontrado");
  clientes.splice(indice, 1);
}

/** getEspecies / getRazas: catálogos para los formularios de mascotas */
export async function getEspecies(): Promise<Especie[]> {
  await simularRed();
  return [...especies];
}

export async function getRazas(especieId?: string): Promise<Raza[]> {
  await simularRed();
  return especieId ? razas.filter((r) => r.especieId === especieId) : [...razas];
}

/** getMascotas: listado completo de mascotas */
export async function getMascotas(): Promise<Mascota[]> {
  await simularRed();
  return [...mascotas];
}

/** getMascotaPorId: busca una mascota por su id */
export async function getMascotaPorId(id: string): Promise<Mascota | undefined> {
  await simularRed();
  return mascotas.find((m) => m.id === id);
}

/** getMascotasDeCliente: mascotas que pertenecen a un cliente */
export async function getMascotasDeCliente(clienteId: string): Promise<Mascota[]> {
  await simularRed();
  return mascotas.filter((m) => m.clienteId === clienteId);
}

/**
 * crearMascota: registra una mascota nueva ligada a un cliente.
 * TODO Supabase: supabase.from("mascotas").insert(datos).select().single()
 */
export async function crearMascota(datos: Omit<Mascota, "id" | "creadoEn">): Promise<Mascota> {
  await simularRed();
  const nueva: Mascota = {
    ...datos,
    id: `m-${Date.now()}`,
    creadoEn: new Date().toISOString().slice(0, 10),
  };
  mascotas.push(nueva);
  return nueva;
}

/**
 * actualizarMascota: modifica los datos de una mascota existente.
 * TODO Supabase: supabase.from("mascotas").update(datos).eq("id", id)
 */
export async function actualizarMascota(
  id: string,
  datos: Partial<Omit<Mascota, "id" | "creadoEn">>
): Promise<Mascota> {
  await simularRed();
  const indice = mascotas.findIndex((m) => m.id === id);
  if (indice === -1) throw new Error("Mascota no encontrada");
  mascotas[indice] = { ...mascotas[indice], ...datos };
  return mascotas[indice];
}

/**
 * subirFotoMascota: guarda la foto de perfil de la mascota (MOCK).
 *
 * QUÉ hace ahora: recibe la imagen YA COMPRIMIDA como dataURL (texto
 *   base64) y la guarda en el campo fotoUrl de la mascota en memoria.
 * POR QUÉ recibe un dataURL y no el archivo original: la compresión
 *   ocurre en el navegador (PetPhotoUploader) ANTES de llegar aquí;
 *   este servicio nunca ve la foto pesada de la cámara.
 *
 * TODO Supabase Storage — al conectar, el cuerpo cambia a:
 *   1. Convertir el dataURL a Blob (o mejor: cambiar la firma para
 *      recibir el Blob directo desde el componente).
 *   2. Subirlo al bucket:
 *        const ruta = `mascotas/${mascotaId}.webp`;
 *        await supabase.storage.from("fotos").upload(ruta, blob, {
 *          contentType: "image/webp",
 *          upsert: true,   // reemplaza la foto anterior sin duplicar
 *        });
 *   3. Obtener la URL pública y guardarla en la tabla:
 *        const { data } = supabase.storage.from("fotos").getPublicUrl(ruta);
 *        await supabase.from("mascotas")
 *          .update({ foto_url: data.publicUrl }).eq("id", mascotaId);
 */
export async function subirFotoMascota(mascotaId: string, fotoDataUrl: string): Promise<void> {
  await simularRed();
  const mascota = mascotas.find((m) => m.id === mascotaId);
  if (!mascota) throw new Error("Mascota no encontrada");
  mascota.fotoUrl = fotoDataUrl; // en el mock, el dataURL ES la "url"
}

/**
 * buscarMascotasAvanzado: BUSCADOR INTELIGENTE de mascotas.
 * Cruza el texto contra nombre de mascota + nombre del dueño + raza,
 * para distinguir entre mascotas con el mismo nombre (ej. varios "Lobo").
 * Cada palabra del texto debe coincidir con alguno de los tres campos.
 */
export async function buscarMascotasAvanzado(texto: string): Promise<
  Array<Mascota & { nombreDueno: string; nombreRaza: string; nombreEspecie: string }>
> {
  await simularRed();
  // Enriquecemos cada mascota con los datos de su dueño y raza
  const enriquecidas = mascotas.map((m) => {
    const dueno = clientes.find((c) => c.id === m.clienteId);
    const raza = razas.find((r) => r.id === m.razaId);
    const especie = especies.find((e) => e.id === m.especieId);
    return {
      ...m,
      nombreDueno: dueno ? `${dueno.nombre} ${dueno.apellidos}` : "—",
      nombreRaza: raza?.nombre ?? "—",
      nombreEspecie: especie?.nombre ?? "—",
    };
  });

  const palabras = texto.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return enriquecidas;

  return enriquecidas.filter((m) => {
    const pajar = `${m.nombre} ${m.nombreDueno} ${m.nombreRaza} ${m.nombreEspecie}`.toLowerCase();
    // Todas las palabras deben aparecer en algún campo (búsqueda cruzada)
    return palabras.every((p) => pajar.includes(p));
  });
}

/**
 * busquedaGlobal: BUSCADOR RÁPIDO GLOBAL del encabezado.
 * Busca a la vez en clientes (nombre, teléfono) y mascotas (nombre, dueño, raza)
 * y devuelve resultados listos para navegar a la vista de detalle.
 */
export async function busquedaGlobal(texto: string): Promise<ResultadoBusqueda[]> {
  const q = texto.toLowerCase().trim();
  if (q.length < 2) return [];
  await simularRed();

  const resultados: ResultadoBusqueda[] = [];

  // Coincidencias en clientes
  for (const c of clientes) {
    const nombreCompleto = `${c.nombre} ${c.apellidos}`;
    if (nombreCompleto.toLowerCase().includes(q) || c.telefono.includes(q)) {
      resultados.push({
        tipo: "cliente",
        id: c.id,
        titulo: nombreCompleto,
        subtitulo: `Tel: ${c.telefono}`,
        url: `/clientes/${c.id}`,
      });
    }
  }

  // Coincidencias en mascotas (incluye nombre del dueño y raza para desambiguar)
  const conDatos = await buscarMascotasAvanzado(q);
  for (const m of conDatos) {
    resultados.push({
      tipo: "mascota",
      id: m.id,
      titulo: m.nombre,
      subtitulo: `${m.nombreEspecie} · ${m.nombreRaza} · Dueño: ${m.nombreDueno}`,
      url: `/mascotas/${m.id}`,
    });
  }

  return resultados.slice(0, 10); // limitamos a 10 resultados
}

/** getConsultasDeMascota: expediente clínico (historial) de una mascota */
export async function getConsultasDeMascota(mascotaId: string): Promise<Consulta[]> {
  await simularRed();
  return consultas
    .filter((c) => c.mascotaId === mascotaId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// ------------------------------------------------------------
// SERVICIOS: catálogo administrable desde /servicios
// ------------------------------------------------------------

/** getServicios: catálogo completo, ordenado alfabéticamente */
export async function getServicios(): Promise<Servicio[]> {
  await simularRed();
  return [...servicios].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/**
 * crearServicio / actualizarServicio / eliminarServicio: CRUD del
 * catálogo. TODO Supabase: tabla `servicios` con insert/update/delete.
 * eliminarServicio protege el historial: si alguna consulta usa el
 * servicio (por nombre), se rechaza el borrado — mismo criterio que
 * razas y categorías.
 */
export async function crearServicio(datos: Omit<Servicio, "id">): Promise<Servicio> {
  await simularRed();
  const nuevo: Servicio = { ...datos, id: `sv-${Date.now()}` };
  servicios.push(nuevo);
  return nuevo;
}

export async function actualizarServicio(
  id: string,
  datos: Partial<Omit<Servicio, "id">>
): Promise<Servicio> {
  await simularRed();
  const indice = servicios.findIndex((s) => s.id === id);
  if (indice === -1) throw new Error("Servicio no encontrado");
  servicios[indice] = { ...servicios[indice], ...datos };
  return servicios[indice];
}

export async function eliminarServicio(id: string): Promise<void> {
  await simularRed();
  const servicio = servicios.find((s) => s.id === id);
  if (!servicio) throw new Error("Servicio no encontrado");
  if (consultas.some((c) => c.tipoServicio === servicio.nombre)) {
    throw new Error("No se puede eliminar: hay consultas registradas con este servicio.");
  }
  servicios.splice(servicios.indexOf(servicio), 1);
}

// ------------------------------------------------------------
// VETERINARIOS: médicos que firman documentos (≠ cuentas de usuario)
// ------------------------------------------------------------

/** getVeterinarios: médicos activos primero, ordenados por nombre */
export async function getVeterinarios(): Promise<Veterinario[]> {
  await simularRed();
  return [...veterinarios].sort(
    (a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre)
  );
}

/** crearVeterinario / actualizarVeterinario: alta y edición del médico */
export async function crearVeterinario(datos: Omit<Veterinario, "id">): Promise<Veterinario> {
  await simularRed();
  const nuevo: Veterinario = { ...datos, id: `vet-${Date.now()}` };
  veterinarios.push(nuevo);
  return nuevo;
}

export async function actualizarVeterinario(
  id: string,
  datos: Partial<Omit<Veterinario, "id">>
): Promise<Veterinario> {
  await simularRed();
  const indice = veterinarios.findIndex((v) => v.id === id);
  if (indice === -1) throw new Error("Veterinario no encontrado");
  veterinarios[indice] = { ...veterinarios[indice], ...datos };
  return veterinarios[indice];
}

/**
 * desactivarVeterinario: BAJA LÓGICA (no se borra la fila).
 * POR QUÉ no se elimina: su cédula quedó impresa en certificados y
 * recetas ya emitidos; borrarlo dejaría documentos sin respaldo de
 * quién los firmó. Desactivarlo lo saca de los selects sin perder historial.
 */
export async function desactivarVeterinario(id: string): Promise<void> {
  await simularRed();
  const vet = veterinarios.find((v) => v.id === id);
  if (!vet) throw new Error("Veterinario no encontrado");
  vet.activo = false;
}

// ------------------------------------------------------------
// PLANTILLAS DE DOCUMENTOS LEGALES (editables desde /formatos)
// ------------------------------------------------------------

/** getPlantillas: catálogo de formatos legales */
export async function getPlantillas(): Promise<PlantillaDocumento[]> {
  await simularRed();
  return [...plantillas].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/** getPlantillaPorId: una plantilla concreta (para editar o generar) */
export async function getPlantillaPorId(id: string): Promise<PlantillaDocumento | undefined> {
  await simularRed();
  return plantillas.find((p) => p.id === id);
}

/** crearPlantilla: la clínica puede redactar formatos propios */
export async function crearPlantilla(datos: Omit<PlantillaDocumento, "id">): Promise<PlantillaDocumento> {
  await simularRed();
  const nueva: PlantillaDocumento = { ...datos, id: `pl-${Date.now()}` };
  plantillas.push(nueva);
  return nueva;
}

/** actualizarPlantilla: guarda la redacción editada del documento */
export async function actualizarPlantilla(
  id: string,
  datos: Partial<Omit<PlantillaDocumento, "id">>
): Promise<PlantillaDocumento> {
  await simularRed();
  const indice = plantillas.findIndex((p) => p.id === id);
  if (indice === -1) throw new Error("Plantilla no encontrada");
  plantillas[indice] = { ...plantillas[indice], ...datos };
  return plantillas[indice];
}

/** eliminarPlantilla: quita un formato del catálogo */
export async function eliminarPlantilla(id: string): Promise<void> {
  await simularRed();
  const indice = plantillas.findIndex((p) => p.id === id);
  if (indice === -1) throw new Error("Plantilla no encontrada");
  plantillas.splice(indice, 1);
}

/**
 * getAntecedentesDeMascota: la ficha de antecedentes del paciente
 * (o undefined si aún no se captura).
 * TODO Supabase: from("antecedentes").select("*").eq("mascota_id", id).maybeSingle()
 */
export async function getAntecedentesDeMascota(mascotaId: string): Promise<Antecedentes | undefined> {
  await simularRed();
  return antecedentes.find((a) => a.mascotaId === mascotaId);
}

/**
 * guardarAntecedentes: crea O actualiza los antecedentes (upsert).
 * POR QUÉ upsert: cada mascota tiene UNA sola ficha de antecedentes;
 * si ya existe se actualiza, si no se crea — el formulario no tiene
 * que distinguir entre "crear" y "editar".
 * TODO Supabase: from("antecedentes").upsert({ mascota_id, ...datos },
 *   { onConflict: "mascota_id" }) — requiere unique(mascota_id).
 */
export async function guardarAntecedentes(
  mascotaId: string,
  datos: Omit<Antecedentes, "id" | "mascotaId" | "actualizadoEn">
): Promise<Antecedentes> {
  await simularRed();
  const hoy = new Date().toISOString().slice(0, 10);
  const existente = antecedentes.find((a) => a.mascotaId === mascotaId);
  if (existente) {
    Object.assign(existente, datos, { actualizadoEn: hoy });
    return existente;
  }
  const nuevo: Antecedentes = {
    ...datos,
    id: `ant-${Date.now()}`,
    mascotaId,
    actualizadoEn: hoy,
  };
  antecedentes.push(nuevo);
  return nuevo;
}

/**
 * crearConsulta: agrega una entrada al expediente clínico de la mascota.
 * POR QUÉ: el veterinario en sesión queda registrado como responsable;
 * peso y temperatura son opcionales porque no siempre se toman.
 * TODO Supabase: supabase.from("consultas").insert(datos)
 */
export async function crearConsulta(datos: Omit<Consulta, "id">): Promise<Consulta> {
  await simularRed();
  const nueva: Consulta = { ...datos, id: `co-${Date.now()}` };
  consultas.push(nueva);
  return nueva;
}

/** getRecetasDeMascota: recetas emitidas para una mascota */
export async function getRecetasDeMascota(mascotaId: string): Promise<Receta[]> {
  await simularRed();
  return recetas.filter((r) => r.mascotaId === mascotaId);
}

/**
 * crearReceta: guarda una receta con sus múltiples medicamentos.
 * POR QUÉ: los medicamentos van embebidos en la receta (no en tabla aparte)
 * porque siempre se leen juntos; en Supabase será una columna jsonb.
 * TODO Supabase: supabase.from("recetas").insert({ ...datos, medicamentos: jsonb })
 */
export async function crearReceta(datos: Omit<Receta, "id">): Promise<Receta> {
  await simularRed();
  const nueva: Receta = { ...datos, id: `re-${Date.now()}` };
  recetas.push(nueva);
  return nueva;
}

/**
 * actualizarReceta: modifica una receta ya guardada (edición in-place
 * desde el editor profesional). Se puede corregir una dosis, una
 * frecuencia o las observaciones sin re-crear la receta.
 * TODO Supabase: from("recetas").update({ medicamentos: jsonb, observaciones })
 *   .eq("id", id) — el array completo de medicamentos se reemplaza.
 */
export async function actualizarReceta(
  id: string,
  datos: Partial<Omit<Receta, "id">>
): Promise<Receta> {
  await simularRed();
  const indice = recetas.findIndex((r) => r.id === id);
  if (indice === -1) throw new Error("Receta no encontrada");
  recetas[indice] = { ...recetas[indice], ...datos };
  return recetas[indice];
}

/** getVacunasDeMascota: vacunas aplicadas a una mascota */
export async function getVacunasDeMascota(mascotaId: string): Promise<Vacuna[]> {
  await simularRed();
  return vacunas.filter((v) => v.mascotaId === mascotaId);
}

/**
 * crearVacuna: registra una vacuna aplicada, con su próxima dosis opcional.
 * La próxima dosis alimenta las alertas del dashboard y del expediente.
 * TODO Supabase: supabase.from("vacunas").insert(datos)
 */
export async function crearVacuna(datos: Omit<Vacuna, "id">): Promise<Vacuna> {
  await simularRed();
  const nueva: Vacuna = { ...datos, id: `v-${Date.now()}` };
  vacunas.push(nueva);
  return nueva;
}

/**
 * getVacunasProximas: vacunas con próxima dosis dentro de `dias` días
 * (o ya vencidas). Alimenta las alertas del dashboard y el módulo de vacunas.
 */
export async function getVacunasProximas(dias = 30): Promise<Array<Vacuna & { nombreMascota: string }>> {
  await simularRed();
  return vacunas
    .filter((v) => v.proximaDosis && diasHasta(v.proximaDosis) <= dias)
    .map((v) => ({
      ...v,
      nombreMascota: mascotas.find((m) => m.id === v.mascotaId)?.nombre ?? "—",
    }))
    .sort((a, b) => (a.proximaDosis ?? "").localeCompare(b.proximaDosis ?? ""));
}

/**
 * getConsultasGlobal: TODAS las consultas de la clínica (vista /consultas),
 * enriquecidas con el nombre de la mascota para no mostrar ids crudos.
 * TODO Supabase: select con join -> consultas.select("*, mascotas(nombre)")
 */
export async function getConsultasGlobal(): Promise<Array<Consulta & { nombreMascota: string }>> {
  await simularRed();
  return consultas
    .map((c) => ({
      ...c,
      nombreMascota: mascotas.find((m) => m.id === c.mascotaId)?.nombre ?? "—",
    }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha)); // más recientes primero
}

/**
 * getRecetasGlobal: TODAS las recetas (vista /recetas), con nombre de
 * mascota y dueño (necesarios para el encabezado al imprimir).
 * TODO Supabase: recetas.select("*, mascotas(nombre, clientes(nombre, apellidos))")
 */
export async function getRecetasGlobal(): Promise<
  Array<Receta & { nombreMascota: string; nombreDueno: string }>
> {
  await simularRed();
  return recetas
    .map((r) => {
      const mascota = mascotas.find((m) => m.id === r.mascotaId);
      const dueno = mascota ? clientes.find((c) => c.id === mascota.clienteId) : undefined;
      return {
        ...r,
        nombreMascota: mascota?.nombre ?? "—",
        nombreDueno: dueno ? `${dueno.nombre} ${dueno.apellidos}` : "—",
      };
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/**
 * getVacunasGlobal: TODAS las vacunas (vista /vacunas) con nombre de
 * mascota, para revisar el estado de refuerzos de toda la clínica.
 */
export async function getVacunasGlobal(): Promise<Array<Vacuna & { nombreMascota: string }>> {
  await simularRed();
  return vacunas
    .map((v) => ({
      ...v,
      nombreMascota: mascotas.find((m) => m.id === v.mascotaId)?.nombre ?? "—",
    }))
    .sort((a, b) => (a.proximaDosis ?? "9999").localeCompare(b.proximaDosis ?? "9999"));
}

/**
 * crearEspecie / crearRaza / eliminarRaza: mantenimiento de catálogos.
 * POR QUÉ eliminarRaza valida mascotas: si una mascota usa la raza,
 * borrarla dejaría datos huérfanos (en Supabase: FK ON DELETE RESTRICT).
 */
export async function crearEspecie(nombre: string): Promise<Especie> {
  await simularRed();
  const nueva: Especie = { id: `e-${Date.now()}`, nombre: nombre.trim() };
  especies.push(nueva);
  return nueva;
}

export async function crearRaza(especieId: string, nombre: string): Promise<Raza> {
  await simularRed();
  const nueva: Raza = { id: `r-${Date.now()}`, especieId, nombre: nombre.trim() };
  razas.push(nueva);
  return nueva;
}

export async function eliminarRaza(id: string): Promise<void> {
  await simularRed();
  if (mascotas.some((m) => m.razaId === id)) {
    throw new Error("No se puede eliminar: hay mascotas registradas con esta raza.");
  }
  const indice = razas.findIndex((r) => r.id === id);
  if (indice === -1) throw new Error("Raza no encontrada");
  razas.splice(indice, 1);
}

/**
 * crearCategoria / eliminarCategoria: catálogo de categorías de producto.
 * Misma regla: no se borra una categoría que tenga productos asignados.
 */
export async function crearCategoria(nombre: string): Promise<Categoria> {
  await simularRed();
  const nueva: Categoria = { id: `cat-${Date.now()}`, nombre: nombre.trim() };
  categorias.push(nueva);
  return nueva;
}

export async function eliminarCategoria(id: string): Promise<void> {
  await simularRed();
  if (productos.some((p) => p.categoriaId === id)) {
    throw new Error("No se puede eliminar: hay productos en esta categoría.");
  }
  const indice = categorias.findIndex((c) => c.id === id);
  if (indice === -1) throw new Error("Categoría no encontrada");
  categorias.splice(indice, 1);
}

/** getCategorias / getProductos: catálogo e inventario del punto de venta */
export async function getCategorias(): Promise<Categoria[]> {
  await simularRed();
  return [...categorias];
}

export async function getProductos(): Promise<Producto[]> {
  await simularRed();
  return [...productos];
}

/**
 * crearProducto: agrega un producto nuevo al inventario.
 * TODO: En Supabase será un insert en la tabla `productos`.
 */
export async function crearProducto(datos: Omit<Producto, "id">): Promise<Producto> {
  await simularRed();
  const nuevo: Producto = { ...datos, id: `p-${Date.now()}` };
  productos.push(nuevo);
  return nuevo;
}

/**
 * actualizarProducto: modifica los datos de un producto existente.
 * TODO: En Supabase será un update por id en la tabla `productos`.
 */
export async function actualizarProducto(
  id: string,
  datos: Partial<Omit<Producto, "id">>
): Promise<Producto> {
  await simularRed();
  const indice = productos.findIndex((p) => p.id === id);
  if (indice === -1) throw new Error("Producto no encontrado");
  productos[indice] = { ...productos[indice], ...datos };
  return productos[indice];
}

/**
 * eliminarProducto: quita un producto del inventario.
 * TODO: En Supabase conviene un "soft delete" (columna activo=false)
 * para no romper el historial de ventas/compras que lo referencian.
 */
export async function eliminarProducto(id: string): Promise<void> {
  await simularRed();
  const indice = productos.findIndex((p) => p.id === id);
  if (indice === -1) throw new Error("Producto no encontrado");
  productos.splice(indice, 1);
}

/**
 * registrarVenta: guarda una venta y DESCUENTA el stock de cada producto.
 * TODO: En Supabase esto debe ser una transacción/función RPC para
 * evitar condiciones de carrera con el inventario.
 */
export async function registrarVenta(venta: Omit<Venta, "id" | "folio">): Promise<Venta> {
  await simularRed();
  for (const item of venta.items) {
    const producto = productos.find((p) => p.id === item.productoId);
    if (!producto) throw new Error(`Producto no encontrado: ${item.nombreProducto}`);
    if (producto.stock < item.cantidad) {
      throw new Error(`Stock insuficiente de "${producto.nombre}" (quedan ${producto.stock})`);
    }
    producto.stock -= item.cantidad; // descuento de inventario
  }
  const nueva: Venta = {
    ...venta,
    id: `vt-${ventas.length + 1}`,
    folio: `V-${String(ventas.length + 1).padStart(4, "0")}`,
  };
  ventas.push(nueva);
  return nueva;
}

/**
 * registrarCompra: guarda una compra a proveedor y AUMENTA el stock.
 */
export async function registrarCompra(compra: Omit<Compra, "id" | "folio">): Promise<Compra> {
  await simularRed();
  for (const item of compra.items) {
    const producto = productos.find((p) => p.id === item.productoId);
    if (producto) producto.stock += item.cantidad; // entrada de inventario
  }
  const nueva: Compra = {
    ...compra,
    id: `cp-${compras.length + 1}`,
    folio: `C-${String(compras.length + 1).padStart(4, "0")}`,
  };
  compras.push(nueva);
  return nueva;
}

// ------------------------------------------------------------
// DOCUMENTOS MÉDICOS (análisis de laboratorio, recetas externas)
// ------------------------------------------------------------

/** getDocumentosDeMascota: archivos del expediente de una mascota */
export async function getDocumentosDeMascota(mascotaId: string): Promise<DocumentoMedico[]> {
  await simularRed();
  return documentos
    .filter((d) => d.mascotaId === mascotaId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/**
 * subirDocumento: guarda un documento médico ligado a la mascota.
 * QUÉ recibe: el archivo ya convertido a dataURL (las imágenes llegan
 *   comprimidas a WebP por el ImageUploader; los PDFs van tal cual).
 * TODO Supabase Storage — al conectar:
 *   1. Subir el binario: storage.from("documentos")
 *        .upload(`mascotas/${mascotaId}/${Date.now()}-${nombre}`, blob)
 *   2. Guardar la ruta (no el contenido) en la tabla `documentos_medicos`.
 *   3. Para LEER usar createSignedUrl(ruta, 3600): los documentos médicos
 *      son sensibles y NO deben estar en un bucket público.
 */
export async function subirDocumento(datos: Omit<DocumentoMedico, "id" | "fecha">): Promise<DocumentoMedico> {
  await simularRed();
  const nuevo: DocumentoMedico = {
    ...datos,
    id: `doc-${Date.now()}`,
    fecha: new Date().toISOString().slice(0, 10),
  };
  documentos.push(nuevo);
  return nuevo;
}

/** eliminarDocumento: quita un documento del expediente */
export async function eliminarDocumento(id: string): Promise<void> {
  await simularRed();
  const indice = documentos.findIndex((d) => d.id === id);
  if (indice === -1) throw new Error("Documento no encontrado");
  documentos.splice(indice, 1);
}

/** getVentasDelDia: tickets de HOY (incluye cancelados, para auditoría) */
export async function getVentasDelDia(): Promise<Venta[]> {
  await simularRed();
  const hoy = new Date().toISOString().slice(0, 10);
  // Los más recientes primero (el id crece con cada venta)
  return ventas.filter((v) => v.fecha === hoy).reverse();
}

/**
 * cancelarVenta: CANCELA un ticket y DEVUELVE el stock al inventario.
 *
 * QUÉ hace: 1) valida que la venta exista y no esté ya cancelada,
 *   2) regresa cada cantidad vendida al stock de su producto,
 *   3) marca la venta como "cancelada" (NO se borra: queda como
 *   evidencia de auditoría, con fecha-hora de cancelación).
 * POR QUÉ no se borra la fila: un folio que desaparece es un hueco
 *   inexplicable en la numeración; un folio CANCELADO cuenta la
 *   historia completa.
 * TODO Supabase: será una RPC transaccional `cancelar_venta(venta_id)`
 *   (igual que registrar_venta) para que la devolución del stock y el
 *   cambio de estado ocurran juntos o no ocurran — nunca a medias.
 */
export async function cancelarVenta(ventaId: string): Promise<Venta> {
  await simularRed();
  const venta = ventas.find((v) => v.id === ventaId);
  if (!venta) throw new Error("Venta no encontrada");
  if (venta.estado === "cancelada") throw new Error("Este ticket ya fue cancelado.");

  // Devolución del inventario: cada línea regresa su cantidad al stock
  for (const item of venta.items) {
    const producto = productos.find((p) => p.id === item.productoId);
    if (producto) producto.stock += item.cantidad;
  }

  venta.estado = "cancelada";
  venta.canceladaEn = new Date().toISOString();
  return venta;
}

// ------------------------------------------------------------
// CORTE DE CAJA (Reporte Z del punto de venta)
// ------------------------------------------------------------

/**
 * getCorteDelDia: calcula el resumen de ventas de HOY en vivo:
 * total vendido, número de tickets y desglose por método de pago.
 * POR QUÉ se calcula y no se guarda: hasta que se cierra la caja el
 * número sigue cambiando con cada venta; solo el CIERRE se persiste.
 * TODO Supabase: será un select con sum()/count() agrupado por
 * metodo_pago, filtrado por fecha = current_date.
 */
export async function getCorteDelDia(): Promise<{
  fecha: string;
  totalVendido: number;
  numeroTickets: number;
  porMetodo: DesglosePago;
  yaCerrada: boolean;
}> {
  await simularRed();
  const hoy = new Date().toISOString().slice(0, 10);
  // Las CANCELADAS no cuentan: su dinero se devolvió y su stock regresó
  const ventasHoy = ventas.filter((v) => v.fecha === hoy && v.estado === "completada");

  // Acumulamos usando el DESGLOSE real de cada venta (no la etiqueta):
  // así una venta mixta suma su parte a efectivo Y a transferencia, y
  // el efectivo del cajón cuadra con el renglón "efectivo".
  const porMetodo: DesglosePago = { efectivo: 0, tarjeta: 0, transferencia: 0 };
  for (const v of ventasHoy) {
    porMetodo.efectivo += v.pago.efectivo;
    porMetodo.tarjeta += v.pago.tarjeta;
    porMetodo.transferencia += v.pago.transferencia;
  }

  return {
    fecha: hoy,
    totalVendido: ventasHoy.reduce((suma, v) => suma + v.total, 0),
    numeroTickets: ventasHoy.length,
    porMetodo,
    // Si ya existe un corte con la fecha de hoy, la caja está cerrada
    yaCerrada: cortesCaja.some((c) => c.fecha === hoy),
  };
}

/**
 * registrarCorteCaja: CIERRA la caja del día guardando la "fotografía"
 * de los totales al momento del cierre. Solo se permite un corte por día.
 * TODO Supabase: insert en tabla `cortes_caja` con unique(fecha).
 */
export async function registrarCorteCaja(usuarioId: string): Promise<CorteCaja> {
  const resumen = await getCorteDelDia();
  if (resumen.yaCerrada) {
    throw new Error("La caja de hoy ya fue cerrada.");
  }
  const corte: CorteCaja = {
    id: `corte-${Date.now()}`,
    fecha: resumen.fecha,
    totalVendido: resumen.totalVendido,
    numeroTickets: resumen.numeroTickets,
    porMetodo: resumen.porMetodo,
    usuarioId,
    cerradoEn: new Date().toISOString(),
  };
  cortesCaja.push(corte);
  return corte;
}

// ------------------------------------------------------------
// REPORTES MENSUALES (dashboard de ventas)
// ------------------------------------------------------------

/**
 * getReporteMensual: calcula TODAS las métricas del panel de reportes
 * en una sola pasada sobre las ventas COMPLETADAS:
 *   - Total del mes actual y del anterior (para la comparativa %)
 *   - Ventas por día del mes (alimenta el gráfico de barras)
 *   - Top 5 de productos por importe vendido
 *   - Desglose de ingresos por método de pago
 * POR QUÉ un solo servicio y no cuatro: el componente hace UNA
 * petición y pinta todo; menos parpadeos de carga en la vista.
 * TODO Supabase: cada bloque será una consulta agregada:
 *   - totales: sum(total) filtrado por rango de fechas
 *   - por día: sum(total) group by fecha
 *   - top productos: requiere "desanidar" el jsonb de items
 *     (jsonb_array_elements) — ideal hacerlo en una función RPC
 *   - por método: sum(total) group by metodo_pago
 */
export async function getReporteMensual(): Promise<{
  mesActual: string;              // "2026-07" (para el título)
  totalMesActual: number;
  totalMesAnterior: number;
  variacionPorcentaje: number | null; // null si el mes anterior no tuvo ventas
  ventasPorDia: Array<{ dia: number; total: number }>;
  topProductos: Array<{ nombre: string; cantidad: number; importe: number }>;
  porMetodo: DesglosePago;
}> {
  await simularRed();

  const hoy = new Date();
  const mesActual = hoy.toISOString().slice(0, 7); // "YYYY-MM"

  // Mes anterior: restamos un mes con Date (maneja enero -> diciembre solo)
  const fechaAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const mesAnterior = `${fechaAnterior.getFullYear()}-${String(fechaAnterior.getMonth() + 1).padStart(2, "0")}`;

  // Solo ventas completadas: las canceladas no son ingreso
  const completadas = ventas.filter((v) => v.estado === "completada");
  const delMes = completadas.filter((v) => v.fecha.startsWith(mesActual));
  const delMesAnterior = completadas.filter((v) => v.fecha.startsWith(mesAnterior));

  const totalMesActual = delMes.reduce((s, v) => s + v.total, 0);
  const totalMesAnterior = delMesAnterior.reduce((s, v) => s + v.total, 0);

  // Comparativa: ((actual - anterior) / anterior) * 100.
  // Si el mes anterior fue 0 no hay base de comparación -> null (la UI muestra "—")
  const variacionPorcentaje =
    totalMesAnterior > 0
      ? Math.round(((totalMesActual - totalMesAnterior) / totalMesAnterior) * 100)
      : null;

  // Ventas por día: un renglón por cada día transcurrido del mes (1..hoy)
  const diasTranscurridos = hoy.getDate();
  const ventasPorDia = Array.from({ length: diasTranscurridos }, (_, i) => {
    const dia = i + 1;
    const fechaDia = `${mesActual}-${String(dia).padStart(2, "0")}`;
    return {
      dia,
      total: delMes.filter((v) => v.fecha === fechaDia).reduce((s, v) => s + v.total, 0),
    };
  });

  // Top productos del mes: acumulamos cantidad e importe por producto
  const acumulado = new Map<string, { nombre: string; cantidad: number; importe: number }>();
  for (const venta of delMes) {
    for (const item of venta.items) {
      const previo = acumulado.get(item.productoId) ?? {
        nombre: item.nombreProducto, cantidad: 0, importe: 0,
      };
      previo.cantidad += item.cantidad;
      previo.importe += item.cantidad * item.precioUnitario;
      acumulado.set(item.productoId, previo);
    }
  }
  // Ordenamos por importe (lo que más dinero dejó) y tomamos 5
  const topProductos = [...acumulado.values()]
    .sort((a, b) => b.importe - a.importe)
    .slice(0, 5);

  // Ingresos del mes por forma de pago (usando el desglose real)
  const porMetodo: DesglosePago = { efectivo: 0, tarjeta: 0, transferencia: 0 };
  for (const v of delMes) {
    porMetodo.efectivo += v.pago.efectivo;
    porMetodo.tarjeta += v.pago.tarjeta;
    porMetodo.transferencia += v.pago.transferencia;
  }

  return {
    mesActual, totalMesActual, totalMesAnterior,
    variacionPorcentaje, ventasPorDia, topProductos, porMetodo,
  };
}

/** getVentas / getCompras: historiales para los módulos de POS y compras */
export async function getVentas(): Promise<Venta[]> {
  await simularRed();
  return [...ventas].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function getCompras(): Promise<Compra[]> {
  await simularRed();
  return [...compras].sort((a, b) => b.fecha.localeCompare(a.fecha));
}
