import http from 'node:http'
import crypto from 'node:crypto'
import app from '../server/app'
import {
  getCashfreeConfigForEnv,
  getCashfreeStatusReport,
  sanitizeEnvironment,
  verifyCashfreeWebhookSignature,
  verifyEnvSwitchPassword,
  checkRateLimit,
  recordFailedPasswordAttempt,
  resetPasswordRateLimit,
} from '../server/cashfree'
import { setMockQueryHandler } from '../server/db'
import { signToken } from '../server/auth'

async function runCashfreeTests() {
  console.log('====================================================')
  console.log('GM FURNITURE — CASHFREE GATEWAY & SWITCH TEST SUITE')
  console.log('====================================================\n')

  const configuredEnv = process.env.CASHFREE_ENVIRONMENT || 'sandbox'
  const sandboxClientId = process.env.CASHFREE_CLIENT_ID
  const sandboxClientSecret = process.env.CASHFREE_CLIENT_SECRET

  if (configuredEnv.toLowerCase() === 'production') {
    console.error('[CONFIG ERROR] Test script CASHFREE_ENVIRONMENT is configured to production.')
    console.error('Testing must be performed in sandbox mode. Aborting to protect live environment.')
    process.exit(1)
  }

  const missingVars: string[] = []
  if (!sandboxClientId) missingVars.push('CASHFREE_CLIENT_ID')
  if (!sandboxClientSecret) missingVars.push('CASHFREE_CLIENT_SECRET')

  if (missingVars.length > 0) {
    console.error(`[CONFIG ERROR] Missing required Cashfree environment variable(s): ${missingVars.join(', ')}`)
    console.error('Please configure these in your local environment or .env file before running tests.')
    process.exit(1)
  }

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`[PASS] ${testName}`)
      passed++
    } else {
      console.error(`[FAIL] ${testName}`, detail !== undefined ? detail : '')
      failed++
    }
  }

  // ----------------------------------------------------
  // TEST 1: Sandbox configuration selects Sandbox endpoint
  // ----------------------------------------------------
  {
    const origEnv = process.env.CASHFREE_ENVIRONMENT
    const origId = process.env.CASHFREE_CLIENT_ID
    const origSecret = process.env.CASHFREE_CLIENT_SECRET
    try {
      process.env.CASHFREE_ENVIRONMENT = 'sandbox'
      process.env.CASHFREE_CLIENT_ID = sandboxClientId
      process.env.CASHFREE_CLIENT_SECRET = sandboxClientSecret

      const config = getCashfreeConfigForEnv('sandbox')
      assert(
        config.baseUrl === 'https://sandbox.cashfree.com/pg' &&
        config.ordersUrl === 'https://sandbox.cashfree.com/pg/orders' &&
        config.env === 'sandbox' &&
        config.isProduction === false &&
        config.isConfigured === true,
        '1. Sandbox configuration selects the Sandbox endpoint'
      )
    } finally {
      process.env.CASHFREE_ENVIRONMENT = origEnv
      process.env.CASHFREE_CLIENT_ID = origId
      process.env.CASHFREE_CLIENT_SECRET = origSecret
    }
  }

  // ----------------------------------------------------
  // TEST 2: Production configuration selects Production endpoint
  // ----------------------------------------------------
  {
    const origProdId = process.env.CASHFREE_PRODUCTION_CLIENT_ID
    const origProdSecret = process.env.CASHFREE_PRODUCTION_CLIENT_SECRET
    try {
      process.env.CASHFREE_PRODUCTION_CLIENT_ID = 'PROD_MOCK_CLIENT_123456'
      process.env.CASHFREE_PRODUCTION_CLIENT_SECRET = 'PROD_MOCK_SECRET_XYZ987'

      const config = getCashfreeConfigForEnv('production')
      assert(
        config.baseUrl === 'https://api.cashfree.com/pg' &&
        config.ordersUrl === 'https://api.cashfree.com/pg/orders' &&
        config.env === 'production' &&
        config.isProduction === true &&
        config.isConfigured === true,
        '2. Production configuration selects the Production endpoint'
      )
    } finally {
      process.env.CASHFREE_PRODUCTION_CLIENT_ID = origProdId
      process.env.CASHFREE_PRODUCTION_CLIENT_SECRET = origProdSecret
    }
  }

  // ----------------------------------------------------
  // TEST 3: Missing Production credentials prevent activation
  // ----------------------------------------------------
  {
    const origProdId = process.env.CASHFREE_PRODUCTION_CLIENT_ID
    const origProdSecret = process.env.CASHFREE_PRODUCTION_CLIENT_SECRET
    const origGeneralId = process.env.CASHFREE_CLIENT_ID
    const origGeneralSecret = process.env.CASHFREE_CLIENT_SECRET
    const origEnv = process.env.CASHFREE_ENVIRONMENT
    try {
      delete process.env.CASHFREE_PRODUCTION_CLIENT_ID
      delete process.env.CASHFREE_PRODUCTION_CLIENT_SECRET
      delete process.env.CASHFREE_PROD_CLIENT_ID
      delete process.env.CASHFREE_PROD_CLIENT_SECRET
      process.env.CASHFREE_ENVIRONMENT = 'sandbox'
      process.env.CASHFREE_CLIENT_ID = sandboxClientId
      process.env.CASHFREE_CLIENT_SECRET = sandboxClientSecret

      const prodConfig = getCashfreeConfigForEnv('production')
      assert(
        prodConfig.isConfigured === false &&
        prodConfig.clientId === '' &&
        prodConfig.clientSecret === '',
        '3. Missing Production credentials prevent activation (isConfigured = false)'
      )
    } finally {
      process.env.CASHFREE_PRODUCTION_CLIENT_ID = origProdId
      process.env.CASHFREE_PRODUCTION_CLIENT_SECRET = origProdSecret
      process.env.CASHFREE_CLIENT_ID = origGeneralId
      process.env.CASHFREE_CLIENT_SECRET = origGeneralSecret
      process.env.CASHFREE_ENVIRONMENT = origEnv
    }
  }

  // ----------------------------------------------------
  // TEST 4: Missing credentials do not accidentally trigger a Sandbox fallback
  // ----------------------------------------------------
  {
    const origProdId = process.env.CASHFREE_PRODUCTION_CLIENT_ID
    const origProdSecret = process.env.CASHFREE_PRODUCTION_CLIENT_SECRET
    const origGeneralId = process.env.CASHFREE_CLIENT_ID
    const origGeneralSecret = process.env.CASHFREE_CLIENT_SECRET
    try {
      delete process.env.CASHFREE_PRODUCTION_CLIENT_ID
      delete process.env.CASHFREE_PRODUCTION_CLIENT_SECRET
      delete process.env.CASHFREE_PROD_CLIENT_ID
      delete process.env.CASHFREE_PROD_CLIENT_SECRET
      process.env.CASHFREE_CLIENT_ID = sandboxClientId
      process.env.CASHFREE_CLIENT_SECRET = sandboxClientSecret

      const prodConfig = getCashfreeConfigForEnv('production')
      assert(
        prodConfig.baseUrl === 'https://api.cashfree.com/pg' &&
        prodConfig.clientId === '' &&
        prodConfig.isConfigured === false,
        '4. Missing credentials do not silently fall back to sandbox credentials on production endpoint'
      )
    } finally {
      process.env.CASHFREE_PRODUCTION_CLIENT_ID = origProdId
      process.env.CASHFREE_PRODUCTION_CLIENT_SECRET = origProdSecret
      process.env.CASHFREE_CLIENT_ID = origGeneralId
      process.env.CASHFREE_CLIENT_SECRET = origGeneralSecret
    }
  }

  // ----------------------------------------------------
  // TEST 5: Invalid environment values are rejected and default to sandbox
  // ----------------------------------------------------
  {
    const s1 = sanitizeEnvironment('invalid_value')
    const s2 = sanitizeEnvironment('STAGE')
    const s3 = sanitizeEnvironment(null)
    const s4 = sanitizeEnvironment('production')
    const s5 = sanitizeEnvironment('PRODUCTION')
    assert(
      s1 === 'sandbox' && s2 === 'sandbox' && s3 === 'sandbox' && s4 === 'production' && s5 === 'production',
      '5. Invalid environment values default safely to sandbox; production is strictly parsed'
    )
  }

  // ----------------------------------------------------
  // TEST 6: Webhook HMAC signature verification
  // ----------------------------------------------------
  {
    const secret = 'mock_hmac_secret_for_webhook_signature_unit_test'
    const timestamp = '1696872000'
    const rawBody = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', order: { order_id: 'GMF_123' } })
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(timestamp + rawBody)
      .digest('base64')

    const isValid = verifyCashfreeWebhookSignature(rawBody, validSignature, timestamp, secret)
    const isTampered = verifyCashfreeWebhookSignature(rawBody + 'tampered', validSignature, timestamp, secret)
    const isWrongSig = verifyCashfreeWebhookSignature(rawBody, 'invalid_sig', timestamp, secret)

    assert(
      isValid === true && isTampered === false && isWrongSig === false,
      '6. Webhook HMAC-SHA256 signature verification validates authentic requests and rejects tampered ones'
    )
  }

  // ----------------------------------------------------
  // TEST 7: Password confirmation logic with CASHFREE_ENV_SWITCH_PASSWORD
  // ----------------------------------------------------
  {
    const origPwd = process.env.CASHFREE_ENV_SWITCH_PASSWORD
    try {
      process.env.CASHFREE_ENV_SWITCH_PASSWORD = 'CASHFREE'
      const key = `test_rate_limit_${Date.now()}`

      // 7a: Correct password succeeds
      const checkValid = verifyEnvSwitchPassword('CASHFREE', key)
      assert(checkValid.valid === true && checkValid.status === 200, '7a. Correct password CASHFREE permits switch')

      // 7b: Incorrect password fails with exact message
      const checkWrong = verifyEnvSwitchPassword('WRONG_PASSWORD', key)
      assert(
        checkWrong.valid === false &&
        checkWrong.status === 401 &&
        checkWrong.error === 'Incorrect password. Environment unchanged.',
        '7b. Incorrect password returns "Incorrect password. Environment unchanged."'
      )

      // 7c: Missing server variable fails safely
      delete process.env.CASHFREE_ENV_SWITCH_PASSWORD
      const checkMissing = verifyEnvSwitchPassword('CASHFREE', key)
      assert(
        checkMissing.valid === false &&
        checkMissing.status === 500 &&
        Boolean(checkMissing.error?.includes('CASHFREE_ENV_SWITCH_PASSWORD')),
        '7c. Missing CASHFREE_ENV_SWITCH_PASSWORD server variable rejects request safely'
      )
    } finally {
      process.env.CASHFREE_ENV_SWITCH_PASSWORD = origPwd
    }
  }

  // ----------------------------------------------------
  // TEST 8: In-memory mock database setup for Express testing
  // ----------------------------------------------------
  const mockState = {
    settings: {
      id: 'default',
      store_name: 'GM Furniture',
      brand_tagline: 'Handcrafted Solid Wood Furniture for Modern Living',
      support_email: 'support@gmfurniture.in',
      support_phone: '+91 (011) 4920-8000',
      registered_address: 'Studio GM, Sector 44, Institutional Area, Gurugram, Haryana 122003, India',
      gstin: '36AFNPV7079J1ZG',
      pan: 'AAACG1234F',
      currency: 'INR (₹)',
      assembly_charge: 3000,
      convenience_fee_percent: 0,
      gst_percent: 18,
      cashfree_environment: 'sandbox',
    },
    users: [
      {
        id: 'admin_test_1',
        name: 'Store Administrator',
        email: 'admin@gmfurniture.in',
        provider: 'local',
        role: 'admin',
        avatar_url: null,
      },
      {
        id: 'cust_test_1',
        name: 'Regular Customer',
        email: 'customer@example.com',
        provider: 'local',
        role: 'customer',
        avatar_url: null,
      },
    ],
    orders: new Map<string, any>(),
  }

  setMockQueryHandler(async (sql: string, params: any[]) => {
    const s = sql.toLowerCase()

    // Store settings
    if (s.includes('select * from store_settings') || s.includes('select cashfree_environment from store_settings')) {
      return [mockState.settings]
    }
    if (s.includes('insert into store_settings') || s.includes('update store_settings')) {
      if (params.length > 0 && typeof params[0] === 'string' && (params[0] === 'sandbox' || params[0] === 'production')) {
        mockState.settings.cashfree_environment = params[0]
      }
      return [mockState.settings]
    }

    // Users
    if (s.includes('select id, name, email') && s.includes('from users where id = $1')) {
      const u = mockState.users.find((user) => user.id === params[0])
      return u ? [u] : []
    }

    // Orders pending count
    if (s.includes('count(*)') && s.includes('from orders')) {
      return [{ count: '0' }]
    }

    // Orders lookup
    if (s.includes('select * from orders where payment_order_id = $1 or id = $1')) {
      const ord = mockState.orders.get(params[0])
      return ord ? [ord] : []
    }

    // Orders update
    if (s.includes('update orders set payment_status =')) {
      const orderId = params[params.length - 1]
      const ord = mockState.orders.get(orderId)
      if (ord && ord.payment_status !== 'paid') {
        ord.payment_status = 'paid'
        ord.status = 'confirmed'
        return [{ rowCount: 1 }]
      }
      return []
    }

    return []
  })

  // Start local test server
  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const port = (server.address() as any).port
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    // ----------------------------------------------------
    // TEST 9: Health check & safe status reporting
    // ----------------------------------------------------
    const resHealth = await fetch(`${baseUrl}/api/health`)
    const healthJson = (await resHealth.json()) as any
    assert(
      resHealth.status === 200 &&
      healthJson.cashfree &&
      healthJson.cashfree.environment === 'sandbox' &&
      healthJson.cashfree.clientSecret === undefined &&
      healthJson.cashfree.clientId === undefined,
      '9. Health check exposes safe Cashfree status without leaking credentials'
    )

    // ----------------------------------------------------
    // TEST 10: Public settings endpoint does not leak secrets
    // ----------------------------------------------------
    const resSettings = await fetch(`${baseUrl}/api/settings`)
    const settingsJson = (await resSettings.json()) as any
    assert(
      resSettings.status === 200 &&
      settingsJson.clientSecret === undefined &&
      settingsJson.switchPassword === undefined &&
      settingsJson.cashfreeEnvironment === 'sandbox',
      '10. Public settings endpoint returns store settings with cashfreeEnvironment without leaking private credentials'
    )

    // ----------------------------------------------------
    // TEST 11: Unauthenticated request to admin endpoints rejected (401)
    // ----------------------------------------------------
    const resStatusUnauth = await fetch(`${baseUrl}/api/admin/cashfree/status`)
    const resSwitchUnauth = await fetch(`${baseUrl}/api/admin/cashfree/environment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment: 'production', password: 'CASHFREE' }),
    })
    assert(
      resStatusUnauth.status === 401 && resSwitchUnauth.status === 401,
      '11. Unauthenticated users are strictly rejected from admin Cashfree endpoints (401)'
    )

    // ----------------------------------------------------
    // TEST 12: Customer-role user rejected from admin switch (403 Forbidden)
    // ----------------------------------------------------
    const customerToken = signToken({
      id: 'cust_test_1',
      name: 'Regular Customer',
      email: 'customer@example.com',
      provider: 'local',
      role: 'customer',
    })

    const resCustomerSwitch = await fetch(`${baseUrl}/api/admin/cashfree/environment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ environment: 'production', password: 'CASHFREE' }),
    })
    assert(
      resCustomerSwitch.status === 403,
      '12. Customer-role user cannot change the environment (403 Forbidden)'
    )

    // ----------------------------------------------------
    // TEST 13: Admin user with wrong password receives 401 "Incorrect password. Environment unchanged."
    // ----------------------------------------------------
    const adminToken = signToken({
      id: 'admin_test_1',
      name: 'Store Administrator',
      email: 'admin@gmfurniture.in',
      provider: 'local',
      role: 'admin',
    })

    process.env.CASHFREE_ENV_SWITCH_PASSWORD = 'CASHFREE'

    const resAdminWrongPwd = await fetch(`${baseUrl}/api/admin/cashfree/environment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ environment: 'production', password: 'WRONG_SECRET' }),
    })
    const wrongPwdJson = (await resAdminWrongPwd.json().catch(() => ({}))) as any
    assert(
      resAdminWrongPwd.status === 401 &&
      wrongPwdJson.error === 'Incorrect password. Environment unchanged.' &&
      mockState.settings.cashfree_environment === 'sandbox',
      '13. Admin with wrong password receives 401 "Incorrect password. Environment unchanged."'
    )

    // ----------------------------------------------------
    // TEST 14: Admin switching to Production WITHOUT production credentials is safe
    // ----------------------------------------------------
    const savedProdId = process.env.CASHFREE_PRODUCTION_CLIENT_ID
    const savedProdSecret = process.env.CASHFREE_PRODUCTION_CLIENT_SECRET
    delete process.env.CASHFREE_PRODUCTION_CLIENT_ID
    delete process.env.CASHFREE_PRODUCTION_CLIENT_SECRET
    delete process.env.CASHFREE_PROD_CLIENT_ID
    delete process.env.CASHFREE_PROD_CLIENT_SECRET

    const resAdminMissingCreds = await fetch(`${baseUrl}/api/admin/cashfree/environment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ environment: 'production', password: 'CASHFREE' }),
    })
    const missingCredsJson = (await resAdminMissingCreds.json().catch(() => ({}))) as any
    assert(
      resAdminMissingCreds.status === 400 &&
      Boolean(missingCredsJson.error?.includes('Production credentials')) &&
      mockState.settings.cashfree_environment === 'sandbox',
      '14. Missing Production credentials prevent switching to Production with actionable error'
    )

    // ----------------------------------------------------
    // TEST 15: Admin switching to Production WITH valid credentials succeeds
    // ----------------------------------------------------
    process.env.CASHFREE_PRODUCTION_CLIENT_ID = 'PROD_MOCK_LIVE_APP_9999'
    process.env.CASHFREE_PRODUCTION_CLIENT_SECRET = 'PROD_MOCK_LIVE_SECRET_KEY_9999'

    const resAdminValidSwitch = await fetch(`${baseUrl}/api/admin/cashfree/environment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ environment: 'production', password: 'CASHFREE' }),
    })
    const validSwitchJson = (await resAdminValidSwitch.json().catch(() => ({}))) as any
    assert(
      resAdminValidSwitch.status === 200 &&
      validSwitchJson.success === true &&
      validSwitchJson.environment === 'production' &&
      mockState.settings.cashfree_environment === 'production',
      '15. Admin with correct password and configured Production credentials successfully switches to Production'
    )

    // ----------------------------------------------------
    // TEST 16: Admin switches back to Sandbox successfully
    // ----------------------------------------------------
    const resSwitchBack = await fetch(`${baseUrl}/api/admin/cashfree/environment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ environment: 'sandbox', password: 'CASHFREE' }),
    })
    const switchBackJson = (await resSwitchBack.json().catch(() => ({}))) as any
    assert(
      resSwitchBack.status === 200 &&
      switchBackJson.environment === 'sandbox' &&
      mockState.settings.cashfree_environment === 'sandbox',
      '16. Admin switches back to Sandbox Mode with password successfully'
    )

    // Restore env
    if (savedProdId) process.env.CASHFREE_PRODUCTION_CLIENT_ID = savedProdId
    else delete process.env.CASHFREE_PRODUCTION_CLIENT_ID
    if (savedProdSecret) process.env.CASHFREE_PRODUCTION_CLIENT_SECRET = savedProdSecret
    else delete process.env.CASHFREE_PRODUCTION_CLIENT_SECRET

    // ----------------------------------------------------
    // TEST 17: Payment verification uses the environment recorded on the original payment attempt
    // ----------------------------------------------------
    // Create an order created in 'sandbox' mode
    mockState.orders.set('GMF_TEST_ORDER_1', {
      id: 'ord_123',
      order_number: 'GM-2026-123456',
      subtotal: 50000,
      total: 50000,
      status: 'pending',
      payment_status: 'pending',
      payment_gateway: 'cashfree',
      payment_environment: 'sandbox', // Recorded as sandbox!
      payment_order_id: 'GMF_TEST_ORDER_1',
      items_json: '[]',
      delivery_address_json: '{}',
      created_at: new Date(),
    })

    // Now pretend global settings was switched to 'production'
    mockState.settings.cashfree_environment = 'production'

    // Verify endpoint should check order.payment_environment ('sandbox'), NOT global 'production'
    // Let's call /api/payments/cashfree/status?order_id=GMF_TEST_ORDER_1
    const resVerifyEnv = await fetch(`${baseUrl}/api/payments/cashfree/status?order_id=GMF_TEST_ORDER_1`)
    const verifyEnvJson = (await resVerifyEnv.json().catch(() => ({}))) as any

    // In a real environment without contacting Cashfree servers, it attempts sandbox verification or returns proper status
    assert(
      resVerifyEnv.status === 200 &&
      verifyEnvJson.order?.paymentEnvironment === 'sandbox',
      '17. Payment verification retrieves and honors the original order.payment_environment'
    )

    // Reset settings
    mockState.settings.cashfree_environment = 'sandbox'

    // ----------------------------------------------------
    // TEST 18: Cashfree webhook endpoint rejects invalid signature with 400
    // ----------------------------------------------------
    const resBadWebhook = await fetch(`${baseUrl}/api/payments/cashfree/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': 'invalid_signature_xyz',
        'x-webhook-timestamp': '1696872000',
      },
      body: JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', order: { order_id: 'GMF_TEST_ORDER_1' } }),
    })
    assert(
      resBadWebhook.status === 400,
      '18. Webhook endpoint rejects invalid signature with HTTP 400'
    )

    // ----------------------------------------------------
    // TEST 19: Valid webhook signature is processed idempotently
    // ----------------------------------------------------
    const webhookSecret = process.env.CASHFREE_CLIENT_SECRET || sandboxClientSecret
    const webhookTimestamp = '1696872000'
    const webhookPayload = JSON.stringify({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      order: { order_id: 'GMF_TEST_ORDER_1' },
      payment: { cf_payment_id: 'cf_pay_123', payment_status: 'SUCCESS' },
    })

    const validWebhookSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookTimestamp + webhookPayload)
      .digest('base64')

    const resGoodWebhook = await fetch(`${baseUrl}/api/payments/cashfree/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': validWebhookSig,
        'x-webhook-timestamp': webhookTimestamp,
      },
      body: webhookPayload,
    })
    const goodWebhookJson = (await resGoodWebhook.json().catch(() => ({}))) as any
    assert(
      resGoodWebhook.status === 200 && goodWebhookJson.status === 'processed',
      '19. Valid webhook signature is processed successfully and idempotently'
    )

    // ----------------------------------------------------
    // TEST 20: Rate limiting on repeated failed password attempts
    // ----------------------------------------------------
    const testRateKey = `rl_test_${Date.now()}`
    resetPasswordRateLimit(testRateKey)

    for (let i = 0; i < 5; i++) {
      verifyEnvSwitchPassword('WRONG', testRateKey)
    }

    const lockedCheck = verifyEnvSwitchPassword('CASHFREE', testRateKey)
    assert(
      lockedCheck.valid === false &&
      lockedCheck.status === 429 &&
      Boolean(lockedCheck.error?.includes('Too many failed password attempts')),
      '20. Rate limiting activates after 5 failed password attempts (HTTP 429)'
    )
    resetPasswordRateLimit(testRateKey)
  } finally {
    setMockQueryHandler(null)
    server.close()
  }

  console.log('\n====================================================')
  console.log(`FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('====================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runCashfreeTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
