import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/auth-context'
import { AppNav } from '../../shared/app-nav'
import { CompanyList } from './company-list'
import { companyService } from './company-service'
import type { CompanySummary } from './company-types'

export const AllCompaniesPage = () => {
  const { authData } = useAuth()
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<CompanySummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accessToken = authData!.tokens.accessToken
  const { role } = authData!.user

  const loadCompanies = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await companyService.list(accessToken)
      setCompanies(response.companies)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження компаній')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void loadCompanies()
  }, [loadCompanies])

  if (role !== 'manager') {
    return <Navigate to="/companies" replace />
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_40%),linear-gradient(145deg,_#f8fafc_0%,_#e2e8f0_100%)] px-6 py-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <AppNav title="Всі компанії" />

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Всі компанії в системі</h3>
              <p className="text-sm text-slate-500">Зі збереженим власником кожного запису</p>
            </div>
            <button
              type="button"
              onClick={() => void loadCompanies()}
              disabled={isLoading}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Оновити
            </button>
          </div>

          <CompanyList
            companies={companies}
            isLoading={isLoading}
            emptyText="Жодної компанії ще не створено."
            onCompanyClick={(company) => void navigate(`/companies/${company.id}`)}
          />
        </div>
      </section>
    </main>
  )
}
