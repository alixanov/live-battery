import { useState } from 'react'
import { useDemoVehicles, useDemoHistory } from '../../hooks/useDemoData'
import { socColor, sohColor, sohLabel } from '../../utils/battery'
import { GitCompare, ChevronDown, Activity, Battery, Thermometer, Zap, TrendingDown } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts'

function VehicleSelector({ label, value, onChange, vehicles, exclude }: any) {
  return (
    <div className="relative">
      <p className="label mb-2">{label}</p>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            backgroundImage: 'none',
          }}>
          <option value="">— Выберите автомобиль —</option>
          {vehicles
            .filter((v: any) => v.vehicle_id !== exclude)
            .map((v: any) => (
              <option key={v.vehicle_id} value={v.vehicle_id}>
                {v.make} {v.model} ({v.year})
              </option>
            ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  )
}

function MetricRow({ label, a, b, unit = '', higherBetter = true }: {
  label: string; a: number; b: number; unit?: string; higherBetter?: boolean
}) {
  const diff = a - b
  const aWins = higherBetter ? diff > 0 : diff < 0
  const bWins = higherBetter ? diff < 0 : diff > 0
  const maxVal = Math.max(Math.abs(a), Math.abs(b), 0.001)
  const aWidth = Math.round((a / maxVal) * 100)
  const bWidth = Math.round((b / maxVal) * 100)

  return (
    <div className="py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Left bar (A) */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm font-bold" style={{ color: aWins ? '#22c55e' : 'var(--text-primary)' }}>
            {a.toFixed(1)}{unit}
          </span>
          <div className="h-2 rounded-full w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div className="h-full rounded-full ml-auto transition-all duration-700"
              style={{ width: `${aWidth}%`, backgroundColor: aWins ? '#22c55e' : '#3b82f6' }} />
          </div>
        </div>
        {/* Center label */}
        <div className="text-center shrink-0">
          {aWins && <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>◀</span>}
          {bWins && <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>▶</span>}
          {!aWins && !bWins && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>=</span>}
        </div>
        {/* Right bar (B) */}
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm font-bold" style={{ color: bWins ? '#22c55e' : 'var(--text-primary)' }}>
            {b.toFixed(1)}{unit}
          </span>
          <div className="h-2 rounded-full w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${bWidth}%`, backgroundColor: bWins ? '#22c55e' : '#a78bfa' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function VehicleCompareData({ vehicleId, color, label }: { vehicleId: string; color: string; label: string }) {
  const vehicles = useDemoVehicles()
  const vehicle = vehicles.find(v => v.vehicle_id === vehicleId)!
  const history = useDemoHistory(vehicleId, 30)
  const last = history[history.length - 1]

  if (!last || !vehicle) return null

  const sohC = sohColor(last.soh)
  const socC = socColor(last.soc)

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: color }}>
          {vehicle.make[0]}
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{label}: {vehicle.make} {vehicle.model}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{vehicle.year} · {vehicle.battery_chemistry} · {vehicle.battery_nominal_capacity} кВт·ч</p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'SoH', value: `${last.soh.toFixed(1)}%`, color: sohC, sub: sohLabel(last.soh), icon: <Activity size={14} style={{ color: sohC }} /> },
          { label: 'SoC', value: `${last.soc.toFixed(1)}%`, color: socC, sub: 'Заряд батареи', icon: <Battery size={14} style={{ color: socC }} /> },
          { label: 'Температура', value: `${last.temperature.toFixed(1)}°C`, color: last.temperature > 40 ? '#ef4444' : '#f59e0b', sub: last.temperature > 40 ? 'Высокая' : 'Норма', icon: <Thermometer size={14} style={{ color: last.temperature > 40 ? '#ef4444' : '#f59e0b' }} /> },
          { label: 'Сопротивление', value: `${last.internal_resistance.toFixed(1)} мОм`, color: 'var(--text-primary)', sub: last.internal_resistance > 25 ? 'Критично' : 'Норма', icon: <Zap size={14} style={{ color: 'var(--text-muted)' }} /> },
          { label: 'Ресурс', value: `${last.rul_cycles} цикл.`, color: last.rul_cycles > 300 ? '#22c55e' : '#f59e0b', sub: `~${last.rul_days} дней`, icon: <TrendingDown size={14} style={{ color: 'var(--text-muted)' }} /> },
          { label: 'Ёмкость', value: `${vehicle.battery_nominal_capacity} кВт·ч`, color: 'var(--accent)', sub: vehicle.battery_chemistry, icon: <Battery size={14} style={{ color: 'var(--accent)' }} /> },
        ].map(m => (
          <div key={m.label} className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              {m.icon}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
            </div>
            <p className="text-base font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompareRadar({ idA, idB, nameA, nameB }: { idA: string; idB: string; nameA: string; nameB: string }) {
  const histA = useDemoHistory(idA, 10)
  const histB = useDemoHistory(idB, 10)
  const lastA = histA[histA.length - 1]
  const lastB = histB[histB.length - 1]

  if (!lastA || !lastB) return null

  const data = [
    { metric: 'SoH', A: lastA.soh, B: lastB.soh, full: 100 },
    { metric: 'SoC', A: lastA.soc, B: lastB.soc, full: 100 },
    { metric: 'RUL', A: Math.min(lastA.rul_cycles / 10, 100), B: Math.min(lastB.rul_cycles / 10, 100), full: 100 },
    { metric: 'Темп.', A: Math.max(0, 100 - lastA.temperature * 1.5), B: Math.max(0, 100 - lastB.temperature * 1.5), full: 100 },
    { metric: 'Сопр.', A: Math.max(0, 100 - lastA.internal_resistance * 2.5), B: Math.max(0, 100 - lastB.internal_resistance * 2.5), full: 100 },
  ]

  return (
    <div className="card">
      <p className="label mb-1">Радарная диаграмма</p>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Нормализованное сравнение по 5 метрикам (выше = лучше)</p>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
          <Radar name={nameA} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} dot />
          <Radar name={nameB} dataKey="B" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.25} strokeWidth={2} dot />
          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
            labelStyle={{ color: 'var(--text-muted)', fontSize: 11 }}
            itemStyle={{ color: 'var(--text-primary)', fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function CompareMetrics({ idA, idB }: { idA: string; idB: string }) {
  const histA = useDemoHistory(idA, 10)
  const histB = useDemoHistory(idB, 10)
  const lastA = histA[histA.length - 1]
  const lastB = histB[histB.length - 1]
  if (!lastA || !lastB) return null

  return (
    <div className="card">
      <p className="label mb-1">Детальное сравнение метрик</p>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Зелёный — лучшее значение</p>
      <MetricRow label="Здоровье батареи (SoH)" a={lastA.soh} b={lastB.soh} unit="%" />
      <MetricRow label="Уровень заряда (SoC)" a={lastA.soc} b={lastB.soc} unit="%" />
      <MetricRow label="Температура батареи" a={lastA.temperature} b={lastB.temperature} unit="°C" higherBetter={false} />
      <MetricRow label="Внутреннее сопротивление" a={lastA.internal_resistance} b={lastB.internal_resistance} unit=" мОм" higherBetter={false} />
      <MetricRow label="Остаточный ресурс (циклы)" a={lastA.rul_cycles} b={lastB.rul_cycles} unit="" />
      <MetricRow label="Остаточный ресурс (дни)" a={lastA.rul_days} b={lastB.rul_days} unit="" />
    </div>
  )
}

export default function Compare() {
  const vehicles = useDemoVehicles()
  const [idA, setIdA] = useState(vehicles[0]?.vehicle_id ?? '')
  const [idB, setIdB] = useState(vehicles[1]?.vehicle_id ?? '')

  const vA = vehicles.find(v => v.vehicle_id === idA)
  const vB = vehicles.find(v => v.vehicle_id === idB)
  const nameA = vA ? `${vA.make} ${vA.model}` : 'Авто А'
  const nameB = vB ? `${vB.make} ${vB.model}` : 'Авто Б'

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Сравнение автомобилей</h1>
        <p className="page-subtitle">Выберите два автомобиля для детального сравнения батарей</p>
      </div>

      {/* Selectors */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            <GitCompare size={16} color="#fff" />
          </div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Выбор автомобилей</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <VehicleSelector label="Автомобиль А" value={idA} onChange={setIdA} vehicles={vehicles} exclude={idB} />
          <VehicleSelector label="Автомобиль Б" value={idB} onChange={setIdB} vehicles={vehicles} exclude={idA} />
        </div>
      </div>

      {idA && idB ? (
        <>
          {/* Individual cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <VehicleCompareData vehicleId={idA} color="#3b82f6" label="А" />
            <VehicleCompareData vehicleId={idB} color="#a78bfa" label="Б" />
          </div>

          {/* Radar + metrics */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <CompareRadar idA={idA} idB={idB} nameA={nameA} nameB={nameB} />
            <CompareMetrics idA={idA} idB={idB} />
          </div>
        </>
      ) : (
        <div className="card text-center py-16">
          <GitCompare size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Выберите два автомобиля</p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>После выбора отобразится полное сравнение батарей</p>
        </div>
      )}
    </div>
  )
}
