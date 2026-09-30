import { afterEach, describe, expect, it } from 'vitest';
import { en } from './en';
import { setLanguage, t } from './index';

const fuentes = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}', '!./**'], {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

// Primer argumento literal de t('...') o t("...") (admite comillas escapadas dentro).
const T_LITERAL = /\bt\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g;

function clavesUsadas(): Map<string, string> {
  const claves = new Map<string, string>();
  for (const [archivo, codigo] of Object.entries(fuentes)) {
    for (const m of codigo.matchAll(T_LITERAL)) {
      claves.set(m[2].replace(/\\(['"\\])/g, '$1'), archivo);
    }
  }
  return claves;
}

describe('i18n', () => {
  afterEach(() => setLanguage('ES'));

  it('todo texto t() literal del código tiene traducción al inglés', () => {
    const claves = clavesUsadas();
    expect(claves.size).toBeGreaterThan(400);
    const faltantes = [...claves].filter(([k]) => !(k in en)).map(([k, archivo]) => `${archivo}: ${k}`);
    expect(faltantes).toEqual([]);
  });

  it('en inglés traduce e interpola; sin traducción muestra el español', () => {
    setLanguage('EN');
    expect(t('Mis Citas')).toBe('My Appointments');
    expect(t('Sede #{sedeId}', { sedeId: 2 })).toBe('Site #2');
    expect(t('Mensaje del backend sin traducir')).toBe('Mensaje del backend sin traducir');
  });

  it('en español devuelve el texto original', () => {
    setLanguage('ES');
    expect(t('Mis Citas')).toBe('Mis Citas');
    expect(t('Sede #{sedeId}', { sedeId: null })).toBe('Sede #');
  });
});
