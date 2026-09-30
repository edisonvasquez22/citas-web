import { vi } from 'vitest';

/** JWT sin firma válida (el cliente nunca verifica la firma) con el claim "roles" dado. */
export function fakeJwt(roles: string[], extra: Record<string, unknown> = {}): string {
  const encode = (obj: object) => btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256' })}.${encode({ sub: '1', roles, ...extra })}.firma`;
}

export function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function mockFetch(...respuestas: Response[]) {
  const fn = vi.fn<typeof fetch>();
  respuestas.forEach((r) => fn.mockResolvedValueOnce(r));
  vi.stubGlobal('fetch', fn);
  return fn;
}

export function authHeaderOf(call: Parameters<typeof fetch>): string | null {
  return new Headers(call[1]?.headers).get('Authorization');
}
