import { describe, expect, it } from 'vitest';
import { homeScreenFor, isScreenAllowed } from './navigation';
import { decodeRolesFromAccessToken } from './utils/jwt';
import { fakeJwt } from './test-utils';

describe('navegación por rol', () => {
  it('cada rol aterriza en su propio inicio', () => {
    expect(homeScreenFor(['USER'])).toBe('success-landing');
    expect(homeScreenFor(['PROFESSIONAL'])).toBe('inicio-profesional');
    expect(homeScreenFor(['ADMIN'])).toBe('inicio-admin');
  });

  it('un paciente no puede abrir pantallas de admin ni de profesional', () => {
    expect(isScreenAllowed('mi-perfil', ['USER'])).toBe(true);
    expect(isScreenAllowed('admin-eps', ['USER'])).toBe(false);
    expect(isScreenAllowed('mi-disponibilidad', ['USER'])).toBe(false);
  });

  it('el admin accede a EPS y planes', () => {
    expect(isScreenAllowed('admin-eps', ['ADMIN'])).toBe(true);
  });
});

describe('decodeRolesFromAccessToken', () => {
  it('lee solo roles conocidos del claim "roles"', () => {
    expect(decodeRolesFromAccessToken(fakeJwt(['ADMIN', 'ROOT']))).toEqual(['ADMIN']);
  });

  it('devuelve vacío con un token malformado', () => {
    expect(decodeRolesFromAccessToken('no-es-un-jwt')).toEqual([]);
  });
});
