/**
 * Seed script — fills the DB with realistic demo data.
 * Run:  npx tsx src/seed.ts
 *
 * WARNING: clears ALL existing data from every collection before seeding.
 */

import 'dotenv/config'

import bcrypt from 'bcryptjs'
import mongoose, { Types } from 'mongoose'

import { ChatMessageModel } from './modules/chat/chat-message-schema.js'
import { ChatModel } from './modules/chat/chat-schema.js'
import { CandidateBookingModel } from './modules/booking/booking-schema.js'
import { CandidateModel } from './modules/candidate/candidate-schema.js'
import { CompanyModel } from './modules/company/company-schema.js'
import { PositionModel } from './modules/position/position-schema.js'
import { SkillModel } from './modules/skill/skill-schema.js'
import { UserModel } from './modules/user/user-schema.js'

// ─── helpers ─────────────────────────────────────────────────────────────────

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000)
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const pickN = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

// ─── raw data pools ───────────────────────────────────────────────────────────

const ALL_SKILLS = [
  // Frontend
  'React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'Next.js', 'Nuxt.js',
  'Tailwind CSS', 'SCSS/SASS', 'Redux', 'Zustand', 'GraphQL',
  // Backend
  'Node.js', 'Python', 'Java', 'Go', 'Rust', 'PHP', 'C#', '.NET', 'Spring Boot',
  'Django', 'FastAPI', 'NestJS', 'Express.js', 'Kotlin',
  // Databases
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'ClickHouse',
  // DevOps / Cloud
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'CI/CD',
  'GitHub Actions', 'Ansible', 'Linux',
  // Mobile
  'React Native', 'Flutter', 'iOS (Swift)', 'Android (Kotlin)',
  // Data / AI
  'Machine Learning', 'TensorFlow', 'PyTorch', 'Data Analysis', 'Pandas', 'SQL',
  // Other
  'REST API', 'WebSocket', 'Microservices', 'gRPC', 'System Design',
]

const INDUSTRIES = [
  'Фінтех', 'EdTech', 'HealthTech', 'E-commerce', 'SaaS', 'GameDev',
  'Медіа & Реклама', 'Логістика', 'Кібербезпека', 'IoT',
]

const FIRST_NAMES = [
  'Олексій', 'Дмитро', 'Андрій', 'Іван', 'Максим', 'Сергій', 'Микола', 'Владислав',
  'Тарас', 'Богдан', 'Роман', 'Артем', 'Євген', 'Юрій', 'Віктор',
  'Олена', 'Наталія', 'Юлія', 'Ірина', 'Катерина', 'Марія', 'Аліна', 'Анна',
  'Дарина', 'Вікторія', 'Тетяна', 'Людмила', 'Оксана', 'Лариса', 'Соломія',
]

const LAST_NAMES = [
  'Коваленко', 'Шевченко', 'Бондаренко', 'Іваненко', 'Петренко', 'Кравченко',
  'Ткаченко', 'Мороз', 'Лисенко', 'Гриценко', 'Марченко', 'Назаренко',
  'Савченко', 'Поліщук', 'Бойко', 'Костенко', 'Хоменко', 'Романенко',
  'Лук\'яненко', 'Пономаренко', 'Даниленко', 'Сидоренко', 'Яценко', 'Павленко',
]

const POSITION_TITLES = [
  'Frontend Developer', 'Backend Developer', 'Full-Stack Developer',
  'DevOps Engineer', 'Data Engineer', 'QA Engineer', 'Mobile Developer',
  'Machine Learning Engineer', 'Security Engineer', 'UI/UX Designer',
]

