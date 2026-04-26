import { Router } from 'express'

import { authenticate } from '../../middlewares/auth-middleware.js'
import * as authController from './auth-controller.js'

export const authRouter = Router()

authRouter.post('/register', authController.register)
authRouter.post('/login', authController.login)
authRouter.post('/refresh', authController.refresh)
authRouter.get('/me', authenticate, authController.me)
