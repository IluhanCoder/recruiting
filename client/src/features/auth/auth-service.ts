import type { AuthResponse, LoginPayload, RegisterPayload } from './auth-types'
import { API_BASE } from '../../shared/api-base'

const API_BASE_PATH = `${API_BASE}/api/auth`

const parseError = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { message?: string }
    return data.message ?? 'Unexpected server response'
  } catch {
    return 'Unexpected server response'
  }
}

const request = async <T>(path: string, init: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_PATH}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const message = await parseError(response)
    throw new Error(message)
  }

  return (await response.json()) as T
}

export const authService = {
  register(payload: RegisterPayload) {
    return request<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  login(payload: LoginPayload) {
    return request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  me(accessToken: string) {
    return request<{ user: AuthResponse['user'] }>('/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  },

  refresh(refreshToken: string) {
    return request<AuthResponse>('/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  },
}
