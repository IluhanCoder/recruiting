import cors from 'cors'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import { errorHandler } from './middlewares/error-handler.js'
import { notFoundHandler } from './middlewares/not-found-handler.js'
import { authRouter } from './modules/auth/auth-router.js'
import { bookingRouter } from './modules/booking/booking-router.js'
import { candidateRouter } from './modules/candidate/candidate-router.js'
import { chatRouter } from './modules/chat/chat-router.js'
import { companyRouter } from './modules/company/company-router.js'
import { dashboardRouter } from './modules/dashboard/dashboard-router.js'
import { positionRouter } from './modules/position/position-router.js'
import { recommendationRouter } from './modules/recommendation/recommendation-router.js'
import { skillRouter } from './modules/skill/skill-router.js'
import { userRouter } from './modules/user/user-router.js'
import { expireBookings } from './scheduler.js'

export const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth', authRouter)
app.use('/api/bookings', bookingRouter)
app.use('/api/users', userRouter)
app.use('/api/companies', companyRouter)
app.use('/api/chats', chatRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/positions', positionRouter)
app.use('/api/recommendations', recommendationRouter)
app.use('/api/candidates', candidateRouter)
app.use('/api/skills', skillRouter)

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/expire-bookings', async (_request, response, next) => {
    try {
      const { CandidateBookingModel } = await import('./modules/booking/booking-schema.js')
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      await CandidateBookingModel.updateMany(
        { status: 'approved' },
        { $set: { requestedTo: yesterday } },
      )
      await expireBookings()
      response.json({ ok: true })
    } catch (error) {
      next(error)
    }
  })
}

app.get('/', (_request, response) => {
  response.status(200).json({
    service: 'recruiting-platform-api',
    message: 'API scaffold for recruitment, staff leasing, and client requests is ready.',
  })
})

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist')
  app.use(express.static(clientDist))
  app.get('*', (_request, response) => {
    response.sendFile(path.join(clientDist, 'index.html'))
  })
} else {
  app.use(notFoundHandler)
}

app.use(errorHandler)