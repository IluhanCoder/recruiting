import mongoose from 'mongoose'

import { HttpError } from '../../shared/http-error.js'
import type { AuthUser } from '../auth/auth-types.js'
import { CompanyModel } from '../company/company-schema.js'
import { SkillModel } from '../skill/skill-schema.js'
import { PositionModel } from './position-schema.js'
import type {
  CreatePositionRequestBody,
  PositionSummary,
  RestorePositionRequestBody,
  UpdatePositionRequestBody,
} from './position-types.js'

const toSummary = (position: Awaited<ReturnType<(typeof PositionModel)['findOne']>>): PositionSummary => {
  if (!position) {
    throw new HttpError(404, 'Position not found')
  }

  return {
    id: position.id,
    title: position.title,
    seniority: position.seniority,
    stack: position.stack,
    neededFrom: position.neededFrom,
    neededTo: position.neededTo,
    isOpenEndedTerm: position.isOpenEndedTerm,
    status: position.status,
    companyId: String(position.companyId),
    assignedClientId: position.assignedClient ? String(position.assignedClient) : undefined,
  }
}

const normalizeStack = (stack: string[]) =>
  stack
    .map((item) => item.trim())
    .filter(Boolean)

const validateStackAgainstSkillBase = async (stack: string[]) => {
  const normalized = normalizeStack(stack)
  if (!normalized.length) {
    throw new HttpError(400, 'stack should contain at least one technology')
  }

  const uniqueLower = [...new Set(normalized.map((item) => item.toLowerCase()))]
  const existing = await SkillModel.find({ nameLower: { $in: uniqueLower } }).select('nameLower')
  const existingLower = new Set(existing.map((skill) => skill.nameLower))
  const missing = uniqueLower.filter((item) => !existingLower.has(item))

  if (missing.length) {
    throw new HttpError(400, `Unknown skills: ${missing.join(', ')}`)
  }

  return normalized
}

export const listPositions = async (
  authUser: AuthUser,
  companyId?: string,
): Promise<PositionSummary[]> => {
  const query: Record<string, unknown> = {}

  if (companyId?.trim()) {
    if (!mongoose.isValidObjectId(companyId)) {
      throw new HttpError(400, 'companyId must be a valid object id')
    }

    const companyQuery =
      authUser.role === 'manager' ? { _id: companyId } : { _id: companyId, ownerUserId: authUser.id }

    const company = await CompanyModel.findOne(companyQuery)
    if (!company) {
      throw new HttpError(404, 'Company not found')
    }

    query.companyId = company.id
  } else if (authUser.role === 'client') {
    const myCompanies = await CompanyModel.find({ ownerUserId: authUser.id }).select('_id')
    query.companyId = { $in: myCompanies.map((company) => company._id) }
  }

  const positions = await PositionModel.find(query).sort({ createdAt: -1 })

  return positions.map((position) => toSummary(position))
}

export const createPosition = async (
  payload: CreatePositionRequestBody,
  authUser: AuthUser,
): Promise<PositionSummary> => {
  if (!payload.title?.trim()) {
    throw new HttpError(400, 'title is required')
  }

  if (!Array.isArray(payload.stack) || payload.stack.length === 0) {
    throw new HttpError(400, 'stack should contain at least one technology')
  }

  const validatedStack = await validateStackAgainstSkillBase(payload.stack)

  const neededFrom = new Date(payload.neededFrom)
  if (Number.isNaN(neededFrom.getTime())) {
    throw new HttpError(400, 'neededFrom must be a valid date')
  }

  const isOpenEndedTerm = Boolean(payload.isOpenEndedTerm)
  let neededTo: Date | undefined

  if (!isOpenEndedTerm) {
    if (!payload.neededTo) {
      throw new HttpError(400, 'neededTo is required when term is not open-ended')
    }

    neededTo = new Date(payload.neededTo)
    if (Number.isNaN(neededTo.getTime())) {
      throw new HttpError(400, 'neededTo must be a valid date')
    }

    if (neededTo < neededFrom) {
      throw new HttpError(400, 'neededTo must be greater than or equal to neededFrom')
    }
  }

  const companyId = payload.companyId?.trim()
  if (!companyId || !mongoose.isValidObjectId(companyId)) {
    throw new HttpError(400, 'companyId must be a valid object id')
  }

  const company = await CompanyModel.findOne({ _id: companyId, ownerUserId: authUser.id })
  if (!company) {
    throw new HttpError(404, 'Company not found')
  }

  const assignedClient = payload.assignedClientId?.trim()
  if (assignedClient && !mongoose.isValidObjectId(assignedClient)) {
    throw new HttpError(400, 'assignedClientId must be a valid object id')
  }

  const createdPosition = await PositionModel.create({
    title: payload.title.trim(),
    seniority: payload.seniority,
    stack: validatedStack,
    neededFrom,
    neededTo,
    isOpenEndedTerm,
    createdBy: authUser.id,
    companyId: company.id,
    assignedClient: assignedClient ?? authUser.id,
  })

  return toSummary(createdPosition)
}

