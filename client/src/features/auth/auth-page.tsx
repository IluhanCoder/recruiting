import { useMemo, useState } from 'react'

import { authService } from './auth-service'
import type { AuthResponse, LoginPayload, RegisterPayload } from './auth-types'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'

// Legacy standalone page kept for reference. Routing is now handled by App.tsx.
export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [authData, setAuthData] = useState<AuthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (payload: LoginPayload) => {
    setError(null)
    setIsLoading(true)
    try {
      const result = await authService.login(payload)
      setAuthData(result)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Помилка авторизації')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (payload: RegisterPayload) => {
    setError(null)
    setIsLoading(true)
    try {
      const result = await authService.register(payload)
      setAuthData(result)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Помилка реєстрації')
    } finally {
      setIsLoading(false)
    }
  }

  const authStateText = useMemo(() => {
    if (!authData) {
      return 'Немає активної сесії'
    }

    return `Авторизовано як ${authData.user.fullName} (${authData.user.email}) · ${authData.user.role}`
  }, [authData])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_40%),linear-gradient(145deg,_#f8fafc_0%,_#e2e8f0_100%)] px-6 py-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-lg backdrop-blur">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recruiting Platform</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">
            Авторизація для менеджера та клієнтської компанії
          </h1>
          <p className="mt-3 text-slate-600">
            Структура винесена в feature `auth`: сервіс API + компоненти форм. Далі можна додавати
            JWT, refresh-механіку, role-based доступ і персистентну сесію.
          </p>
          <p className="mt-4 inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700">
            {authStateText}
          </p>
          {error ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
          </div>
        </div>
      </section>
    </main>
  )
}
