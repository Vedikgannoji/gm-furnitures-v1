/**
 * API base URL helper.
 *
 * Architecture:
 * - Unified Vercel deployment: Frontend and Backend API run under the same
 *   Vercel project domain (https://gmfurniture.vercel.app).
 * - Same-origin relative URLs (/api/...) are used by default.
 * - If VITE_API_URL is provided, it can override the base path.
 */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

/**
 * Wrapper around fetch that:
 *  1. Prepends the correct API base URL.
 *  2. Safely handles JSON responses.
 *  3. Throws descriptive error messages if the server returns an error.
 */
export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: any }> {
  const url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`

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
          `API endpoint not found (${res.status}). Please verify the requested route exists.`
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
