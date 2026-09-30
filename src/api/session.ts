import { UserSession } from '../types';
import { decodeRolesFromAccessToken } from '../utils/jwt';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

// sessionStorage (no localStorage): la sesión sobrevive a recargar la pestaña pero no queda en disco entre pestañas.
const STORAGE_KEY = 'fcv.session';

type Listener = (session: UserSession | null, reason?: 'expired') => void;

let current: UserSession | null = readStored();
const listeners = new Set<Listener>();
let refreshInFlight: Promise<UserSession | null> | null = null;

function readStored(): UserSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserSession;
    return parsed.accessToken && parsed.refreshToken ? parsed : null;
  } catch {
    return null;
  }
}

function persist(session: UserSession | null) {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin almacenamiento disponible la sesión sigue funcionando en memoria.
  }
}

export function getSession(): UserSession | null {
  return current;
}

export function setSession(session: UserSession | null, reason?: 'expired') {
  current = session;
  persist(session);
  listeners.forEach((l) => l(session, reason));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Un solo refresh concurrente: si varias peticiones reciben 401 a la vez, todas esperan la misma renovación. */
export function refreshSession(): Promise<UserSession | null> {
  if (refreshInFlight) return refreshInFlight;
  const session = current;
  if (!session) return Promise.resolve(null);

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken })
      });
      if (!response.ok) return null;
      const data: { accessToken: string; refreshToken: string } = await response.json();
      const renewed: UserSession = {
        ...session,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        roles: decodeRolesFromAccessToken(data.accessToken)
      };
      setSession(renewed);
      return renewed;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function withAuth(init: RequestInit | undefined, accessToken: string): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  return { ...init, headers };
}

/**
 * fetch autenticado contra citas-api. Siempre usa el access token vigente (ignora el que traiga `init`),
 * reintenta una vez tras renovar ante un 401 y, si la renovación falla, cierra la sesión como expirada.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const url = input.startsWith('http') ? input : `${API_URL}${input}`;
  const session = current;
  if (!session) return fetch(url, init);

  const response = await fetch(url, withAuth(init, session.accessToken));
  if (response.status !== 401) return response;

  const renewed = await refreshSession();
  if (!renewed) {
    if (current) setSession(null, 'expired');
    return response;
  }
  return fetch(url, withAuth(init, renewed.accessToken));
}
