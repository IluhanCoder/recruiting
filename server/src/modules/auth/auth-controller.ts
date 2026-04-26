import type { NextFunction, Request, Response } from 'express'

import * as authService from './auth-service.js'
import type { LoginRequestBody, RefreshRequestBody, RegisterRequestBody } from './auth-types.js'

export const register = async (
  request: Request<unknown, unknown, RegisterRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authResult = await authService.register(request.body)
    response.status(201).json(authResult)
  } catch (error) {
    next(error)
  }
}

export const login = async (
  request: Request<unknown, unknown, LoginRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authResult = await authService.login(request.body)
    response.status(200).json(authResult)
  } catch (error) {
    next(error)
  }
}

export const me = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const user = response.locals.authUser

    if (!user) {
      response.status(401).json({ message: 'Unauthorized' })
      return
    }

    response.status(200).json({ user })
  } catch (error) {
    next(error)
  }
}

export const refresh = async (
  request: Request<unknown, unknown, RefreshRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authResult = await authService.refreshSession(request.body)
    response.status(200).json(authResult)
  } catch (error) {
    next(error)
  }
}