const CHAT_MESSAGES_POOL = {
  clientOpen: [
    'Добрий день! Хотіли б дізнатись більше про кандидатів для нашої позиції.',
    'Привіт! Нам потрібен досвідчений React-розробник, маєте когось на прикметі?',
    'Добридень. Ми шукаємо Backend-девелопера з досвідом у Node.js і PostgreSQL.',
    'Вітаю! Цікавить можливість найму DevOps-спеціаліста на 3 місяці.',
    'Привіт! Ми активно розширюємося і потребуємо декількох розробників одночасно.',
  ],
  managerReply1: [
    'Вітаю! Так, є кілька цікавих кандидатів. Зараз підберу і надішлю профілі.',
    'Добрий день! Зрозуміло, підберемо відповідних спеціалістів.',
    'Привіт! Маємо чудових спеціалістів саме для вашого стеку. Готуємо рекомендації.',
    'Вітаю! Займемось підбором негайно, протягом дня надішлемо варіанти.',
    'Добридень! Є кілька перевірених спеціалістів. Зараз все уточню і поверну зв\'язок.',
  ],
  clientFollow: [
    'Дякую! Коли можна очікувати детальніше резюме?',
    'Чудово, чекаємо на подробиці.',
    'Дякуємо. До речі, нам важливо, щоб кандидат мав досвід у мікросервісах.',
    'Окей! Ми можемо почати з тесту або технічного інтерв\'ю?',
    'Добре, також цікавить чи є досвід з AWS або GCP?',
  ],
  managerReply2: [
    'Профілі вже сформовані, призначаємо вам доступ у системі.',
    'Зрозуміло! У нас є кілька кандидатів саме з мікросервісним досвідом.',
    'Так, є кандидат з сертифікацією AWS. Внесемо запит на бронювання.',
    'Технічне інтерв\'ю можна запланувати після підтвердження бронювання.',
    'Наш спеціаліст підготує деталі по кожному кандидату окремо.',
  ],
  clientClosing: [
    'Відмінно, дякуємо за оперативність!',
    'Чекаємо. Якщо виникнуть питання — напишемо.',
    'Добре, будемо на зв\'язку.',
    'Дуже дякуємо, продовжимо в системі.',
    'Супер, тоді погоджуємо і переходимо до наступного кроку.',
  ],
}

// ─── main ─────────────────────────────────────────────────────────────────────

const SALT = 10
const DEFAULT_PASSWORD = 'password123'

