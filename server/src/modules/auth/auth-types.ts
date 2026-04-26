import type { CompanyProfile, UserRole } from '../user/user-schema.js'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: UserRole
  companyId?: string
  companyProfile?: CompanyProfile
}

export interface RegisterRequestBody {
  email: string
  password: string
  fullName: string
  role?: UserRole
  companyProfile?: CompanyProfile
}

export interface LoginRequestBody {
  email: string
  password: string
}

export interface RefreshRequestBody {
  refreshToken: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: AuthUser
  tokens: AuthTokens
}

export interface AccessTokenPayload {
  sub: string
  email: string
  role: UserRole
  tokenType: 'access'
}

export interface RefreshTokenPayload {
  sub: string
  email: string
  role: UserRole
  tokenType: 'refresh'
}
