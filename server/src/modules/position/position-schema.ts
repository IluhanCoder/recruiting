import { model, Schema, type HydratedDocument, type Types } from 'mongoose'

export const POSITION_STATUSES = ['open', 'in_progress', 'closed', 'archived'] as const
export const POSITION_SENIORITIES = ['junior', 'middle', 'senior'] as const

export type PositionStatus = (typeof POSITION_STATUSES)[number]
export type PositionSeniority = (typeof POSITION_SENIORITIES)[number]

export interface Position {
  title: string
  seniority: PositionSeniority
  stack: string[]
  neededFrom: Date
  neededTo?: Date
  isOpenEndedTerm: boolean
  status: PositionStatus
  createdBy: Types.ObjectId
  companyId: Types.ObjectId
  assignedClient?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type PositionDocument = HydratedDocument<Position>

const positionSchema = new Schema<Position>(
  {
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    seniority: { type: String, required: true, enum: POSITION_SENIORITIES },
    stack: {
      type: [String],
      required: true,
      set: (items: string[]) => items.map((item) => item.trim()).filter(Boolean),
    },
    neededFrom: { type: Date, required: true, default: Date.now },
    neededTo: { type: Date },
    isOpenEndedTerm: { type: Boolean, required: true, default: true },
    status: { type: String, enum: POSITION_STATUSES, default: 'open' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    assignedClient: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

positionSchema.index({ status: 1, seniority: 1 })

export const PositionModel = model<Position>('Position', positionSchema)
