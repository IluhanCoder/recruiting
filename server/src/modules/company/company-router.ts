import { Router } from 'express'

import { authenticate, authorizeRoles } from '../../middlewares/auth-middleware.js'

import * as companyController from './company-controller.js'

export const companyRouter = Router()

companyRouter.get('/mine', authenticate, authorizeRoles('manager', 'client'), companyController.listMine)
companyRouter.get('/mine/:companyId', authenticate, authorizeRoles('manager', 'client'), companyController.getMineById)
companyRouter.patch('/mine/:companyId', authenticate, authorizeRoles('manager', 'client'), companyController.updateMineById)
companyRouter.get('/:companyId', authenticate, authorizeRoles('manager'), companyController.getById)
companyRouter.get('/:companyId/employees', authenticate, authorizeRoles('manager', 'client'), companyController.getEmployees)
companyRouter.get('/:companyId/history', authenticate, authorizeRoles('manager', 'client'), companyController.getHistory)
companyRouter.get('/', authenticate, authorizeRoles('manager'), companyController.list)
companyRouter.post('/', authenticate, authorizeRoles('manager', 'client'), companyController.create)
companyRouter.post('/me', authenticate, authorizeRoles('manager', 'client'), companyController.createMyCompany)
companyRouter.get('/me', authenticate, authorizeRoles('manager', 'client'), companyController.getMyCompany)
companyRouter.patch('/me', authenticate, authorizeRoles('manager', 'client'), companyController.updateMyCompany)
