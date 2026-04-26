import { useState } from 'react'

import type { CreateCompanyPayload } from './company-types'

interface CompanyFormProps {
  onSubmit: (payload: CreateCompanyPayload) => Promise<boolean>
  isLoading: boolean
}

export const CompanyForm = ({ onSubmit, isLoading }: CompanyFormProps) => {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const isCreated = await onSubmit({
      name,
      website: website.trim() || undefined,
      industry: industry.trim() || undefined,
    })

    if (isCreated) {
      setName('')
      setWebsite('')
      setIndustry('')
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-1">
        <span className="text-sm text-slate-600">
          Назва компанії <span className="text-red-500">*</span>
        </span>
        <input
          required
          minLength={2}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none ring-sky-300 transition focus:ring"
          placeholder="Acme Corp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-slate-600">
          Галузь <span className="text-slate-400">(необов'язково)</span>
        </span>
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none ring-sky-300 transition focus:ring"
          placeholder="FinTech / Healthcare / E-commerce"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          disabled={isLoading}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-slate-600">
          Вебсайт <span className="text-slate-400">(необов'язково)</span>
        </span>
        <input
          type="url"
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none ring-sky-300 transition focus:ring"
          placeholder="https://example.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          disabled={isLoading}
        />
      </label>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
      >
        {isLoading ? 'Зберігаємо...' : 'Створити компанію'}
      </button>
    </form>
  )
}
