import { useState } from 'react'

import type { RegisterPayload } from './auth-types'

interface RegisterFormProps {
  onSubmit: (payload: RegisterPayload) => Promise<void>
  isLoading: boolean
}

export const RegisterForm = ({ onSubmit, isLoading }: RegisterFormProps) => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({ fullName, email, password })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-slate-950">Реєстрація компанії / менеджера</h2>
      <label className="block space-y-1">
        <span className="text-sm text-slate-600">Ім'я</span>
        <input
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none ring-sky-300 transition focus:ring"
          placeholder="Олександр Іваненко"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-slate-600">Email</span>
        <input
          required
          type="email"
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none ring-sky-300 transition focus:ring"
          placeholder="company@client.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-slate-600">Пароль</span>
        <input
          required
          type="password"
          minLength={6}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none ring-sky-300 transition focus:ring"
          placeholder="******"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
      >
        {isLoading ? 'Створюємо...' : 'Створити акаунт'}
      </button>
    </form>
  )
}
