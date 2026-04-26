import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../context/auth-context'

export const ProtectedRoute = () => {
  const { authData, isInitializing } = useAuth()

  if (isInitializing) {
    return null // silent — token verification in progress
  }

  if (!authData) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
