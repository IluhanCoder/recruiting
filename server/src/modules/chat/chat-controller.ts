import type { NextFunction, Request, Response } from 'express'

import { HttpError } from '../../shared/http-error.js'
import * as chatService from './chat-service.js'
import type { CreateChatMessageRequestBody } from './chat-types.js'

export const list = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const chats = await chatService.listChats(authUser)
    response.status(200).json({ chats })
  } catch (error) {
    next(error)
  }
}

export const listMessages = async (
  request: Request<{ chatId: string }>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const messages = await chatService.listChatMessages(String(request.params.chatId), authUser)
    response.status(200).json({ messages })
  } catch (error) {
    next(error)
  }
}

export const createMessage = async (
  request: Request<{ chatId: string }, unknown, CreateChatMessageRequestBody>,
  response: Response,
  next: NextFunction,
) => {
  try {
    const authUser = response.locals.authUser
    if (!authUser) {
      throw new HttpError(401, 'Unauthorized')
    }

    const message = await chatService.createChatMessage(
      String(request.params.chatId),
      request.body,
      authUser,
    )
    response.status(201).json({ message })
  } catch (error) {
    next(error)
  }
}
