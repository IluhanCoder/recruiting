import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/auth-context'

interface AppNavProps {
  title: string
  actions?: ReactNode
}

export const AppNav = ({ title, actions }: AppNavProps) => {
  const { authData, clearSession } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const { role, fullName, email } = authData!.user

  const handleLogout = () => {
    clearSession()
    void navigate('/login')
  }

  const linkClass = (path: string) =>
    pathname === path
      ? 'rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white'
      : 'rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100'

  return (
    <header className="flex flex-wrap bg-red-700 items-center justify-between gap-4 rounded-3xl border border-white/70 bg-white/70 p-6 shadow-lg backdrop-blur">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recruiting Platform</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950 md:text-3xl">{title}</h1>
        <p className="mt-2 inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700">
          {fullName} ({email}) &middot; {role}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex items-center gap-2">
          <Link to="/dashboard" className={linkClass('/dashboard')}>
            Дашборд
          </Link>
          <Link to="/candidates" className={linkClass('/candidates')}>
            Кандидати
          </Link>
          <Link to="/chats" className={linkClass('/chats')}>
            Чат
          </Link>
          {role === 'client' ? (
            <>
              <Link to="/companies" className={linkClass('/companies')}>
                Мої компанії
              </Link>
              <Link to="/my-bookings" className={linkClass('/my-bookings')}>
                Мої запити
              </Link>
              <Link to="/recommendations" className={linkClass('/recommendations')}>
                Рекомендації
              </Link>
            </>
          ) : null}
          {role === 'manager' ? (
            <>
              <Link to="/companies/all" className={linkClass('/companies/all')}>
                Всі компанії
              </Link>
              <Link to="/bookings" className={linkClass('/bookings')}>
                Запити
              </Link>
              <Link to="/skills" className={linkClass('/skills')}>
                База навичок
              </Link>
            </>
          ) : null}
        </nav>

        {actions}

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Вийти
        </button>
      </div>
    </header>
  )
}
