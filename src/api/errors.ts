import { ApiErrorBody } from '../types';

/** Mensaje legible de una respuesta de error de citas-api (ApiError), con respaldo si el cuerpo no es JSON. */
export async function mensajeDeError(response: Response, respaldo: string): Promise<string> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    if (body.detalles && body.detalles.length > 0) return body.detalles.join(' · ');
    if (body.message) return body.message;
  } catch {
    // Cuerpo vacío o no JSON.
  }
  return respaldo;
}
