import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../../store'
import { Vehicle } from '../../utils/mockData'
import VehicleFormModal from '../../components/VehicleFormModal'
import { Plus, Pencil, Trash2, ChevronRight, Battery, Zap, Car, Usb, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

const CHEM_COLOR: Record<string, string> = {
  NMC: '#3b82f6',
  LFP: '#22c55e',
  NCA: '#f59e0b',
  LTO: '#a78bfa',
}

/* ── USB scan steps ── */
const SCAN_STEPS = [
  { id: 'connect',  label: 'Подключение к OBD-II адаптеру…',     ms: 900  },
  { id: 'port',     label: 'Обнаружен USB-порт COM3',             ms: 700  },
  { id: 'protocol', label: 'Определение протокола CAN-шины…',     ms: 1100 },
  { id: 'vin',      label: 'Считывание VIN-кода автомобиля…',     ms: 1200 },
  { id: 'bms',      label: 'Подключение к BMS (Battery Mgmt)…',   ms: 900  },
  { id: 'params',   label: 'Загрузка параметров батареи…',        ms: 800  },
  { id: 'done',     label: 'Данные получены успешно',             ms: 0    },
]

/* Список возможных «найденных» авто */
const USB_VEHICLES = [
  { make: 'Tesla',     model: 'Model Y',  year: 2023, chemistry: 'NMC', capacity: 75,  voltage: 360, vin: 'YV4ER2AE0P2345678' },
  { make: 'BMW',       model: 'iX3',      year: 2022, chemistry: 'NMC', capacity: 74,  voltage: 400, vin: 'WBAFQ410X0BCK12345' },
  { make: 'Audi',      model: 'e-tron 55',year: 2023, chemistry: 'NMC', capacity: 95,  voltage: 396, vin: 'WAUZZZGE0KB123456'  },
  { make: 'Kia',       model: 'EV6',      year: 2023, chemistry: 'NMC', capacity: 77,  voltage: 697, vin: 'KNDC4DLD7P5012345'  },
  { make: 'Hyundai',   model: 'IONIQ 5',  year: 2022, chemistry: 'NMC', capacity: 72,  voltage: 697, vin: 'KMHK341GBNU012345'  },
  { make: 'Mercedes',  model: 'EQS 450',  year: 2023, chemistry: 'NMC', capacity: 107, voltage: 396, vin: 'W1K2960971A012345'  },
]

function UsbModal({ onClose, onAdd }: { onClose: () => void; onAdd: (v: any) => void }) {
  const [step, setStep] = useState(-1)         // -1 = idle, 0..N = scanning, 99 = done, -2 = error
  const [found, setFound] = useState<typeof USB_VEHICLES[0] | null>(null)

  function startScan() {
    setStep(0)
    setFound(null)
  }

  /* Advance steps */
  useEffect(() => {
    if (step < 0 || step >= SCAN_STEPS.length - 1) return
    const t = setTimeout(() => setStep(s => s + 1), SCAN_STEPS[step].ms)
    return () => clearTimeout(t)
  }, [step])

  /* When we reach last step — pick random vehicle */
  useEffect(() => {
    if (step === SCAN_STEPS.length - 1) {
      const v = USB_VEHICLES[Math.floor(Math.random() * USB_VEHICLES.length)]
      setFound(v)
      setTimeout(() => setStep(99), 400)
    }
  }, [step])

  function handleAdd() {
    if (!found) return
    onAdd(found)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
              <Usb size={17} color="#fff" />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Подключение по USB / OBD-II</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Автоматическое определение автомобиля</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">

          {/* Idle state */}
          {step === -1 && (
            <div className="text-center py-4 space-y-4">
              <div className="flex flex-col items-center gap-3">
                {/* USB animation */}
                <div className="relative w-20 h-20">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(99,102,241,0.08)', border: '2px dashed rgba(99,102,241,0.3)' }}>
                    <Usb size={32} style={{ color: '#6366f1' }} />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Подключите OBD-II адаптер к автомобилю
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Подсоедините USB-кабель к компьютеру, а OBD-II разъём — к диагностическому порту под панелью приборов
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-xl p-3 text-left space-y-2"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                {[
                  ['1', 'Найдите OBD-II разъём под рулём'],
                  ['2', 'Вставьте адаптер и подождите мигания LED'],
                  ['3', 'Соедините USB-кабель с компьютером'],
                  ['4', 'Нажмите «Начать сканирование»'],
                ].map(([n, text]) => (
                  <div key={n} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>{n}</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>

              <button onClick={startScan}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
                <Usb size={16} />
                Начать сканирование
              </button>
            </div>
          )}

          {/* Scanning */}
          {step >= 0 && step < 99 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                Сканирование…
              </p>
              <div className="space-y-2">
                {SCAN_STEPS.map((s, i) => {
                  const done    = i < step
                  const current = i === step
                  const pending = i > step
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{
                        backgroundColor: current ? 'rgba(99,102,241,0.08)' : done ? 'rgba(34,197,94,0.06)' : 'var(--bg-surface)',
                        border: `1px solid ${current ? 'rgba(99,102,241,0.25)' : done ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                        opacity: pending ? 0.45 : 1,
                        transition: 'all 0.3s ease',
                      }}>
                      <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                        {done    && <CheckCircle size={16} style={{ color: '#22c55e' }} />}
                        {current && <Loader2 size={16} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />}
                        {pending && <div className="w-3 h-3 rounded-full" style={{ border: '1.5px solid var(--border)' }} />}
                      </div>
                      <span className="text-xs font-medium flex-1"
                        style={{ color: done ? '#22c55e' : current ? '#6366f1' : 'var(--text-muted)' }}>
                        {s.label}
                      </span>
                      {done && <span className="text-xs" style={{ color: '#22c55e' }}>✓</span>}
                    </div>
                  )
                })}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((step / (SCAN_STEPS.length - 1)) * 100)}%`,
                    background: 'linear-gradient(90deg, #6366f1, #3b82f6)',
                  }} />
              </div>
            </div>
          )}

          {/* Done — found vehicle */}
          {step === 99 && found && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#22c55e' }}>
                <CheckCircle size={17} />
                Автомобиль успешно обнаружен
              </div>

              {/* Vehicle info card */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.05)' }}>
                <div className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(34,197,94,0.15)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold"
                    style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                    {found.make[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {found.make} {found.model}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{found.year} г. · VIN: {found.vin}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 divide-x px-0"
                  style={{ borderColor: 'rgba(34,197,94,0.15)' }}>
                  {[
                    ['Химия',    found.chemistry],
                    ['Ёмкость',  `${found.capacity} кВт·ч`],
                    ['Напряжение', `${found.voltage} В`],
                  ].map(([label, val]) => (
                    <div key={label} className="px-3 py-2.5 text-center">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  Отмена
                </button>
                <button onClick={handleAdd}
                  className="flex-2 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 4px 12px rgba(34,197,94,0.3)', flex: 2 }}>
                  <Plus size={15} />
                  Добавить автомобиль
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function VehicleCard({ vehicle, onEdit }: { vehicle: Vehicle; onEdit: (v: Vehicle) => void }) {
  const { deleteVehicle } = useAppStore()

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (confirm(`Удалить ${vehicle.make} ${vehicle.model} (${vehicle.plate_number || vehicle.vehicle_id})?`)) {
      deleteVehicle(vehicle.vehicle_id)
    }
  }

  const chemColor = CHEM_COLOR[vehicle.battery_chemistry] ?? 'var(--text-muted)'

  return (
    <div className="card group relative flex flex-col gap-4">
      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
        <button onClick={() => onEdit(vehicle)} title="Редактировать"
          className="p-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          <Pencil size={14} />
        </button>
        <button onClick={handleDelete} title="Удалить"
          className="p-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 pr-16">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--accent)' }}>
          {vehicle.make[0]}
        </div>
        <div className="min-w-0">
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {vehicle.make} {vehicle.model}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {vehicle.plate_number || vehicle.vehicle_id} · {vehicle.year}
          </p>
        </div>
      </div>

      {/* Battery info */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 mb-1">
          <Battery size={13} style={{ color: chemColor }} />
          <span className="text-xs font-medium" style={{ color: chemColor }}>
            {vehicle.battery_brand} — {vehicle.battery_model || vehicle.battery_chemistry}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Химия',      value: vehicle.battery_chemistry },
            { label: 'Ёмкость',    value: `${vehicle.battery_nominal_capacity} кВт·ч` },
            { label: 'Напряжение', value: `${vehicle.battery_nominal_voltage} В` },
            { label: 'Ячейки',     value: vehicle.cell_config || `${vehicle.cell_count} шт.` },
            { label: 'Пр-во',      value: vehicle.manufacture_date || '—' },
            { label: 'Нач. циклов',value: String(vehicle.initial_cycles) },
          ].map(item => (
            <div key={item.label} className="px-2.5 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Link to={`/vehicles/${vehicle.vehicle_id}`}
        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors mt-auto"
        style={{ backgroundColor: 'rgba(59,130,246,0.08)', color: 'var(--accent)' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.15)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.08)')}>
        <span className="flex items-center gap-1.5"><Zap size={12} /> Открыть мониторинг</span>
        <ChevronRight size={13} />
      </Link>
    </div>
  )
}

export default function Vehicles() {
  const { vehicles, addVehicle } = useAppStore()
  const [modalOpen, setModalOpen]   = useState(false)
  const [usbOpen,   setUsbOpen]     = useState(false)
  const [editing,   setEditing]     = useState<Vehicle | null>(null)

  function openAdd()          { setEditing(null); setModalOpen(true) }
  function openEdit(v: Vehicle) { setEditing(v);   setModalOpen(true) }

  function handleUsbAdd(found: any) {
    const newVehicle: Vehicle = {
      vehicle_id:               `usb_${Date.now()}`,
      make:                     found.make,
      model:                    found.model,
      year:                     found.year,
      plate_number:             `USB-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
      battery_chemistry:        found.chemistry as any,
      battery_nominal_capacity: found.capacity,
      battery_nominal_voltage:  found.voltage,
      battery_brand:            found.make,
      battery_model:            `${found.chemistry}-${found.capacity}`,
      cell_count:               96,
      cell_config:              '96s1p',
      initial_cycles:           0,
      manufacture_date:         `${found.year}-01`,
    }
    addVehicle(newVehicle)
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Мои автомобили</h1>
          <p className="page-subtitle">
            Список электромобилей · {vehicles.length} {vehicles.length === 1 ? 'автомобиль' : 'автомобилей'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* USB button */}
          <button onClick={() => setUsbOpen(true)}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#6366f1'
              e.currentTarget.style.color = '#6366f1'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}>
            <Usb size={15} />
            Подключить по USB
          </button>
          {/* Add button */}
          <button onClick={openAdd}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <Plus size={15} /> Добавить ТС
          </button>
        </div>
      </div>

      {/* Grid */}
      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4"
          style={{ color: 'var(--text-muted)' }}>
          <Car size={48} style={{ opacity: 0.3 }} />
          <p className="text-sm">Вы ещё не добавили автомобиль. Добавьте свой первый электромобиль.</p>
          <div className="flex gap-2">
            <button onClick={() => setUsbOpen(true)}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <Usb size={15} /> Подключить по USB
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
              <Plus size={15} /> Добавить ТС
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map(v => <VehicleCard key={v.vehicle_id} vehicle={v} onEdit={openEdit} />)}
        </div>
      )}

      <VehicleFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
      {usbOpen && <UsbModal onClose={() => setUsbOpen(false)} onAdd={handleUsbAdd} />}
    </div>
  )
}
