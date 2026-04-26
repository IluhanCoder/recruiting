import { HttpError } from '../../shared/http-error.js'
import type { AuthUser } from '../auth/auth-types.js'
import { UserModel } from '../user/user-schema.js'
import { CandidateModel } from '../candidate/candidate-schema.js'
import { PositionModel } from '../position/position-schema.js'
import { CandidateBookingModel } from '../booking/booking-schema.js'

import { CompanyModel } from './company-schema.js'
import type {
  CompanyEmployee,
  CompanyHiringRecord,
  CompanySummary,
  CreateCompanyRequestBody,
  UpdateCompanyRequestBody,
} from './company-types.js'

const toSummary = (
  company: Awaited<ReturnType<(typeof CompanyModel)['findOne']>>,
  owner?: { fullName: string; email: string } | null,
): CompanySummary => {
  if (!company) {
    throw new HttpError(404, 'Company not found')
  }

  return {
    id: company.id,
    name: company.name,
    website: company.website,
    industry: company.industry,
    description: company.description,
    technologies: company.technologies,
    hiringNeeds: company.hiringNeeds,
    rentedSpecialists: company.rentedSpecialists,
    ownerUserId: String(company.ownerUserId),
    ownerName: owner?.fullName,
    ownerEmail: owner?.email,
    teamSize: company.teamMemberIds.length,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  }
}

const resolveMyCompany = async (authUser: AuthUser) => {
  const user = await UserModel.findById(authUser.id)
  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  if (user.companyId) {
    const company = await CompanyModel.findById(user.companyId)
    if (!company) {
      throw new HttpError(404, 'Linked company not found')
    }

    return { user, company }
  }

  const company = await CompanyModel.findOne({ teamMemberIds: user.id })
  if (company) {
    user.companyId = company.id
    await user.save()
    return { user, company }
  }

  throw new HttpError(404, 'Company is not created for this user')
}

export const listCompanies = async (): Promise<CompanySummary[]> => {
  const companies = await CompanyModel.find().sort({ createdAt: -1 })
  const ownerIds = companies.map((c) => c.ownerUserId)
  const owners = await UserModel.find({ _id: { $in: ownerIds } }).select('fullName email')
  const ownerMap = new Map(owners.map((o) => [String(o._id), o]))
  return companies.map((c) => toSummary(c, ownerMap.get(String(c.ownerUserId))))
}

export const listMyCompanies = async (authUser: AuthUser): Promise<CompanySummary[]> => {
  const companies = await CompanyModel.find({ ownerUserId: authUser.id }).sort({ createdAt: -1 })
  return companies.map((c) => toSummary(c))
}

export const getMyCompanyById = async (
  authUser: AuthUser,
  companyId: string,
): Promise<CompanySummary> => {
  const company = await CompanyModel.findOne({ _id: companyId, ownerUserId: authUser.id })
  if (!company) {
    throw new HttpError(404, 'Company not found')
  }

  return toSummary(company)
}

export const getCompanyById = async (companyId: string): Promise<CompanySummary> => {
  const company = await CompanyModel.findById(companyId)
  if (!company) {
    throw new HttpError(404, 'Company not found')
  }

  const owner = await UserModel.findById(company.ownerUserId).select('fullName email')
  return toSummary(company, owner)
}

export const createCompany = async (
  authUser: AuthUser,
  payload: CreateCompanyRequestBody,
): Promise<CompanySummary> => {
  if (!payload.name?.trim()) {
    throw new HttpError(400, 'name is required')
  }

  const company = await CompanyModel.create({
    name: payload.name.trim(),
    website: payload.website?.trim(),
    industry: payload.industry?.trim(),
    description: payload.description?.trim(),
    technologies: payload.technologies ?? [],
    hiringNeeds: payload.hiringNeeds ?? [],
    ownerUserId: authUser.id,
    teamMemberIds: [],
  })

  return toSummary(company)
}

export const createMyCompany = async (
  authUser: AuthUser,
  payload: CreateCompanyRequestBody,
): Promise<CompanySummary> => {
  if (!payload.name?.trim()) {
    throw new HttpError(400, 'name is required')
  }

  const user = await UserModel.findById(authUser.id)
  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  if (user.companyId) {
    throw new HttpError(409, 'User already belongs to a company')
  }

  const company = await CompanyModel.create({
    name: payload.name.trim(),
    website: payload.website?.trim(),
    industry: payload.industry?.trim(),
    description: payload.description?.trim(),
    technologies: payload.technologies ?? [],
    hiringNeeds: payload.hiringNeeds ?? [],
    ownerUserId: user.id,
    teamMemberIds: [user.id],
  })

  user.companyId = company.id
  user.companyProfile = {
    name: company.name,
    website: company.website,
    industry: company.industry,
    description: company.description,
    technologies: company.technologies,
    hiringNeeds: company.hiringNeeds,
    rentedSpecialists: company.rentedSpecialists,
  }
  await user.save()

  return toSummary(company)
}

export const getMyCompany = async (authUser: AuthUser): Promise<CompanySummary> => {
  const { company } = await resolveMyCompany(authUser)
  return toSummary(company)
}

