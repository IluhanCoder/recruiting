import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/auth-context'
import { AppNav } from '../../shared/app-nav'
import { Modal } from '../../shared/modal'
import { CompanyForm } from './company-form'
import { CompanyList } from './company-list'
import { companyService } from './company-service'
import type { CompanySummary, CreateCompanyPayload } from './company-types'

export const CompanyPage = () => {
  const { authData } = useAuth()
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<CompanySummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accessToken = authData!.tokens.accessToken

  const loadCompanies = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await companyService.listMine(accessToken)
      setCompanies(response.companies)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження компаній')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  const handleCreate = async (payload: CreateCompanyPayload): Promise<boolean> => {
    setError(null)
    setIsCreating(true)
    try {
      const response = await companyService.create(payload, accessToken)
      setCompanies((prev) => [response.company, ...prev])
      setIsModalOpen(false)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка створення компанії')
      return false
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    void loadCompanies()
  }, [loadCompanies])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_40%),linear-gradient(145deg,_#f8fafc_0%,_#e2e8f0_100%)] px-6 py-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <AppNav title="Мої компанії" />

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Список моїх компаній</h3>
            <button
              type="button"
              onClick={() => void loadCompanies()}
              disabled={isLoading}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Оновити
            </button>
          </div>

          <div className="max-h-[560px] overflow-y-auto pr-1">
            <CompanyList
              companies={companies}
              isLoading={isLoading}
              onCompanyClick={(company) => void navigate(`/companies/${company.id}`)}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            + Додати компанію
          </button>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Додати компанію"
        >
          <CompanyForm onSubmit={handleCreate} isLoading={isCreating} />
        </Modal>
      </section>
    </main>
  )
}
