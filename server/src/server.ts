import 'dotenv/config'

import mongoose from 'mongoose'

import { app } from './app.js'
import { startScheduler } from './scheduler.js'

const port = Number(process.env.PORT ?? 4000)
const mongoUri = process.env.MONGODB_URI

const startServer = async () => {
  if (mongoUri) {
    await mongoose.connect(mongoUri)
    console.log('MongoDB connected')
  } else {
    console.warn('MONGODB_URI is not set, starting API without a database connection')
  }

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
    startScheduler()
  })
}

startServer().catch((error: unknown) => {
  console.error('Failed to start server', error)
  process.exit(1)
})
