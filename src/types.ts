/** Sesión autenticada. Solo trae lo que devuelve POST /api/auth/login (accessToken, refreshToken); no hay endpoint de perfil todavía (EP-002, sin aprobar). */
export interface UserSession {
  email: string;
  accessToken: string;
  refreshToken: string;
}

export type ActiveScreen = 'login' | 'success-landing';