export const updateMyCompany = async (
  authUser: AuthUser,
  payload: UpdateCompanyRequestBody,
): Promise<CompanySummary> => {
  const { user, company } = await resolveMyCompany(authUser)

  if (payload.name !== undefined) {
    company.name = payload.name.trim()
  }
  if (payload.website !== undefined) {
    company.website = payload.website.trim()
  }
  if (payload.industry !== undefined) {
    company.industry = payload.industry.trim()
  }
  if (payload.description !== undefined) {
    company.description = payload.description.trim()
  }
  if (payload.technologies !== undefined) {
    company.technologies = payload.technologies
  }
  if (payload.hiringNeeds !== undefined) {
    company.hiringNeeds = payload.hiringNeeds
  }
  if (payload.rentedSpecialists !== undefined) {
    company.rentedSpecialists = payload.rentedSpecialists
  }

  await company.save()

  user.companyProfile = {
    name: company.name,
    website: company.website,
    industry: company.industry,
    description: company.description,
    technologies: company.technologies,
    hiringNeeds: company.hiringNeeds,
    rentedSpecialists: company.rentedSpecialists,
  }
  await user.save()

  return toSummary(company)
}

export const updateMyCompanyById = async (
  authUser: AuthUser,
  companyId: string,
  payload: UpdateCompanyRequestBody,
): Promise<CompanySummary> => {
  const company = await CompanyModel.findOne({ _id: companyId, ownerUserId: authUser.id })
  if (!company) {
    throw new HttpError(404, 'Company not found')
  }

  if (payload.name !== undefined) {
    company.name = payload.name.trim()
  }
  if (payload.website !== undefined) {
    company.website = payload.website.trim()
  }
  if (payload.industry !== undefined) {
    company.industry = payload.industry.trim()
  }
  if (payload.description !== undefined) {
    company.description = payload.description.trim()
  }
  if (payload.technologies !== undefined) {
    company.technologies = payload.technologies
  }
  if (payload.hiringNeeds !== undefined) {
    company.hiringNeeds = payload.hiringNeeds
  }
  if (payload.rentedSpecialists !== undefined) {
    company.rentedSpecialists = payload.rentedSpecialists
  }

  await company.save()
  return toSummary(company)
}

export const getCompanyEmployees = async (companyId: string): Promise<CompanyEmployee[]> => {
  if (!companyId) {
    throw new HttpError(400, 'companyId is required')
  }

  const positions = await PositionModel.find({ companyId }).select('title seniority').lean()
  if (!positions.length) return []

  const positionIds = positions.map((p) => p._id)
  const positionMap = new Map(
    positions.map((p) => [String(p._id), { title: p.title, seniority: p.seniority }]),
  )

  const bookings = await CandidateBookingModel.find({
    positionId: { $in: positionIds },
    status: 'approved',
  })
    .select('candidateId positionId requestedFrom requestedTo')
    .lean()

  if (!bookings.length) return []

  const candidateIds = [...new Set(bookings.map((b) => String(b.candidateId)))]
  const candidates = await CandidateModel.find({ _id: { $in: candidateIds } })
    .select('fullName')
    .lean()
  const candidateMap = new Map(candidates.map((c) => [String(c._id), c.fullName]))

  return bookings.map((b) => {
    const pos = positionMap.get(String(b.positionId))
    return {
      bookingId: String(b._id),
      candidateId: String(b.candidateId),
      candidateName: candidateMap.get(String(b.candidateId)) ?? 'Невідомий кандидат',
      positionId: String(b.positionId),
      positionTitle: pos?.title ?? 'Невідома посада',
      positionSeniority: pos?.seniority ?? '',
      requestedFrom: b.requestedFrom,
      requestedTo: b.requestedTo,
    }
  })
}

export const getCompanyHiringHistory = async (companyId: string): Promise<CompanyHiringRecord[]> => {
  if (!companyId) {
    throw new HttpError(400, 'companyId is required')
  }

  const positions = await PositionModel.find({ companyId }).select('title seniority').lean()
  if (!positions.length) return []

  const positionIds = positions.map((p) => p._id)
  const positionMap = new Map(
    positions.map((p) => [String(p._id), { title: p.title, seniority: p.seniority }]),
  )

  const bookings = await CandidateBookingModel.find({
    positionId: { $in: positionIds },
    status: 'completed',
  })
    .select('candidateId positionId requestedFrom requestedTo')
    .sort({ requestedTo: -1 })
    .lean()

  if (!bookings.length) return []

  const candidateIds = [...new Set(bookings.map((b) => String(b.candidateId)))]
  const candidates = await CandidateModel.find({ _id: { $in: candidateIds } })
    .select('fullName')
    .lean()
  const candidateMap = new Map(candidates.map((c) => [String(c._id), c.fullName]))

  return bookings.map((b) => {
    const pos = positionMap.get(String(b.positionId))
    return {
      bookingId: String(b._id),
      candidateId: String(b.candidateId),
      candidateName: candidateMap.get(String(b.candidateId)) ?? 'Невідомий кандидат',
      positionId: String(b.positionId),
      positionTitle: pos?.title ?? 'Невідома посада',
      positionSeniority: pos?.seniority ?? '',
      requestedFrom: b.requestedFrom,
      requestedTo: b.requestedTo,
    }
  })
}
