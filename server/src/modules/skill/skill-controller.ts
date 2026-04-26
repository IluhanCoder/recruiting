import type { NextFunction, Request, Response } from 'express'

import * as skillService from './skill-service.js'
import type { CreateSkillRequestBody, UpdateSkillRequestBody } from './skill-types.js'

export const list = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const skills = await skillService.listSkills()
    response.status(200).json({ skills })
  } catch (error) {
    next(error)
  }
}

export const create = async (
  request: Request<unknown, unknown, CreateSkillRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const skill = await skillService.createSkill(request.body)
    response.status(201).json({ skill })
  } catch (error) {
    next(error)
  }
}

export const update = async (
  request: Request<{ skillId: string }, unknown, UpdateSkillRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const skill = await skillService.updateSkill(String(request.params.skillId), request.body)
    response.status(200).json({ skill })
  } catch (error) {
    next(error)
  }
}

export const remove = async (
  request: Request<{ skillId: string }>,
  response: Response,
  next: NextFunction,
) => {
  try {
    await skillService.deleteSkill(String(request.params.skillId))
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
