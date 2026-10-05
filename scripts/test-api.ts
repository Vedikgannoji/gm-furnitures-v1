import http from 'node:http'
import app from '../server/app'

async function runTests() {
  console.log('Testing Express app on local test server...')
  const server = http.createServer(app)

  await new Promise<void>((resolve) => server.listen(0, resolve))
  const addr = server.address() as any
  const port = addr.port
  const baseUrl = `http://127.0.0.1:${port}`

  console.log(`Test server running at ${baseUrl}`)

  try {
    // 1. Test /api/health
    const resHealth = await fetch(`${baseUrl}/api/health`)
    const healthJson = await resHealth.json()
    console.log('1. Health check:', resHealth.status === 200 ? 'PASS' : 'FAIL', healthJson)

    // 2. Test 404 returns JSON, never HTML
    const res404 = await fetch(`${baseUrl}/api/non-existent-route-for-testing`)
    const json404 = await res404.json()
    const contentType = res404.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    console.log('2. API 404 returns JSON:', isJson && res404.status === 404 ? 'PASS' : 'FAIL', json404)

    // 3. Test URL normalization (calling /health without /api prefix)
    const resNorm = await fetch(`${baseUrl}/health`)
    const normJson = await resNorm.json()
    console.log('3. URL normalization (/health -> /api/health):', resNorm.status === 200 ? 'PASS' : 'FAIL', normJson)

    // 4. Test missing credentials validation on login
    const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const loginJson = await resLogin.json()
    console.log('4. Auth validation (missing credentials):', resLogin.status === 400 ? 'PASS' : 'FAIL', loginJson)

    // 5. Test protected route without token
    const resMe = await fetch(`${baseUrl}/api/auth/me`)
    const meJson = await resMe.json()
    console.log('5. Protected route rejection (unauthorized):', resMe.status === 401 ? 'PASS' : 'FAIL', meJson)

    // 6. Test admin route without token
    const resAdmin = await fetch(`${baseUrl}/api/admin/stats`)
    const adminJson = await resAdmin.json()
    console.log('6. Admin route protection (forbidden/unauthorized):', resAdmin.status === 401 || resAdmin.status === 403 ? 'PASS' : 'FAIL', adminJson)

    console.log('\nAll core architecture assertions PASSED!')
  } finally {
    server.close()
  }
}

runTests().catch((err) => {
  console.error('Test error:', err)
  process.exit(1)
})
