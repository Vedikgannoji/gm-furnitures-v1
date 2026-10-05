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

  let res: Response
  try {
    res = await fetch(url, init)
  } catch (networkError) {
    throw new Error(
      'Unable to reach the server. Please check your internet connection and try again.'
    )
  }

  const contentType = res.headers.get('content-type') || ''
  let data: any

  if (contentType.includes('application/json')) {
    data = await res.json()
  } else {
    const text = await res.text()
    if (!res.ok) {
      if (res.status === 404 || res.status === 405) {
        throw new Error(
          `API endpoint not found (${res.status}). The backend may not be deployed yet — ` +
          `set VITE_API_URL in Vercel to your Railway/Render backend URL.`
        )
      }
      throw new Error(
        `Server error (${res.status}). Please try again or contact support.`
      )
    }
    data = { message: text }
  }

  return { ok: res.ok, status: res.status, data }
}
