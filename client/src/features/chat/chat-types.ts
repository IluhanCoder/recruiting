export interface ChatClientSummary {
  id: string
  fullName: string
  email: string
}

export interface ChatSummary {
  id: string
  client: ChatClientSummary
  lastMessageText?: string
  lastMessageAt?: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessageSenderSummary {
  id: string
  fullName: string
  role: 'manager' | 'client'
}

export interface ChatMessageSummary {
  id: string
  chatId: string
  sender: ChatMessageSenderSummary
  text: string
  createdAt: string
}

export interface CreateChatMessagePayload {
  text: string
}
