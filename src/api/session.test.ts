import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authHeaderOf, fakeJwt, jsonResponse, mockFetch } from '../test-utils';
import type { UserSession } from '../types';

type SessionModule = typeof import('./session');

async function cargarModulo(): Promise<SessionModule> {
  vi.resetModules();
  return import('./session');
}

const sesionUsuario = (): UserSession => ({
  email: 'paciente1@demo.invalid',
  accessToken: 'access-viejo',
  refreshToken: 'refresh-viejo',
  roles: ['USER']
});

describe('session / apiFetch', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('restaura la sesión guardada al recargar el módulo', async () => {
    const primero = await cargarModulo();
    primero.setSession(sesionUsuario());

    const recargado = await cargarModulo();
    expect(recargado.getSession()?.email).toBe('paciente1@demo.invalid');
  });

  it('usa siempre el access token vigente, aunque la petición traiga otro', async () => {
    const m = await cargarModulo();
    m.setSession(sesionUsuario());
    const fetchMock = mockFetch(jsonResponse(200, []));

    await m.apiFetch('/api/appointments/mine', { headers: { Authorization: 'Bearer token-antiguo' } });

    expect(authHeaderOf(fetchMock.mock.calls[0])).toBe('Bearer access-viejo');
  });

  it('ante un 401 renueva la sesión una vez y reintenta con el token nuevo', async () => {
    const m = await cargarModulo();
    m.setSession(sesionUsuario());
    const nuevoAccess = fakeJwt(['USER']);
    const fetchMock = mockFetch(
      jsonResponse(401),
      jsonResponse(200, { accessToken: nuevoAccess, refreshToken: 'refresh-nuevo' }),
      jsonResponse(200, [{ citaId: 1 }])
    );

    const resp = await m.apiFetch('/api/appointments/mine');

    expect(resp.status).toBe(200);
    expect(String(fetchMock.mock.calls[1][0])).toContain('/api/auth/refresh');
    expect(authHeaderOf(fetchMock.mock.calls[2])).toBe(`Bearer ${nuevoAccess}`);
    expect(m.getSession()?.refreshToken).toBe('refresh-nuevo');
  });

  it('dos 401 simultáneos comparten una sola renovación', async () => {
    const m = await cargarModulo();
    m.setSession(sesionUsuario());
    const nuevoAccess = fakeJwt(['USER']);
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes('/api/auth/refresh')) {
        return jsonResponse(200, { accessToken: nuevoAccess, refreshToken: 'refresh-nuevo' });
      }
      return m.getSession()?.accessToken === nuevoAccess ? jsonResponse(200, []) : jsonResponse(401);
    });
    vi.stubGlobal('fetch', fetchMock);

    const [a, b] = await Promise.all([m.apiFetch('/api/specialties'), m.apiFetch('/api/professionals')]);

    expect([a.status, b.status]).toEqual([200, 200]);
    expect(fetchMock.mock.calls.filter((c) => String(c[0]).includes('/api/auth/refresh'))).toHaveLength(1);
  });

  it('si la renovación falla cierra la sesión como expirada', async () => {
    const m = await cargarModulo();
    m.setSession(sesionUsuario());
    const listener = vi.fn();
    m.subscribe(listener);
    mockFetch(jsonResponse(401), jsonResponse(401));

    const resp = await m.apiFetch('/api/users/me');

    expect(resp.status).toBe(401);
    expect(m.getSession()).toBeNull();
    expect(listener).toHaveBeenCalledWith(null, 'expired');
    expect(sessionStorage.getItem('fcv.session')).toBeNull();
  });

  it('un 403 no intenta renovar la sesión', async () => {
    const m = await cargarModulo();
    m.setSession(sesionUsuario());
    const fetchMock = mockFetch(jsonResponse(403));

    const resp = await m.apiFetch('/api/admin/eps');

    expect(resp.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(m.getSession()).not.toBeNull();
  });
});
