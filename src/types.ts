/** Nombres de rol tal como los emite JwtTokenProviderAdapter en el claim "roles" del accessToken. */
export type Rol = 'USER' | 'PROFESSIONAL' | 'ADMIN';

/**
 * Sesión autenticada. POST /api/auth/login solo devuelve accessToken/refreshToken; `roles` se decodifica
 * en cliente del propio JWT (ver utils/jwt.ts). El perfil completo vive en GET /api/users/me (PerfilApi).
 */
export interface UserSession {
  email: string;
  accessToken: string;
  refreshToken: string;
  roles: Rol[];
}

export type ActiveScreen =
  | 'login'
  | 'register'
  | 'success-landing'
  | 'agendar-cita'
  | 'mis-citas'
  | 'mi-agenda'
  | 'mi-disponibilidad'
  | 'aprobacion-citas'
  | 'admin-catalogo'
  | 'admin-reprogramaciones'
  | 'admin-eps'
  | 'mi-perfil'
  | 'inicio-profesional'
  | 'inicio-admin';

/** RF-01: tipoDocumento se guarda como texto libre en el backend (sin catálogo fijo); estos son los valores que ofrece el formulario. */
export type DocumentType = 'CC' | 'CE' | 'TI' | 'PAS';

/**
 * Tipos de HU-009/010/013/014/015/016 (S3). Reflejan exactamente lo que
 * devuelve `citas-api` — ver docs/wiki/llm-wiki/wiki/contratos.md del
 * workspace. No inventar campos que la API no devuelve.
 */
export type CitaTipo = 'GENERAL' | 'ESPECIALIZADA';

/** Las dos sedes son catálogo fijo y público (HU-006/V2); no hay endpoint de sedes todavía. */
export type SedeId = 1 | 2;

export const SEDES: Record<SedeId, { nombre: string; corto: string; direccion: string }> = {
  1: {
    nombre: 'Hospital Internacional de Colombia (HIC)',
    corto: 'HIC · Piedecuesta',
    direccion: 'Km 7 Autopista Bucaramanga - Piedecuesta, Valle de Menzulí'
  },
  2: {
    nombre: 'Fundación Cardiovascular de Colombia - Instituto Cardiovascular (ICV)',
    corto: 'ICV · Floridablanca',
    direccion: 'Calle 155A No. 23-58, Urbanización El Bosque'
  }
};

/** GET /api/specialties */
export interface SpecialtyApi {
  id: number;
  codigo: string;
  nombre: string;
  duracionMinutos: number;
  general: boolean;
  requiereAprobacionAdmin: boolean;
  activa: boolean;
}

/** GET /api/professionals */
export interface ProfessionalApi {
  profesionalId: number;
  nombreCompleto: string;
  especialidadIds: number[];
  sedeIds: number[];
}

/** GET /api/availability */
export interface HorarioDisponible {
  profesionalId: number;
  sedeId: number;
  inicio: string;
  fin: string;
}

/** POST /api/appointments/general | /specialized */
export interface AppointmentResult {
  citaId: number;
  estado: 'APPROVED' | 'REQUESTED';
  inicio: string;
  fin: string;
}

/**
 * GET/POST/PUT /api/professionals/me/availability-blocks (HU-012). No incluye información de citas
 * asignadas: el backend no expone eso en este recurso (ver DisponibilidadProfesionalController), así que
 * la UI no debe inventar contadores de pacientes/cupos comprometidos que la API no devuelve.
 */
export interface AvailabilityBlockApi {
  id: number;
  profesionalId: number;
  sedeId: SedeId;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm:ss
  horaFin: string; // HH:mm:ss
  activo: boolean;
}

/**
 * GET /api/admin/appointments/requested, POST .../approve, POST .../reject (HU-016). Solo trae IDs: la UI
 * muestra "Paciente #<id>" y resuelve profesional/especialidad cruzando con /api/professionals y /api/specialties.
 */
export interface AdminAppointmentApi {
  citaId: number;
  pacienteUsuarioId: number;
  profesionalId: number;
  sedeId: SedeId;
  especialidadId: number;
  estado: 'REQUESTED' | 'APPROVED' | 'REJECTED';
  inicio: string;
  fin: string;
  motivoDecision: string | null;
}

/**
 * GET/POST/PATCH /api/admin/professionals (HU-010/HU-011) y PUT /{id}/assignments (RF-07). Trae también
 * inactivos y datos de contacto (vienen de Usuario). Solo especialidades y sedes son editables.
 */
export interface ProfessionalAdminApi {
  profesionalId: number;
  usuarioId: number;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string;
  telefono: string;
  codigoProfesional: string;
  matricula: string;
  activo: boolean;
  especialidades: { especialidadId: number; primaria: boolean }[];
  sedeIds: SedeId[];
}

/** Catálogo fijo `appointment_statuses` (V2), ver `EstadoCita.java`. */
export type EstadoCita = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

