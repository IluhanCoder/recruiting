import { Router } from 'express'

import { authenticate, authorizeRoles } from '../../middlewares/auth-middleware.js'
import * as chatController from './chat-controller.js'

export const chatRouter = Router()

chatRouter.get('/', authenticate, authorizeRoles('manager', 'client'), chatController.list)
chatRouter.get('/:chatId/messages', authenticate, authorizeRoles('manager', 'client'), chatController.listMessages)
chatRouter.post('/:chatId/messages', authenticate, authorizeRoles('manager', 'client'), chatController.createMessage)
