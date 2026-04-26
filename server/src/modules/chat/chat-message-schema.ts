import { model, Schema, type HydratedDocument, type Types } from 'mongoose'

import type { UserRole } from '../user/user-schema.js'

export interface ChatMessage {
  chatId: Types.ObjectId
  senderUserId: Types.ObjectId
  senderRole: UserRole
  text: string
  createdAt: Date
  updatedAt: Date
}

export type ChatMessageDocument = HydratedDocument<ChatMessage>

const chatMessageSchema = new Schema<ChatMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['manager', 'client'], required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

chatMessageSchema.index({ chatId: 1, createdAt: 1 })

export const ChatMessageModel = model<ChatMessage>('ChatMessage', chatMessageSchema)
