import { Router } from 'express'

import { authenticate, authorizeRoles } from '../../middlewares/auth-middleware.js'
import * as userController from './user-controller.js'

export const userRouter = Router()

userRouter.get('/me', authenticate, authorizeRoles('manager', 'client'), userController.me)
userRouter.patch(
  '/me/company-profile',
  authenticate,
  authorizeRoles('manager', 'client'),
  userController.updateMyCompanyProfile,
)
