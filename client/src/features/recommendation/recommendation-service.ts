import type { RecommendedCandidate } from './recommendation-types'

const API_BASE_PATH = '/api/recommendations'

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

export const recommendationService = {
  list(accessToken: string) {
    return request<{ recommendations: RecommendedCandidate[] }>('/', accessToken, {
      method: 'GET',
    })
  },
}
