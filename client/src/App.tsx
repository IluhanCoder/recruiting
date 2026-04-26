import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import { AuthProvider } from './context/auth-context'
import { LoginPage } from './features/auth/login-page'
import { RegisterPage } from './features/auth/register-page'
import { BookingPage } from './features/booking/booking-page'
import { BookingRequestsPage } from './features/booking/booking-requests-page'
import { MyBookingsPage } from './features/booking/my-bookings-page'
import { CandidateDetailPage } from './features/candidate/candidate-detail-page'
import { CandidatePage } from './features/candidate/candidate-page'
import { ChatsPage } from './features/chat/chats-page'
import { CompanyPage } from './features/company/company-page'
import { CompanyDetailPage } from './features/company/company-detail-page'
import { AllCompaniesPage } from './features/company/all-companies-page'
import { DashboardPage } from './features/dashboard/dashboard-page'
import { RecommendationsPage } from './features/recommendation/recommendations-page'
import { SkillsPage } from './features/skill/skills-page'
import { ProtectedRoute } from './shared/protected-route'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/candidates', element: <CandidatePage /> },
      { path: '/candidates/:candidateId', element: <CandidateDetailPage /> },
      { path: '/candidates/:candidateId/book', element: <BookingPage /> },
      { path: '/bookings', element: <BookingRequestsPage /> },
      { path: '/my-bookings', element: <MyBookingsPage /> },
      { path: '/chats', element: <ChatsPage /> },
      { path: '/companies', element: <CompanyPage /> },
      { path: '/companies/all', element: <AllCompaniesPage /> },
      { path: '/companies/:companyId', element: <CompanyDetailPage /> },
      { path: '/skills', element: <SkillsPage /> },
      { path: '/recommendations', element: <RecommendationsPage /> },
    ],
  },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
