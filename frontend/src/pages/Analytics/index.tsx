import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList, ReferenceLine,
} from 'recharts'
import { useDemoVehicles, useDemoHistory } from '../../hooks/useDemoData'
import { generateHistory } from '../../utils/mockData'
import { sohColor } from '../../utils/battery'
import { TrendingDown, Calendar, Zap, ChevronRight, ShieldAlert, Activity, AlertTriangle } from 'lucide-react'

/* ── helpers ── */
function ageMonths(d: string) {
  const [y, m] = d.split('-').map(Number)
  const now = new Date()
  return Math.max(1, (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m))
}
function fmtMonths(n: number) {
  if (n <= 0) return 'EOL'
  if (n < 1)  return '< 1 мес'
  if (n < 12) return `${Math.round(n)} мес`
  const y = Math.floor(n / 12), mo = Math.round(n % 12)
  return mo > 0 ? `${y}г ${mo}м` : `${y} г`
}
function riskColor(s: number) {
  if (s >= 60) return '#ef4444'
  if (s >= 35) return '#f97316'
  if (s >= 15) return '#eab308'
  return '#22c55e'
}
function riskLabel(s: number) {
  if (s >= 60) return 'КРИТИЧНО'
  if (s >= 35) return 'ВЫСОКИЙ'
  if (s >= 15) return 'СРЕДНИЙ'
  return 'НОРМА'
}

const MONO: React.CSSProperties = { fontFamily: 'ui-monospace, monospace', letterSpacing: '0.02em' }

