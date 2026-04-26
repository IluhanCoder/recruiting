import type { CreateSkillPayload, SkillSummary, UpdateSkillPayload } from './skill-types'
import { API_BASE } from '../../shared/api-base'

const API_BASE_PATH = `${API_BASE}/api/skills`

const parseError = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { message?: string }
    return data.message ?? 'Unexpected server response'
  } catch {
    return 'Unexpected server response'
  }
}

const request = async <T>(
  path: string,
  accessToken: string,
  init: Omit<RequestInit, 'headers'>,
): Promise<T> => {
  const response = await fetch(`${API_BASE_PATH}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const message = await parseError(response)
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const skillService = {
  list(accessToken: string) {
    return request<{ skills: SkillSummary[] }>('/', accessToken, { method: 'GET' })
  },

  create(payload: CreateSkillPayload, accessToken: string) {
    return request<{ skill: SkillSummary }>('/', accessToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  update(skillId: string, payload: UpdateSkillPayload, accessToken: string) {
    return request<{ skill: SkillSummary }>(`/${skillId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  remove(skillId: string, accessToken: string) {
    return request<void>(`/${skillId}`, accessToken, { method: 'DELETE' })
  },
}