async function seed() {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) throw new Error('MONGODB_URI is not set in .env')

  await mongoose.connect(mongoUri)
  console.log('Connected to MongoDB')

  // ── Wipe everything ──────────────────────────────────────────────────────
  await Promise.all([
    UserModel.deleteMany({}),
    CandidateModel.deleteMany({}),
    CompanyModel.deleteMany({}),
    PositionModel.deleteMany({}),
    CandidateBookingModel.deleteMany({}),
    ChatModel.deleteMany({}),
    ChatMessageModel.deleteMany({}),
    SkillModel.deleteMany({}),
  ])
  console.log('Cleared existing data')

  // ── Skills ───────────────────────────────────────────────────────────────
  const skillDocs = await SkillModel.insertMany(
    ALL_SKILLS.map((name) => ({ name, nameLower: name.toLowerCase() })),
  )
  console.log(`Created ${skillDocs.length} skills`)

  // ── Managers ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT)

  const managers = await UserModel.insertMany([
    {
      fullName: 'Олег Василенко',
      email: 'manager1@demo.com',
      passwordHash,
      role: 'manager',
      isActive: true,
      lastLoginAt: daysAgo(1),
      refreshTokenHash: null,
    },
    {
      fullName: 'Наталія Романова',
      email: 'manager2@demo.com',
      passwordHash,
      role: 'manager',
      isActive: true,
      lastLoginAt: daysAgo(2),
      refreshTokenHash: null,
    },
  ])
  console.log(`Created ${managers.length} managers`)

  // ── Clients + Companies ───────────────────────────────────────────────────
  const clientData = [
    {
      fullName: 'Микола Захаренко',
      email: 'client1@demo.com',
      company: {
        name: 'Finova Tech',
        website: 'https://finova.tech',
        industry: 'Фінтех',
        description: 'Розробка платіжних рішень та фінансових сервісів для B2B ринку.',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
        hiringNeeds: ['Frontend Developer', 'Backend Developer'],
      },
    },
    {
      fullName: 'Юлія Примаченко',
      email: 'client2@demo.com',
      company: {
        name: 'EduStream',
        website: 'https://edustream.ua',
        industry: 'EdTech',
        description: 'Онлайн-платформа для корпоративного навчання і підвищення кваліфікації.',
        technologies: ['Vue.js', 'Python', 'Django', 'MongoDB'],
        hiringNeeds: ['Full-Stack Developer', 'DevOps Engineer'],
      },
    },
    {
      fullName: 'Сергій Маринченко',
      email: 'client3@demo.com',
      company: {
        name: 'HealthBridge',
        website: 'https://healthbridge.com',
        industry: 'HealthTech',
        description: 'Медична інформаційна система для клінік та лікарень.',
        technologies: ['Angular', 'Java', 'Spring Boot', 'PostgreSQL', 'Docker'],
        hiringNeeds: ['Backend Developer', 'QA Engineer'],
      },
    },
    {
      fullName: 'Оксана Гладченко',
      email: 'client4@demo.com',
      company: {
        name: 'ShipLogic',
        website: 'https://shiplogic.io',
        industry: 'Логістика',
        description: 'Платформа для автоматизації логістики і відстеження вантажів.',
        technologies: ['React', 'Go', 'PostgreSQL', 'Kubernetes', 'Kafka'],
        hiringNeeds: ['Full-Stack Developer', 'DevOps Engineer', 'Mobile Developer'],
      },
    },
    {
      fullName: 'Артем Дяченко',
      email: 'client5@demo.com',
      company: {
        name: 'DataPulse',
        website: 'https://datapulse.ai',
        industry: 'SaaS',
        description: 'Аналітична платформа на базі ML для retail та e-commerce компаній.',
        technologies: ['Python', 'TensorFlow', 'FastAPI', 'PostgreSQL', 'AWS'],
        hiringNeeds: ['Machine Learning Engineer', 'Data Engineer', 'Backend Developer'],
      },
    },
  ]

  const clients: mongoose.Document[] = []
  const companies: mongoose.Document[] = []

  for (const data of clientData) {
    const user = await UserModel.create({
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      role: 'client',
      isActive: true,
      lastLoginAt: daysAgo(rand(1, 10)),
      refreshTokenHash: null,
    })

    const company = await CompanyModel.create({
      ...data.company,
      rentedSpecialists: rand(0, 4),
      ownerUserId: user._id,
      teamMemberIds: [],
    })

    // link company to user
    user.companyId = String(company._id)
    user.companyProfile = {
      name: data.company.name,
      website: data.company.website,
      industry: data.company.industry,
      description: data.company.description,
      technologies: data.company.technologies,
      hiringNeeds: data.company.hiringNeeds,
      rentedSpecialists: company.rentedSpecialists,
    }
    await user.save()

    clients.push(user)
    companies.push(company)
  }
  console.log(`Created ${clients.length} clients and ${companies.length} companies`)

  // ── Candidates ────────────────────────────────────────────────────────────
  const candidatePool: {
    fullName: string
    skills: string[]
    availability: 'available' | 'leased'
    availableFrom: Date
    availableTo?: Date
    isOpenEndedAvailability: boolean
  }[] = []

  // Skill clusters for realistic profiles
  const clusters = [
    ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Redux'],
    ['Vue.js', 'TypeScript', 'Nuxt.js', 'SCSS/SASS', 'GraphQL'],
    ['Angular', 'TypeScript', 'SCSS/SASS', 'REST API'],
    ['Node.js', 'TypeScript', 'Express.js', 'PostgreSQL', 'Redis'],
    ['Node.js', 'TypeScript', 'NestJS', 'PostgreSQL', 'Docker'],
    ['Python', 'Django', 'PostgreSQL', 'Redis', 'REST API'],
    ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Microservices'],
    ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'Microservices'],
    ['Go', 'PostgreSQL', 'Docker', 'Kubernetes', 'gRPC'],
    ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
    ['Vue.js', 'Python', 'Django', 'MongoDB', 'REST API'],
    ['Angular', 'Java', 'Spring Boot', 'MySQL'],
    ['React Native', 'TypeScript', 'REST API', 'Redux'],
    ['Flutter', 'Dart', 'REST API', 'Firebase'],
    ['iOS (Swift)', 'REST API', 'PostgreSQL'],
    ['Android (Kotlin)', 'REST API', 'Kotlin'],
    ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux'],
    ['Docker', 'Kubernetes', 'GCP', 'Ansible', 'GitHub Actions', 'Linux'],
    ['AWS', 'Terraform', 'CI/CD', 'GitHub Actions', 'Docker', 'Linux'],
    ['Python', 'Machine Learning', 'TensorFlow', 'Data Analysis', 'SQL'],
    ['Python', 'Machine Learning', 'PyTorch', 'Data Analysis', 'Pandas'],
    ['Python', 'Data Analysis', 'SQL', 'Pandas', 'Elasticsearch'],
    ['React', 'TypeScript', 'GraphQL', 'Node.js', 'MongoDB'],
    ['C#', '.NET', 'SQL', 'Docker', 'Microservices'],
    ['PHP', 'MySQL', 'Docker', 'REST API'],
    ['Rust', 'WebSocket', 'gRPC', 'Docker', 'System Design'],
    ['Node.js', 'TypeScript', 'MongoDB', 'Redis', 'WebSocket'],
    ['React', 'TypeScript', 'Next.js', 'GraphQL', 'PostgreSQL'],
    ['Python', 'FastAPI', 'MongoDB', 'Machine Learning', 'Docker'],
    ['Go', 'Microservices', 'Kubernetes', 'gRPC', 'PostgreSQL'],
    ['React', 'Redux', 'TypeScript', 'REST API', 'PostgreSQL'],
    ['Vue.js', 'Node.js', 'MongoDB', 'TypeScript', 'Docker'],
    ['Java', 'Kotlin', 'Spring Boot', 'Kubernetes', 'PostgreSQL'],
    ['Docker', 'AWS', 'GitHub Actions', 'Kubernetes', 'Terraform'],
    ['React Native', 'TypeScript', 'GraphQL', 'Node.js'],
    ['Python', 'Django', 'Elasticsearch', 'Redis', 'PostgreSQL'],
    ['C#', '.NET', 'Azure', 'SQL', 'Docker'],
    ['Node.js', 'TypeScript', 'NestJS', 'GraphQL', 'MongoDB'],
    ['Angular', 'TypeScript', 'NestJS', 'PostgreSQL', 'Docker'],
    ['Python', 'Machine Learning', 'AWS', 'Docker', 'FastAPI'],
    ['React', 'TypeScript', 'Tailwind CSS', 'Zustand', 'REST API'],
    ['Go', 'Docker', 'Redis', 'PostgreSQL', 'REST API'],
    ['Flutter', 'TypeScript', 'REST API', 'Redux'],
    ['PHP', 'Laravel', 'MySQL', 'Redis', 'Docker'],
    ['Node.js', 'Express.js', 'MongoDB', 'Redis', 'CI/CD'],
  ]

  const usedNames = new Set<string>()
  for (let i = 0; i < clusters.length; i++) {
    let fullName = ''
    do {
      fullName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
    } while (usedNames.has(fullName))
    usedNames.add(fullName)

    const isLeased = Math.random() < 0.25
    const fromDaysAgo = rand(0, 30)
    const availableFrom = daysAgo(fromDaysAgo)
    const isOpenEnded = !isLeased && Math.random() < 0.4

    let availableTo: Date | undefined
    if (isLeased) {
      availableTo = daysFromNow(rand(14, 90))
    } else if (!isOpenEnded) {
      availableTo = daysFromNow(rand(30, 180))
    }

    // add 1-2 extra random skills beyond the cluster
    const extras = pickN(
      ALL_SKILLS.filter((s) => !clusters[i].includes(s)),
      rand(0, 2),
    )

    candidatePool.push({
      fullName,
      skills: [...clusters[i], ...extras],
      availability: isLeased ? 'leased' : 'available',
      availableFrom,
      availableTo,
      isOpenEndedAvailability: isOpenEnded,
    })
  }

  const manager0Id = managers[0]._id
  const candidateDocs = await CandidateModel.insertMany(
    candidatePool.map((c) => ({ ...c, createdBy: manager0Id })),
  )
  console.log(`Created ${candidateDocs.length} candidates`)

  // ── Positions ─────────────────────────────────────────────────────────────
  const positionDocs: mongoose.Document[] = []

  for (let ci = 0; ci < companies.length; ci++) {
    const company = companies[ci]
    const client = clients[ci]
    const techStack = company.technologies as string[]
    const needs = company.hiringNeeds as string[]

    for (let p = 0; p < needs.length; p++) {
      const title = needs[p] ?? pick(POSITION_TITLES)
      const seniority = pick(['junior', 'middle', 'senior'] as const)

      // Closed/completed positions (created months ago)
      const closedPos = await PositionModel.create({
        title,
        seniority: 'middle',
        stack: pickN(techStack, Math.min(techStack.length, rand(2, 4))),
        neededFrom: daysAgo(rand(90, 180)),
        neededTo: daysAgo(rand(10, 40)),
        isOpenEndedTerm: false,
        status: 'closed',
        createdBy: managers[0]._id,
        companyId: company._id,
        assignedClient: client._id,
      })
      positionDocs.push(closedPos)

      // Active open position
      const openPos = await PositionModel.create({
        title,
        seniority,
        stack: pickN(techStack, Math.min(techStack.length, rand(2, 4))),
        neededFrom: daysFromNow(rand(3, 14)),
        neededTo: isOpenEndedTitleCheck(title) ? undefined : daysFromNow(rand(60, 180)),
        isOpenEndedTerm: isOpenEndedTitleCheck(title),
        status: 'open',
        createdBy: managers[ci % managers.length]._id,
        companyId: company._id,
        assignedClient: client._id,
      })
      positionDocs.push(openPos)
    }
  }
  console.log(`Created ${positionDocs.length} positions`)

  // ── Bookings ──────────────────────────────────────────────────────────────
  const availableCandidates = candidateDocs.filter((c) => c.availability === 'available')
  const leasedCandidates = candidateDocs.filter((c) => c.availability === 'leased')

  let bookingCount = 0

  // Completed bookings (past, closed positions)
  const closedPositions = positionDocs.filter((p) => p.status === 'closed')
  for (const pos of closedPositions) {
    const candidate = pick(availableCandidates)
    const from = daysAgo(rand(90, 120))
    const to = daysAgo(rand(10, 40))
    await CandidateBookingModel.create({
      candidateId: candidate._id,
      positionId: pos._id,
      requestedFrom: from,
      requestedTo: to,
      weeklyHours: pick([20, 30, 40]),
      status: 'completed',
      comment: 'Підтверджено клієнтом після технічного інтерв\'ю.',
      managerComment: 'Кандидат успішно пройшов випробувальний термін.',
      createdBy: pos.createdBy,
    })
    bookingCount++
  }

  // Approved bookings for leased candidates
  const openPositions = positionDocs.filter((p) => p.status === 'open')
  for (const cand of leasedCandidates.slice(0, Math.min(leasedCandidates.length, 5))) {
    const pos = pick(openPositions)
    const from = daysAgo(rand(5, 20))
    const to = daysFromNow(rand(14, 60))
    await CandidateBookingModel.create({
      candidateId: cand._id,
      positionId: pos._id,
      requestedFrom: from,
      requestedTo: to,
      weeklyHours: pick([20, 40]),
      status: 'approved',
      comment: 'Клієнт підтвердив готовність розпочати.',
      managerComment: 'Схвалено після узгодження умов.',
      createdBy: pos.createdBy,
    })
    bookingCount++
  }

  // New (pending) bookings from clients
  for (const client of clients) {
    const pos = pick(openPositions)
    const candidate = pick(availableCandidates)
    await CandidateBookingModel.create({
      candidateId: candidate._id,
      positionId: pos._id,
      requestedFrom: daysFromNow(rand(7, 21)),
      requestedTo: daysFromNow(rand(30, 120)),
      weeklyHours: 40,
      status: 'new',
      comment: 'Зацікавлені в цьому спеціалісті для нашого проєкту.',
      createdBy: client._id,
    })
    bookingCount++
  }

  console.log(`Created ${bookingCount} bookings`)

  // ── Chats + Messages ──────────────────────────────────────────────────────
  const manager0 = managers[0]
  const manager1 = managers[1]

  let chatMsgCount = 0
  for (const client of clients) {
    const chat = await ChatModel.create({ clientUserId: client._id })

    const msgs: { senderUserId: Types.ObjectId; senderRole: 'manager' | 'client'; text: string; createdAt: Date }[] = []
    const baseTime = daysAgo(rand(5, 20)).getTime()

    const clientOpen = pick(CHAT_MESSAGES_POOL.clientOpen)
    const mgrReply1 = pick(CHAT_MESSAGES_POOL.managerReply1)
    const clientFollow = pick(CHAT_MESSAGES_POOL.clientFollow)
    const mgrReply2 = pick(CHAT_MESSAGES_POOL.managerReply2)
    const clientClose = pick(CHAT_MESSAGES_POOL.clientClosing)

    msgs.push(
      { senderUserId: client._id as Types.ObjectId, senderRole: 'client', text: clientOpen, createdAt: new Date(baseTime) },
      { senderUserId: manager0._id as Types.ObjectId, senderRole: 'manager', text: mgrReply1, createdAt: new Date(baseTime + 3_600_000) },
      { senderUserId: client._id as Types.ObjectId, senderRole: 'client', text: clientFollow, createdAt: new Date(baseTime + 7_200_000) },
      { senderUserId: manager1._id as Types.ObjectId, senderRole: 'manager', text: mgrReply2, createdAt: new Date(baseTime + 10_800_000) },
      { senderUserId: client._id as Types.ObjectId, senderRole: 'client', text: clientClose, createdAt: new Date(baseTime + 14_400_000) },
    )

    for (const msg of msgs) {
      await ChatMessageModel.create({ chatId: chat._id, ...msg })
      chatMsgCount++
    }

    const lastMsg = msgs[msgs.length - 1]
    chat.lastMessageText = lastMsg.text
    chat.lastMessageAt = lastMsg.createdAt
    await chat.save()
  }
  console.log(`Created ${clients.length} chats and ${chatMsgCount} messages`)

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n=== Seed complete ===')
  console.log(`  Skills:     ${skillDocs.length}`)
  console.log(`  Managers:   ${managers.length}`)
  console.log(`  Clients:    ${clients.length}`)
  console.log(`  Companies:  ${companies.length}`)
  console.log(`  Candidates: ${candidateDocs.length}`)
  console.log(`  Positions:  ${positionDocs.length}`)
  console.log(`  Bookings:   ${bookingCount}`)
  console.log(`  Chats:      ${clients.length}  (messages: ${chatMsgCount})`)
  console.log('\nDemo credentials (all passwords: password123):')
  console.log('  manager1@demo.com  — manager')
  console.log('  manager2@demo.com  — manager')
  console.log('  client1@demo.com   — client  (Finova Tech)')
  console.log('  client2@demo.com   — client  (EduStream)')
  console.log('  client3@demo.com   — client  (HealthBridge)')
  console.log('  client4@demo.com   — client  (ShipLogic)')
  console.log('  client5@demo.com   — client  (DataPulse)')

  await mongoose.disconnect()
}

function isOpenEndedTitleCheck(title: string) {
  return ['DevOps Engineer', 'Machine Learning Engineer', 'Data Engineer'].includes(title)
}

seed().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
