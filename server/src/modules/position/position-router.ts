import { Router } from 'express'

import { authenticate, authorizeRoles } from '../../middlewares/auth-middleware.js'
import * as positionController from './position-controller.js'

export const positionRouter = Router()

positionRouter.get('/', authenticate, authorizeRoles('manager', 'client'), positionController.list)
positionRouter.post('/', authenticate, authorizeRoles('manager', 'client'), positionController.create)
positionRouter.patch('/:positionId', authenticate, authorizeRoles('manager', 'client'), positionController.update)
positionRouter.patch('/:positionId/restore', authenticate, authorizeRoles('client'), positionController.restore)
