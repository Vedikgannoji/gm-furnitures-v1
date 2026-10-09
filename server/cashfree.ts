import crypto from 'node:crypto'
import dotenv from 'dotenv'

dotenv.config()

export type CashfreeEnvironment = 'sandbox' | 'production'

export interface CashfreeConfig {
  env: CashfreeEnvironment
  isProduction: boolean
  baseUrl: string
  ordersUrl: string
  clientId: string
  clientSecret: string
  apiVersion: string
  isConfigured: boolean
}

export interface CashfreeStatusReport {
  currentEnvironment: CashfreeEnvironment
  sandboxConfigured: boolean
  productionConfigured: boolean
  switchPasswordConfigured: boolean
}

export const CASHFREE_SANDBOX_BASE_URL = 'https://sandbox.cashfree.com/pg'
export const CASHFREE_PRODUCTION_BASE_URL = 'https://api.cashfree.com/pg'
export const CASHFREE_API_VERSION = '2023-08-01'

/**
 * Checks whether an ID string is formatted as a Cashfree Sandbox/Test ID.
 * Cashfree test credentials typically start with 'TEST' or contain test markers.
 */
export function isTestCredential(id?: string | null): boolean {
  if (!id) return false
  const trimmed = id.trim()
  return (
    trimmed.startsWith('TEST') ||
    trimmed.toLowerCase().startsWith('test_') ||
    trimmed.toLowerCase().includes('_test_')
  )
}

/**
 * Checks whether a secret key is formatted as a Cashfree Sandbox/Test Secret.
 * Cashfree test secrets start with 'cfsk_ma_test_'.
 */
export function isTestSecret(secret?: string | null): boolean {
  if (!secret) return false
  const trimmed = secret.trim()
  return (
    trimmed.startsWith('cfsk_ma_test_') ||
    trimmed.toLowerCase().includes('_test_')
  )
}

/**
 * Sanitizes an environment string to either 'sandbox' or 'production'.
 * Strictly defaults to 'sandbox' for any unrecognized or invalid value.
 */
export function sanitizeEnvironment(raw?: string | null): CashfreeEnvironment {
  const normalized = (raw || '').trim().toLowerCase()
  if (normalized === 'production') {
    return 'production'
  }
  return 'sandbox'
}

/**
 * Resolves the credentials specifically for the requested environment.
 * Ensures Sandbox credentials are NEVER used for Production, and vice versa.
 */
export function getCashfreeCredentialsForEnv(env: CashfreeEnvironment): {
  clientId: string
  clientSecret: string
  isConfigured: boolean
} {
  if (env === 'production') {
    // 1. Dedicated production environment variables take highest priority
    const dedicatedId = (
      process.env.CASHFREE_PRODUCTION_CLIENT_ID ||
      process.env.CASHFREE_PROD_CLIENT_ID ||
      ''
    ).trim()

    const dedicatedSecret = (
      process.env.CASHFREE_PRODUCTION_CLIENT_SECRET ||
      process.env.CASHFREE_PROD_CLIENT_SECRET ||
      ''
    ).trim()

    // 2. Fall back to standard CASHFREE_CLIENT_ID / CASHFREE_CLIENT_SECRET ONLY IF:
    //    a) CASHFREE_ENVIRONMENT is set to 'production', AND
    //    b) The credentials are NOT clearly sandbox test credentials
    const generalId = (process.env.CASHFREE_CLIENT_ID || '').trim()
    const generalSecret = (process.env.CASHFREE_CLIENT_SECRET || '').trim()
    const globalEnv = (process.env.CASHFREE_ENVIRONMENT || '').trim().toLowerCase()

    let clientId = dedicatedId
    let clientSecret = dedicatedSecret

    if (!clientId && globalEnv === 'production' && !isTestCredential(generalId)) {
      clientId = generalId
    }

    if (!clientSecret && globalEnv === 'production' && !isTestSecret(generalSecret)) {
      clientSecret = generalSecret
    }

    // Safety guard: NEVER permit sandbox/test credentials to be used against production
    if (isTestCredential(clientId) || isTestSecret(clientSecret)) {
      return {
        clientId: '',
        clientSecret: '',
        isConfigured: false,
      }
    }

    const isConfigured = Boolean(clientId && clientSecret)
    return { clientId, clientSecret, isConfigured }
  }

  // Sandbox Mode:
  const dedicatedId = (process.env.CASHFREE_SANDBOX_CLIENT_ID || '').trim()
  const dedicatedSecret = (process.env.CASHFREE_SANDBOX_CLIENT_SECRET || '').trim()
  const generalId = (process.env.CASHFREE_CLIENT_ID || '').trim()
  const generalSecret = (process.env.CASHFREE_CLIENT_SECRET || '').trim()
  const globalEnv = (process.env.CASHFREE_ENVIRONMENT || '').trim().toLowerCase()

  let clientId = dedicatedId
  let clientSecret = dedicatedSecret

  if (!clientId) {
    if (isTestCredential(generalId) || globalEnv !== 'production') {
      clientId = generalId
    }
  }

  if (!clientSecret) {
    if (isTestSecret(generalSecret) || globalEnv !== 'production') {
      clientSecret = generalSecret
    }
  }

  const isConfigured = Boolean(clientId && clientSecret)
  return { clientId, clientSecret, isConfigured }
}

