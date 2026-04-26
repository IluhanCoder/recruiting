import { model, Schema, type HydratedDocument } from 'mongoose'

export interface Skill {
  name: string
  nameLower: string
  createdAt: Date
  updatedAt: Date
}

export type SkillDocument = HydratedDocument<Skill>

const skillSchema = new Schema<Skill>(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    nameLower: { type: String, required: true, unique: true, trim: true, lowercase: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

export const SkillModel = model<Skill>('Skill', skillSchema)
