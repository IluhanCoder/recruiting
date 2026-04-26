import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '../../context/auth-context'
import { skillService } from '../skill/skill-service'
import { AppNav } from '../../shared/app-nav'
import { Modal } from '../../shared/modal'
import { CandidateCardsWithFilters } from './candidate-cards-with-filters'
import { CandidateForm } from './candidate-form'
import { candidateService } from './candidate-service'
import type { CandidateSummary, CreateCandidatePayload } from './candidate-types'
import { bookingService } from '../booking/booking-service'

export const CandidatePage = () => {
  const { authData } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const suggestForBookingId = searchParams.get('suggestFor')
  const excludeCandidateId = searchParams.get('excludeCandidate')

  const [candidates, setCandidates] = useState<CandidateSummary[]>([])
  const [skillOptions, setSkillOptions] = useState<string[]>([])
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false)
  const [isCreatingCandidate, setIsCreatingCandidate] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)

  const accessToken = authData!.tokens.accessToken
  const { role } = authData!.user

  const canCreateCandidate = role === 'manager' && !suggestForBookingId

  const handleSuggestCandidate = async (candidate: CandidateSummary) => {
    if (!suggestForBookingId) return
    setSuggestError(null)
    setIsSuggesting(true)
    try {
      await bookingService.update(
        suggestForBookingId,
        { action: 'suggest', suggestedCandidateId: candidate.id },
        accessToken,
      )
      void navigate('/bookings')
    } catch (requestError) {
      setSuggestError(
        requestError instanceof Error ? requestError.message : 'Помилка пропозиції кандидата',
      )
    } finally {
      setIsSuggesting(false)
    }
  }

  const loadCandidates = useCallback(async () => {
    setError(null)
    setIsLoadingCandidates(true)
    try {
      const [candidateResult, skillResult] = await Promise.all([
        candidateService.list(accessToken),
        skillService.list(accessToken),
      ])

      setCandidates(candidateResult.candidates)
      setSkillOptions(skillResult.skills.map((skill) => skill.name))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Помилка завантаження кандидатів')
    } finally {
      setIsLoadingCandidates(false)
    }
  }, [accessToken])

  const handleCreateCandidate = async (payload: CreateCandidatePayload): Promise<boolean> => {
    if (!canCreateCandidate) {
      setError('Лише менеджер може додавати кандидатів')
      return false
    }

    setError(null)
    setIsCreatingCandidate(true)

    try {
      const response = await candidateService.create(payload, accessToken)
      setCandidates((previous) => [response.candidate, ...previous])
      setIsModalOpen(false)
      return true
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Помилка створення кандидата')
      return false
    } finally {
      setIsCreatingCandidate(false)
    }
  }

  useEffect(() => {
    void loadCandidates()
  }, [loadCandidates])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_40%),linear-gradient(145deg,_#f8fafc_0%,_#e2e8f0_100%)] px-6 py-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <AppNav
          title={suggestForBookingId ? 'Оберіть кандидата для заміни' : 'База кандидатів'}
          actions={
            suggestForBookingId ? (
              <button
                type="button"
                onClick={() => void navigate('/bookings')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Скасувати вибір
              </button>
            ) : undefined
          }
        />

        {suggestForBookingId ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Оберіть кандидата для підстановки в запит на бронювання. Кандидат має бути вільний.
          </div>
        ) : null}

        {suggestError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {suggestError}
          </p>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Список кандидатів</h3>
            <button
              type="button"
              onClick={() => void loadCandidates()}
              disabled={isLoadingCandidates}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Оновити
            </button>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="max-h-[560px] overflow-y-auto pr-1">
            <CandidateCardsWithFilters
              candidates={
                suggestForBookingId && excludeCandidateId
                  ? candidates.filter((c) => c.id !== excludeCandidateId)
                  : candidates
              }
              companies={[]}
              positions={[]}
              isLoading={isLoadingCandidates || isSuggesting}
              emptyText='Додайте першого кандидата через кнопку "Додати кандидата".'
              showCompanyFilter={false}
              showPositionFilter={false}
              skillOptions={skillOptions}
              onCandidateClick={
                suggestForBookingId
                  ? (candidate) => void handleSuggestCandidate(candidate)
                  : (candidate) => void navigate(`/candidates/${candidate.id}`)
              }
            />
          </div>

          {canCreateCandidate ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + Додати кандидата
            </button>
          ) : null}
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Додати кандидата"
        >
          <CandidateForm
            onSubmit={handleCreateCandidate}
            isLoading={isCreatingCandidate}
            canCreate={canCreateCandidate}
            skillOptions={skillOptions}
          />
        </Modal>
      </section>
    </main>
  )
}
