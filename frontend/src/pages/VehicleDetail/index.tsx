import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDemoHistory, useDemoCells, useDemoVehicles } from '../../hooks/useDemoData'
import { socColor, sohColor, sohLabel } from '../../utils/battery'
import SoCGauge from '../../components/charts/SoCGauge'
import MetricLine from '../../components/charts/MetricLine'
import CellBalanceChart from '../../components/charts/CellBalanceChart'
import RULChart from '../../components/charts/RULChart'
import PowerChart from '../../components/charts/PowerChart'
import TemperatureChart from '../../components/charts/TemperatureChart'
import VehicleFormModal from '../../components/VehicleFormModal'
import { ArrowLeft, Zap, Thermometer, Activity, TrendingDown, TrendingUp, Minus, Battery, HeartPulse, Scale, Calendar, PlugZap, Pencil, Download, History } from 'lucide-react'

/* ── Generate mock charging sessions from history ── */
function generateChargingSessions(vehicleId: string, capacity: number) {
  const seed = vehicleId.charCodeAt(vehicleId.length - 1)
  const sessions = []
  const now = Date.now()

  for (let i = 0; i < 10; i++) {
    const daysAgo = i * (1.5 + ((seed * (i + 1)) % 3))
    const startMs = now - daysAgo * 86_400_000 - ((seed * i) % 6) * 3_600_000
    const startSoc = 15 + ((seed * (i + 3)) % 25)
    const endSoc   = 75 + ((seed * (i + 1)) % 20)
    const kwh      = +((endSoc - startSoc) / 100 * capacity).toFixed(1)
    const durationMin = Math.round(kwh * (40 + (seed % 20)))
    const cost     = +(kwh * 0.07).toFixed(2)

    sessions.push({
      id: i,
      startTime: new Date(startMs).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      startSoc,
      endSoc,
      kwh,
      durationMin,
      cost,
    })
  }
  return sessions
}

