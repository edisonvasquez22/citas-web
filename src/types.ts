/** Nombres de rol tal como los emite JwtTokenProviderAdapter en el claim "roles" del accessToken. */
export type Rol = 'USER' | 'PROFESSIONAL' | 'ADMIN';

/**
 * Sesión autenticada. POST /api/auth/login solo devuelve accessToken/refreshToken (no hay endpoint de
 * perfil todavía, EP-002 sin aprobar); `roles` se decodifica en cliente del propio JWT (ver utils/jwt.ts),
 * no se inventa ni se consulta a un endpoint que no existe.
 */
export interface UserSession {
  email: string;
  accessToken: string;
  refreshToken: string;
  roles: Rol[];
}

export type ActiveScreen = 'login' | 'register' | 'success-landing' | 'agendar-cita' | 'mi-disponibilidad';

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

/** Forma del error que ya devuelve el backend (ApiError, ver contratos.md). */
export interface ApiErrorBody {
  status: number;
  error: string;
  message: string;
  detalles?: string[];
}
