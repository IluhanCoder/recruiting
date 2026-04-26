import type { CreatePositionPayload, PositionSummary, RestorePositionPayload, UpdatePositionPayload } from './position-types'
import { API_BASE } from '../../shared/api-base'

const API_BASE_PATH = `${API_BASE}/api/positions`

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

  return (await response.json()) as T
}

export const positionService = {
  listAll(accessToken: string) {
    return request<{ positions: PositionSummary[] }>('/', accessToken, {
      method: 'GET',
    })
  },

  listByCompany(companyId: string, accessToken: string) {
    return request<{ positions: PositionSummary[] }>(`?companyId=${companyId}`, accessToken, {
      method: 'GET',
    })
  },

  create(payload: CreatePositionPayload, accessToken: string) {
    return request<{ position: PositionSummary }>('/', accessToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  update(positionId: string, payload: UpdatePositionPayload, accessToken: string) {
    return request<{ position: PositionSummary }>(`/${positionId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  restore(positionId: string, payload: RestorePositionPayload, accessToken: string) {
    return request<{ position: PositionSummary }>(`/${positionId}/restore`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },
}
