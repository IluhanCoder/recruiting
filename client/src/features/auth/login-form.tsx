import { useState } from 'react'

import type { LoginPayload } from './auth-types'

interface LoginFormProps {
  onSubmit: (payload: LoginPayload) => Promise<void>
  isLoading: boolean
}

export const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({ email, password })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-slate-950">Вхід у систему</h2>
      <label className="block space-y-1">
        <span className="text-sm text-slate-600">Email</span>
        <input
          required
          type="email"
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none ring-sky-300 transition focus:ring"
          placeholder="hr@company.com"
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
        className="w-full rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
      >
        {isLoading ? 'Входимо...' : 'Увійти'}
      </button>
    </form>
  )
}
