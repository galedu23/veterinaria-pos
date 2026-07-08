// ============================================================
// Tipos globales del sistema veterinario.
// Estas interfaces reflejan las tablas que luego existirán en Supabase.
// TODO: Al conectar Supabase, generar estos tipos con `supabase gen types`.
// ============================================================

/** Roles disponibles en el sistema (validación de UI por rol) */
export type Rol = "administrador" | "veterinario" | "recepcion";

/** Usuario interno del sistema (empleado de la clínica) */
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  avatarUrl?: string;
}

/** Cliente: dueño de una o varias mascotas */
export interface Cliente {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  email?: string;
  direccion?: string;
  creadoEn: string; // fecha ISO
}

/** Especie de mascota (Perro, Gato, etc.) */
export interface Especie {
  id: string;
  nombre: string;
}

/** Raza, ligada a una especie */
export interface Raza {
  id: string;
  especieId: string;
  nombre: string;
}

/** Mascota registrada, ligada a un cliente */
export interface Mascota {
  id: string;
  clienteId: string;
  nombre: string;
  especieId: string;
  razaId: string;
  sexo: "macho" | "hembra";
  fechaNacimiento?: string;
  color?: string;
  fotoUrl?: string;
  creadoEn: string;
}

/**
 * Antecedentes: información BASE del paciente (una sola por mascota).
 * No cambia en cada visita — es el contexto que el veterinario revisa
 * antes de explorar: dónde vive, alergias, convivencia con otros animales.
 * EN SUPABASE: tabla `antecedentes` con unique(mascota_id) — se hace
 * upsert, nunca hay dos filas para la misma mascota.
 */
export interface Antecedentes {
  id: string;
  mascotaId: string;
  enfermedadesPrevias?: string;
  lugarVive?: string;            // ej. "Casa con patio, ciudad"
  otrasMascotas?: string;        // convivencia con otros animales
  vacunasDesparasitaciones?: string; // historial previo a llegar a la clínica
  prevencionParasitos?: string;  // gusano del corazón y ectoparásitos
  alergias?: string;             // alergias a medicamentos
  actualizadoEn: string;
}

/**
 * ExploracionFisica: la REVISIÓN POR SISTEMAS de una consulta.
 * Campos de texto libre (así trabajaba el sistema anterior): el
 * veterinario anota "normal", "sin alteraciones" o el hallazgo.
 * EN SUPABASE: columna jsonb `exploracion` dentro de `consultas`
 * (siempre se lee junto con su consulta, igual que los medicamentos
 * de una receta).
 */
export interface ExploracionFisica {
  // --- Signos vitales complementarios ---
  fc?: string;               // frecuencia cardíaca (ej. "120 lpm")
  fr?: string;               // frecuencia respiratoria (ej. "24 rpm")
  pulsoFemoral?: string;
  deshidratacionPct?: string; // % de deshidratación estimado
  mucosas?: string;           // color/estado de mucosas
  tllc?: string;              // THC: tiempo de llenado capilar (ej. "<2 s")
  // --- Revisión por sistemas ---
  cabeza?: string;
  pielPelaje?: string;
  ganglios?: string;
  sistemaRespiratorio?: string;
  sistemaEndocrino?: string;
  sistemaMusculoEsqueletico?: string;
  sistemaNervioso?: string;
  sistemaReproductivo?: string;
  palpacion?: string;         // palpación rectal y vaginal
  otros?: string;
}

/** Consulta / entrada del expediente clínico */
export interface Consulta {
  id: string;
  mascotaId: string;
  veterinarioId: string;
  fecha: string;
  motivo: string;
  diagnostico: string;   // DX presuntivo
  tratamiento?: string;  // TX (tratamiento / receta indicada)
  pesoKg?: number;
  temperaturaC?: number;
  notas?: string;
  // --- Campos del formulario clínico completo ---
  tipoServicio?: string;      // Consulta general, Vacunación, Cirugía...
  condicionCorporal?: number; // CC: escala 1-9 (1 emaciado, 5 ideal, 9 obeso)
  proximaConsulta?: string;   // fecha ISO de la cita de seguimiento
  progreso?: string;          // evolución del paciente (columna de anamnesis)
  exploracion?: ExploracionFisica; // jsonb en Supabase
}

/** Medicamento dentro de una receta (dosis, frecuencia, duración) */
export interface MedicamentoRecetado {
  nombre: string;
  dosis: string;      // ej. "5 mg"
  frecuencia: string; // ej. "cada 8 horas"
  duracion: string;   // ej. "7 días"
  indicaciones?: string;
}

/**
 * Receta médica. VINCULACIÓN ESTRICTA: toda receta PERTENECE a una
 * consulta (consultaId es OBLIGATORIO). Una receta sin consulta no
 * tiene contexto clínico — ¿qué diagnóstico la justifica?
 * EN SUPABASE: columna `consulta_id uuid NOT NULL references
 * consultas(id) ON DELETE CASCADE` — si se borra la consulta, sus
 * recetas se van con ella (no quedan recetas huérfanas).
 */
