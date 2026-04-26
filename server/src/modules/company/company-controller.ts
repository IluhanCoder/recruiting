import type { NextFunction, Request, Response } from 'express'

import { HttpError } from '../../shared/http-error.js'

import * as companyService from './company-service.js'
import type { CreateCompanyRequestBody, UpdateCompanyRequestBody } from './company-types.js'

export const listMine = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const companies = await companyService.listMyCompanies(authUser)
    response.status(200).json({ companies })
  } catch (error) {
    next(error)
  }
}

export const getMineById = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const company = await companyService.getMyCompanyById(authUser, String(request.params.companyId))
    response.status(200).json({ company })
  } catch (error) {
    next(error)
  }
}

export const getById = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const company = await companyService.getCompanyById(String(request.params.companyId))
    response.status(200).json({ company })
  } catch (error) {
    next(error)
  }
}

export const list = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const companies = await companyService.listCompanies()
    response.status(200).json({ companies })
  } catch (error) {
    next(error)
  }
}

export const create = async (
  request: Request<unknown, unknown, CreateCompanyRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const company = await companyService.createCompany(authUser, request.body)
    response.status(201).json({ company })
  } catch (error) {
    next(error)
  }
}

export const createMyCompany = async (
  request: Request<unknown, unknown, CreateCompanyRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const company = await companyService.createMyCompany(authUser, request.body)
    response.status(201).json({ company })
  } catch (error) {
    next(error)
  }
}

export const getMyCompany = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const company = await companyService.getMyCompany(authUser)
    response.status(200).json({ company })
  } catch (error) {
    next(error)
  }
}

export const updateMyCompany = async (
  request: Request<unknown, unknown, UpdateCompanyRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const company = await companyService.updateMyCompany(authUser, request.body)
    response.status(200).json({ company })
  } catch (error) {
    next(error)
  }
}

export const updateMineById = async (
  request: Request<{ companyId: string }, unknown, UpdateCompanyRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const company = await companyService.updateMyCompanyById(authUser, request.params.companyId, request.body)
    response.status(200).json({ company })
  } catch (error) {
    next(error)
  }
}

export const getEmployees = async (
  request: Request<{ companyId: string }>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const employees = await companyService.getCompanyEmployees(request.params.companyId)
    response.json({ employees })
  } catch (error) {
    next(error)
  }
}

export const getHistory = async (
  request: Request<{ companyId: string }>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const history = await companyService.getCompanyHiringHistory(request.params.companyId)
    response.json({ history })
  } catch (error) {
    next(error)
  }
}
