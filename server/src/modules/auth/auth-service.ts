import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { HttpError } from '../../shared/http-error.js'
import { UserModel, type UserDocument } from '../user/user-schema.js'

import type {
  AccessTokenPayload,
  AuthResponse,
  AuthUser,
  LoginRequestBody,
  RefreshRequestBody,
  RefreshTokenPayload,
  RegisterRequestBody,
} from './auth-types.js'

const SALT_ROUNDS = 10
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET
const ACCESS_TOKEN_TTL =
  (process.env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn']) ?? '15m'
const REFRESH_TOKEN_TTL =
  (process.env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']) ?? '30d'

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be configured in environment')
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const buildAuthResponse = (user: AuthUser): AuthResponse => {
  const accessTokenPayload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tokenType: 'access',
  }

  const refreshTokenPayload: RefreshTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tokenType: 'refresh',
  }

  const accessToken = jwt.sign(accessTokenPayload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  })
  const refreshToken = jwt.sign(refreshTokenPayload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  })

  return {
    user,
    tokens: {
      accessToken,
      refreshToken,
    },
  }
}

const validateCredentials = (email: string, password: string) => {
  if (!email.trim() || !password.trim()) {
    throw new HttpError(400, 'Email and password are required')
  }

  if (password.length < 6) {
    throw new HttpError(400, 'Password must be at least 6 characters long')
  }
}

const toAuthUser = (user: UserDocument): AuthUser => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  companyId: user.companyId,
  companyProfile: user.companyProfile,
})

const persistRefreshToken = async (user: UserDocument, refreshToken: string) => {
  user.refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS)
  await user.save()
}

export const register = async (payload: RegisterRequestBody): Promise<AuthResponse> => {
  validateCredentials(payload.email, payload.password)

  if (!payload.fullName.trim()) {
    throw new HttpError(400, 'fullName is required')
  }

  const normalizedEmail = normalizeEmail(payload.email)
  const existingUser = await UserModel.findOne({ email: normalizedEmail })
  if (existingUser) {
    throw new HttpError(409, 'User with this email already exists')
  }

  const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS)

  const user = await UserModel.create({
    fullName: payload.fullName.trim(),
    email: normalizedEmail,
    passwordHash,
    role: payload.role ?? 'manager',
    companyProfile: payload.companyProfile,
  })

  const authResponse = buildAuthResponse(toAuthUser(user))
  await persistRefreshToken(user, authResponse.tokens.refreshToken)

  return authResponse
}

export const login = async (payload: LoginRequestBody): Promise<AuthResponse> => {
  if (!payload.email.trim() || !payload.password.trim()) {
    throw new HttpError(400, 'Email and password are required')
  }

  const normalizedEmail = normalizeEmail(payload.email)
  const user = await UserModel.findOne({ email: normalizedEmail }).select('+passwordHash +refreshTokenHash')

  if (!user) {
    throw new HttpError(401, 'Invalid email or password')
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash)
  if (!isPasswordValid) {
    throw new HttpError(401, 'Invalid email or password')
  }

  user.lastLoginAt = new Date()

  const authResponse = buildAuthResponse(toAuthUser(user))
  await persistRefreshToken(user, authResponse.tokens.refreshToken)

  return authResponse
}

export const getCurrentUser = async (accessToken: string | undefined): Promise<AuthUser> => {
  if (!accessToken) {
    throw new HttpError(401, 'Missing authorization token')
  }

  let decoded: AccessTokenPayload
  try {
    decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as AccessTokenPayload
  } catch {
    throw new HttpError(401, 'Invalid authorization token')
  }

  if (decoded.tokenType !== 'access' || !decoded.sub) {
    throw new HttpError(401, 'Invalid token payload')
  }

  const user = await UserModel.findById(decoded.sub)
  if (!user) {
    throw new HttpError(401, 'User not found for provided token')
  }

  return toAuthUser(user)
}

export const refreshSession = async (payload: RefreshRequestBody): Promise<AuthResponse> => {
  const token = payload.refreshToken?.trim()
  if (!token) {
    throw new HttpError(400, 'refreshToken is required')
  }

  let decoded: RefreshTokenPayload
  try {
    decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload
  } catch {
    throw new HttpError(401, 'Invalid refresh token')
  }

  if (decoded.tokenType !== 'refresh' || !decoded.sub) {
    throw new HttpError(401, 'Invalid refresh token payload')
  }

  const user = await UserModel.findById(decoded.sub).select('+refreshTokenHash')
  if (!user || !user.refreshTokenHash) {
    throw new HttpError(401, 'Refresh token is not valid')
  }

  const isRefreshTokenValid = await bcrypt.compare(token, user.refreshTokenHash)
  if (!isRefreshTokenValid) {
    throw new HttpError(401, 'Refresh token is not valid')
  }

  const authResponse = buildAuthResponse(toAuthUser(user))
  await persistRefreshToken(user, authResponse.tokens.refreshToken)

  return authResponse
}