export interface Receta {
  id: string;
  mascotaId: string;   // FK a mascotas (denormalizada para listar rápido)
  consultaId: string;  // FK OBLIGATORIA a consultas
  veterinarioId: string;
  fecha: string;
  medicamentos: MedicamentoRecetado[];
  observaciones?: string;
}

/**
 * Servicio: catálogo de servicios de la clínica (Baño, Rayos X...).
 * Alimenta el select "Tipo de servicio" del alta de consulta.
 * EN SUPABASE: tabla `servicios`; a futuro `consultas.tipo_servicio`
 * puede volverse FK `servicio_id` — por ahora la consulta guarda el
 * NOMBRE (texto) para que el historial no cambie si se renombra.
 */
export interface Servicio {
  id: string;
  nombre: string;
  precio?: number;      // precio de lista (opcional)
  descripcion?: string;
}

/** Registro de vacuna aplicada, con fecha de próxima dosis para alertas */
export interface Vacuna {
  id: string;
  mascotaId: string;
  nombre: string;
  fechaAplicacion: string;
  proximaDosis?: string; // si existe, genera alerta cuando se acerca
  lote?: string;
  veterinarioId: string;
}

/** Categoría de producto (Alimento, Medicamento, Accesorio...) */
export interface Categoria {
  id: string;
  nombre: string;
}

/** Producto del inventario (punto de venta) */
export interface Producto {
  id: string;
  categoriaId: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number; // para alertas de inventario bajo
  fotoUrl?: string;    // foto comprimida (WebP); URL de Storage a futuro
}

/** Métodos de pago aceptados en el punto de venta */
export type MetodoPago = "efectivo" | "tarjeta" | "transferencia";

/** Datos de la clínica que se imprimen en el ticket (módulo Configuración) */
export interface ConfiguracionClinica {
  nombre: string;
  direccion: string;
  telefono: string;
  mensajeDespedida: string;
  /** Logotipo comprimido (WebP dataURL); "" = sin logo. Aparece en tickets y recetas */
  logoUrl: string;
}

/** Documento médico del expediente (PDF o imagen: análisis, recetas externas) */
export interface DocumentoMedico {
  id: string;
  mascotaId: string;   // todo documento queda ligado a su mascota
  nombre: string;      // nombre visible, ej. "Biometría hemática marzo"
  tipo: "pdf" | "imagen";
  dataUrl: string;     // contenido en base64 (mock); URL de Storage a futuro
  tamanoKB: number;
  fecha: string;
  subidoPorId: string; // usuario que lo subió
}

/** Corte de caja del día (Reporte Z del punto de venta) */
export interface CorteCaja {
  id: string;
  fecha: string;                        // día que se cierra (ISO)
  totalVendido: number;
  numeroTickets: number;
  porMetodo: Record<MetodoPago, number>; // desglose por método de pago
  usuarioId: string;                     // quién cerró la caja
  cerradoEn: string;                     // fecha-hora del cierre
}

/** Línea de una venta o compra */
export interface LineaItem {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
}

/** Tipo de descuento aplicable en el POS */
export type TipoDescuento = "porcentaje" | "monto";

/** Venta realizada en el punto de venta (ticket interno) */
export interface Venta {
  id: string;
  folio: string;
  clienteId?: string; // puede ser venta a público general
  usuarioId: string;
  fecha: string;
  items: LineaItem[];
  subtotal: number;   // suma de las líneas ANTES del descuento
  descuento: number;  // monto descontado en $ (0 = sin descuento)
  total: number;      // subtotal - descuento (lo que se cobró)
  metodoPago: MetodoPago; // alimenta el desglose del corte de caja
  /** "cancelada" devuelve el stock al inventario y sale de los reportes */
  estado: "completada" | "cancelada";
  canceladaEn?: string; // fecha-hora de la cancelación (auditoría)
}

/** Compra a proveedor (entrada de inventario) */
export interface Compra {
  id: string;
  folio: string;
  proveedor: string;
  usuarioId: string;
  fecha: string;
  items: LineaItem[];
  total: number;
}

/** Métricas que alimentan las tarjetas del dashboard */
export interface DashboardStats {
  usuarios: number;
  clientes: number;
  mascotas: number;
  consultas: number;
  productos: number;
  ventasHoy: number;
  vacunasProximas: number;
}

/** Resultado del buscador rápido global (clientes y mascotas) */
export interface ResultadoBusqueda {
  tipo: "cliente" | "mascota";
  id: string;
  titulo: string;    // nombre principal
  subtitulo: string; // dato de apoyo (dueño, teléfono, raza...)
  url: string;       // ruta a la vista de detalle
}