/* ── Fleet header bar ── */
function FleetStatusBar({ vehicles }: { vehicles: any[] }) {
  const data = useMemo(() =>
    vehicles.map(v => {
      const h = generateHistory(v.vehicle_id, 30)
      const last = h[h.length - 1]
      if (!last) return null
      const age = ageMonths(v.manufacture_date || '2022-01')
      const rate = (100 - last.soh) / age
      const risk = Math.min(100, Math.round(
        (last.soh < 80 ? 40 : last.soh < 90 ? 20 : 0) +
        (last.internal_resistance > 25 ? 30 : last.internal_resistance > 15 ? 15 : 0) +
        (last.temperature > 45 ? 30 : last.temperature > 40 ? 15 : 0) +
        (last.rul_cycles < 100 ? 30 : last.rul_cycles < 300 ? 15 : 0)
      ))
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
    { label: 'FLEET SoH AVG', value: avgSoH.toFixed(1), unit: '%', color: sohColor(avgSoH) },
    { label: 'FLEET IR AVG',  value: avgIR.toFixed(1),  unit: ' мΩ', color: avgIR > 20 ? '#ef4444' : avgIR > 12 ? '#f59e0b' : '#22c55e' },
    { label: 'TEMP AVG',      value: avgTemp.toFixed(1), unit: '°C', color: avgTemp > 40 ? '#ef4444' : '#22c55e' },
    { label: 'CRITICAL',      value: String(critical),   unit: ' авт', color: critical > 0 ? '#ef4444' : '#22c55e' },
    { label: 'MAX RISK IDX',  value: String(maxRisk),    unit: '/100', color: riskColor(maxRisk) },
  ]

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
      {/* top bar */}
      <div className="flex items-center gap-3 px-5 py-2.5" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <Activity size={13} style={{ color: 'var(--accent)' }} />
        <span style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>FLEET MONITOR · {n} VEHICLES · LIVE</span>
        <span className="ml-auto flex items-center gap-1.5" style={{ fontSize: 11, color: '#22c55e' }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          ONLINE
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0" style={{ borderColor: 'var(--border)' }}>
        {stats.map(s => (
          <div key={s.label} className="px-5 py-4">
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</p>
            <p style={{ ...MONO, fontSize: 26, fontWeight: 600, color: s.color, lineHeight: 1 }}>
              {s.value}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>{s.unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Comparison bar chart ── */
function FleetBarChart({ vehicles }: { vehicles: any[] }) {
  const rows = useMemo(() =>
    vehicles
      .map(v => {
        const h = generateHistory(v.vehicle_id, 30)
        const last = h[h.length - 1]
        if (!last) return null
        return { name: `${v.make} ${v.model}`, soh: +last.soh.toFixed(1), color: sohColor(last.soh), ir: +last.internal_resistance.toFixed(1) }
      })
      .filter(Boolean)
      .sort((a, b) => a!.soh - b!.soh) as { name: string; soh: number; color: string; ir: number }[]
  , [vehicles])

  if (!rows.length) return null

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
      <div className="flex items-center gap-3 px-5 py-2.5" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <ShieldAlert size={13} style={{ color: 'var(--accent)' }} />
        <span style={{ ...MONO, fontSize: 11, color: 'var(--text-muted)' }}>BATTERY STATE OF HEALTH · COMPARATIVE · %</span>
        <div className="ml-auto flex items-center gap-4">
          {[['#22c55e', '≥90'], ['#f59e0b', '80–90'], ['#ef4444', '<80']].map(([c, l]) => (
            <span key={l} className="flex items-center gap-1.5" style={{ fontSize: 10, color: 'var(--text-muted)', ...MONO }}>
              <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: c }} />{l}%
            </span>
          ))}
        </div>
      </div>
      <div className="px-4 pt-4 pb-3">
        <ResponsiveContainer width="100%" height={rows.length * 48 + 8}>
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 56, left: 8, bottom: 0 }} barSize={16}>
            <XAxis type="number" domain={[50, 100]} hide />
            <YAxis type="category" dataKey="name" width={116}
              tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: 'ui-monospace,monospace' }}
              axisLine={false} tickLine={false} />
            <ReferenceLine x={80} stroke="#ef444440" strokeDasharray="4 2" label={{ value: 'EOL', position: 'top', fill: '#ef4444', fontSize: 9 }} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              content={({ active, payload }) => active && payload?.length ? (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', ...MONO, fontSize: 12, color: 'var(--text-primary)' }}>
                  SoH {payload[0].value}%
                </div>
              ) : null} />
            <Bar dataKey="soh" radius={[0, 4, 4, 0]} background={{ fill: 'var(--bg-surface)', radius: 4 }}>
              {rows.map((d, i) => <Cell key={i} fill={d.color} />)}
              <LabelList dataKey="soh" position="right"
                style={{ ...MONO, fontSize: 12, fontWeight: 600, fill: 'var(--text-secondary)' }}
                formatter={(v: number) => `${v}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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

  const risk = Math.min(100, Math.round(
    (last.soh < 80 ? 40 : last.soh < 90 ? 20 : 0) +
    (last.internal_resistance > 25 ? 30 : last.internal_resistance > 15 ? 15 : 0) +
    (last.temperature > 45 ? 30 : last.temperature > 40 ? 15 : 0) +
    (last.rul_cycles < 100 ? 30 : last.rul_cycles < 300 ? 15 : 0)
  ))
  const rc = riskColor(risk)
  const sohC = sohColor(last.soh)
  const cap = (vehicle.battery_nominal_capacity * last.soh / 100).toFixed(1)

  const chartData = history.map((h, i) => ({ i, soh: +h.soh.toFixed(2) }))

  const metrics = [
    { key: 'SOH',   val: last.soh.toFixed(1),                unit: '%',    color: sohC,  label: 'STATE OF HEALTH' },
    { key: 'IR',    val: last.internal_resistance.toFixed(1), unit: ' мΩ', color: last.internal_resistance > 25 ? '#ef4444' : last.internal_resistance > 15 ? '#f59e0b' : '#22c55e', label: 'INT. RESISTANCE' },
    { key: 'TEMP',  val: last.temperature.toFixed(1),         unit: '°C',  color: last.temperature > 45 ? '#ef4444' : last.temperature > 40 ? '#f97316' : '#22c55e', label: 'TEMPERATURE' },
    { key: 'RUL',   val: String(last.rul_cycles),             unit: ' cy', color: last.rul_cycles < 100 ? '#ef4444' : last.rul_cycles < 300 ? '#f59e0b' : '#22c55e', label: 'REMAINING CYCLES' },
  ]

  return (
    <div className="rounded-xl overflow-hidden flex flex-col" style={{ border: `1px solid ${risk >= 60 ? rc + '60' : 'var(--border)'}`, backgroundColor: 'var(--bg-card)' }}>

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: `${sohC}18`, color: sohC, border: `1px solid ${sohC}30` }}>
            {vehicle.make[0]}
          </div>
          <div>
            <p style={{ ...MONO, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              {vehicle.make} {vehicle.model}
            </p>
            <p style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>
              {vehicle.plate_number} · {vehicle.battery_chemistry} · {vehicle.battery_nominal_capacity} кВт·ч
            </p>
          </div>
        </div>
        {/* Risk badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: `${rc}12`, border: `1px solid ${rc}30` }}>
          {risk >= 35 && <AlertTriangle size={10} style={{ color: rc }} />}
          <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: rc }}>{riskLabel(risk)}</span>
          <span style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>{risk}/100</span>
        </div>
      </div>

      {/* 4 engineering metrics */}
      <div className="grid grid-cols-4 divide-x" style={{ borderBottom: '1px solid var(--border)', borderColor: 'var(--border)' }}>
        {metrics.map(m => (
          <div key={m.key} className="px-3 py-3 text-center">
            <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>{m.key}</p>
            <p style={{ ...MONO, fontSize: 18, fontWeight: 700, color: m.color, lineHeight: 1 }}>
              {m.val}<span style={{ fontSize: 10, fontWeight: 400 }}>{m.unit}</span>
            </p>
            <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Capacity + SoH bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ ...MONO, fontSize: 10, color: 'var(--text-muted)' }}>CAPACITY · ACTUAL / NOMINAL</span>
          <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: sohC }}>
            {cap} / {vehicle.battery_nominal_capacity} кВт·ч
          </span>
        </div>
        <div className="relative h-3 rounded overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
          {/* EOL marker */}
          <div className="absolute top-0 bottom-0 w-px" style={{ left: '60%', backgroundColor: '#ef444460' }} />
          <div className="h-full rounded transition-all duration-700" style={{ width: `${last.soh}%`, backgroundColor: sohC }} />
        </div>
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 9, color: '#ef4444', ...MONO }}>▲ EOL 80%</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', ...MONO }}>100%</span>
        </div>
      </div>

      {/* SoH trend chart */}
      <div className="px-4 pb-3">
        <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>SoH TREND · LAST 30 READINGS</p>
        <ResponsiveContainer width="100%" height={56}>
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
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', ...MONO, fontSize: 11, color: 'var(--text-primary)' }}>
                {(+payload[0].value).toFixed(2)}%
              </div>
            ) : null} />
            <Area type="monotone" dataKey="soh" stroke={sohC} strokeWidth={1.5}
              fill={`url(#g-${vehicle.vehicle_id})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Analytics row */}
      <div className="grid grid-cols-3 divide-x" style={{ borderTop: '1px solid var(--border)', borderColor: 'var(--border)' }}>
        <div className="px-3 py-2.5 text-center">
          <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', marginBottom: 3 }}>DEGRADATION RATE</p>
          <p style={{ ...MONO, fontSize: 14, fontWeight: 700, color: rate > 0.15 ? '#ef4444' : rate > 0.08 ? '#f59e0b' : '#22c55e' }}>
            -{rate.toFixed(2)}<span style={{ fontSize: 10, fontWeight: 400 }}>%/мес</span>
          </p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', marginBottom: 3 }}>TIME TO EOL</p>
          <p style={{ ...MONO, fontSize: 14, fontWeight: 700, color: monthsToEol < 12 ? '#ef4444' : monthsToEol < 36 ? '#f59e0b' : '#22c55e' }}>
            {fmtMonths(monthsToEol)}
          </p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p style={{ ...MONO, fontSize: 9, color: 'var(--text-muted)', marginBottom: 3 }}>EOL DATE EST.</p>
          <p style={{ ...MONO, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
            {last.soh > 80 ? eolDate.toLocaleDateString('ru-RU', { year: 'numeric', month: 'short' }) : '—'}
          </p>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="px-4 py-2.5 flex items-start gap-2"
        style={{ borderTop: '1px solid var(--border)', backgroundColor: `${rc}06` }}>
        <span style={{ ...MONO, fontSize: 10, color: rc, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>►</span>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {risk >= 60
            ? `Критическое состояние. IR ${last.internal_resistance.toFixed(1)} мΩ, RUL ${last.rul_cycles} цикл. Требуется немедленная диагностика.`
            : risk >= 35
            ? `Повышенный износ. Деградация ${rate.toFixed(2)}%/мес. Плановая замена через ${fmtMonths(monthsToEol)}.`
            : `Норма. Расчётный ресурс до ${eolDate.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}.`
          }
        </p>
      </div>

      <Link to={`/vehicles/${vehicle.vehicle_id}`}
        className="flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--accent)', ...MONO, fontSize: 11 }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.06)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
        <span>ОТКРЫТЬ МОНИТОРИНГ БАТАРЕИ</span>
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
          <FleetBarChart vehicles={vehicles} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {vehicles.map(v => <VehicleCard key={v.vehicle_id} vehicle={v} />)}
          </div>
        </>
      )}
    </div>
  )
}