export const updatePosition = async (
  positionId: string,
  payload: UpdatePositionRequestBody,
  authUser: AuthUser,
): Promise<PositionSummary> => {
  if (!positionId || !mongoose.isValidObjectId(positionId)) {
    throw new HttpError(400, 'positionId must be a valid object id')
  }

  const position = await PositionModel.findById(positionId)
  if (!position) {
    throw new HttpError(404, 'Position not found')
  }

  const company = await CompanyModel.findOne({ _id: position.companyId, ownerUserId: authUser.id })
  if (!company) {
    throw new HttpError(404, 'Company not found')
  }

  const nextTitle = payload.title?.trim()
  if (payload.title !== undefined && !nextTitle) {
    throw new HttpError(400, 'title is required')
  }

  const nextStack = payload.stack?.map((item) => item.trim()).filter(Boolean)
  if (payload.stack !== undefined && (!nextStack || nextStack.length === 0)) {
    throw new HttpError(400, 'stack should contain at least one technology')
  }

  const validatedStack = payload.stack ? await validateStackAgainstSkillBase(payload.stack) : undefined

  const neededFrom =
    payload.neededFrom !== undefined ? new Date(payload.neededFrom) : new Date(position.neededFrom)
  if (Number.isNaN(neededFrom.getTime())) {
    throw new HttpError(400, 'neededFrom must be a valid date')
  }

  const isOpenEndedTerm = payload.isOpenEndedTerm ?? position.isOpenEndedTerm
  let neededTo: Date | undefined

  if (isOpenEndedTerm) {
    neededTo = undefined
  } else {
    const sourceNeededTo = payload.neededTo ?? position.neededTo?.toISOString()
    if (!sourceNeededTo) {
      throw new HttpError(400, 'neededTo is required when term is not open-ended')
    }

    neededTo = new Date(sourceNeededTo)
    if (Number.isNaN(neededTo.getTime())) {
      throw new HttpError(400, 'neededTo must be a valid date')
    }

    if (neededTo < neededFrom) {
      throw new HttpError(400, 'neededTo must be greater than or equal to neededFrom')
    }
  }

  position.title = nextTitle ?? position.title
  position.seniority = payload.seniority ?? position.seniority
  position.stack = validatedStack ?? position.stack
  position.neededFrom = neededFrom
  position.neededTo = neededTo
  position.isOpenEndedTerm = isOpenEndedTerm

  await position.save()

  return toSummary(position)
}

export const restorePosition = async (
  positionId: string,
  payload: RestorePositionRequestBody,
  authUser: AuthUser,
): Promise<PositionSummary> => {
  if (!positionId || !mongoose.isValidObjectId(positionId)) {
    throw new HttpError(400, 'positionId must be a valid object id')
  }

  const position = await PositionModel.findById(positionId)
  if (!position) {
    throw new HttpError(404, 'Position not found')
  }

  if (position.status !== 'archived') {
    throw new HttpError(409, 'Only archived positions can be restored')
  }

  const company = await CompanyModel.findOne({ _id: position.companyId, ownerUserId: authUser.id })
  if (!company) {
    throw new HttpError(404, 'Company not found')
  }

  const neededFrom = new Date(payload.neededFrom)
  if (Number.isNaN(neededFrom.getTime())) {
    throw new HttpError(400, 'neededFrom must be a valid date')
  }

  const isOpenEndedTerm = Boolean(payload.isOpenEndedTerm)
  let neededTo: Date | undefined

  if (!isOpenEndedTerm) {
    if (!payload.neededTo) {
      throw new HttpError(400, 'neededTo is required when term is not open-ended')
    }
    neededTo = new Date(payload.neededTo)
    if (Number.isNaN(neededTo.getTime())) {
      throw new HttpError(400, 'neededTo must be a valid date')
    }
    if (neededTo < neededFrom) {
      throw new HttpError(400, 'neededTo must be greater than or equal to neededFrom')
    }
  }

  position.status = 'open'
  position.neededFrom = neededFrom
  position.neededTo = neededTo
  position.isOpenEndedTerm = isOpenEndedTerm

  await position.save()

  return toSummary(position)
}