/* ── CSV export ── */
function exportCSV(vehicle: any, last: any) {
  const rows = [
    ['Параметр', 'Значение'],
    ['Автомобиль', `${vehicle.make} ${vehicle.model} ${vehicle.year}`],
    ['Гос. номер', vehicle.plate_number || '—'],
    ['Химия батареи', vehicle.battery_chemistry],
    ['Ёмкость (кВт·ч)', vehicle.battery_nominal_capacity],
    ['SoH (%)', last.soh.toFixed(2)],
    ['SoC (%)', last.soc.toFixed(2)],
    ['Температура (°C)', last.temperature.toFixed(2)],
    ['Напряжение (В)', last.voltage.toFixed(2)],
    ['Ток (А)', last.current.toFixed(2)],
    ['Мощность (кВт)', last.power_kw.toFixed(2)],
    ['Сопротивление (мОм)', last.internal_resistance.toFixed(2)],
    ['Остаточный ресурс (цикл)', last.rul_cycles],
    ['Остаточный ресурс (дней)', last.rul_days],
    ['Дата выгрузки', new Date().toLocaleString('ru-RU')],
  ]
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `battery_report_${vehicle.vehicle_id}_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function Delta({ current, prev, unit = '', invert = false }: any) {
  const d = +(current - prev).toFixed(2)
  const positive = invert ? d < 0 : d > 0
  const color = d === 0 ? 'var(--text-muted)' : positive ? '#22c55e' : '#ef4444'
  const Icon = d > 0.05 ? TrendingUp : d < -0.05 ? TrendingDown : Minus
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color }}>
      <Icon size={12} />
      {d > 0 ? '+' : ''}{d}{unit}
    </span>
  )
}

function MetricCard({ label, value, unit, sub, color, prev, prevUnit, invert, icon }: any) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="label">{label}</p>
        {icon}
      </div>
      <p className="text-3xl font-bold mb-1" style={{ color: color ?? 'var(--text-primary)' }}>
        {value}
        {unit && <span className="text-base font-normal secondary-text ml-1">{unit}</span>}
      </p>
      <div className="flex items-center justify-between">
        {sub && <p className="text-xs" style={{ color: color ?? 'var(--text-muted)' }}>{sub}</p>}
        {prev !== undefined && <Delta current={value} prev={prev} unit={prevUnit ?? unit} invert={invert} />}
      </div>
    </div>
  )
}

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const vehicles = useDemoVehicles()
  const vehicle = vehicles.find(v => v.vehicle_id === id) ?? vehicles[0]
  const history = useDemoHistory(id ?? 'EV-001', 60)
  const cells = useDemoCells(id ?? 'EV-001')
  const [editOpen, setEditOpen] = useState(false)
  const chargingSessions = useMemo(
    () => generateChargingSessions(vehicle?.vehicle_id ?? 'EV-001', vehicle?.battery_nominal_capacity ?? 75),
    [vehicle?.vehicle_id, vehicle?.battery_nominal_capacity]
  )

  const last = history[history.length - 1]
  const prev = history[history.length - 10] ?? last
  if (!last) return null

  const charging = last.current > 0
  const tempColor = last.temperature > 45 ? '#ef4444' : last.temperature > 35 ? '#f59e0b' : '#22c55e'
  const cellMin = Math.min(...cells)
  const cellMax = Math.max(...cells)
  const cellDelta = +((cellMax - cellMin) * 1000).toFixed(1)
  const cellStatus = cellDelta < 20 ? { label: 'Баланс в норме', color: '#22c55e' }
    : cellDelta < 50 ? { label: 'Лёгкий дисбаланс', color: '#f59e0b' }
    : { label: 'Критический дисбаланс', color: '#ef4444' }

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6">
      {/* ── Header ── */}
      <div className="space-y-3">
        {/* Row 1: back + title + status badge */}
        <div className="flex items-center gap-3">
          <Link to="/" className="shrink-0 p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="page-title truncate">{vehicle.make} {vehicle.model}</h1>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {vehicle.plate_number || id} · {vehicle.year} · {vehicle.battery_chemistry} · {vehicle.battery_nominal_capacity} кВт·ч
            </p>
          </div>
          {charging ? (
            <span className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full font-medium"
              style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
              <Zap size={11} />
              <span className="hidden sm:inline">Зарядка · </span>{last.current.toFixed(0)} А
            </span>
          ) : (
            <span className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full font-medium"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
              <Activity size={11} />
              <span className="hidden sm:inline">Разряд · </span>{Math.abs(last.current).toFixed(0)} А
            </span>
          )}
        </div>
        {/* Row 2: action buttons */}
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(vehicle, last)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#22c55e'; e.currentTarget.style.borderColor = '#22c55e' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            <Download size={13} /> <span>Экспорт CSV</span>
          </button>
          <button onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            <Pencil size={13} /> <span>Редактировать</span>
          </button>
        </div>
      </div>

      {/* ── 4 key metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Заряд (SoC)" value={last.soc.toFixed(1)} unit="%" color={socColor(last.soc)}
          prev={prev.soc} prevUnit="%" icon={<Battery size={16} style={{ color: socColor(last.soc) }} />} />
        <MetricCard label="Здоровье (SoH)" value={last.soh.toFixed(1)} unit="%"
          color={sohColor(last.soh)} sub={sohLabel(last.soh)}
          prev={prev.soh} prevUnit="%" invert icon={<Activity size={16} style={{ color: sohColor(last.soh) }} />} />
        <MetricCard label="Температура" value={last.temperature.toFixed(1)} unit="°C"
          color={tempColor} sub={last.temperature > 40 ? 'Высокая' : 'Норма'}
          prev={prev.temperature} prevUnit="°C" invert icon={<Thermometer size={16} style={{ color: tempColor }} />} />
        <MetricCard label="Остаточный ресурс" value={last.rul_cycles} unit="цикл."
          sub={`~${last.rul_days} дней`} color="var(--text-primary)"
          prev={prev.rul_cycles} icon={<TrendingDown size={16} style={{ color: 'var(--text-muted)' }} />} />
      </div>

      {/* ── SoC gauge + RUL degradation ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gauge panel */}
        <div className="card flex flex-col items-center justify-center gap-5 py-6">
          <SoCGauge value={last.soc} size={190} />
          <div className="w-full space-y-2.5 px-2">
            {[
              { label: 'Напряжение', value: `${last.voltage.toFixed(1)} В` },
              { label: 'Ток', value: `${last.current > 0 ? '+' : ''}${last.current.toFixed(1)} А` },
              { label: 'Мощность', value: `${last.power_kw.toFixed(1)} кВт` },
              { label: 'Сопротивление', value: `${last.internal_resistance.toFixed(2)} мΩ` },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RUL degradation chart */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="label">Прогноз деградации SoH</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                До конца ресурса (EOL 80%): <span style={{ color: '#3b82f6' }} className="font-medium">{last.rul_cycles} циклов · ~{last.rul_days} дней</span>
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded"
              style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
              Уверенность: {(last.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <RULChart history={history} />
        </div>
      </div>

      {/* ── Ток / Температура ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <p className="label mb-1">Зарядный ток</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Положительный = заряд, отрицательный = разряд
          </p>
          <PowerChart history={history} />
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="label">Температура батареи</p>
              <p className="text-xs mt-0.5" style={{ color: tempColor }}>
                Текущая: {last.temperature.toFixed(1)}°C
              </p>
            </div>
            {last.temperature > 40 && (
              <span className="text-xs px-2 py-1 rounded"
                style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                ⚠ Повышенная
              </span>
            )}
          </div>
          <TemperatureChart history={history} />
        </div>
      </div>

      {/* ── SoC history ── */}
      <div className="card">
        <p className="label mb-1">История заряда (SoC)</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Последние 5 часов</p>
        <MetricLine
          data={history.slice(-40).map(h => ({ ...h, timestamp: h.timestamp }))}
          dataKey="soc" color="#22c55e" label="SoC" unit="%"
          domain={[0, 100]} referenceValue={10} referenceLabel="Мин. заряд"
        />
      </div>

      {/* ── Cell balance ── */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="label">Балансировка ячеек</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {cells.length} ячеек · Разброс: <span style={{ color: cellStatus.color }} className="font-medium">{cellDelta} мВ</span>
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded font-medium"
            style={{ backgroundColor: `${cellStatus.color}18`, color: cellStatus.color }}>
            {cellStatus.label}
          </span>
        </div>
        <CellBalanceChart voltages={cells} />
        {/* Cell voltage mini-table */}
        <div className="mt-4 grid grid-cols-4 sm:grid-cols-8 gap-2">
          {cells.map((v, i) => {
            const avg = cells.reduce((a, b) => a + b, 0) / cells.length
            const diff = Math.abs(v - avg) * 1000
            const c = diff < 20 ? '#22c55e' : diff < 50 ? '#f59e0b' : '#ef4444'
            return (
              <div key={i} className="text-center p-1.5 rounded" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>#{i + 1}</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: c }}>{v.toFixed(3)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Спецификация батареи ── */}
      {vehicle.battery_brand && (
        <div className="card">
          <p className="label mb-4">Спецификация аккумулятора</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: 'Производитель', value: vehicle.battery_brand },
              { label: 'Модель батареи', value: vehicle.battery_model || '—' },
              { label: 'Химия', value: vehicle.battery_chemistry },
              { label: 'Ёмкость', value: `${vehicle.battery_nominal_capacity} кВт·ч` },
              { label: 'Напряжение', value: `${vehicle.battery_nominal_voltage} В` },
              { label: 'Конфигурация', value: vehicle.cell_config || `${vehicle.cell_count} яч.` },
              { label: 'Дата пр-ва', value: vehicle.manufacture_date || '—' },
              { label: 'Нач. циклов', value: `${vehicle.initial_cycles}` },
              { label: 'Гос. номер', value: vehicle.plate_number || '—' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Диагностика ── */}
      <div className="card">
        <p className="label mb-4">Диагностика батареи</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {([
            {
              title: 'Состояние здоровья',
              value: sohLabel(last.soh),
              detail: `SoH ${last.soh.toFixed(1)}% — ${last.soh >= 80 ? 'замена не требуется' : last.soh >= 60 ? 'рекомендуется замена' : 'требуется замена'}`,
              color: sohColor(last.soh),
              Icon: HeartPulse,
            },
            {
              title: 'Тепловой режим',
              value: last.temperature > 45 ? 'Перегрев' : last.temperature > 35 ? 'Повышенная' : 'Норма',
              detail: `${last.temperature.toFixed(1)}°C · Порог: 45°C`,
              color: tempColor,
              Icon: Thermometer,
            },
            {
              title: 'Внутреннее сопротивление',
              value: last.internal_resistance < 15 ? 'Норма' : last.internal_resistance < 25 ? 'Повышенное' : 'Критично',
              detail: `${last.internal_resistance.toFixed(2)} мΩ`,
              color: last.internal_resistance < 15 ? '#22c55e' : last.internal_resistance < 25 ? '#f59e0b' : '#ef4444',
              Icon: Zap,
            },
            {
              title: 'Балансировка ячеек',
              value: cellStatus.label,
              detail: `Разброс ${cellDelta} мВ · ${cells.length} ячеек`,
              color: cellStatus.color,
              Icon: Scale,
            },
            {
              title: 'Остаточный ресурс',
              value: last.rul_cycles > 500 ? 'Хороший' : last.rul_cycles > 100 ? 'Средний' : 'Низкий',
              detail: `${last.rul_cycles} циклов · ~${last.rul_days} дней`,
              color: last.rul_cycles > 500 ? '#22c55e' : last.rul_cycles > 100 ? '#f59e0b' : '#ef4444',
              Icon: Calendar,
            },
            {
              title: 'Режим работы',
              value: charging ? 'Зарядка' : 'Разряд',
              detail: `${Math.abs(last.current).toFixed(1)} А · ${last.power_kw.toFixed(1)} кВт`,
              color: charging ? '#22c55e' : '#3b82f6',
              Icon: charging ? PlugZap : Activity,
            },
          ] as const).map(item => (
            <div key={item.title} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${item.color}18` }}>
                <item.Icon size={16} style={{ color: item.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.title}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: item.color }}>{item.value}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── История зарядок ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(59,130,246,0.12)' }}>
              <History size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="label">История зарядок</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Последние 10 сессий зарядки</p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded"
            style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--accent)' }}>
            {chargingSessions.length} сессий
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: 380 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[['Дата', 'Дата / Время'], ['SoC↑', 'Нач. SoC'], ['SoC↓', 'Кон. SoC'], ['кВт·ч', 'Энергия'], ['Время', 'Длительность'], ['$', 'Стоимость']].map(([m, f]) => (
                  <th key={f} className="text-left py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    <span className="sm:hidden">{m}</span>
                    <span className="hidden sm:inline">{f}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chargingSessions.map((s, i) => (
                <tr key={s.id}
                  className="transition-colors"
                  style={{ borderBottom: i < chargingSessions.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td className="py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{s.startTime}</td>
                  <td className="py-3 px-2">
                    <span className="text-xs font-medium" style={{ color: socColor(s.startSoc) }}>{s.startSoc}%</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs font-medium" style={{ color: socColor(s.endSoc) }}>{s.endSoc}%</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs font-bold" style={{ color: 'var(--accent)', whiteSpace: 'nowrap' }}>{s.kwh} кВт·ч</span>
                  </td>
                  <td className="py-3 px-2 text-xs" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {s.durationMin >= 60
                      ? `${Math.floor(s.durationMin / 60)}ч ${s.durationMin % 60}м`
                      : `${s.durationMin}м`}
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs font-medium" style={{ color: '#22c55e' }}>${s.cost}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary row */}
        <div className="mt-4 pt-4 grid grid-cols-3 gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Всего энергии', value: `${chargingSessions.reduce((a, s) => a + s.kwh, 0).toFixed(1)} кВт·ч` },
            { label: 'Всего затрат', value: `$${chargingSessions.reduce((a, s) => a + s.cost, 0).toFixed(2)}` },
            { label: 'Ср. длительность', value: (() => { const avg = Math.round(chargingSessions.reduce((a,s) => a + s.durationMin, 0) / chargingSessions.length); return avg >= 60 ? `${Math.floor(avg/60)} ч ${avg%60} мин` : `${avg} мин` })() },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <VehicleFormModal open={editOpen} onClose={() => setEditOpen(false)} editing={vehicle} />
    </div>
  )
}
