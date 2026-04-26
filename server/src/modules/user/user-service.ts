import { HttpError } from '../../shared/http-error.js'
import type { AuthUser } from '../auth/auth-types.js'

import { UserModel } from './user-schema.js'
import type { UpdateCompanyProfileRequestBody, UserSummary } from './user-types.js'

const toUserSummary = (
  user: Awaited<ReturnType<(typeof UserModel)['findOne']>>,
): UserSummary => {
  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    companyProfile: user.companyProfile,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
  }
}

export const getCurrentUserProfile = async (authUser: AuthUser): Promise<UserSummary> => {
  const user = await UserModel.findById(authUser.id)
  return toUserSummary(user)
}

export const updateCompanyProfile = async (
  authUser: AuthUser,
  payload: UpdateCompanyProfileRequestBody,
): Promise<UserSummary> => {
  if (!payload.companyProfile) {
    throw new HttpError(400, 'companyProfile is required')
  }

  const user = await UserModel.findById(authUser.id)
  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  user.companyProfile = payload.companyProfile
  await user.save()

  return toUserSummary(user)
}
