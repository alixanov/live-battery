import AlertBadge from './AlertBadge'
import { formatDate } from '../../utils/battery'
import { CheckCircle, Thermometer, Battery, Zap, TrendingDown, AlertTriangle } from 'lucide-react'
import { DemoAlert } from '../../hooks/useDemoAlerts'

const TYPE_ICONS: Record<string, any> = {
  LOW_SOC:        Battery,
  SOH_DEGRADATION: TrendingDown,
  OVERTEMPERATURE: Thermometer,
  HIGH_RESISTANCE: Zap,
  LOW_RUL:        AlertTriangle,
}

const TYPE_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#eab308',
  LOW:      '#60a5fa',
}

export default function AlertRow({ alert, onResolve }: { alert: DemoAlert; onResolve?: (id: string) => void }) {
  const Icon = TYPE_ICONS[alert.alert_type] ?? AlertTriangle
  const color = TYPE_COLORS[alert.priority] ?? 'var(--text-muted)'

  return (
    <div className="flex items-start gap-4 py-3.5 border-b last:border-0 transition-colors"
      style={{ borderColor: 'var(--border)' }}>
      {/* Icon */}
      <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
        style={{ backgroundColor: `${color}18` }}>
        <Icon size={15} style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <AlertBadge priority={alert.priority} />
          <span className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
            {alert.vehicle_name}
          </span>
        </div>
        <p className="text-sm font-medium mt-1.5" style={{ color: 'var(--text-primary)' }}>{alert.message}</p>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {alert.vehicle_id} · {formatDate(alert.triggered_at)}
          </p>
          <span className="text-xs" style={{ color }}>
            {alert.value.toFixed(1)} {alert.unit} / порог {alert.threshold} {alert.unit}
          </span>
        </div>
      </div>

      {/* Resolve button */}
      {alert.is_active && onResolve && (
        <button
          onClick={() => onResolve(alert.id)}
          className="shrink-0 p-1.5 rounded-lg transition-colors mt-0.5"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#22c55e')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          title="Отметить устранённым"
        >
          <CheckCircle size={18} />
        </button>
      )}
    </div>
  )
}
