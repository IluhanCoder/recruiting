import type { ErrorRequestHandler } from 'express'

import { HttpError } from '../shared/http-error.js'

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if ((error as { type?: string }).type === 'entity.too.large') {
    response.status(413).json({ message: 'Файл завеликий. Максимальний розмір 10MB.' })
    return
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ message: error.message })
    return
  }

  console.error(error)
  response.status(500).json({ message: 'Internal server error' })
}
