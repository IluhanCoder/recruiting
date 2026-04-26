export interface PositionSummary {
  id: string
  title: string
  seniority: 'junior' | 'middle' | 'senior'
  stack: string[]
  neededFrom: Date
  neededTo?: Date
  isOpenEndedTerm: boolean
  status: 'open' | 'in_progress' | 'closed' | 'archived'
  companyId: string
  assignedClientId?: string
}

export interface CreatePositionRequestBody {
  title: string
  seniority: 'junior' | 'middle' | 'senior'
  stack: string[]
  neededFrom: string
  neededTo?: string
  isOpenEndedTerm: boolean
  companyId: string
  assignedClientId?: string
}

export interface UpdatePositionRequestBody {
  title?: string
  seniority?: 'junior' | 'middle' | 'senior'
  stack?: string[]
  neededFrom?: string
  neededTo?: string
  isOpenEndedTerm?: boolean
}

export interface RestorePositionRequestBody {
  neededFrom: string
  neededTo?: string
  isOpenEndedTerm: boolean
}
