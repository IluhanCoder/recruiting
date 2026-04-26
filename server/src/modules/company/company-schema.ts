import { model, Schema, type HydratedDocument, type Types } from 'mongoose'

export interface Company {
  name: string
  website?: string
  industry?: string
  description?: string
  technologies: string[]
  hiringNeeds: string[]
  rentedSpecialists: number
  ownerUserId: Types.ObjectId
  teamMemberIds: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

export type CompanyDocument = HydratedDocument<Company>

const companySchema = new Schema<Company>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
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
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamMemberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

companySchema.index({ name: 1 })
companySchema.index({ ownerUserId: 1 })

export const CompanyModel = model<Company>('Company', companySchema)
