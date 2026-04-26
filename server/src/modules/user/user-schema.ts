import { model, Schema, type HydratedDocument } from 'mongoose'

export const USER_ROLES = ['manager', 'client'] as const

export type UserRole = (typeof USER_ROLES)[number]

export interface CompanyProfile {
  name?: string
  website?: string
  industry?: string
  description?: string
  technologies: string[]
  hiringNeeds: string[]
  rentedSpecialists: number
}

export interface User {
  fullName: string
  email: string
  passwordHash: string
  role: UserRole
  companyId?: string
  companyProfile?: CompanyProfile
  refreshTokenHash: string | null
  lastLoginAt: Date | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type UserDocument = HydratedDocument<User>

const companyProfileSchema = new Schema<CompanyProfile>(
  {
    name: { type: String, trim: true, maxlength: 120 },
    website: { type: String, trim: true, maxlength: 255 },
    industry: { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    technologies: {
      type: [String],
      default: [],
      set: (items: string[]) => items.map((item) => item.trim()).filter(Boolean),
    },
    hiringNeeds: {
      type: [String],
      default: [],
      set: (items: string[]) => items.map((item) => item.trim()).filter(Boolean),
    },
    rentedSpecialists: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
)

const userSchema = new Schema<User>(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'manager' },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: undefined },
    companyProfile: { type: companyProfileSchema, default: undefined },
    refreshTokenHash: { type: String, default: null, select: false },
    lastLoginAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id)
        delete ret._id
        delete ret.passwordHash
        delete ret.refreshTokenHash
        return ret
      },
    },
  },
)

export const UserModel = model<User>('User', userSchema)
