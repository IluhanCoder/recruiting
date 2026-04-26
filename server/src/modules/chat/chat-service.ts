import mongoose from 'mongoose'

import { HttpError } from '../../shared/http-error.js'
import type { AuthUser } from '../auth/auth-types.js'
import { UserModel } from '../user/user-schema.js'
import { ChatMessageModel } from './chat-message-schema.js'
import type { ChatDocument } from './chat-schema.js'
import { ChatModel } from './chat-schema.js'
import type {
  ChatMessageSummary,
  ChatSummary,
  CreateChatMessageRequestBody,
} from './chat-types.js'

const ensureClientChat = async (clientUserId: string) => {
  return ChatModel.findOneAndUpdate(
    { clientUserId },
    { $setOnInsert: { clientUserId } },
    { new: true, upsert: true },
  )
}

const assertCanAccessChat = (chat: ChatDocument | null, authUser: AuthUser) => {
  if (!chat) {
    throw new HttpError(404, 'Chat not found')
  }

  if (authUser.role === 'manager') {
    return
  }

  if (String(chat.clientUserId) !== authUser.id) {
    throw new HttpError(403, 'Forbidden')
  }
}

const mapChatsWithClient = async (
  chats: Awaited<ReturnType<typeof ChatModel.find>>,
): Promise<ChatSummary[]> => {
  const clientIds = [...new Set(chats.map((chat) => String(chat.clientUserId)))]
  const clients = await UserModel.find({ _id: { $in: clientIds } }).select('fullName email')
  const clientById = new Map(clients.map((client) => [client.id, client]))

  const result: ChatSummary[] = []

  for (const chat of chats) {
    const client = clientById.get(String(chat.clientUserId))
    if (!client) {
      continue
    }

    result.push({
      id: chat.id,
      client: {
        id: client.id,
        fullName: client.fullName,
        email: client.email,
      },
      lastMessageText: chat.lastMessageText,
      lastMessageAt: chat.lastMessageAt,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    })
  }

  return result
}

const mapMessages = async (
  messages: Awaited<ReturnType<typeof ChatMessageModel.find>>,
): Promise<ChatMessageSummary[]> => {
  const senderIds = [...new Set(messages.map((message) => String(message.senderUserId)))]
  const users = await UserModel.find({ _id: { $in: senderIds } }).select('fullName role')
  const usersById = new Map(users.map((user) => [user.id, user]))

  const result: ChatMessageSummary[] = []

  for (const message of messages) {
    const sender = usersById.get(String(message.senderUserId))
    if (!sender) {
      continue
    }

    result.push({
      id: message.id,
      chatId: String(message.chatId),
      sender: {
        id: sender.id,
        fullName: sender.fullName,
        role: sender.role,
      },
      text: message.text,
      createdAt: message.createdAt,
    })
  }

  return result
}

export const listChats = async (authUser: AuthUser): Promise<ChatSummary[]> => {
  if (authUser.role === 'client') {
    const chat = await ensureClientChat(authUser.id)
    return mapChatsWithClient(chat ? [chat] : [])
  }

  const clients = await UserModel.find({ role: 'client', isActive: true }).select('_id')
  if (clients.length) {
    await ChatModel.bulkWrite(
      clients.map((client) => ({
        updateOne: {
          filter: { clientUserId: client._id },
          update: { $setOnInsert: { clientUserId: client._id } },
          upsert: true,
        },
      })),
      { ordered: false },
    )
  }

  const chats = await ChatModel.find().sort({ lastMessageAt: -1, updatedAt: -1 })
  return mapChatsWithClient(chats)
}

export const listChatMessages = async (
  chatId: string,
  authUser: AuthUser,
): Promise<ChatMessageSummary[]> => {
  if (!mongoose.isValidObjectId(chatId)) {
    throw new HttpError(400, 'chatId must be a valid object id')
  }

  const chat = await ChatModel.findById(chatId)
  assertCanAccessChat(chat, authUser)

  const messages = await ChatMessageModel.find({ chatId }).sort({ createdAt: 1 })
  return mapMessages(messages)
}

export const createChatMessage = async (
  chatId: string,
  payload: CreateChatMessageRequestBody,
  authUser: AuthUser,
): Promise<ChatMessageSummary> => {
  if (!mongoose.isValidObjectId(chatId)) {
    throw new HttpError(400, 'chatId must be a valid object id')
  }

  const text = String(payload.text ?? '').trim()
  if (!text) {
    throw new HttpError(400, 'text is required')
  }

  const chat = await ChatModel.findById(chatId)
  assertCanAccessChat(chat, authUser)

  const message = await ChatMessageModel.create({
    chatId,
    senderUserId: authUser.id,
    senderRole: authUser.role,
    text,
  })

  await ChatModel.findByIdAndUpdate(chatId, {
    $set: {
      lastMessageText: text,
      lastMessageAt: message.createdAt,
    },
  })

  const created = await mapMessages([message])
  if (!created.length) {
    throw new HttpError(500, 'Failed to create message')
  }

  return created[0]
}
