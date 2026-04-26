import type { NextFunction, Request, Response } from 'express'

import { HttpError } from '../../shared/http-error.js'
import { getRecommendations } from './recommendation-service.js'

export const listRecommendations = async (
  _request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const recommendations = await getRecommendations(authUser)
    response.status(200).json({ recommendations })
  } catch (error) {
    next(error)
  }
}
