import { en } from './en';

export type Language = 'ES' | 'EN';

const STORAGE_KEY = 'fcv.lang';

function readStored(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'EN' ? 'EN' : 'ES';
  } catch {
    return 'ES';
  }
}

let current: Language = readStored();

export function getLanguage(): Language {
  return current;
}

/**
 * Cambia el idioma global. App guarda el idioma en su estado y re-renderiza todo el árbol, así que
 * `t()` puede ser una función de módulo sin hook ni contexto (ningún componente está memoizado).
 */
export function setLanguage(lang: Language) {
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Preferencia opcional: sin almacenamiento solo dura la sesión.
  }
  if (typeof document !== 'undefined') document.documentElement.lang = lang === 'EN' ? 'en' : 'es';
}

/**
 * La clave es el propio texto en español. En inglés se busca en `en`; si falta, se muestra el español
 * (también cubre mensajes dinámicos del backend, que llegan en español). `{nombre}` se interpola con `vars`.
 */
export function t(texto: string, vars?: Record<string, string | number | null | undefined>): string {
  const base = current === 'EN' ? en[texto] ?? texto : texto;
  if (!vars) return base;
  return base.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k] ?? '') : m));
}

/** Locale BCP 47 para Intl (fechas, números). */
export function locale(): string {
  return current === 'EN' ? 'en-US' : 'es-CO';
}
