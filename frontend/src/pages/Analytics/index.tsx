import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine, LabelList,
  PieChart, Pie,
  LineChart, Line,
} from 'recharts'
import { useDemoVehicles, useDemoHistory } from '../../hooks/useDemoData'
import { generateHistory } from '../../utils/mockData'
import { sohColor } from '../../utils/battery'
import {
  TrendingDown, ChevronRight, ShieldAlert, Activity,
  AlertTriangle, Battery, Thermometer, Zap, Clock,
} from 'lucide-react'

/* ── helpers ── */
function ageMonths(d: string) {
  const [y, m] = d.split('-').map(Number)
  const now = new Date()
  return Math.max(1, (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m))
}
function fmtMonths(n: number) {
  if (n <= 0) return 'Исчерпан'
  if (n < 1)  return '< 1 мес.'
  if (n < 12) return `${Math.round(n)} мес.`
  const y = Math.floor(n / 12), mo = Math.round(n % 12)
  return mo > 0 ? `${y} г. ${mo} мес.` : `${y} г.`
}
function riskColor(s: number) {
  if (s >= 60) return '#ef4444'
  if (s >= 35) return '#f97316'
  if (s >= 15) return '#eab308'
  return '#22c55e'
}
function riskLabel(s: number) {
  if (s >= 60) return 'Критично'
  if (s >= 35) return 'Высокий'
  if (s >= 15) return 'Средний'
  return 'Норма'
}

const VEHICLE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a78bfa', '#f43f5e', '#06b6d4']

function calcRisk(last: any) {
  return Math.min(100, Math.round(
    (last.soh < 80 ? 40 : last.soh < 90 ? 20 : 0) +
    (last.internal_resistance > 25 ? 30 : last.internal_resistance > 15 ? 15 : 0) +
    (last.temperature > 45 ? 30 : last.temperature > 40 ? 15 : 0) +
    (last.rul_cycles < 100 ? 30 : last.rul_cycles < 300 ? 15 : 0)
  ))
}

