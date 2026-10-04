import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import { db } from './db'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'gm_atelier_fallback_jwt_secret_dev'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || ''

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

export interface AuthUser {
  id: string
  name: string
  email: string
  provider: string
  role?: string
  avatar_url?: string
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      role: user.role || 'customer',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch {
    return null
  }
}

export function verifyAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  verifyAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required.' })
    }
    next()
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function verifyGoogleToken(credential: string): Promise<{
  email: string
  name: string
  sub: string
  picture?: string
}> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is not configured in the server environment.')
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload || !payload.email) {
    throw new Error('Invalid Google credential payload')
  }

  return {
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    sub: payload.sub,
    picture: payload.picture,
  }
}

/**
 * Strict authentication middleware:
 * Ensures the request comes from an authenticated user.
 * Attaches req.user strictly from verified server-side JWT session.
 */
export function verifyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' })
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' })
  }

  // Verify user still exists in database
  const user = db.prepare('SELECT id, name, email, provider, role, avatar_url FROM users WHERE id = ?').get(decoded.id) as AuthUser | undefined

  if (!user) {
    return res.status(401).json({ error: 'User account no longer exists.' })
  }

  req.user = user
  next()
}

/**
 * Optional authentication middleware:
 * If a valid token is present, populates req.user.
 * Does not block if no token or expired token.
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (decoded) {
      const user = db.prepare('SELECT id, name, email, provider, role, avatar_url FROM users WHERE id = ?').get(decoded.id) as AuthUser | undefined
      if (user) {
        req.user = user
      }
    }
  }
  next()
}
