import { useEffect, useState } from 'react'

import { useAuth } from '../../context/auth-context'
import { FilterCheckboxList } from '../../shared/filter-checkbox-list'
import { skillService } from '../skill/skill-service'
import type { CreatePositionPayload, PositionSeniority, PositionSummary } from './position-types'

interface PositionFormProps {
  companyId: string
  onSubmit: (payload: CreatePositionPayload) => Promise<boolean>
  isLoading: boolean
  submitLabel?: string
  initialPosition?: PositionSummary
}

export const PositionForm = ({
  companyId,
  onSubmit,
  isLoading,
  submitLabel = 'Додати позицію',
  initialPosition,
}: PositionFormProps) => {
  const { authData } = useAuth()
  const accessToken = authData!.tokens.accessToken

  const [title, setTitle] = useState('')
  const [seniority, setSeniority] = useState<PositionSeniority>('middle')
  const [stack, setStack] = useState<string[]>([])
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const [neededFrom, setNeededFrom] = useState(() => new Date().toISOString().split('T')[0])
  const [neededTo, setNeededTo] = useState('')
  const [isOpenEndedTerm, setIsOpenEndedTerm] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const loadSkills = async () => {
      setIsLoadingSkills(true)
      try {
        const response = await skillService.list(accessToken)
        setAvailableSkills(response.skills.map((skill) => skill.name))
      } catch {
        setFormError('Не вдалося завантажити базу навичок')
      } finally {
        setIsLoadingSkills(false)
      }
    }

    void loadSkills()
  }, [accessToken])

  useEffect(() => {
    if (!initialPosition) {
      return
    }

    setTitle(initialPosition.title)
    setSeniority(initialPosition.seniority)
    setStack(initialPosition.stack)
    setNeededFrom(new Date(initialPosition.neededFrom).toISOString().split('T')[0])
    setNeededTo(
      initialPosition.neededTo ? new Date(initialPosition.neededTo).toISOString().split('T')[0] : '',
    )
    setIsOpenEndedTerm(initialPosition.isOpenEndedTerm)
    setFormError(null)
  }, [initialPosition])

  useEffect(() => {
    if (!initialPosition || !availableSkills.length) {
      return
    }

    const merged = [...new Set([...availableSkills, ...initialPosition.stack])]
    if (merged.length !== availableSkills.length) {
      setAvailableSkills(merged)
    }
  }, [availableSkills, initialPosition])

  const toggleSkill = (skill: string) => {
    setStack((previous) => {
      if (previous.includes(skill)) {
        return previous.filter((item) => item !== skill)
      }

      return [...previous, skill]
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    if (!stack.length) {
      setFormError('Оберіть хоча б одну навичку з бази')
      return
    }

    if (!isOpenEndedTerm && !neededTo) {
      setFormError('Вкажіть дату завершення або оберіть "невизначений термін"')
      return
    }

    const created = await onSubmit({
      title,
      seniority,
      stack,
      neededFrom,
      neededTo: isOpenEndedTerm ? undefined : neededTo,
      isOpenEndedTerm,
      companyId,
    })

    if (created) {
      if (!initialPosition) {
        setTitle('')
        setSeniority('middle')
        setStack([])
        setNeededFrom(new Date().toISOString().split('T')[0])
        setNeededTo('')
        setIsOpenEndedTerm(true)
      }
      setFormError(null)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-1">
        <span className="text-sm text-slate-600">Назва позиції</span>
        <input
          required
          minLength={2}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none ring-sky-300 transition focus:ring"
          placeholder="Frontend Engineer"
          disabled={isLoading}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-slate-600">Рівень</span>
        <select
          value={seniority}
          onChange={(event) => setSeniority(event.target.value as PositionSeniority)}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none ring-sky-300 transition focus:ring"
          disabled={isLoading}
        >
          <option value="junior">Junior</option>
          <option value="middle">Middle</option>
          <option value="senior">Senior</option>
        </select>
      </label>

      <div className="space-y-2">
        <span className="text-sm text-slate-600">Навички з єдиної бази</span>
        {isLoadingSkills ? (
          <p className="text-sm text-slate-500">Завантажуємо навички...</p>
        ) : availableSkills.length === 0 ? (
          <p className="text-sm text-slate-500">База навичок порожня. Додайте навички на сторінці "База навичок".</p>
        ) : (
          <FilterCheckboxList
            title="Навички з єдиної бази"
            panel={false}
            options={availableSkills.map((s) => ({ value: s, label: s }))}
            selected={new Set(stack)}
            onToggle={toggleSkill}
            searchPlaceholder="Пошук навичок..."
            disabled={isLoading}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm text-slate-600">Потрібно з</span>
          <input
            required
            type="date"
            value={neededFrom}
            onChange={(event) => setNeededFrom(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none ring-sky-300 transition focus:ring"
            disabled={isLoading}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-slate-600">Потрібно до</span>
          <input
            type="date"
            value={neededTo}
            onChange={(event) => setNeededTo(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none ring-sky-300 transition focus:ring disabled:cursor-not-allowed disabled:bg-slate-100"
            disabled={isLoading || isOpenEndedTerm}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={isOpenEndedTerm}
          onChange={(event) => setIsOpenEndedTerm(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 accent-slate-900"
          disabled={isLoading}
        />
        Невизначений термін
      </label>

      {formError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
      >
        {isLoading ? 'Зберігаємо...' : submitLabel}
      </button>
    </form>
  )
}
