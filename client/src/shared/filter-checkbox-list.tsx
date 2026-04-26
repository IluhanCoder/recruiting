import { useState } from 'react'

export interface FilterCheckboxListOption {
  value: string
  label: string
}

interface FilterCheckboxListProps {
  /** Panel heading (uppercase label above the list) */
  title: string
  options: FilterCheckboxListOption[]
  selected: Set<string>
  onToggle: (value: string) => void
  /** Shown when options is empty (before any search) */
  emptyMessage?: string
  searchPlaceholder?: string
  /**
   * When true, wraps the list in a sidebar-panel card
   * (rounded-2xl glass card with padding).
   * When false, renders only search + list – useful inside forms.
   * Default: true
   */
  panel?: boolean
  /** Extra Tailwind class on the outer wrapper */
  className?: string
  disabled?: boolean
}

export const FilterCheckboxList = ({
  title,
  options,
  selected,
  onToggle,
  emptyMessage = 'Немає елементів',
  searchPlaceholder = 'Пошук...',
  panel = true,
  className = '',
  disabled = false,
}: FilterCheckboxListProps) => {
  const [query, setQuery] = useState('')

  const visible = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const inner = (
    <>
      {options.length > 0 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none ring-sky-300 transition focus:ring"
        />
      )}

      {options.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-slate-400">Нічого не знайдено</p>
      ) : (
        <ul className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
          {visible.map((opt) => (
            <li key={opt.value}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 hover:text-slate-950">
                <input
                  type="checkbox"
                  checked={selected.has(opt.value)}
                  onChange={() => onToggle(opt.value)}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-slate-300 accent-sky-600 disabled:cursor-not-allowed"
                />
                <span className="leading-tight">{opt.label}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </>
  )

  if (!panel) {
    return (
      <div className={className}>
        <p className="mb-2 text-sm font-semibold text-slate-700">{title}</p>
        {inner}
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border border-white/70 bg-white/70 p-5 shadow backdrop-blur ${className}`}>
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">{title}</p>
      {inner}
    </div>
  )
}
