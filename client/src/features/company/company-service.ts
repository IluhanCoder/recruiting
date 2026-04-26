import type { CompanyEmployee, CompanyHiringRecord, CompanySummary, CreateCompanyPayload, UpdateCompanyPayload } from './company-types'

const API_BASE_PATH = '/api/companies'

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

export const companyService = {
  list(accessToken: string) {
    return request<{ companies: CompanySummary[] }>('/', accessToken, { method: 'GET' })
  },

  getById(companyId: string, accessToken: string) {
    return request<{ company: CompanySummary }>(`/${companyId}`, accessToken, { method: 'GET' })
  },

  listMine(accessToken: string) {
    return request<{ companies: CompanySummary[] }>('/mine', accessToken, { method: 'GET' })
  },

  getMineById(companyId: string, accessToken: string) {
    return request<{ company: CompanySummary }>(`/mine/${companyId}`, accessToken, { method: 'GET' })
  },

  updateMineById(companyId: string, payload: UpdateCompanyPayload, accessToken: string) {
    return request<{ company: CompanySummary }>(`/mine/${companyId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  create(payload: CreateCompanyPayload, accessToken: string) {
    return request<{ company: CompanySummary }>('/', accessToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getEmployees(companyId: string, accessToken: string) {
    return request<{ employees: CompanyEmployee[] }>(`/${companyId}/employees`, accessToken, {
      method: 'GET',
    })
  },

  getHistory(companyId: string, accessToken: string) {
    return request<{ history: CompanyHiringRecord[] }>(`/${companyId}/history`, accessToken, {
      method: 'GET',
    })
  },
}
