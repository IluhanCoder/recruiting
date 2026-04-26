import { Router } from 'express'

import { authenticate, authorizeRoles } from '../../middlewares/auth-middleware.js'
import * as dashboardController from './dashboard-controller.js'

export const dashboardRouter = Router()

dashboardRouter.get('/', authenticate, authorizeRoles('manager', 'client'), dashboardController.get)
