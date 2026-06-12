import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDemoVehicles, useDemoHistory } from '../../hooks/useDemoData'
import { BatterySnapshot } from '../../utils/mockData'
import { socColor, sohColor } from '../../utils/battery'
import SparkLine from '../../components/charts/SparkLine'
import { TrendingDown, TrendingUp, Minus, AlertTriangle, Battery, Thermometer, Zap, Activity, ChevronRight } from 'lucide-react'

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0.5) return <TrendingUp size={14} className="text-green-400" />
  if (delta < -0.5) return <TrendingDown size={14} className="text-red-400" />
  return <Minus size={14} className="text-slate-500" />
}

function FleetStatCard({ label, value, unit, delta, sparkData, color, icon }: any) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}18` }}>
            {icon}
          </div>
          <span className="label">{label}</span>
        </div>
        <div className="flex items-center gap-1" style={{ color: delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : 'var(--text-muted)' }}>
          <TrendIcon delta={delta} />
          <span className="text-xs font-medium">{delta > 0 ? '+' : ''}{delta.toFixed(1)}</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-3xl font-bold" style={{ color }}>{value}</span>
          {unit && <span className="text-sm ml-1 secondary-text">{unit}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <SparkLine data={sparkData} color={color} height={44} />
        </div>
      </div>
    </div>
  )
}

function SoHCircle({ soh }: { soh: number }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const fill = circ * (soh / 100)
  const color = soh >= 80 ? '#22c55e' : soh >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--bg-surface)" strokeWidth="3.5" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>{soh.toFixed(0)}</span>
      </div>
    </div>
  )
}

function VehicleRow({ vehicle }: { vehicle: any }) {
  const history = useDemoHistory(vehicle.vehicle_id, 20)
  const last = history[history.length - 1]
  if (!last) return null

  const charging = last.current > 0
  const tempWarn = last.temperature > 40
  const socC = socColor(last.soc)
  const sohC = sohColor(last.soh)

  return (
    <Link to={`/vehicles/${vehicle.vehicle_id}`}>
      <div className="card-hover group">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <SoHCircle soh={last.soh} />
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {vehicle.make} {vehicle.model}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {vehicle.plate_number || vehicle.vehicle_id} · {vehicle.year}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {charging && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                <Zap size={11} /> Заряд
              </span>
            )}
            {tempWarn && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                <Thermometer size={11} /> {last.temperature.toFixed(0)}°C
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
              {vehicle.battery_chemistry}
            </span>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'SoC', value: `${last.soc.toFixed(1)}%`, color: socC },
            { label: 'SoH', value: `${last.soh.toFixed(1)}%`, color: sohC },
            { label: 'Темп.', value: `${last.temperature.toFixed(0)}°C`, color: last.temperature > 40 ? '#ef4444' : '#f59e0b' },
            { label: 'Сопр.', value: `${last.internal_resistance.toFixed(1)}мΩ`, color: 'var(--text-primary)' },
          ].map(m => (
            <div key={m.label} className="stat-box text-center">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
              <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* SoC bar */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Заряд батареи</span>
            <span className="text-xs font-medium" style={{ color: socC }}>{last.soc.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${last.soc}%`, backgroundColor: socC,
                boxShadow: charging ? `0 0 8px ${socC}80` : 'none' }} />
          </div>
        </div>

        {/* Mini sparkline */}
        <div className="mt-3 -mx-1">
          <SparkLine data={history.map(h => h.soc)} color={socC} height={32} />
        </div>
      </div>
    </Link>
  )
}

