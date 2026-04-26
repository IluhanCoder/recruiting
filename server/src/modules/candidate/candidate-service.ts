import { HttpError } from '../../shared/http-error.js'
import type { AuthUser } from '../auth/auth-types.js'
import { CandidateBookingModel } from '../booking/booking-schema.js'
import { PositionModel } from '../position/position-schema.js'
import { CandidateModel } from './candidate-schema.js'
import type {
  CandidateSummary,
  CreateCandidateRequestBody,
  UpdateCandidateRequestBody,
} from './candidate-types.js'

const MAX_CV_DATA_URL_LENGTH = 10 * 1024 * 1024

const getCompletedHiresCompaniesCountByCandidateIds = async (
  candidateIds: string[],
): Promise<Map<string, number>> => {
  if (!candidateIds.length) {
    return new Map()
  }

  const now = new Date()
  const bookings = await CandidateBookingModel.find({
    candidateId: { $in: candidateIds },
    $or: [
      { status: 'completed' },
      { status: 'approved', requestedTo: { $lt: now } },
    ],
  })
    .select('candidateId positionId')
    .lean()

  if (!bookings.length) {
    return new Map()
  }

  const positionIds = [...new Set(bookings.map((booking) => String(booking.positionId)))]
  const positions = await PositionModel.find({ _id: { $in: positionIds } }).select('companyId').lean()
  const companyIdByPositionId = new Map(
    positions.map((position) => [String(position._id), String(position.companyId)]),
  )

  const companiesByCandidateId = new Map<string, Set<string>>()
  for (const booking of bookings) {
    const candidateId = String(booking.candidateId)
    const companyId = companyIdByPositionId.get(String(booking.positionId))
    if (!companyId) {
      continue
    }

    const companies = companiesByCandidateId.get(candidateId) ?? new Set<string>()
    companies.add(companyId)
    companiesByCandidateId.set(candidateId, companies)
  }

  return new Map(
    [...companiesByCandidateId.entries()].map(([candidateId, companies]) => [candidateId, companies.size]),
  )
}

const toSummary = (
  candidate: Awaited<ReturnType<(typeof CandidateModel)['findOne']>>,
  completedHiresCompaniesCount = 0,
): CandidateSummary => {
  if (!candidate) {
    throw new HttpError(404, 'Candidate not found')
  }

  return {
    id: candidate.id,
    fullName: candidate.fullName,
    avatarDataUrl: candidate.avatarDataUrl,
    resumeText: candidate.resumeText,
    cvPdfDataUrl: candidate.cvPdfDataUrl,
    completedHiresCompaniesCount,
    skills: candidate.skills,
    availability: candidate.availability,
    availableFrom: candidate.availableFrom,
    availableTo: candidate.availableTo,
    isOpenEndedAvailability: candidate.isOpenEndedAvailability,
  }
}

export const listCandidates = async (authUser: AuthUser): Promise<CandidateSummary[]> => {
  const query =
    authUser.role === 'client'
      ? { availability: 'available' }
      : {}

  const candidates = await CandidateModel.find(query).sort({ createdAt: -1 })
  const completedHiresCompaniesCountByCandidateId =
    await getCompletedHiresCompaniesCountByCandidateIds(candidates.map((candidate) => candidate.id))

  return candidates.map((candidate) =>
    toSummary(candidate, completedHiresCompaniesCountByCandidateId.get(candidate.id) ?? 0),
  )
}

export const getCandidateById = async (
  candidateId: string,
  authUser: AuthUser,
): Promise<CandidateSummary> => {
  const query =
    authUser.role === 'client'
      ? {
          _id: candidateId,
          availability: 'available',
        }
      : { _id: candidateId }

  const candidate = await CandidateModel.findOne(query)
  const completedHiresCompaniesCountByCandidateId =
    await getCompletedHiresCompaniesCountByCandidateIds(candidate ? [candidate.id] : [])

  return toSummary(candidate, completedHiresCompaniesCountByCandidateId.get(candidate?.id ?? '') ?? 0)
}

