import { Router } from 'express'

import { authenticate, authorizeRoles } from '../../middlewares/auth-middleware.js'
import { listRecommendations } from './recommendation-controller.js'

export const recommendationRouter = Router()

recommendationRouter.get(
  '/',
  authenticate,
  authorizeRoles('manager', 'client'),
  listRecommendations,
)
