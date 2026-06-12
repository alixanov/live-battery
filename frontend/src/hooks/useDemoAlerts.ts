import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import { shallow } from 'zustand/shallow'
import { generateHistory } from '../utils/mockData'
import { subMinutes, subSeconds } from 'date-fns'

export interface DemoAlert {
  id: string
  vehicle_id: string
  vehicle_name: string
  alert_type: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
  triggered_at: string
  is_active: boolean
  value: number
  threshold: number
  unit: string
}

const ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

/* случайное смещение ±delta */
function jitter(base: number, delta: number) {
  return base + (Math.random() - 0.5) * 2 * delta
}

function generateAlerts(vehicles: any[], tick: number): DemoAlert[] {
  const alerts: DemoAlert[] = []
  const now = new Date()

  for (const v of vehicles) {
    const history = generateHistory(v.vehicle_id, 30)
    const last = history[history.length - 1]
    if (!last) continue

    const name = `${v.make} ${v.model}`

    /* Флуктуируем значения в зависимости от tick */
    const soc  = Math.max(5,  Math.min(99,  last.soc  + Math.sin(tick * 0.7 + v.vehicle_id.charCodeAt(0)) * 3))
    const temp = Math.max(18, Math.min(58,  last.temperature + Math.sin(tick * 0.4 + 1) * 2.5))
    const ir   = Math.max(5,  Math.min(40,  last.internal_resistance + Math.sin(tick * 0.3 + 2) * 1.5))
    const soh  = last.soh
    const rul  = last.rul_cycles

    const ago = (sec: number) => subSeconds(now, sec).toISOString()

    /* SoC */
    if (soc < 10) {
      alerts.push({
        id: `${v.vehicle_id}-soc-critical`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'LOW_SOC', priority: 'CRITICAL',
        message: `Критически низкий заряд: ${soc.toFixed(1)}% — немедленно зарядите`,
        triggered_at: ago(jitter(90, 30)), is_active: true,
        value: +soc.toFixed(1), threshold: 10, unit: '%',
      })
    } else if (soc < 20) {
      alerts.push({
        id: `${v.vehicle_id}-soc-low`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'LOW_SOC', priority: 'HIGH',
        message: `Низкий заряд батареи: ${soc.toFixed(1)}%`,
        triggered_at: ago(jitter(300, 60)), is_active: true,
        value: +soc.toFixed(1), threshold: 20, unit: '%',
      })
    }

    /* SoH деградация */
    if (soh < 65) {
      alerts.push({
        id: `${v.vehicle_id}-soh-critical`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'SOH_DEGRADATION', priority: 'CRITICAL',
        message: `Критическая деградация: SoH ${soh.toFixed(1)}% — требуется замена`,
        triggered_at: ago(jitter(600, 120)), is_active: true,
        value: +soh.toFixed(1), threshold: 65, unit: '%',
      })
    } else if (soh < 80) {
      alerts.push({
        id: `${v.vehicle_id}-soh-high`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'SOH_DEGRADATION', priority: 'HIGH',
        message: `Деградация батареи: SoH ${soh.toFixed(1)}% — рекомендуется замена`,
        triggered_at: ago(jitter(900, 180)), is_active: true,
        value: +soh.toFixed(1), threshold: 80, unit: '%',
      })
    }

    /* Температура */
    if (temp > 47) {
      alerts.push({
        id: `${v.vehicle_id}-temp-critical`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'OVERTEMPERATURE', priority: 'CRITICAL',
        message: `Перегрев батареи: ${temp.toFixed(1)}°C — остановитесь`,
        triggered_at: ago(jitter(45, 20)), is_active: true,
        value: +temp.toFixed(1), threshold: 47, unit: '°C',
      })
    } else if (temp > 40) {
      alerts.push({
        id: `${v.vehicle_id}-temp-high`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'OVERTEMPERATURE', priority: 'HIGH',
        message: `Повышенная температура: ${temp.toFixed(1)}°C (норма < 40°C)`,
        triggered_at: ago(jitter(200, 60)), is_active: true,
        value: +temp.toFixed(1), threshold: 40, unit: '°C',
      })
    } else if (temp > 35 && tick % 3 === 0) {
      /* Периодически добавляем предупреждение среднего уровня */
      alerts.push({
        id: `${v.vehicle_id}-temp-medium`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'OVERTEMPERATURE', priority: 'MEDIUM',
        message: `Температура батареи повышается: ${temp.toFixed(1)}°C`,
        triggered_at: ago(jitter(60, 30)), is_active: true,
        value: +temp.toFixed(1), threshold: 35, unit: '°C',
      })
    }

    /* Сопротивление */
    if (ir > 26) {
      alerts.push({
        id: `${v.vehicle_id}-ir-critical`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'HIGH_RESISTANCE', priority: 'HIGH',
        message: `Высокое внутреннее сопротивление: ${ir.toFixed(1)} мОм`,
        triggered_at: ago(jitter(1200, 300)), is_active: true,
        value: +ir.toFixed(1), threshold: 26, unit: 'мОм',
      })
    } else if (ir > 16) {
      alerts.push({
        id: `${v.vehicle_id}-ir-medium`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'HIGH_RESISTANCE', priority: 'MEDIUM',
        message: `Повышенное сопротивление: ${ir.toFixed(1)} мОм — рекомендуется диагностика`,
        triggered_at: ago(jitter(1800, 400)), is_active: true,
        value: +ir.toFixed(1), threshold: 16, unit: 'мОм',
      })
    }

    /* Остаточный ресурс */
    if (rul < 100) {
      alerts.push({
        id: `${v.vehicle_id}-rul-critical`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'LOW_RUL', priority: 'CRITICAL',
        message: `Критически мало циклов: ${rul} осталось (~${last.rul_days} дней)`,
        triggered_at: ago(jitter(3600, 600)), is_active: true,
        value: rul, threshold: 100, unit: 'цикл',
      })
    } else if (rul < 300) {
      alerts.push({
        id: `${v.vehicle_id}-rul-low`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'LOW_RUL', priority: 'MEDIUM',
        message: `Низкий остаточный ресурс: ${rul} циклов (~${last.rul_days} дней)`,
        triggered_at: ago(jitter(7200, 600)), is_active: true,
        value: rul, threshold: 300, unit: 'цикл',
      })
    }

    /* Каждые ~2 мин добавляем случайный LOW-алерт для жизни */
    if (tick % 2 === (v.vehicle_id.charCodeAt(0) % 2)) {
      const lowMsgs = [
        { type: 'LOW_SOC',        msg: `Заряд опускается: ${soc.toFixed(1)}% — рекомендуем зарядку`,       val: +soc.toFixed(1),  thr: 30,  u: '%'   },
        { type: 'OVERTEMPERATURE',msg: `Температура выше нормы: ${temp.toFixed(1)}°C`,                     val: +temp.toFixed(1), thr: 32,  u: '°C'  },
        { type: 'HIGH_RESISTANCE',msg: `Незначительный рост сопротивления: ${ir.toFixed(1)} мОм`,          val: +ir.toFixed(1),   thr: 12,  u: 'мОм' },
      ]
      const pick = lowMsgs[tick % lowMsgs.length]
      alerts.push({
        id: `${v.vehicle_id}-low-${pick.type}`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: pick.type, priority: 'LOW',
        message: pick.msg,
        triggered_at: ago(jitter(120, 60)), is_active: true,
        value: pick.val, threshold: pick.thr, unit: pick.u,
      })
    }
  }

  return alerts.sort((a, b) => ORDER[a.priority] - ORDER[b.priority])
}

