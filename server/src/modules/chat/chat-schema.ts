import { model, Schema, type HydratedDocument, type Types } from 'mongoose'

export interface Chat {
  clientUserId: Types.ObjectId
  lastMessageText?: string
  lastMessageAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type ChatDocument = HydratedDocument<Chat>

const chatSchema = new Schema<Chat>(
  {
    clientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    lastMessageText: { type: String, trim: true, maxlength: 2000 },
    lastMessageAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

chatSchema.index({ lastMessageAt: -1, updatedAt: -1 })

export const ChatModel = model<Chat>('Chat', chatSchema)
