import mongoose from 'mongoose'

import { HttpError } from '../../shared/http-error.js'
import { SkillModel } from './skill-schema.js'
import type { CreateSkillRequestBody, SkillSummary, UpdateSkillRequestBody } from './skill-types.js'

const normalizeSkillName = (name: string) => name.trim()

const toSummary = (skill: Awaited<ReturnType<(typeof SkillModel)['findOne']>>): SkillSummary => {
  if (!skill) {
    throw new HttpError(404, 'Skill not found')
  }

  return {
    id: skill.id,
    name: skill.name,
  }
}

export const listSkills = async (): Promise<SkillSummary[]> => {
  const skills = await SkillModel.find().sort({ nameLower: 1 })
  return skills.map((skill) => toSummary(skill))
}

export const createSkill = async (payload: CreateSkillRequestBody): Promise<SkillSummary> => {
  const name = normalizeSkillName(payload.name ?? '')
  if (!name) {
    throw new HttpError(400, 'name is required')
  }

  const nameLower = name.toLowerCase()
  const exists = await SkillModel.findOne({ nameLower })
  if (exists) {
    throw new HttpError(409, 'Skill already exists')
  }

  const skill = await SkillModel.create({ name, nameLower })
  return toSummary(skill)
}

export const updateSkill = async (
  skillId: string,
  payload: UpdateSkillRequestBody,
): Promise<SkillSummary> => {
  if (!mongoose.isValidObjectId(skillId)) {
    throw new HttpError(400, 'skillId must be a valid object id')
  }

  const skill = await SkillModel.findById(skillId)
  if (!skill) {
    throw new HttpError(404, 'Skill not found')
  }

  const name = normalizeSkillName(payload.name ?? '')
  if (!name) {
    throw new HttpError(400, 'name is required')
  }

  const nameLower = name.toLowerCase()
  const existing = await SkillModel.findOne({ nameLower, _id: { $ne: skillId } })
  if (existing) {
    throw new HttpError(409, 'Skill already exists')
  }

  skill.name = name
  skill.nameLower = nameLower
  await skill.save()

  return toSummary(skill)
}

export const deleteSkill = async (skillId: string): Promise<void> => {
  if (!mongoose.isValidObjectId(skillId)) {
    throw new HttpError(400, 'skillId must be a valid object id')
  }

  const deleted = await SkillModel.findByIdAndDelete(skillId)
  if (!deleted) {
    throw new HttpError(404, 'Skill not found')
  }
}