// Один ТС — собирает снапшот и кладёт в ref родителя
function VehicleCollector({ vehicleId, onData }: {
  vehicleId: string
  onData: (id: string, last: BatterySnapshot, prev: BatterySnapshot) => void
}) {
  const history = useDemoHistory(vehicleId, 30)
  const last = history[history.length - 1]
  const prev = history[history.length - 6] ?? last

  // Стабильные примитивы как зависимости — не вызовет бесконечный цикл
  const soc  = last?.soc
  const soh  = last?.soh
  const temp = last?.temperature

  useEffect(() => {
    if (last && prev) onData(vehicleId, last, prev)
  }, [vehicleId, soc, soh, temp]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

// Fleet-level aggregated stats — динамически по всем ТС из стора
function FleetStats() {
  const vehicles = useDemoVehicles()
  const [snapshots, setSnapshots] = useState<Record<string, { last: BatterySnapshot; prev: BatterySnapshot }>>({})

  // useCallback — стабильная ссылка, не вызывает лишних ре-рендеров
  const handleData = useCallback((id: string, last: BatterySnapshot, prev: BatterySnapshot) => {
    setSnapshots(s => {
      const cur = s[id]
      if (cur?.last.soc === last.soc && cur?.last.soh === last.soh && cur?.last.temperature === last.temperature) return s
      return { ...s, [id]: { last, prev } }
    })
  }, [])

  const lasts = Object.values(snapshots).map(s => s.last)
  const prevs  = Object.values(snapshots).map(s => s.prev)
  const n = lasts.length || 1

  const avgSoC  = lasts.reduce((s, l) => s + l.soc, 0) / n
  const avgSoH  = lasts.reduce((s, l) => s + l.soh, 0) / n
  const avgTemp = lasts.reduce((s, l) => s + l.temperature, 0) / n
  const prevSoC  = prevs.reduce((s, l) => s + l.soc, 0) / n
  const prevSoH  = prevs.reduce((s, l) => s + l.soh, 0) / n
  const prevTemp = prevs.reduce((s, l) => s + l.temperature, 0) / n
  const alerts  = lasts.filter(l => l.soh < 80 || l.temperature > 40 || l.soc < 15).length
  const sparkSoC = lasts.map(l => l.soc)
  const sparkSoH = lasts.map(l => l.soh)
  const sparkTemp = lasts.map(l => l.temperature)

  return (
    <>
      {vehicles.map(v => (
        <VehicleCollector key={v.vehicle_id} vehicleId={v.vehicle_id} onData={handleData} />
      ))}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <FleetStatCard label="Заряд батареи (SoC)" value={avgSoC.toFixed(1)} unit="%" delta={avgSoC - prevSoC}
          sparkData={sparkSoC.length ? sparkSoC : [0]} color="#22c55e"
          icon={<Battery size={16} style={{ color: '#22c55e' }} />} />
        <FleetStatCard label="Здоровье батареи (SoH)" value={avgSoH.toFixed(1)} unit="%" delta={avgSoH - prevSoH}
          sparkData={sparkSoH.length ? sparkSoH : [0]} color="#3b82f6"
          icon={<Activity size={16} style={{ color: '#3b82f6' }} />} />
        <FleetStatCard label="Температура" value={avgTemp.toFixed(1)} unit="°C" delta={-(avgTemp - prevTemp)}
          sparkData={sparkTemp.length ? sparkTemp : [0]} color="#f59e0b"
          icon={<Thermometer size={16} style={{ color: '#f59e0b' }} />} />
        <FleetStatCard label="Предупреждения" value={alerts} unit="" delta={0}
          sparkData={[alerts]} color={alerts > 0 ? '#ef4444' : '#22c55e'}
          icon={<AlertTriangle size={16} style={{ color: alerts > 0 ? '#ef4444' : '#22c55e' }} />} />
      </div>
    </>
  )
}

export default function Overview() {
  const vehicles = useDemoVehicles()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 5000)
    return () => clearInterval(id)
  }, [])

  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Главная</h1>
          <p className="page-subtitle">Состояние батарей · {vehicles.length} {vehicles.length === 1 ? 'автомобиль' : 'автомобилей'} · данные обновляются каждые 5 сек.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{timeStr}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{dateStr}</p>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Онлайн
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <FleetStats />

      {/* Vehicle list */}
      <div>
        <p className="label mb-4">Выберите автомобиль для анализа батареи</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map(v => <VehicleRow key={v.vehicle_id} vehicle={v} />)}
        </div>
      </div>
    </div>
  )
}