export const createCandidate = async (
  payload: CreateCandidateRequestBody,
  authUser: AuthUser,
): Promise<CandidateSummary> => {
  if (!payload.fullName?.trim()) {
    throw new HttpError(400, 'fullName is required')
  }

  const skills = (payload.skills ?? []).map((item) => item.trim()).filter(Boolean)
  if (!skills.length) {
    throw new HttpError(400, 'skills should contain at least one skill')
  }

  const avatarDataUrl = payload.avatarDataUrl?.trim()
  if (avatarDataUrl && !avatarDataUrl.startsWith('data:image/')) {
    throw new HttpError(400, 'avatarDataUrl must be a valid image data URL')
  }

  const cvPdfDataUrl = payload.cvPdfDataUrl?.trim()
  if (cvPdfDataUrl && !cvPdfDataUrl.startsWith('data:application/pdf')) {
    throw new HttpError(400, 'cvPdfDataUrl must be a valid PDF data URL')
  }
  if (cvPdfDataUrl && cvPdfDataUrl.length > MAX_CV_DATA_URL_LENGTH) {
    throw new HttpError(413, 'cvPdfDataUrl is too large (max 10MB)')
  }

  const resumeText = payload.resumeText?.trim() || undefined

  const availableFrom = new Date(payload.availableFrom)
  if (Number.isNaN(availableFrom.getTime())) {
    throw new HttpError(400, 'availableFrom must be a valid date')
  }

  const isOpenEndedAvailability = Boolean(payload.isOpenEndedAvailability)
  let availableTo: Date | undefined

  if (!isOpenEndedAvailability) {
    if (!payload.availableTo) {
      throw new HttpError(400, 'availableTo is required when term is not open-ended')
    }

    availableTo = new Date(payload.availableTo)
    if (Number.isNaN(availableTo.getTime())) {
      throw new HttpError(400, 'availableTo must be a valid date')
    }

    if (availableTo.getTime() < availableFrom.getTime()) {
      throw new HttpError(400, 'availableTo must be greater or equal to availableFrom')
    }
  }

  const createdCandidate = await CandidateModel.create({
    fullName: payload.fullName.trim(),
    avatarDataUrl,
    resumeText,
    cvPdfDataUrl,
    skills,
    availableFrom,
    availableTo,
    isOpenEndedAvailability,
    createdBy: authUser.id,
  })

  return toSummary(createdCandidate, 0)
}

export const updateCandidate = async (
  candidateId: string,
  payload: UpdateCandidateRequestBody,
): Promise<CandidateSummary> => {
  const candidate = await CandidateModel.findById(candidateId)
  if (!candidate) {
    throw new HttpError(404, 'Candidate not found')
  }

  if (!payload.fullName?.trim()) {
    throw new HttpError(400, 'fullName is required')
  }

  const skills = (payload.skills ?? []).map((item) => item.trim()).filter(Boolean)
  if (!skills.length) {
    throw new HttpError(400, 'skills should contain at least one skill')
  }

  const avatarDataUrl = payload.avatarDataUrl?.trim()
  if (avatarDataUrl && !avatarDataUrl.startsWith('data:image/')) {
    throw new HttpError(400, 'avatarDataUrl must be a valid image data URL')
  }

  const cvPdfDataUrl = payload.cvPdfDataUrl?.trim()
  if (cvPdfDataUrl && !cvPdfDataUrl.startsWith('data:application/pdf')) {
    throw new HttpError(400, 'cvPdfDataUrl must be a valid PDF data URL')
  }
  if (cvPdfDataUrl && cvPdfDataUrl.length > MAX_CV_DATA_URL_LENGTH) {
    throw new HttpError(413, 'cvPdfDataUrl is too large (max 10MB)')
  }

  const resumeText = payload.resumeText?.trim() || undefined

  const availableFrom = new Date(payload.availableFrom)
  if (Number.isNaN(availableFrom.getTime())) {
    throw new HttpError(400, 'availableFrom must be a valid date')
  }

  const isOpenEndedAvailability = Boolean(payload.isOpenEndedAvailability)
  let availableTo: Date | undefined

  if (!isOpenEndedAvailability) {
    if (!payload.availableTo) {
      throw new HttpError(400, 'availableTo is required when term is not open-ended')
    }

    availableTo = new Date(payload.availableTo)
    if (Number.isNaN(availableTo.getTime())) {
      throw new HttpError(400, 'availableTo must be a valid date')
    }

    if (availableTo.getTime() < availableFrom.getTime()) {
      throw new HttpError(400, 'availableTo must be greater or equal to availableFrom')
    }
  }

  candidate.fullName = payload.fullName.trim()
  candidate.avatarDataUrl = avatarDataUrl
  candidate.resumeText = resumeText
  candidate.cvPdfDataUrl = cvPdfDataUrl
  candidate.skills = skills
  candidate.availableFrom = availableFrom
  candidate.availableTo = availableTo
  candidate.isOpenEndedAvailability = isOpenEndedAvailability

  await candidate.save()

  const completedHiresCompaniesCountByCandidateId =
    await getCompletedHiresCompaniesCountByCandidateIds([candidate.id])

  return toSummary(candidate, completedHiresCompaniesCountByCandidateId.get(candidate.id) ?? 0)
}
