interface Props {
  label: string
  value: string | number
  unit?: string
  sub?: string
  valueColor?: string
  icon?: React.ReactNode
}

export default function StatCard({ label, value, unit, sub, valueColor, icon }: Props) {
  return (
    <div className="card flex items-center gap-4">
      {icon && (
        <div className="shrink-0 p-2.5 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="label mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold" style={{ color: valueColor ?? 'var(--text-primary)' }}>
            {value}
          </span>
          {unit && <span className="text-sm secondary-text">{unit}</span>}
        </div>
        {sub && <p className="text-xs muted-text mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
