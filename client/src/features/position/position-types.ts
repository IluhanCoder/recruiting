export type PositionSeniority = 'junior' | 'middle' | 'senior'

export interface PositionSummary {
  id: string
  title: string
  seniority: PositionSeniority
  stack: string[]
  neededFrom: string
  neededTo?: string
  isOpenEndedTerm: boolean
  status: 'open' | 'in_progress' | 'closed' | 'archived'
  companyId: string
  assignedClientId?: string
}

export interface CreatePositionPayload {
  title: string
  seniority: PositionSeniority
  stack: string[]
  neededFrom: string
  neededTo?: string
  isOpenEndedTerm: boolean
  companyId: string
}

export type UpdatePositionPayload = CreatePositionPayload

export interface RestorePositionPayload {
  neededFrom: string
  neededTo?: string
  isOpenEndedTerm: boolean
}
