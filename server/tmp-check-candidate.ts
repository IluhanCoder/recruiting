import 'dotenv/config'
import mongoose from 'mongoose'
import { CandidateModel } from './src/modules/candidate/candidate-schema.ts'
import { CandidateBookingModel } from './src/modules/booking/booking-schema.ts'
import { PositionModel } from './src/modules/position/position-schema.ts'
import { CompanyModel } from './src/modules/company/company-schema.ts'

const run = async () => {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    console.log('MONGODB_URI missing')
    process.exit(1)
  }

  await mongoose.connect(mongoUri)

  const name = "Дарина Лук'яненко"
  const candidate = await CandidateModel.findOne({ fullName: name }).lean()

  if (!candidate) {
    const fallback = await CandidateModel.find({ fullName: /Дарина\s+Лук/i })
      .select('fullName availability availableFrom availableTo isOpenEndedAvailability')
      .lean()

    console.log(
      JSON.stringify(
        {
          candidateFound: false,
          fallbackCount: fallback.length,
          fallbackNames: fallback.map((c) => c.fullName),
        },
        null,
        2,
      ),
    )

    await mongoose.disconnect()
    return
  }

  const bookings = await CandidateBookingModel.find({
    $or: [{ candidateId: candidate._id }, { originalCandidateId: candidate._id }],
  })
    .sort({ requestedFrom: -1 })
    .lean()

  const positionIds = [...new Set(bookings.map((b) => String(b.positionId)))]
  const positions = await PositionModel.find({ _id: { $in: positionIds } }).select('title companyId').lean()
  const companyIds = [...new Set(positions.map((p) => String(p.companyId)))]
  const companies = await CompanyModel.find({ _id: { $in: companyIds } }).select('name').lean()

  const positionMap = new Map(positions.map((p) => [String(p._id), p]))
  const companyMap = new Map(companies.map((c) => [String(c._id), c.name]))

  const now = new Date()
  const activeApproved = bookings.filter(
    (b) => b.status === 'approved' && new Date(b.requestedFrom) <= now && now <= new Date(b.requestedTo),
  )

  const relatedBookings = bookings.map((b) => {
    const position = positionMap.get(String(b.positionId))
    const company = position ? companyMap.get(String(position.companyId)) ?? null : null

    return {
      status: b.status,
      from: b.requestedFrom,
      to: b.requestedTo,
      position: position?.title ?? null,
      company,
    }
  })

  console.log(
    JSON.stringify(
      {
        candidate: {
          fullName: candidate.fullName,
          availability: candidate.availability,
          availableFrom: candidate.availableFrom,
          availableTo: candidate.availableTo ?? null,
          isOpenEndedAvailability: candidate.isOpenEndedAvailability,
        },
        activeApprovedCount: activeApproved.length,
        activeApproved: activeApproved.map((b) => {
          const position = positionMap.get(String(b.positionId))
          return {
            from: b.requestedFrom,
            to: b.requestedTo,
            position: position?.title ?? null,
            company: position ? companyMap.get(String(position.companyId)) ?? null : null,
          }
        }),
        relatedBookings,
      },
      null,
      2,
    ),
  )

  await mongoose.disconnect()
}

run().catch(async (error) => {
  console.error(error)
  await mongoose.disconnect()
  process.exit(1)
})
