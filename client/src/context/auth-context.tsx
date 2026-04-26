import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

import { authService } from '../features/auth/auth-service'
import type { AuthResponse } from '../features/auth/auth-types'

const STORAGE_KEY = 'recruiting_auth'

interface AuthContextValue {
  authData: AuthResponse | null
  isInitializing: boolean
  setSession(data: AuthResponse): void
  clearSession(): void
  /** Fetch wrapper that auto-refreshes the access token on 401, then retries once. */
  apiFetch(input: string, init?: RequestInit): Promise<Response>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const loadStoredAuth = (): AuthResponse | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthResponse) : null
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authData, setAuthData] = useState<AuthResponse | null>(loadStoredAuth)
  const [isInitializing, setIsInitializing] = useState<boolean>(() => loadStoredAuth() !== null)
  // Ref to always have latest authData inside apiFetch without re-creating it
  const authDataRef = useRef(authData)
  authDataRef.current = authData

  const setSession = useCallback((data: AuthResponse) => {
    setAuthData(data)
    authDataRef.current = data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [])

  const clearSession = useCallback(() => {
    setAuthData(null)
    authDataRef.current = null
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // On mount: if we have stored tokens, verify the access token.
  // If it's expired (401), attempt a silent refresh. If refresh also fails, clear the session.
  useEffect(() => {
    const stored = loadStoredAuth()
    if (!stored) {
      setIsInitializing(false)
      return
    }

    authService
      .me(stored.tokens.accessToken)
      .then(() => {
        // Token still valid — nothing to do
      })
      .catch(async () => {
        try {
          const refreshed = await authService.refresh(stored.tokens.refreshToken)
          setSession(refreshed)
        } catch {
          clearSession()
        }
      })
      .finally(() => {
        setIsInitializing(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Drop-in replacement for fetch() that:
   * 1. Injects the Authorization header automatically
   * 2. On 401, silently refreshes the token and retries once
   * 3. On refresh failure, clears the session (user is sent to login)
   */
  const apiFetch = useCallback(async (input: string, init: RequestInit = {}): Promise<Response> => {
    const current = authDataRef.current

    const doFetch = (token: string) =>
      fetch(input, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
          Authorization: `Bearer ${token}`,
        },
      })

    if (!current) return doFetch('')

    const response = await doFetch(current.tokens.accessToken)

    if (response.status !== 401) return response

    // Access token rejected — try to refresh
    try {
      const refreshed = await authService.refresh(current.tokens.refreshToken)
      setSession(refreshed)
      return doFetch(refreshed.tokens.accessToken)
    } catch {
      clearSession()
      return response // caller will see 401
    }
  }, [setSession, clearSession])

  return (
    <AuthContext.Provider value={{ authData, isInitializing, setSession, clearSession, apiFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
