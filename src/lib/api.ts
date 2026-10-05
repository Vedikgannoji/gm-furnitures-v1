/**
 * API base URL helper.
 *
 * In development: Vite's proxy forwards /api → http://localhost:3001,
 *   so an empty string (relative URL) works fine.
 *
 * In production: the Express server runs on a separate host
 *   (e.g. Railway / Render). Set VITE_API_URL to that origin in your
 *   Vercel project environment variables, e.g.:
 *
 *     VITE_API_URL = https://gm-furniture-api.railway.app
 *
 *   Leave it empty (or unset) for local development.
 */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

/**
 * Wrapper around fetch that:
 *  1. Prepends the correct API base URL.
 *  2. Always reads the response body safely — if the server returns
 *     non-JSON (e.g. an HTML error page), it throws a clear message
 *     instead of "Unexpected token '<'".
 */
export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: any }> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, init)

  const contentType = res.headers.get('content-type') || ''
  let data: any

  if (contentType.includes('application/json')) {
    data = await res.json()
  } else {
    // Server returned non-JSON (HTML error page, plain text, etc.)
    const text = await res.text()
    if (!res.ok) {
      throw new Error(
        `API error ${res.status}: server returned an unexpected response. ` +
        `Check that VITE_API_URL points to the correct backend URL. ` +
        `(Received: ${text.slice(0, 120)})`
      )
    }
    data = { message: text }
  }

  return { ok: res.ok, status: res.status, data }
}