/* ── Пул новых алертов — появляются после удаления ── */
const EXTRA_POOL = [
  { type: 'OVERTEMPERATURE', priority: 'MEDIUM' as const, msg: (v: string, val: number) => `${v}: температура батареи ${val.toFixed(1)}°C — следите за нагревом` },
  { type: 'HIGH_RESISTANCE', priority: 'LOW'    as const, msg: (v: string, val: number) => `${v}: незначительный рост сопротивления ${val.toFixed(1)} мОм` },
  { type: 'LOW_SOC',         priority: 'MEDIUM' as const, msg: (v: string, val: number) => `${v}: заряд опускается до ${val.toFixed(1)}% — рекомендуем зарядку` },
  { type: 'SOH_DEGRADATION', priority: 'LOW'    as const, msg: (v: string, val: number) => `${v}: незначительная деградация SoH ${val.toFixed(1)}%` },
  { type: 'LOW_RUL',         priority: 'MEDIUM' as const, msg: (v: string, val: number) => `${v}: осталось ${Math.round(val)} циклов заряда` },
  { type: 'OVERTEMPERATURE', priority: 'HIGH'   as const, msg: (v: string, val: number) => `${v}: повышенная температура ${val.toFixed(1)}°C при зарядке` },
  { type: 'HIGH_RESISTANCE', priority: 'MEDIUM' as const, msg: (v: string, val: number) => `${v}: сопротивление ячеек выросло до ${val.toFixed(1)} мОм` },
  { type: 'LOW_SOC',         priority: 'HIGH'   as const, msg: (v: string, val: number) => `${v}: быстрый разряд — заряд ${val.toFixed(1)}% за последний час` },
]

