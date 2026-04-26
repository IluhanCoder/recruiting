import type { CompanyProfile } from '../user/user-schema.js'

export interface CompanySummary extends CompanyProfile {
  id: string
  ownerUserId: string
  ownerName?: string
  ownerEmail?: string
  teamSize: number
  createdAt: Date
  updatedAt: Date
}

export interface CompanyEmployee {
  bookingId: string
  candidateId: string
  candidateName: string
  positionId: string
  positionTitle: string
  positionSeniority: string
  requestedFrom: Date
  requestedTo: Date
}

export interface CompanyHiringRecord {
  bookingId: string
  candidateId: string
  candidateName: string
  positionId: string
  positionTitle: string
  positionSeniority: string
  requestedFrom: Date
  requestedTo: Date
}

export interface CreateCompanyRequestBody {
  name: string
  website?: string
  industry?: string
  description?: string
  technologies?: string[]
  hiringNeeds?: string[]
}

export interface UpdateCompanyRequestBody {
  name?: string
  website?: string
  industry?: string
  description?: string
  technologies?: string[]
  hiringNeeds?: string[]
  rentedSpecialists?: number
}
