/**
 * Provides live-updating demo data when backend is unavailable.
 * Simulates real-time telemetry by ticking every 5s.
 */
import { useState, useEffect, useRef } from 'react'
import { generateHistory, generateCellVoltages, BatterySnapshot } from '../utils/mockData'
import { useAppStore } from '../store'

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function useDemoVehicles() {
  return useAppStore(s => s.vehicles)
}

export function useDemoHistory(vehicleId: string, points = 60) {
  const [history, setHistory] = useState<BatterySnapshot[]>(() => generateHistory(vehicleId, points))

  useEffect(() => {
    const id = setInterval(() => {
      setHistory(prev => {
        const last = prev[prev.length - 1]
        const charging = last.soc < 25 || (last.soc < 80 && Math.random() > 0.7)
        const soc = clamp(last.soc + (charging ? 0.9 : -0.7) + (Math.random() - 0.5) * 0.4, 5, 99)
        const temp = clamp(last.temperature + (Math.random() - 0.48) * 0.4, 18, 55)
        const ir   = clamp(last.internal_resistance + (Math.random() - 0.5) * 0.05, 5, 50)
        const next: BatterySnapshot = {
          timestamp: new Date().toISOString(),
          soc:  +soc.toFixed(1),
          soh:  +clamp(last.soh - 0.001, 50, 100).toFixed(1),
          internal_resistance: +ir.toFixed(2),
          rul_cycles: Math.max(0, last.rul_cycles - 1),
          rul_days:   Math.max(0, last.rul_days - 1),
          confidence: last.confidence,
          voltage:    +clamp(350 + (soc / 100) * 50 + (Math.random() - 0.5) * 3, 300, 420).toFixed(1),
          current:    charging ? +(20 + Math.random() * 60).toFixed(1) : -(10 + Math.random() * 80).toFixed(1),
          temperature: +temp.toFixed(1),
          power_kw:   +(350 * 40 / 1000 + Math.random() * 5).toFixed(1),
        }
        return [...prev.slice(-points + 1), next]
      })
    }, 5000)
    return () => clearInterval(id)
  }, [vehicleId, points])

  return history
}

export function useDemoCells(vehicleId: string) {
  const [cells, setCells] = useState(() => generateCellVoltages(vehicleId))
  useEffect(() => {
    const id = setInterval(() => {
      setCells(prev => prev.map(v => +clamp(v + (Math.random() - 0.5) * 0.003, 3.2, 4.3).toFixed(3)))
    }, 3000)
    return () => clearInterval(id)
  }, [vehicleId])
  return cells
}
