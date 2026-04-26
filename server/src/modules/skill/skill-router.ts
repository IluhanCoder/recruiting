import { Router } from 'express'

import { authenticate, authorizeRoles } from '../../middlewares/auth-middleware.js'
import * as skillController from './skill-controller.js'

export const skillRouter = Router()

skillRouter.get('/', authenticate, authorizeRoles('manager', 'client'), skillController.list)
skillRouter.post('/', authenticate, authorizeRoles('manager'), skillController.create)
skillRouter.patch('/:skillId', authenticate, authorizeRoles('manager'), skillController.update)
skillRouter.delete('/:skillId', authenticate, authorizeRoles('manager'), skillController.remove)
