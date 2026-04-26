import type { ChatMessageSummary, ChatSummary, CreateChatMessagePayload } from './chat-types'
import { API_BASE } from '../../shared/api-base'

const API_BASE_PATH = `${API_BASE}/api/chats`

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

export const chatService = {
  list(accessToken: string) {
    return request<{ chats: ChatSummary[] }>('/', accessToken, { method: 'GET' })
  },

  listMessages(chatId: string, accessToken: string) {
    return request<{ messages: ChatMessageSummary[] }>(`/${chatId}/messages`, accessToken, {
      method: 'GET',
    })
  },

  sendMessage(chatId: string, payload: CreateChatMessagePayload, accessToken: string) {
    return request<{ message: ChatMessageSummary }>(`/${chatId}/messages`, accessToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
