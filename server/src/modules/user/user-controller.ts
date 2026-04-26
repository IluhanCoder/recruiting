import type { NextFunction, Request, Response } from 'express'

import { HttpError } from '../../shared/http-error.js'
import * as userService from './user-service.js'
import type { UpdateCompanyProfileRequestBody } from './user-types.js'

export const me = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const user = await userService.getCurrentUserProfile(authUser)
    response.status(200).json({ user })
  } catch (error) {
    next(error)
  }
}

export const updateMyCompanyProfile = async (
  request: Request<unknown, unknown, UpdateCompanyProfileRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const user = await userService.updateCompanyProfile(authUser, request.body)
    response.status(200).json({ user })
  } catch (error) {
    next(error)
  }
}