export function useDemoAlerts(activeOnly = true) {
  const vehicles          = useAppStore(s => s.vehicles)
  const resolvedAlerts    = useAppStore(s => s.resolvedAlerts)
  const resolveAlert      = useAppStore(s => s.resolveAlert)
  const clearResolvedAlerts = useAppStore(s => s.clearResolvedAlerts)

  const [tick, setTick]   = useState(0)
  const [extras, setExtras] = useState<DemoAlert[]>([])
  const tickRef = useRef(0)

  /* Каждые 25-45 секунд — добавляем новый алерт */
  useEffect(() => {
    if (!vehicles.length) return
    const delay = 25_000 + Math.random() * 20_000
    const id = setTimeout(() => {
      const v    = vehicles[Math.floor(Math.random() * vehicles.length)]
      const tmpl = EXTRA_POOL[Math.floor(Math.random() * EXTRA_POOL.length)]
      const name = `${v.make} ${v.model}`
      const val  = tmpl.type === 'LOW_SOC'        ? 15 + Math.random() * 15
                 : tmpl.type === 'OVERTEMPERATURE' ? 36 + Math.random() * 10
                 : tmpl.type === 'HIGH_RESISTANCE' ? 12 + Math.random() * 10
                 : tmpl.type === 'LOW_RUL'         ? 150 + Math.random() * 150
                 : 82 + Math.random() * 6

      const fresh: DemoAlert = {
        id:           `extra_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        vehicle_id:   v.vehicle_id,
        vehicle_name: name,
        alert_type:   tmpl.type,
        priority:     tmpl.priority,
        message:      tmpl.msg(name, val),
        triggered_at: new Date().toISOString(),
        is_active:    true,
        value:        +val.toFixed(1),
        threshold:    0,
        unit:         tmpl.type === 'LOW_SOC' ? '%' : tmpl.type === 'OVERTEMPERATURE' ? '°C' : tmpl.type === 'HIGH_RESISTANCE' ? 'мОм' : tmpl.type === 'LOW_RUL' ? 'цикл' : '%',
      }
      setExtras(prev => [fresh, ...prev].slice(0, 12))
      tickRef.current += 1
      setTick(tickRef.current)
    }, delay)
    return () => clearTimeout(id)
  })

  const base = generateAlerts(vehicles, tick)
  const all  = [...extras, ...base]

  const filtered = all
    .map(a => ({ ...a, is_active: !resolvedAlerts.has(a.id) }))
    .filter(a => !activeOnly || a.is_active)
    .sort((a, b) => ORDER[a.priority] - ORDER[b.priority])

  const stats = {
    CRITICAL: filtered.filter(a => a.priority === 'CRITICAL').length,
    HIGH:     filtered.filter(a => a.priority === 'HIGH').length,
    MEDIUM:   filtered.filter(a => a.priority === 'MEDIUM').length,
    LOW:      filtered.filter(a => a.priority === 'LOW').length,
  }

  function resolve(id: string) {
    /* Удаляем немедленно */
    resolveAlert(id)
    /* Убираем из extras тоже */
    setExtras(prev => prev.filter(a => a.id !== id))
  }

  return { alerts: filtered, stats, resolve }
}