/* ── Fleet header ── */
function FleetStatusBar({ vehicles }: { vehicles: any[] }) {
  const data = useMemo(() =>
    vehicles.map(v => {
      const h = generateHistory(v.vehicle_id, 30)
      const last = h[h.length - 1]
      if (!last) return null
      const age = ageMonths(v.manufacture_date || '2022-01')
      const rate = (100 - last.soh) / age
      const risk = calcRisk(last)
      return { soh: last.soh, ir: last.internal_resistance, temp: last.temperature, rul: last.rul_cycles, rate, risk }
    }).filter(Boolean) as any[]
  , [vehicles])

  if (!data.length) return null
  const n = data.length
  const avgSoH  = data.reduce((s, d) => s + d.soh, 0) / n
  const avgIR   = data.reduce((s, d) => s + d.ir, 0)  / n
  const avgTemp = data.reduce((s, d) => s + d.temp, 0) / n
  const maxRisk = Math.max(...data.map(d => d.risk))
  const critical = data.filter(d => d.risk >= 60).length

  const stats = [
    { label: 'Среднее здоровье', value: avgSoH.toFixed(1), unit: '%', color: sohColor(avgSoH), icon: Battery },
    { label: 'Среднее сопротивление', value: avgIR.toFixed(1), unit: ' мОм', color: avgIR > 20 ? '#ef4444' : avgIR > 12 ? '#f59e0b' : '#22c55e', icon: Zap },
    { label: 'Средняя температура', value: avgTemp.toFixed(1), unit: '°C', color: avgTemp > 40 ? '#ef4444' : '#22c55e', icon: Thermometer },
    { label: 'Критических авто', value: String(critical), unit: ' шт.', color: critical > 0 ? '#ef4444' : '#22c55e', icon: AlertTriangle },
    { label: 'Макс. индекс риска', value: String(maxRisk), unit: '/100', color: riskColor(maxRisk), icon: ShieldAlert },
  ]

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
      <div className="flex items-center gap-3 px-5 py-2.5" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <Activity size={13} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
          Диагностика батарей · {n} автомобилей · В режиме реального времени
        </span>
        <span className="ml-auto flex items-center gap-1.5" style={{ fontSize: 12, color: '#22c55e' }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Онлайн
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0" style={{ borderColor: 'var(--border)' }}>
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="px-5 py-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={11} style={{ color: 'var(--text-muted)' }} />
                <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  {s.label}
                </p>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>{s.unit}</span>
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── 1. Распределение состояния батарей (Donut) + рейтинг (Bar) ── */
function FleetHealthOverview({ vehicles }: { vehicles: any[] }) {
  const rows = useMemo(() =>
    vehicles.map((v, i) => {
      const h = generateHistory(v.vehicle_id, 30)
      const last = h[h.length - 1]
      if (!last) return null
      const risk = calcRisk(last)
      return {
        name: `${v.make} ${v.model}`,
        shortName: v.model,
        soh: +last.soh.toFixed(1),
        color: sohColor(last.soh),
        barColor: VEHICLE_COLORS[i % VEHICLE_COLORS.length],
        risk,
        riskColor: riskColor(risk),
      }
    }).filter(Boolean).sort((a, b) => a!.soh - b!.soh) as any[]
  , [vehicles])

  const donutData = useMemo(() => {
    const good     = rows.filter(r => r.soh >= 90).length
    const warning  = rows.filter(r => r.soh >= 80 && r.soh < 90).length
    const critical = rows.filter(r => r.soh < 80).length
    return [
      { name: 'Хорошее (≥90%)', value: good,     color: '#22c55e' },
      { name: 'Внимание (80–90%)', value: warning,  color: '#f59e0b' },
      { name: 'Критично (<80%)', value: critical, color: '#ef4444' },
    ].filter(d => d.value > 0)
  }, [rows])

  const total = rows.length

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Donut — статус парка */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Battery size={15} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Состояние батарей по категориям
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Сколько автомобилей в каждой зоне здоровья. Зелёный — в норме, жёлтый — требует наблюдения, красный — срочно на обслуживание.
          </p>
        </div>
        <div className="flex items-center justify-center gap-6 px-4 py-4">
          <div className="relative">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                  dataKey="value" strokeWidth={0} paddingAngle={3}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--text-primary)' }}>
                    <strong style={{ color: payload[0].payload.color }}>{payload[0].name}</strong>
                    <p style={{ color: 'var(--text-secondary)' }}>{payload[0].value} авт.</p>
                  </div>
                ) : null} />
              </PieChart>
            </ResponsiveContainer>
            {/* Centre label */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{total}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>авт.</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {donutData.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>{d.value} авт.</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{d.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar — рейтинг здоровья */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={15} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Рейтинг здоровья батарей
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Все автомобили отсортированы по уровню здоровья батареи. Красная линия на 80% — порог, ниже которого батарея требует замены.
          </p>
        </div>
        <div className="px-4 pt-3 pb-3">
          <ResponsiveContainer width="100%" height={rows.length * 44 + 10}>
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 52, left: 4, bottom: 0 }} barSize={18}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="shortName" width={80}
                tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif' }}
                axisLine={false} tickLine={false} />
              <ReferenceLine x={80} stroke="#ef444450" strokeDasharray="4 3"
                label={{ value: '80%', position: 'top', fill: '#ef4444', fontSize: 10, fontFamily: 'Inter' }} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                content={({ active, payload }) => active && payload?.length ? (
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-primary)' }}>
                    <p style={{ fontWeight: 600, marginBottom: 2 }}>{payload[0]?.payload?.name}</p>
                    <p style={{ color: 'var(--text-secondary)' }}>Здоровье: <strong style={{ color: payload[0]?.payload?.color }}>{payload[0].value}%</strong></p>
                    <p style={{ color: 'var(--text-secondary)' }}>Риск: <strong style={{ color: payload[0]?.payload?.riskColor }}>{riskLabel(payload[0]?.payload?.risk)}</strong></p>
                  </div>
                ) : null}
              />
              <Bar dataKey="soh" radius={[0, 6, 6, 0]} background={{ fill: 'var(--bg-surface)', radius: 6 }}>
                {rows.map((d, i) => <Cell key={i} fill={d.color} />)}
                <LabelList dataKey="soh" position="right"
                  style={{ fontSize: 12, fontWeight: 700, fill: 'var(--text-secondary)', fontFamily: 'Inter' }}
                  formatter={(v: number) => `${v}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ── 2. Деградация + прогноз ── */
function DegradationForecast({ vehicles }: { vehicles: any[] }) {
  const [selected, setSelected] = useState(0)
  const vehicle = vehicles[selected]

  const { history, forecast } = useMemo(() => {
    if (!vehicle) return { history: [], forecast: [] }
    const h = generateHistory(vehicle.vehicle_id, 60)
    const lastSoh = h[h.length - 1]?.soh ?? 90
    const age = ageMonths(vehicle.manufacture_date || '2022-01')
    const rate = (100 - lastSoh) / age

    const histData = h.map((p, i) => ({ i, soh: +p.soh.toFixed(2), type: 'fact' }))

    // Project 24 months forward
    const forecastData = Array.from({ length: 25 }, (_, k) => ({
      i: h.length + k,
      soh: +(Math.max(0, lastSoh - rate * k)).toFixed(2),
      type: 'forecast',
    }))

    return { history: histData, forecast: [...histData.slice(-1), ...forecastData] }
  }, [vehicle, selected])

  const allData = useMemo(() => {
    const last = history[history.length - 1]
    if (!last) return []
    return [
      ...history,
      ...forecast.slice(1).map(d => ({ ...d, sohForecast: d.soh, soh: undefined })),
    ]
  }, [history, forecast])

  const lastPoint = history[history.length - 1]
  const eolPoint = forecast.find(d => d.soh <= 80)

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={15} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                График деградации и прогноз замены
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 520 }}>
              Синяя линия — фактическая история здоровья батареи. Пунктирная оранжевая — прогноз на 24 месяца вперёд.
              Красная линия на 80% — порог замены батареи.
              {eolPoint && (
                <strong style={{ color: '#ef4444' }}> Расчётная дата замены: через {Math.round((eolPoint.i - history.length) / 2)} мес.</strong>
              )}
            </p>
          </div>
          {/* Vehicle selector */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {vehicles.map((v, i) => (
              <button key={v.vehicle_id} onClick={() => setSelected(i)}
                style={{
                  fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
                  backgroundColor: selected === i ? VEHICLE_COLORS[i % VEHICLE_COLORS.length] + '20' : 'var(--bg-surface)',
                  border: `1px solid ${selected === i ? VEHICLE_COLORS[i % VEHICLE_COLORS.length] + '60' : 'var(--border)'}`,
                  color: selected === i ? VEHICLE_COLORS[i % VEHICLE_COLORS.length] : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}>
                {v.make} {v.model}
              </button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        {lastPoint && (
          <div className="flex flex-wrap gap-4 mt-3">
            {[
              { label: 'Текущее здоровье', val: `${lastPoint.soh.toFixed(1)}%`, color: sohColor(lastPoint.soh) },
              { label: 'До замены (прогноз)', val: eolPoint ? fmtMonths(eolPoint.i - history.length) : '> 2 лет', color: '#22c55e' },
              { label: 'Всего замеров', val: `${history.length}`, color: 'var(--text-secondary)' },
            ].map(k => (
              <div key={k.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.label}:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: k.color }}>{k.val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-3">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart margin={{ top: 6, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradFact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              tickFormatter={v => v < history.length ? `T-${v}` : `+${v - history.length}м`}
              axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
            <YAxis domain={[75, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={38} />
            <ReferenceLine y={80} stroke="#ef444450" strokeDasharray="5 3"
              label={{ value: 'Порог замены 80%', position: 'right', fill: '#ef4444', fontSize: 10, fontFamily: 'Inter' }} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0]
              return (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 3 }}>
                    {p.payload.i < history.length ? `Замер T-${p.payload.i}` : `Прогноз +${p.payload.i - history.length} мес.`}
                  </p>
                  <p style={{ color: p.payload.i < history.length ? '#3b82f6' : '#f59e0b', fontWeight: 700 }}>
                    Здоровье: {(p.value as number)?.toFixed(2)}%
                  </p>
                </div>
              )
            }} />
            <Area data={history} type="monotone" dataKey="soh" stroke="#3b82f6"
              strokeWidth={2} fill="url(#gradFact)" dot={false} activeDot={{ r: 4 }} name="Факт" />
            <Area data={forecast} type="monotone" dataKey="soh" stroke="#f59e0b"
              strokeWidth={2} strokeDasharray="6 3" fill="url(#gradForecast)" dot={false} activeDot={{ r: 4 }} name="Прогноз" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 px-1">
          <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <span className="inline-block w-5 h-0.5 rounded" style={{ backgroundColor: '#3b82f6' }} />
            Фактические данные
          </span>
          <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <span className="inline-block w-5 h-px rounded border-t-2 border-dashed" style={{ borderColor: '#f59e0b' }} />
            Прогноз (24 мес.)
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Per-vehicle card ── */
function VehicleCard({ vehicle }: { vehicle: any }) {
  const history = useDemoHistory(vehicle.vehicle_id, 30)
  const last = history[history.length - 1]
  if (!last) return null

  const age = ageMonths(vehicle.manufacture_date || '2022-01')
  const rate = (100 - last.soh) / age
  const monthsToEol = last.soh > 80 ? (last.soh - 80) / Math.max(rate, 0.001) : 0
  const eolDate = new Date(); eolDate.setMonth(eolDate.getMonth() + Math.round(monthsToEol))

  const risk = calcRisk(last)
  const rc = riskColor(risk)
  const sohC = sohColor(last.soh)
  const cap = (vehicle.battery_nominal_capacity * last.soh / 100).toFixed(1)

  const chartData = history.map((h, i) => ({ i, soh: +h.soh.toFixed(2) }))

  const metrics = [
    { key: 'Здоровье',       val: last.soh.toFixed(1),                unit: '%',    color: sohC },
    { key: 'Сопротивление',  val: last.internal_resistance.toFixed(1), unit: ' мОм', color: last.internal_resistance > 25 ? '#ef4444' : last.internal_resistance > 15 ? '#f59e0b' : '#22c55e' },
    { key: 'Температура',    val: last.temperature.toFixed(1),         unit: '°C',  color: last.temperature > 45 ? '#ef4444' : last.temperature > 40 ? '#f97316' : '#22c55e' },
    { key: 'Ост. циклы',    val: String(last.rul_cycles),             unit: ' шт.', color: last.rul_cycles < 100 ? '#ef4444' : last.rul_cycles < 300 ? '#f59e0b' : '#22c55e' },
  ]

  return (
    <div className="rounded-xl overflow-hidden flex flex-col"
      style={{ border: `1px solid ${risk >= 60 ? rc + '60' : 'var(--border)'}`, backgroundColor: 'var(--bg-card)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: `${sohC}18`, color: sohC, border: `1px solid ${sohC}30` }}>
            {vehicle.make[0]}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {vehicle.make} {vehicle.model}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {vehicle.plate_number} · {vehicle.battery_chemistry} · {vehicle.battery_nominal_capacity} кВт·ч
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: `${rc}12`, border: `1px solid ${rc}30` }}>
          {risk >= 35 && <AlertTriangle size={10} style={{ color: rc }} />}
          <span style={{ fontSize: 11, fontWeight: 700, color: rc }}>{riskLabel(risk)}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{risk}/100</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0" style={{ borderBottom: '1px solid var(--border)', borderColor: 'var(--border)' }}>
        {metrics.map(m => (
          <div key={m.key} className="px-2 py-3 text-center">
            <p style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {m.key}
            </p>
            <p style={{ fontSize: 17, fontWeight: 700, color: m.color, lineHeight: 1 }}>
              {m.val}<span style={{ fontSize: 10, fontWeight: 400 }}>{m.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Capacity bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Фактическая / Номинальная ёмкость
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: sohC }}>
            {cap} / {vehicle.battery_nominal_capacity} кВт·ч
          </span>
        </div>
        <div className="relative h-3 rounded overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="absolute top-0 bottom-0 w-px" style={{ left: '80%', backgroundColor: '#ef444460' }} />
          <div className="h-full rounded transition-all duration-700"
            style={{ width: `${last.soh}%`, background: `linear-gradient(90deg, ${sohC}99, ${sohC})` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 9, color: '#ef4444' }}>▲ Порог замены 80%</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>100%</span>
        </div>
      </div>

      {/* SoH trend */}
      <div className="px-4 pb-3">
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Динамика здоровья — последние 30 замеров
        </p>
        <ResponsiveContainer width="100%" height={52}>
          <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${vehicle.vehicle_id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={sohC} stopOpacity={0.25} />
                <stop offset="95%" stopColor={sohC} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" hide />
            <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} hide />
            <Tooltip content={({ active, payload }) => active && payload?.length ? (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: 'var(--text-primary)' }}>
                {(+(payload[0]?.value ?? 0)).toFixed(2)}%
              </div>
            ) : null} />
            <Area type="monotone" dataKey="soh" stroke={sohC} strokeWidth={1.5}
              fill={`url(#g-${vehicle.vehicle_id})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Analytics row */}
      <div className="grid grid-cols-3 divide-x" style={{ borderTop: '1px solid var(--border)', borderColor: 'var(--border)', overflowX: 'auto' }}>
        <div className="px-3 py-2.5 text-center">
          <p style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Скорость деградации</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: rate > 0.15 ? '#ef4444' : rate > 0.08 ? '#f59e0b' : '#22c55e' }}>
            -{rate.toFixed(2)}<span style={{ fontSize: 10, fontWeight: 400 }}>%/мес.</span>
          </p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>До замены</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: monthsToEol < 12 ? '#ef4444' : monthsToEol < 36 ? '#f59e0b' : '#22c55e' }}>
            {fmtMonths(monthsToEol)}
          </p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Дата замены</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
            {last.soh > 80 ? eolDate.toLocaleDateString('ru-RU', { year: 'numeric', month: 'short' }) : '—'}
          </p>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="px-4 py-2.5 flex items-start gap-2"
        style={{ borderTop: '1px solid var(--border)', backgroundColor: `${rc}06` }}>
        <span style={{ fontSize: 10, color: rc, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>►</span>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {risk >= 60
            ? `Критическое состояние. Сопротивление: ${last.internal_resistance.toFixed(1)} мОм, циклов осталось: ${last.rul_cycles}. Требуется немедленная диагностика.`
            : risk >= 35
            ? `Повышенный износ. Деградация ${rate.toFixed(2)}%/мес. Плановая замена через ${fmtMonths(monthsToEol)}.`
            : `Состояние в норме. Расчётный ресурс до ${eolDate.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}.`
          }
        </p>
      </div>

      <Link to={`/vehicles/${vehicle.vehicle_id}`}
        className="flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--accent)', fontSize: 12 }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.06)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
        <span>Открыть детальный мониторинг</span>
        <ChevronRight size={13} />
      </Link>
    </div>
  )
}

export default function Analytics() {
  const vehicles = useDemoVehicles()

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="page-title">Аналитика батарей</h1>
        <p className="page-subtitle">Тренды деградации, прогноз замены и индекс риска</p>
      </div>

      {vehicles.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Добавьте автомобиль в разделе «Мои авто»
          </p>
        </div>
      ) : (
        <>
          <FleetStatusBar vehicles={vehicles} />
          <FleetHealthOverview vehicles={vehicles} />
          <DegradationForecast vehicles={vehicles} />
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
              Детальный отчёт по каждому автомобилю
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {vehicles.map(v => <VehicleCard key={v.vehicle_id} vehicle={v} />)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
