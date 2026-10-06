export interface CashfreeInstance {
  checkout: (options: {
    paymentSessionId: string
    redirectTarget?: '_self' | '_modal' | '_blank'
  }) => Promise<any>
}

export type CashfreeMode = 'sandbox' | 'production'

declare global {
  interface Window {
    Cashfree?: (config: { mode: CashfreeMode }) => CashfreeInstance
  }
}

/**
 * Safely retrieves or loads the official Cashfree Web Checkout SDK (v3).
 */
export async function getCashfreeSDK(): Promise<(config: { mode: CashfreeMode }) => CashfreeInstance> {
  if (typeof window === 'undefined') {
    throw new Error('Cashfree SDK can only be loaded in a browser environment')
  }

  if (window.Cashfree) {
    return window.Cashfree
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]'
    )
    if (existing) {
      if (window.Cashfree) {
        resolve(window.Cashfree)
        return
      }
      existing.addEventListener('load', () => {
        if (window.Cashfree) {
          resolve(window.Cashfree)
        } else {
          reject(new Error('Cashfree object not found on window'))
        }
      })
      existing.addEventListener('error', () => {
        reject(new Error('Failed to load Cashfree SDK'))
      })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
    script.async = true
    script.onload = () => {
      if (window.Cashfree) {
        resolve(window.Cashfree)
      } else {
        reject(new Error('Cashfree object not found on window after script load'))
      }
    }
    script.onerror = () => {
      reject(new Error('Failed to load Cashfree SDK script'))
    }
    document.head.appendChild(script)
  })
}
