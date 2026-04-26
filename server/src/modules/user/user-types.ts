import type { CompanyProfile, UserRole } from './user-schema.js'

export interface UserSummary {
  id: string
  fullName: string
  email: string
  role: UserRole
  companyId?: string
  companyProfile?: CompanyProfile
  isActive: boolean
  lastLoginAt: Date | null
}

export interface UpdateCompanyProfileRequestBody {
  companyProfile: CompanyProfile
}
