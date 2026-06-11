/**
 * Generates realistic battery telemetry for demo mode (no backend needed).
 */
import { subMinutes, format } from 'date-fns'

export interface BatterySnapshot {
  timestamp: string
  soc: number
  soh: number
  internal_resistance: number
  rul_cycles: number
  rul_days: number
  confidence: number
  voltage: number
  current: number
  temperature: number
  power_kw: number
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/** Deterministic pseudo-random seeded by vehicle_id */
function seededRand(seed: string, index: number) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  h = Math.abs(h + index * 2654435761)
  return (h % 10000) / 10000
}

// Профиль батареи каждого ТС — уникальное состояние для реализма
const VEHICLE_PROFILES: Record<string, {
  baseSoC: number; baseSoH: number; baseIR: number; baseRUL: number; baseTemp: number
}> = {
  'EV-001': { baseSoC: 72, baseSoH: 94, baseIR: 9,  baseRUL: 1850, baseTemp: 27 }, // Отличное
  'EV-002': { baseSoC: 9,  baseSoH: 87, baseIR: 12, baseRUL: 820,  baseTemp: 34 }, // Низкий заряд
  'EV-003': { baseSoC: 41, baseSoH: 61, baseIR: 27, baseRUL: 190,  baseTemp: 39 }, // Деградация
  'EV-004': { baseSoC: 55, baseSoH: 84, baseIR: 11, baseRUL: 950,  baseTemp: 47 }, // Перегрев
  'EV-005': { baseSoC: 83, baseSoH: 91, baseIR: 10, baseRUL: 1400, baseTemp: 24 }, // Норма
}

export function generateHistory(vehicleId: string, points = 60): BatterySnapshot[] {
  const r = (i: number) => seededRand(vehicleId, i)

  const profile = VEHICLE_PROFILES[vehicleId]
  const baseSoC   = profile ? profile.baseSoC  : 20 + r(0) * 70
  const baseSoH   = profile ? profile.baseSoH  : 72 + r(1) * 25
  const baseIR    = profile ? profile.baseIR   : 8  + r(2) * 8
  const baseRUL   = profile ? profile.baseRUL  : 150 + r(3) * 1800
  const baseTemp  = profile ? profile.baseTemp : 22 + r(4) * 12

  const result: BatterySnapshot[] = []
  let soc = baseSoC
  let temp = baseTemp

  for (let i = points; i >= 0; i--) {
    const t = subMinutes(new Date(), i * 5)
    const noise = (r(i * 7 + 1) - 0.5) * 2
    const charging = soc < 30 || (soc < 80 && r(i * 3) > 0.7)
    const current = charging
      ? +(20 + r(i * 5) * 60).toFixed(1)
      : -(10 + r(i * 5) * 80).toFixed(1)

    const soh = clamp(baseSoH - (points - i) * 0.003 + noise * 0.1, 50, 100)
    const ir  = clamp(baseIR  + (points - i) * 0.005 + noise * 0.3, 5, 50)
    const rul_cycles = Math.max(0, Math.round(baseRUL - (points - i) * 0.5))
    const voltage = clamp(350 + (soc / 100) * 50 + noise * 2, 300, 420)
    temp = clamp(temp + (r(i * 11) - 0.48) * 0.5, 18, 55)
    const power_kw = +(voltage * Math.abs(current) / 1000).toFixed(1)

    soc = clamp(soc + (charging ? 0.8 : -0.6) + noise * 0.3, 5, 99)

    result.push({
      timestamp: t.toISOString(),
      soc: +soc.toFixed(1),
      soh: +soh.toFixed(1),
      internal_resistance: +ir.toFixed(2),
      rul_cycles,
      rul_days: Math.round(rul_cycles / 1.5),
      confidence: +(0.7 + r(i * 13) * 0.25).toFixed(2),
      voltage: +voltage.toFixed(1),
      current,
      temperature: +temp.toFixed(1),
      power_kw,
    })
  }
  return result
}

export function generateCellVoltages(vehicleId: string): number[] {
  const base = 3.65 + seededRand(vehicleId, 99) * 0.2
  return Array.from({ length: 16 }, (_, i) =>
    +(base + (seededRand(vehicleId, i * 17 + 5) - 0.5) * 0.06).toFixed(3)
  )
}

export interface Vehicle {
  vehicle_id: string
  plate_number: string
  make: string
  model: string
  year: number
  // Battery specs for analysis
  battery_chemistry: 'NMC' | 'LFP' | 'NCA' | 'LTO'
  battery_brand: string
  battery_model: string
  battery_nominal_capacity: number   // kWh
  battery_nominal_voltage: number    // V
  cell_count: number
  cell_config: string                // e.g. "96s2p"
  manufacture_date: string           // YYYY-MM
  initial_cycles: number
}

export const DEMO_VEHICLES: Vehicle[] = [
  {
    vehicle_id: 'EV-001', plate_number: 'A 001 BC 77', make: 'Tesla', model: 'Model 3', year: 2022,
    battery_chemistry: 'NMC', battery_brand: 'Panasonic', battery_model: '2170 Cell Pack',
    battery_nominal_capacity: 82, battery_nominal_voltage: 350, cell_count: 4416, cell_config: '96s46p',
    manufacture_date: '2022-03', initial_cycles: 12,
  },
  {
    vehicle_id: 'EV-002', plate_number: 'B 002 DE 78', make: 'BYD', model: 'Atto 3', year: 2023,
    battery_chemistry: 'LFP', battery_brand: 'BYD', battery_model: 'Blade Battery Gen2',
    battery_nominal_capacity: 60, battery_nominal_voltage: 320, cell_count: 100, cell_config: '100s1p',
    manufacture_date: '2023-01', initial_cycles: 5,
  },
  {
    vehicle_id: 'EV-003', plate_number: 'C 003 EF 99', make: 'Hyundai', model: 'Ioniq 6', year: 2023,
    battery_chemistry: 'NMC', battery_brand: 'SK On', battery_model: 'NCM9 Pouch',
    battery_nominal_capacity: 77.4, battery_nominal_voltage: 360, cell_count: 192, cell_config: '192s1p',
    manufacture_date: '2023-05', initial_cycles: 8,
  },
  {
    vehicle_id: 'EV-004', plate_number: 'D 004 GH 50', make: 'Rivian', model: 'R1T', year: 2021,
    battery_chemistry: 'NMC', battery_brand: 'Samsung SDI', battery_model: '21700 Large Pack',
    battery_nominal_capacity: 135, battery_nominal_voltage: 400, cell_count: 7776, cell_config: '108s72p',
    manufacture_date: '2021-10', initial_cycles: 45,
  },
  {
    vehicle_id: 'EV-005', plate_number: 'E 005 IJ 77', make: 'Volkswagen', model: 'ID.4', year: 2022,
    battery_chemistry: 'NMC', battery_brand: 'LG Energy Solution', battery_model: 'NCMA Prismatic',
    battery_nominal_capacity: 77, battery_nominal_voltage: 350, cell_count: 288, cell_config: '96s3p',
    manufacture_date: '2022-07', initial_cycles: 20,
  },
]
