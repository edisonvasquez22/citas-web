/** Sesión autenticada. Solo trae lo que devuelve POST /api/auth/login (accessToken, refreshToken); no hay endpoint de perfil todavía (EP-002, sin aprobar). */
export interface UserSession {
  email: string;
  accessToken: string;
  refreshToken: string;
}

export type ActiveScreen = 'login' | 'register' | 'success-landing';

/** RF-01: tipoDocumento se guarda como texto libre en el backend (sin catálogo fijo); estos son los valores que ofrece el formulario. */
export type DocumentType = 'CC' | 'CE' | 'TI' | 'PAS';
