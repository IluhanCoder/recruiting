export interface CompanySummary {
  id: string
  name: string
  website?: string
  industry?: string
  description?: string
  technologies: string[]
  hiringNeeds: string[]
  rentedSpecialists: number
  ownerUserId: string
  ownerName?: string
  ownerEmail?: string
  teamSize: number
  createdAt: string
  updatedAt: string
}

export interface CompanyEmployee {
  bookingId: string
  candidateId: string
  candidateName: string
  positionId: string
  positionTitle: string
  positionSeniority: string
  requestedFrom: string
  requestedTo: string
}

export interface CompanyHiringRecord {
  bookingId: string
  candidateId: string
  candidateName: string
  positionId: string
  positionTitle: string
  positionSeniority: string
  requestedFrom: string
  requestedTo: string
}

export interface CreateCompanyPayload {
  name: string
  website?: string
  industry?: string
}

export interface UpdateCompanyPayload {
  name?: string
  website?: string
  industry?: string
  description?: string
}
