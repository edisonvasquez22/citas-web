import { ActiveScreen, Rol } from './types';

const SCREENS_BY_ROLE: Record<Rol, ActiveScreen[]> = {
  USER: ['success-landing', 'agendar-cita', 'mis-citas', 'mi-perfil'],
  PROFESSIONAL: ['inicio-profesional', 'mi-agenda', 'mi-disponibilidad'],
  ADMIN: ['inicio-admin', 'aprobacion-citas', 'admin-reprogramaciones', 'admin-catalogo', 'admin-eps']
};

export function homeScreenFor(roles: Rol[]): ActiveScreen {
  if (roles.includes('ADMIN')) return 'inicio-admin';
  if (roles.includes('PROFESSIONAL')) return 'inicio-profesional';
  return 'success-landing';
}

/** Evita que un rol abra (o restaure tras recargar) pantallas de otro rol; el backend igual responde 403. */
export function isScreenAllowed(screen: ActiveScreen, roles: Rol[]): boolean {
  return roles.some((rol) => SCREENS_BY_ROLE[rol].includes(screen));
}