/** Catálogo fijo `reschedule_request_statuses` (V2), ver `EstadoSolicitudReprogramacion.java`. */
export type EstadoSolicitudReprogramacion = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

/**
 * Desenlace de la última solicitud de reprogramación de una cita (HU-019/HU-020), o null si nunca se pidió
 * una. El estado de la cita no cambia mientras la solicitud está PENDING (RN-10) — esta es la única forma en
 * que el paciente conoce el resultado de su propia solicitud, incluida tras recargar la página.
 */
export interface ReprogramacionInfoApi {
  solicitudId: number;
  estado: EstadoSolicitudReprogramacion;
  inicioSolicitado: string;
  finSolicitado: string;
  motivoDecision: string | null;
}

/**
 * GET /api/appointments/mine (HU-017). Solo trae IDs de sede/profesional/especialidad — se resuelven
 * cruzando con /api/professionals, /api/specialties y el catálogo fijo SEDES, mismo patrón que
 * AdminAppointmentApi. motivoDecision solo viene informado si la cita fue rechazada (HU-016/HU-023).
 */
export interface MiCitaApi {
  citaId: number;
  sedeId: SedeId;
  profesionalId: number;
  especialidadId: number;
  estado: EstadoCita;
  inicio: string;
  fin: string;
  motivoDecision: string | null;
  reprogramacion: ReprogramacionInfoApi | null;
}

/** POST /api/appointments/{id}/cancel | /complete | /no-show (HU-018/HU-022). */
export interface CierreResponse {
  citaId: number;
  estado: EstadoCita;
}

/**
 * POST /api/appointments/{id}/reschedule (HU-019). No hay ningún endpoint que permita al propio USER
 * consultar después el estado de su solicitud (solo existe GET /api/admin/reschedules, ADMIN-only) — la UI
 * solo puede recordar esta respuesta mientras dura la sesión del navegador, no across reloads.
 */
export interface ReprogramarResponse {
  solicitudId: number;
  citaId: number;
  estado: EstadoSolicitudReprogramacion;
  inicioSolicitado: string;
  finSolicitado: string;
}

/**
 * GET /api/professionals/me/agenda (HU-021). Solo trae citas propias en estado APPROVED — una vez cerrada
 * (COMPLETED/NO_SHOW vía HU-022) deja de aparecer aquí; su trazabilidad está en GET /api/appointments/{id}/history.
 */
export interface CitaAgendaApi {
  citaId: number;
  pacienteUsuarioId: number;
  sedeId: SedeId;
  especialidadId: number;
  inicio: string;
  fin: string;
}

/**
 * GET/POST /api/admin/reschedules/** (HU-020). Ojo: no trae especialidadId ni la sede anterior de la cita
 * (solo sedeSolicitadaId, la nueva) — el contrato real no expone esos datos aquí, no inventarlos. El nombre
 * del profesional se resuelve cruzando con /api/professionals, mismo patrón que AdminAppointmentApi.
 */
export interface SolicitudReprogramacionApi {
  solicitudId: number;
  citaId: number;
  profesionalId: number;
  sedeSolicitadaId: SedeId;
  estado: EstadoSolicitudReprogramacion;
  inicioAnterior: string;
  finAnterior: string;
  inicioSolicitado: string;
  finSolicitado: string;
  motivoDecision: string | null;
}

/** Forma del error que ya devuelve el backend (ApiError, ver contratos.md). */
export interface ApiErrorBody {
  status: number;
  error: string;
  message: string;
  detalles?: string[];
}

/** GET/PATCH /api/users/me (HU-004). email y documento no son editables. */
export interface PerfilApi {
  id: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string;
  telefono: string;
}

/** GET/PUT /api/users/me/afiliacion (HU-005). GET responde 404 si el usuario aún no tiene afiliación. */
export interface AfiliacionApi {
  afiliacionId: number;
  epsId: number;
  epsNombre: string;
  planId: number;
  planNombre: string;
  regimenId: number;
  numeroAfiliacion: string;
}

/** GET /api/eps y /api/admin/eps (HU-007). */
export interface EpsApi {
  id: number;
  codigo: string;
  nombre: string;
  activa: boolean;
}

/** GET /api/eps/{epsId}/plans y /api/admin/eps/{epsId}/plans (HU-008). */
export interface PlanEpsApi {
  id: number;
  epsId: number;
  regimenId: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

/** Catálogo fijo `insurance_regimes` (V2); no hay endpoint, igual que SEDES. */
export const REGIMENES: Record<number, string> = {
  1: 'Contributivo',
  2: 'Subsidiado',
  3: 'Especial',
  4: 'Excepción',
  5: 'Particular'
};

/** GET /api/appointments/{id}/history (HU-023). */
export interface HistorialEstadoApi {
  estado: EstadoCita;
  fuente: 'SYSTEM' | 'USER' | 'ADMIN';
  actorUsuarioId: number | null;
  motivo: string | null;
  momento: string;
}
