import type { NextFunction, Request, Response } from 'express'

import * as positionService from './position-service.js'
import type { CreatePositionRequestBody, RestorePositionRequestBody, UpdatePositionRequestBody } from './position-types.js'
import { HttpError } from '../../shared/http-error.js'

export const list = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const companyId = typeof _request.query.companyId === 'string' ? _request.query.companyId : undefined
    const positions = await positionService.listPositions(authUser, companyId)
    response.status(200).json({ positions })
  } catch (error) {
    next(error)
  }
}

export const create = async (
  request: Request<unknown, unknown, CreatePositionRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const position = await positionService.createPosition(request.body, authUser)
    response.status(201).json({ position })
  } catch (error) {
    next(error)
  }
}

export const update = async (
  request: Request<{ positionId: string }, unknown, UpdatePositionRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const position = await positionService.updatePosition(
      String(request.params.positionId),
      request.body,
      authUser,
    )
    response.status(200).json({ position })
  } catch (error) {
    next(error)
  }
}

export const restore = async (
  request: Request<{ positionId: string }, unknown, RestorePositionRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const position = await positionService.restorePosition(
      String(request.params.positionId),
      request.body,
      authUser,
    )
    response.status(200).json({ position })
  } catch (error) {
    next(error)
  }
}