/**
 * Returns complete Cashfree configuration for a specific environment.
 */
export function getCashfreeConfigForEnv(env: CashfreeEnvironment): CashfreeConfig {
  const isProduction = env === 'production'
  const baseUrl = isProduction ? CASHFREE_PRODUCTION_BASE_URL : CASHFREE_SANDBOX_BASE_URL
  const ordersUrl = `${baseUrl}/orders`
  const { clientId, clientSecret, isConfigured } = getCashfreeCredentialsForEnv(env)

  return {
    env,
    isProduction,
    baseUrl,
    ordersUrl,
    clientId,
    clientSecret,
    apiVersion: CASHFREE_API_VERSION,
    isConfigured,
  }
}

/**
 * Reports current gateway configuration status without exposing credentials.
 */
export function getCashfreeStatusReport(activeEnv: CashfreeEnvironment): CashfreeStatusReport {
  const sandboxCreds = getCashfreeCredentialsForEnv('sandbox')
  const prodCreds = getCashfreeCredentialsForEnv('production')
  const switchPasswordConfigured = Boolean(
    (process.env.CASHFREE_ENV_SWITCH_PASSWORD || '').trim()
  )

  return {
    currentEnvironment: activeEnv,
    sandboxConfigured: sandboxCreds.isConfigured,
    productionConfigured: prodCreds.isConfigured,
    switchPasswordConfigured,
  }
}

/**
 * Verifies a Cashfree webhook HMAC signature in constant time.
 */
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  clientSecret: string
): boolean {
  if (!signature || !timestamp || !clientSecret) {
    return false
  }

  try {
    const generated = crypto
      .createHmac('sha256', clientSecret)
      .update(timestamp + rawBody)
      .digest('base64')

    const sigBuf = Buffer.from(signature)
    const genBuf = Buffer.from(generated)

    if (sigBuf.length !== genBuf.length) {
      return false
    }

    return crypto.timingSafeEqual(sigBuf, genBuf)
  } catch {
    return false
  }
}

// In-memory rate limiting for admin environment switch password attempts
interface RateLimitRecord {
  failedAttempts: number
  lockedUntil: number
}
const rateLimitMap = new Map<string, RateLimitRecord>()

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Checks whether the given key is currently rate-limited.
 */
export function checkRateLimit(key: string): { allowed: boolean; remainingWaitMs?: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)
  if (!record) {
    return { allowed: true }
  }

  if (record.lockedUntil > now) {
    return {
      allowed: false,
      remainingWaitMs: record.lockedUntil - now,
    }
  }

  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    // Lockout expired, reset record
    rateLimitMap.delete(key)
    return { allowed: true }
  }

  return { allowed: true }
}

/**
 * Records a failed password attempt. Locks out if threshold reached.
 */
export function recordFailedPasswordAttempt(key: string): void {
  const now = Date.now()
  const record = rateLimitMap.get(key) || { failedAttempts: 0, lockedUntil: 0 }
  record.failedAttempts += 1

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS
  }

  rateLimitMap.set(key, record)
}

/**
 * Resets failed attempts after a successful verification.
 */
export function resetPasswordRateLimit(key: string): void {
  rateLimitMap.delete(key)
}

/**
 * Verifies the environment switch confirmation password.
 * Strictly uses server-side CASHFREE_ENV_SWITCH_PASSWORD.
 */
export function verifyEnvSwitchPassword(
  candidatePassword: string,
  rateLimitKey: string
): { valid: boolean; error?: string; status: number } {
  const rateLimit = checkRateLimit(rateLimitKey)
  if (!rateLimit.allowed) {
    const minutesLeft = Math.ceil((rateLimit.remainingWaitMs || 0) / 60000)
    return {
      valid: false,
      error: `Too many failed password attempts. Please wait ${minutesLeft} minute(s) before trying again.`,
      status: 429,
    }
  }

  const expectedPassword = (process.env.CASHFREE_ENV_SWITCH_PASSWORD || '').trim()

  if (!expectedPassword) {
    return {
      valid: false,
      error:
        'CASHFREE_ENV_SWITCH_PASSWORD is not configured in the server environment. Please configure CASHFREE_ENV_SWITCH_PASSWORD=CASHFREE before switching environments.',
      status: 500,
    }
  }

  if (typeof candidatePassword !== 'string' || !candidatePassword) {
    recordFailedPasswordAttempt(rateLimitKey)
    return {
      valid: false,
      error: 'Incorrect password. Environment unchanged.',
      status: 401,
    }
  }

  const candidateBuf = Buffer.from(candidatePassword.trim())
  const expectedBuf = Buffer.from(expectedPassword)

  const isMatch =
    candidateBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(candidateBuf, expectedBuf)

  if (!isMatch) {
    recordFailedPasswordAttempt(rateLimitKey)
    return {
      valid: false,
      error: 'Incorrect password. Environment unchanged.',
      status: 401,
    }
  }

  resetPasswordRateLimit(rateLimitKey)
  return { valid: true, status: 200 }
}
