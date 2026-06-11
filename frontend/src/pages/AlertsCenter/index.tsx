import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDemoAlerts } from '../../hooks/useDemoAlerts'
import {
  CheckCircle, ShieldAlert,
  Thermometer, Battery, Zap, TrendingDown, AlertTriangle, ChevronRight, Info,
} from 'lucide-react'

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#eab308',
  LOW:      '#60a5fa',
}
const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Критический',
  HIGH:     'Высокий',
  MEDIUM:   'Средний',
  LOW:      'Низкий',
}
const PRIORITIES = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const

const TYPE_ICONS: Record<string, any> = {
  LOW_SOC:         Battery,
  SOH_DEGRADATION: TrendingDown,
  OVERTEMPERATURE: Thermometer,
  HIGH_RESISTANCE: Zap,
  LOW_RUL:         AlertTriangle,
}

const RECOMMENDATIONS: Record<string, { short: string; steps: string[] }> = {
  LOW_SOC: {
    short: 'Немедленно зарядите автомобиль',
    steps: [
      'Найдите ближайшую зарядную станцию',
      'Подключите зарядку как можно скорее',
      'Не допускайте разряда ниже 5%',
    ],
  },
  SOH_DEGRADATION: {
    short: 'Требуется диагностика батареи',
    steps: [
      'Обратитесь в авторизованный сервисный центр',
      'Запросите полную диагностику аккумулятора',
      'Рассмотрите вопрос о замене батареи',
    ],
  },
  OVERTEMPERATURE: {
    short: 'Остановитесь и охладите батарею',
    steps: [
      'Остановитесь в безопасном месте',
      'Снизьте нагрузку и выключите кондиционер',
      'Не заряжайте до остывания батареи ниже 35°C',
    ],
  },
  HIGH_RESISTANCE: {
    short: 'Проверьте состояние ячеек батареи',
    steps: [
      'Обратитесь на диагностику в сервисный центр',
      'Избегайте быстрой зарядки до устранения проблемы',
      'Проверьте балансировку ячеек',
    ],
  },
  LOW_RUL: {
    short: 'Планируйте замену батареи',
    steps: [
      'Запросите оценку батареи у дилера',
      'Уточните стоимость замены аккумулятора',
      'Избегайте глубоких циклов разряда',
    ],
  },
}

export default function AlertsCenter() {
  const [activeOnly, setActiveOnly] = useState(true)
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { alerts, stats, resolve } = useDemoAlerts(activeOnly)

  const totalActive = stats.CRITICAL + stats.HIGH + stats.MEDIUM + stats.LOW

  const filtered = alerts.filter(a =>
    priority === 'ALL' || a.priority === priority
  )

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Предупреждения</h1>
          <p className="page-subtitle">Состояние батарей и сигналы тревоги по вашим автомобилям</p>
        </div>
        {totalActive > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
            <ShieldAlert size={14} />
            {totalActive} активных
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
          <div key={p} className="card cursor-pointer transition-all duration-200"
            onClick={() => setPriority(priority === p ? 'ALL' : p)}
            style={{ borderColor: priority === p ? PRIORITY_COLORS[p] : 'var(--border)', borderWidth: priority === p ? '1.5px' : '1px' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="label">{PRIORITY_LABELS[p]}</p>
              <div className="w-2 h-2 rounded-full"
                style={{ backgroundColor: PRIORITY_COLORS[p], boxShadow: stats[p] > 0 ? `0 0 8px ${PRIORITY_COLORS[p]}` : 'none' }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: PRIORITY_COLORS[p] }}>{stats[p]}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {stats[p] === 0 ? 'Нет алертов' : 'активных'}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setActiveOnly(!activeOnly)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
          style={{
            backgroundColor: activeOnly ? 'rgba(59,130,246,0.12)' : 'var(--bg-card)',
            borderColor: activeOnly ? 'var(--accent)' : 'var(--border)',
            color: activeOnly ? 'var(--accent)' : 'var(--text-secondary)',
          }}>
          {activeOnly ? 'Только активные' : 'Все'}
        </button>
        <div className="flex flex-wrap gap-1.5">
          {PRIORITIES.map(p => (
            <button key={p} onClick={() => setPriority(priority === p ? 'ALL' : p)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: priority === p
                  ? (p === 'ALL' ? 'rgba(59,130,246,0.12)' : `${PRIORITY_COLORS[p]}18`)
                  : 'transparent',
                color: priority === p
                  ? (p === 'ALL' ? 'var(--accent)' : PRIORITY_COLORS[p])
                  : 'var(--text-secondary)',
              }}>
              {p === 'ALL' ? 'Все' : PRIORITY_LABELS[p]}
              {p !== 'ALL' && stats[p] > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: `${PRIORITY_COLORS[p]}25`, color: PRIORITY_COLORS[p] }}>
                  {stats[p]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alert list */}
      <div className="card p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="mx-auto mb-3" size={40} style={{ color: '#22c55e' }} />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Всё в порядке</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {totalActive === 0 ? 'Нет активных предупреждений' : 'Нет алертов в выбранной категории'}
            </p>
          </div>
        ) : (
          filtered.map(a => {
            const Icon = TYPE_ICONS[a.alert_type] ?? AlertTriangle
            const color = PRIORITY_COLORS[a.priority]
            const rec = RECOMMENDATIONS[a.alert_type]
            const isExpanded = expandedId === a.id

            return (
              <div key={a.id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                {/* Main row */}
                <div className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${color}15` }}>
                      <Icon size={16} style={{ color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${color}18`, color }}>
                          {PRIORITY_LABELS[a.priority]}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded font-medium"
                          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                          {a.vehicle_name}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {a.value.toFixed(1)} {a.unit} / порог {a.threshold} {a.unit}
                        </span>
                      </div>

                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {a.message}
                      </p>

                      {/* Recommendation short */}
                      {rec && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : a.id)}
                          className="flex items-center gap-1.5 mt-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                          style={{ color: 'var(--accent)' }}>
                          <Info size={11} />
                          {rec.short}
                          <ChevronRight size={11} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Link to={`/vehicles/${a.vehicle_id}`}
                        title="Открыть мониторинг"
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                        <ChevronRight size={16} />
                      </Link>
                      {a.is_active && (
                        <button onClick={() => resolve(a.id)}
                          title="Отметить как устранено"
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#22c55e')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded recommendation steps */}
                  {isExpanded && rec && (
                    <div className="mt-3 ml-12 p-3 rounded-xl"
                      style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent)' }}>
                        Что делать:
                      </p>
                      <ol className="space-y-1.5">
                        {rec.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: 'rgba(59,130,246,0.18)', color: 'var(--accent)' }}>
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
