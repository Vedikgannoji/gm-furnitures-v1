import app from './app'
import { ensureDatabaseInitialized } from './db'

const PORT = process.env.PORT || 3001

ensureDatabaseInitialized()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[GM Furniture API Server] Running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('[GM Furniture API Server] Failed to initialize database:', err)
    // Still start server so developer can see diagnostic endpoints
    app.listen(PORT, () => {
      console.log(`[GM Furniture API Server] Running on http://localhost:${PORT} (database initialization pending)`)
    })
  })
