export interface RecommendedPosition {
  id: string
  title: string
  companyId: string
  matchedSkills: string[]
}

export interface RecommendedCandidate {
  id: string
  fullName: string
  skills: string[]
  availability: 'available' | 'leased'
  availableFrom: string
  availableTo?: string
  isOpenEndedAvailability: boolean
  matchedSkills: string[]
  matchedPositions: RecommendedPosition[]
  matchScore: number
}
