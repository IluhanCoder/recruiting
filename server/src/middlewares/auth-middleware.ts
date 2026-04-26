import type { NextFunction, Request, RequestHandler, Response } from 'express'

import { HttpError } from '../shared/http-error.js'
import type { AuthUser } from '../modules/auth/auth-types.js'
import type { UserRole } from '../modules/user/user-schema.js'
import { getCurrentUser } from '../modules/auth/auth-service.js'

type AuthLocals = {
  authUser?: AuthUser
}

const getBearerToken = (request: Request): string | undefined => {
  const authHeader = request.header('authorization')
  if (!authHeader) {
    return undefined
  }

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return undefined
  }

  return token
}

export const authenticate: RequestHandler = async (
  request: Request,
  response: Response<unknown, AuthLocals>,
  next: NextFunction,
) => {
  try {
    const accessToken = getBearerToken(request)
    const authUser = await getCurrentUser(accessToken)
    response.locals.authUser = authUser
    next()
  } catch (error) {
    next(error)
  }
}

export const authorizeRoles = (...roles: UserRole[]): RequestHandler => {
  return (
    _request: Request,
    response: Response<unknown, AuthLocals>,
    next: NextFunction,
  ) => {
    const authUser = response.locals.authUser

    if (!authUser) {
      next(new HttpError(401, 'Unauthorized'))
      return
    }

    if (!roles.includes(authUser.role)) {
      next(new HttpError(403, 'Forbidden for this role'))
      return
    }

    next()
  }
}
