import type { CompanySummary } from './company-types'

interface CompanyListProps {
  companies: CompanySummary[]
  isLoading: boolean
  emptyText?: string
  onCompanyClick?: (company: CompanySummary) => void
}

export const CompanyList = ({
  companies,
  isLoading,
  emptyText = 'Додайте першу компанію через кнопку вище.',
  onCompanyClick,
}: CompanyListProps) => {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Завантажуємо список компаній...</p>
      </div>
    )
  }

  if (!companies.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Список порожній</h3>
        <p className="mt-2 text-sm text-slate-600">{emptyText}</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {companies.map((company) => (
        <li
          key={company.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {onCompanyClick ? (
                <button
                  type="button"
                  onClick={() => onCompanyClick(company)}
                  className="truncate text-left text-base font-semibold text-slate-900 hover:text-sky-700"
                >
                  {company.name}
                </button>
              ) : (
                <p className="truncate text-base font-semibold text-slate-900">{company.name}</p>
              )}

              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {company.industry ? (
                  <span className="text-sm text-slate-600">{company.industry}</span>
                ) : null}
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-sky-600 hover:underline"
                  >
                    {company.website}
                  </a>
                ) : null}
                {company.ownerName ? (
                  <span className="text-sm text-slate-500">
                    Власник: {company.ownerName}
                    {company.ownerEmail ? ` (${company.ownerEmail})` : ''}
                  </span>
                ) : null}
              </div>
            </div>

            <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              {company.teamSize} {teamSizeLabel(company.teamSize)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

const teamSizeLabel = (n: number) => {
  if (n === 1) return 'учасник'
  if (n >= 2 && n <= 4) return 'учасники'
  return 'учасників'
}
