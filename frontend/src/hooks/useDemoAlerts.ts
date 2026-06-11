import { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { generateHistory } from '../utils/mockData'
import { subMinutes } from 'date-fns'

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

function generateAlerts(vehicles: any[]): DemoAlert[] {
  const alerts: DemoAlert[] = []

  for (const v of vehicles) {
    const history = generateHistory(v.vehicle_id, 30)
    const last = history[history.length - 1]
    if (!last) continue

    const name = `${v.make} ${v.model}`
    const time = (offset: number) => subMinutes(new Date(), offset).toISOString()

    // Критически низкий заряд
    if (last.soc < 10) {
      alerts.push({
        id: `${v.vehicle_id}-soc-critical`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'LOW_SOC', priority: 'CRITICAL',
        message: `Критически низкий заряд батареи: ${last.soc.toFixed(1)}%`,
        triggered_at: time(3), is_active: true,
        value: last.soc, threshold: 10, unit: '%',
      })
    } else if (last.soc < 20) {
      alerts.push({
        id: `${v.vehicle_id}-soc-low`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'LOW_SOC', priority: 'HIGH',
        message: `Низкий заряд батареи: ${last.soc.toFixed(1)}%`,
        triggered_at: time(8), is_active: true,
        value: last.soc, threshold: 20, unit: '%',
      })
    }

    // Деградация SoH
    if (last.soh < 65) {
      alerts.push({
        id: `${v.vehicle_id}-soh-critical`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'SOH_DEGRADATION', priority: 'CRITICAL',
        message: `Критическая деградация батареи: SoH ${last.soh.toFixed(1)}%`,
        triggered_at: time(15), is_active: true,
        value: last.soh, threshold: 65, unit: '%',
      })
    } else if (last.soh < 80) {
      alerts.push({
        id: `${v.vehicle_id}-soh-high`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'SOH_DEGRADATION', priority: 'HIGH',
        message: `Деградация батареи: SoH ${last.soh.toFixed(1)}% — рекомендуется замена`,
        triggered_at: time(22), is_active: true,
        value: last.soh, threshold: 80, unit: '%',
      })
    }

    // Перегрев
    if (last.temperature > 45) {
      alerts.push({
        id: `${v.vehicle_id}-temp-critical`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'OVERTEMPERATURE', priority: 'CRITICAL',
        message: `Перегрев батареи: ${last.temperature.toFixed(1)}°C (порог 45°C)`,
        triggered_at: time(2), is_active: true,
        value: last.temperature, threshold: 45, unit: '°C',
      })
    } else if (last.temperature > 40) {
      alerts.push({
        id: `${v.vehicle_id}-temp-high`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'OVERTEMPERATURE', priority: 'HIGH',
        message: `Повышенная температура батареи: ${last.temperature.toFixed(1)}°C`,
        triggered_at: time(6), is_active: true,
        value: last.temperature, threshold: 40, unit: '°C',
      })
    }

    // Высокое внутреннее сопротивление
    if (last.internal_resistance > 25) {
      alerts.push({
        id: `${v.vehicle_id}-ir-critical`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'HIGH_RESISTANCE', priority: 'HIGH',
        message: `Высокое внутреннее сопротивление: ${last.internal_resistance.toFixed(1)} мΩ`,
        triggered_at: time(30), is_active: true,
        value: last.internal_resistance, threshold: 25, unit: 'мΩ',
      })
    } else if (last.internal_resistance > 15) {
      alerts.push({
        id: `${v.vehicle_id}-ir-medium`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'HIGH_RESISTANCE', priority: 'MEDIUM',
        message: `Повышенное внутреннее сопротивление: ${last.internal_resistance.toFixed(1)} мΩ`,
        triggered_at: time(45), is_active: true,
        value: last.internal_resistance, threshold: 15, unit: 'мΩ',
      })
    }

    // Низкий остаточный ресурс
    if (last.rul_cycles < 100) {
      alerts.push({
        id: `${v.vehicle_id}-rul-critical`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'LOW_RUL', priority: 'CRITICAL',
        message: `Критически малый остаточный ресурс: ${last.rul_cycles} циклов (~${last.rul_days} дней)`,
        triggered_at: time(60), is_active: true,
        value: last.rul_cycles, threshold: 100, unit: 'цикл',
      })
    } else if (last.rul_cycles < 300) {
      alerts.push({
        id: `${v.vehicle_id}-rul-low`,
        vehicle_id: v.vehicle_id, vehicle_name: name,
        alert_type: 'LOW_RUL', priority: 'MEDIUM',
        message: `Низкий остаточный ресурс: ${last.rul_cycles} циклов (~${last.rul_days} дней)`,
        triggered_at: time(120), is_active: true,
        value: last.rul_cycles, threshold: 300, unit: 'цикл',
      })
    }
  }

  // Сортировка: CRITICAL → HIGH → MEDIUM → LOW, потом по времени
  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  return alerts.sort((a, b) => order[a.priority] - order[b.priority])
}

export function useDemoAlerts(activeOnly = true) {
  const vehicles = useAppStore(s => s.vehicles)
  const [alerts, setAlerts] = useState<DemoAlert[]>([])
  const [resolved, setResolved] = useState<Set<string>>(new Set())

  useEffect(() => {
    const all = generateAlerts(vehicles)
    setAlerts(all)
  }, [vehicles])

  const filtered = alerts
    .map(a => ({ ...a, is_active: !resolved.has(a.id) }))
    .filter(a => !activeOnly || a.is_active)

  const stats = {
    CRITICAL: filtered.filter(a => a.priority === 'CRITICAL' && a.is_active).length,
    HIGH:     filtered.filter(a => a.priority === 'HIGH'     && a.is_active).length,
    MEDIUM:   filtered.filter(a => a.priority === 'MEDIUM'   && a.is_active).length,
    LOW:      filtered.filter(a => a.priority === 'LOW'      && a.is_active).length,
  }

  function resolve(id: string) {
    setResolved(s => new Set([...s, id]))
  }

  return { alerts: filtered, stats, resolve }
}
