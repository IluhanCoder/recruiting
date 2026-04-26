import type { UserRole } from '../user/user-schema.js'

export interface ChatClientSummary {
  id: string
  fullName: string
  email: string
}

export interface ChatSummary {
  id: string
  client: ChatClientSummary
  lastMessageText?: string
  lastMessageAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessageSenderSummary {
  id: string
  fullName: string
  role: UserRole
}

export interface ChatMessageSummary {
  id: string
  chatId: string
  sender: ChatMessageSenderSummary
  text: string
  createdAt: Date
}

export interface CreateChatMessageRequestBody {
  text: string
}
