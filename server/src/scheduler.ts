import { CandidateModel } from './modules/candidate/candidate-schema.js'
import { CandidateBookingModel } from './modules/booking/booking-schema.js'

const INTERVAL_MS = 60 * 60 * 1000 // every hour

const syncCandidateAvailability = async (now: Date) => {
  const activeApprovedBookings = await CandidateBookingModel.find({
    status: 'approved',
    requestedFrom: { $lte: now },
    requestedTo: { $gte: now },
  })
    .select('candidateId')
    .lean()

  const activeCandidateIds = [...new Set(activeApprovedBookings.map((b) => String(b.candidateId)))]

  if (activeCandidateIds.length) {
    await CandidateModel.updateMany(
      { _id: { $in: activeCandidateIds } },
      { $set: { availability: 'leased' } },
    )
  }

  await CandidateModel.updateMany(
    { _id: { $nin: activeCandidateIds }, availability: 'leased' },
    { $set: { availability: 'available' } },
  )
}

export const expireBookings = async () => {
  const now = new Date()

  const expired = await CandidateBookingModel.find({
    status: 'approved',
    requestedTo: { $lt: now },
  })
    .select('_id candidateId')
    .lean()

  if (!expired.length) return

  const bookingIds = expired.map((b) => b._id)
  const candidateIds = [...new Set(expired.map((b) => String(b.candidateId)))]

  await CandidateBookingModel.updateMany(
    { _id: { $in: bookingIds } },
    { $set: { status: 'completed' } },
  )

  await syncCandidateAvailability(now)

  console.log(`[scheduler] Completed ${expired.length} expired booking(s), freed ${candidateIds.length} candidate(s)`)
}

export const startScheduler = () => {
  // Run immediately on startup to handle any missed expirations
  Promise.all([expireBookings(), syncCandidateAvailability(new Date())]).catch((error: unknown) =>
    console.error('[scheduler] Error on startup run:', error),
  )

  setInterval(() => {
    Promise.all([expireBookings(), syncCandidateAvailability(new Date())]).catch((error: unknown) =>
      console.error('[scheduler] Error:', error),
    )
  }, INTERVAL_MS)

  console.log('[scheduler] Started — checking expired bookings every hour')
}
