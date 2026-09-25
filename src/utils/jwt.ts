import { Rol } from '../types';

/**
 * Decodifica (sin verificar firma; eso es responsabilidad exclusiva del backend) el payload del JWT para
 * leer el claim "roles" que ya emite JwtTokenProviderAdapter en citas-api. No hay endpoint de perfil
 * (EP-002 sin aprobar), así que esta es la única fuente real de rol disponible en el cliente hoy.
 */
export function decodeRolesFromAccessToken(accessToken: string): Rol[] {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return [];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    const claims = JSON.parse(json) as { roles?: unknown };
    if (!Array.isArray(claims.roles)) return [];
    return claims.roles.filter((r): r is Rol => r === 'USER' || r === 'PROFESSIONAL' || r === 'ADMIN');
  } catch {
    return [];
  }
}
