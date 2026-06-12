import { useState, useEffect } from 'react'
import { useDemoVehicles, useDemoHistory } from '../../hooks/useDemoData'
import { socColor, sohColor, sohLabel } from '../../utils/battery'
import { GitCompare, ChevronDown, Activity, Battery, Thermometer, Zap, TrendingDown, CheckCircle, Loader2, Play, RotateCcw } from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts'

/* ── Шаги анализа ── */
const ANALYSIS_STEPS = [
  { id: 'connect',  label: 'Подключение к BMS обоих ТС…',          ms: 700  },
  { id: 'soh',      label: 'Считывание состояния здоровья (SoH)…', ms: 900  },
  { id: 'soc',      label: 'Анализ уровня заряда (SoC)…',          ms: 600  },
  { id: 'thermal',  label: 'Проверка теплового режима…',            ms: 800  },
  { id: 'rul',      label: 'Расчёт остаточного ресурса (RUL)…',    ms: 1000 },
  { id: 'resistance',label: 'Измерение внутреннего сопротивления…', ms: 700  },
  { id: 'compare',  label: 'Формирование сравнительного отчёта…',   ms: 900  },
  { id: 'done',     label: 'Анализ завершён',                       ms: 0    },
]

function VehicleSelector({ label, value, onChange, vehicles, exclude, color }: any) {
  const selected = vehicles.find((v: any) => v.vehicle_id === value)
  return (
    <div>
      <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontSize: 10 }}>{label}</p>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:outline-none"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: `1.5px solid ${value ? color : 'var(--border)'}`,
            color: 'var(--text-primary)',
          }}>
          <option value="">— Выберите автомобиль —</option>
          {vehicles
            .filter((v: any) => v.vehicle_id !== exclude)
            .map((v: any) => (
              <option key={v.vehicle_id} value={v.vehicle_id}>
                {v.make} {v.model} · {v.year}
              </option>
            ))}
        </select>
        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }} />
      </div>
      {selected && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ backgroundColor: `${color}10`, border: `1px solid ${color}25` }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: color }}>{selected.make[0]}</div>
          <div>
            <p className="text-xs font-semibold" style={{ color }}>{selected.make} {selected.model}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selected.battery_chemistry} · {selected.battery_nominal_capacity} кВт·ч</p>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingScreen({ nameA, nameB, onDone }: { nameA: string; nameB: string; onDone: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= ANALYSIS_STEPS.length - 1) {
      setTimeout(onDone, 500)
      return
    }
    const t = setTimeout(() => setStep(s => s + 1), ANALYSIS_STEPS[step].ms)
    return () => clearTimeout(t)
  }, [step])

  const progress = Math.round((step / (ANALYSIS_STEPS.length - 1)) * 100)

  return (
    <div className="card py-8 px-6">
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>
          <GitCompare size={18} color="#fff" />
        </div>
        <div>
          <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Анализ батарей</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: '#3b82f6' }}>{nameA}</span>
            <span style={{ color: 'var(--text-muted)' }}> vs </span>
            <span style={{ color: '#a78bfa' }}>{nameB}</span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
          <span>Прогресс анализа</span>
          <span style={{ color: 'var(--accent)' }}>{progress}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />
        </div>
      </div>

      {/* Steps list */}
      <div className="space-y-2">
        {ANALYSIS_STEPS.slice(0, -1).map((s, i) => {
          const done = i < step
          const active = i === step
          return (
            <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-xl transition-all duration-300"
              style={{
                backgroundColor: active ? 'rgba(59,130,246,0.08)' : 'transparent',
                opacity: i > step ? 0.3 : 1,
              }}>
              <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                {done
                  ? <CheckCircle size={16} style={{ color: '#22c55e' }} />
                  : active
                    ? <Loader2 size={16} style={{ color: 'var(--accent)' }} className="animate-spin" />
                    : <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: 'var(--border)' }} />
                }
              </div>
              <span className="text-sm" style={{ color: active ? 'var(--text-primary)' : done ? '#22c55e' : 'var(--text-muted)', fontWeight: active ? 600 : 400 }}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MetricRow({ label, a, b, unit = '', higherBetter = true }: {
  label: string; a: number; b: number; unit?: string; higherBetter?: boolean
}) {
  const diff = a - b
  const aWins = higherBetter ? diff > 0.5 : diff < -0.5
  const bWins = higherBetter ? diff < -0.5 : diff > 0.5
  const maxVal = Math.max(a, b, 0.001)

  return (
    <div className="py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <p className="text-xs mb-2.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="grid grid-cols-[1fr_28px_1fr] gap-2 items-center">
        {/* A */}
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-sm font-bold" style={{ color: aWins ? '#22c55e' : '#3b82f6' }}>
            {a.toFixed(1)}{unit}
          </span>
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div className="h-full rounded-full ml-auto transition-all duration-1000"
              style={{ width: `${(a / maxVal) * 100}%`, backgroundColor: aWins ? '#22c55e' : '#3b82f6' }} />
          </div>
        </div>
        {/* VS */}
        <div className="flex items-center justify-center">
          {aWins && <span style={{ color: '#22c55e', fontSize: 12 }}>◀</span>}
          {bWins && <span style={{ color: '#22c55e', fontSize: 12 }}>▶</span>}
          {!aWins && !bWins && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>=</span>}
        </div>
        {/* B */}
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-sm font-bold" style={{ color: bWins ? '#22c55e' : '#a78bfa' }}>
            {b.toFixed(1)}{unit}
          </span>
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(b / maxVal) * 100}%`, backgroundColor: bWins ? '#22c55e' : '#a78bfa' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultScreen({ idA, idB, nameA, nameB, vA, vB, onReset }: any) {
  const histA = useDemoHistory(idA, 30)
  const histB = useDemoHistory(idB, 30)
  const lastA = histA[histA.length - 1]
  const lastB = histB[histB.length - 1]

  if (!lastA || !lastB) return null

  const radarData = [
    { metric: 'SoH',    A: lastA.soh,                                   B: lastB.soh },
    { metric: 'SoC',    A: lastA.soc,                                   B: lastB.soc },
    { metric: 'Ресурс', A: Math.min(lastA.rul_cycles / 10, 100),       B: Math.min(lastB.rul_cycles / 10, 100) },
    { metric: 'Темп.',  A: Math.max(0, 100 - lastA.temperature * 1.5), B: Math.max(0, 100 - lastB.temperature * 1.5) },
    { metric: 'Сопр.',  A: Math.max(0, 100 - lastA.internal_resistance * 2.5), B: Math.max(0, 100 - lastB.internal_resistance * 2.5) },
  ]

  /* Кто лучше в целом */
  const scoreA = (lastA.soh > lastB.soh ? 1 : 0) + (lastA.soc > lastB.soc ? 1 : 0)
    + (lastA.rul_cycles > lastB.rul_cycles ? 1 : 0)
    + (lastA.temperature < lastB.temperature ? 1 : 0)
    + (lastA.internal_resistance < lastB.internal_resistance ? 1 : 0)
  const scoreB = 5 - scoreA
  const winner = scoreA > scoreB ? nameA : scoreB > scoreA ? nameB : null

  return (
    <div className="space-y-4">
      {/* Winner banner */}
      <div className="card py-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ background: winner ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(59,130,246,0.08))' : undefined, border: '1px solid rgba(34,197,94,0.2)' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)', fontSize: 10 }}>Итог анализа</p>
          {winner
            ? <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                🏆 <span style={{ color: '#22c55e' }}>{winner}</span> — лучшее состояние батареи
              </p>
            : <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Равный результат по всем метрикам</p>
          }
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {nameA}: {scoreA}/5 · {nameB}: {scoreB}/5
          </p>
        </div>
        <button onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          <RotateCcw size={12} /> Сбросить
        </button>
      </div>

      {/* Vehicle cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {([
          { vehicle: vA, last: lastA, color: '#3b82f6', label: 'А' },
          { vehicle: vB, last: lastB, color: '#a78bfa', label: 'Б' },
        ] as const).map(({ vehicle, last, color, label }) => (
          <div key={label} className="card">
            <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: color as string }}>
                {vehicle.make[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {label}: {vehicle.make} {vehicle.model}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {vehicle.year} · {vehicle.battery_chemistry} · {vehicle.battery_nominal_capacity} кВт·ч
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold" style={{ color: sohColor(last.soh) }}>{last.soh.toFixed(1)}%</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>SoH</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'SoC',    value: `${last.soc.toFixed(1)}%`,                    color: socColor(last.soc) },
                { label: 'Темп.',  value: `${last.temperature.toFixed(1)}°C`,           color: last.temperature > 40 ? '#ef4444' : '#f59e0b' },
                { label: 'Сопр.', value: `${last.internal_resistance.toFixed(1)} мОм`, color: 'var(--text-primary)' },
                { label: 'Ресурс',value: `${last.rul_cycles} цикл`,                    color: last.rul_cycles > 300 ? '#22c55e' : '#f59e0b' },
                { label: 'Дней',   value: `~${last.rul_days}`,                          color: 'var(--text-secondary)' },
                { label: 'Статус', value: sohLabel(last.soh),                           color: sohColor(last.soh) },
              ].map(m => (
                <div key={m.label} className="p-2.5 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                  <p className="text-xs font-bold" style={{ color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Radar + metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <p className="label mb-1">Радарная диаграмма</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Нормализованное сравнение (выше = лучше)</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Radar name={nameA} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.22} strokeWidth={2} dot />
              <Radar name={nameB} dataKey="B" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.22} strokeWidth={2} dot />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-muted)' }}
                itemStyle={{ color: 'var(--text-primary)' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="label">Сравнение метрик</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Зелёный — лучший показатель</p>
            </div>
          </div>
          {/* column headers */}
          <div className="grid grid-cols-[1fr_28px_1fr] gap-2 mb-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            <p className="text-right truncate" style={{ color: '#3b82f6' }}>{nameA.split(' ')[0]}</p>
            <span />
            <p className="text-left truncate" style={{ color: '#a78bfa' }}>{nameB.split(' ')[0]}</p>
          </div>
          <MetricRow label="Здоровье (SoH)" a={lastA.soh} b={lastB.soh} unit="%" />
          <MetricRow label="Заряд (SoC)" a={lastA.soc} b={lastB.soc} unit="%" />
          <MetricRow label="Температура" a={lastA.temperature} b={lastB.temperature} unit="°C" higherBetter={false} />
          <MetricRow label="Сопротивление" a={lastA.internal_resistance} b={lastB.internal_resistance} unit=" мОм" higherBetter={false} />
          <MetricRow label="Ресурс (циклы)" a={lastA.rul_cycles} b={lastB.rul_cycles} />
        </div>
      </div>
    </div>
  )
}

export default function Compare() {
  const vehicles = useDemoVehicles()
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')
  const [phase, setPhase] = useState<'select' | 'loading' | 'result'>('select')

  const vA = vehicles.find(v => v.vehicle_id === idA)
  const vB = vehicles.find(v => v.vehicle_id === idB)
  const nameA = vA ? `${vA.make} ${vA.model}` : 'Авто А'
  const nameB = vB ? `${vB.make} ${vB.model}` : 'Авто Б'

  function handleStart() {
    if (!idA || !idB) return
    setPhase('loading')
  }

  function handleReset() {
    setPhase('select')
    setIdA('')
    setIdB('')
  }

  function handleSelectA(id: string) {
    setIdA(id)
    setPhase('select')
  }

  function handleSelectB(id: string) {
    setIdB(id)
    setPhase('select')
  }

  const canStart = !!idA && !!idB

  return (
    <div className="p-4 md:p-8 space-y-5">
      {/* Header */}
      <div>
        <h1 className="page-title">Сравнение автомобилей</h1>
        <p className="page-subtitle">Выберите два автомобиля и запустите анализ батарей</p>
      </div>

      {/* Selector card — always visible unless result */}
      {phase !== 'result' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              <GitCompare size={16} color="#fff" />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Выбор автомобилей</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <VehicleSelector label="Автомобиль А" value={idA} onChange={handleSelectA}
              vehicles={vehicles} exclude={idB} color="#3b82f6" />
            <VehicleSelector label="Автомобиль Б" value={idB} onChange={handleSelectB}
              vehicles={vehicles} exclude={idA} color="#a78bfa" />
          </div>

          <button
            onClick={handleStart}
            disabled={!canStart || phase === 'loading'}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{
              background: canStart ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'var(--bg-surface)',
              color: canStart ? '#fff' : 'var(--text-muted)',
              border: canStart ? 'none' : '1px solid var(--border)',
              cursor: canStart ? 'pointer' : 'not-allowed',
              boxShadow: canStart ? '0 4px 16px rgba(59,130,246,0.35)' : 'none',
            }}>
            {phase === 'loading'
              ? <><Loader2 size={16} className="animate-spin" /> Анализ…</>
              : <><Play size={15} /> Начать сравнение</>
            }
          </button>

          {!canStart && (
            <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Выберите оба автомобиля для запуска анализа
            </p>
          )}
        </div>
      )}

      {/* Loading */}
      {phase === 'loading' && (
        <LoadingScreen nameA={nameA} nameB={nameB} onDone={() => setPhase('result')} />
      )}

      {/* Result */}
      {phase === 'result' && vA && vB && (
        <ResultScreen idA={idA} idB={idB} nameA={nameA} nameB={nameB} vA={vA} vB={vB} onReset={handleReset} />
      )}
    </div>
  )
}
