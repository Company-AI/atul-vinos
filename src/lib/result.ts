/** Resultado explícito para servicios de dominio: sin excepciones de control de flujo. */
export type Ok<T> = { ok: true; data: T };
export type Err<E = string> = { ok: false; error: E; code?: string };
export type Result<T, E = string> = Ok<T> | Err<E>;

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });
export const err = <E = string>(error: E, code?: string): Err<E> => ({ ok: false, error, code });

export function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(String(result.error));
  return result.data;
}
