import type { NextFunction, Request, Response } from 'express'

import { HttpError } from '../../shared/http-error.js'
import * as dashboardService from './dashboard-service.js'

export const get = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    if (authUser.role === 'manager') {
      const dashboard = await dashboardService.getManagerDashboard()
      response.status(200).json({ dashboard })
    } else {
      const dashboard = await dashboardService.getClientDashboard(authUser)
      response.status(200).json({ dashboard })
    }
  } catch (error) {
    next(error)
  }
}
