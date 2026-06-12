import { create } from 'zustand'
import { Vehicle, DEMO_VEHICLES } from '../utils/mockData'

function applyTheme(dark: boolean) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

const savedTheme = localStorage.getItem('theme')
const initialDark = savedTheme !== 'light'
applyTheme(initialDark)

function loadVehicles(): Vehicle[] {
  try {
    const saved = localStorage.getItem('evbis_vehicles')
    if (saved) return JSON.parse(saved)
  } catch {}
  return DEMO_VEHICLES
}

function saveVehicles(vehicles: Vehicle[]) {
  localStorage.setItem('evbis_vehicles', JSON.stringify(vehicles))
}

interface AppStore {
  darkMode: boolean
  toggleDarkMode: () => void
  vehicles: Vehicle[]
  addVehicle: (v: Vehicle) => void
  updateVehicle: (v: Vehicle) => void
  deleteVehicle: (id: string) => void
  resolvedAlerts: Set<string>
  resolveAlert: (id: string) => void
  clearResolvedAlerts: (keepIds: string[]) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  darkMode: initialDark,
  toggleDarkMode: () => {
    const next = !get().darkMode
    localStorage.setItem('theme', next ? 'dark' : 'light')
    applyTheme(next)
    set({ darkMode: next })
  },
  vehicles: loadVehicles(),
  addVehicle: (v) => {
    const next = [...get().vehicles, v]
    saveVehicles(next)
    set({ vehicles: next })
  },
  updateVehicle: (v) => {
    const next = get().vehicles.map(x => x.vehicle_id === v.vehicle_id ? v : x)
    saveVehicles(next)
    set({ vehicles: next })
  },
  deleteVehicle: (id) => {
    const next = get().vehicles.filter(x => x.vehicle_id !== id)
    saveVehicles(next)
    set({ vehicles: next })
  },
  resolvedAlerts: new Set<string>(),
  resolveAlert: (id) => {
    set(s => ({ resolvedAlerts: new Set([...s.resolvedAlerts, id]) }))
  },
  clearResolvedAlerts: (keepIds) => {
    set({ resolvedAlerts: new Set(keepIds) })
  },
}))
