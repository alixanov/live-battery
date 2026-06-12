import { useState, useEffect } from 'react'
import { X, Car, Battery, ChevronDown } from 'lucide-react'
import { Vehicle } from '../utils/mockData'
import { useAppStore } from '../store'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Vehicle | null
}

const CHEMISTRIES = ['NMC', 'LFP', 'NCA', 'LTO'] as const
const BATTERY_BRANDS = [
  'Panasonic', 'Samsung SDI', 'LG Energy Solution', 'SK On',
  'CATL', 'BYD', 'CALB', 'Gotion', 'Northvolt', 'Other',
]
const MAKES = ['Tesla', 'BYD', 'Hyundai', 'Kia', 'Volkswagen', 'Rivian',
  'Ford', 'GM', 'Nissan', 'BMW', 'Mercedes', 'Audi', 'Volvo', 'NIO', 'Xpeng', 'Other']

const EMPTY: Omit<Vehicle, 'vehicle_id'> = {
  plate_number: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  battery_chemistry: 'NMC',
  battery_brand: '',
  battery_model: '',
  battery_nominal_capacity: 60,
  battery_nominal_voltage: 350,
  cell_count: 192,
  cell_config: '',
  manufacture_date: '',
  initial_cycles: 0,
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      {error && <p className="text-xs font-medium" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder, min, max, step, disabled }: any) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      min={min} max={max} step={step} disabled={disabled}
      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
      style={{
        backgroundColor: disabled ? 'var(--bg-surface)' : 'var(--bg-surface)',
        border: '1.5px solid var(--border)',
        color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
        opacity: disabled ? 0.6 : 1,
        WebkitAppearance: 'none',
        fontSize: 16, // prevents iOS zoom on focus
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
    />
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none transition-colors pr-8"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1.5px solid var(--border)',
          color: 'var(--text-primary)',
          WebkitAppearance: 'none',
          fontSize: 16, // prevents iOS zoom
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)' }} />
    </div>
  )
}

export default function VehicleFormModal({ open, onClose, editing }: Props) {
  const { addVehicle, updateVehicle, vehicles } = useAppStore()
  const [form, setForm] = useState<Omit<Vehicle, 'vehicle_id'> & { vehicle_id: string }>({
    vehicle_id: '', ...EMPTY,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({ ...editing })
      } else {
        const nextNum = vehicles.length + 1
        setForm({ vehicle_id: `EV-${String(nextNum).padStart(3, '0')}`, ...EMPTY })
      }
      setErrors({})
      // small delay so CSS transition plays
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [editing, open])

  // lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function set(key: keyof typeof form, val: any) {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => { const n = { ...e }; delete n[key]; return n })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.vehicle_id.trim()) e.vehicle_id = 'Обязательное поле'
    if (!form.make.trim()) e.make = 'Обязательное поле'
    if (!form.model.trim()) e.model = 'Обязательное поле'
    if (!form.battery_brand.trim()) e.battery_brand = 'Обязательное поле'
    if (!form.battery_model.trim()) e.battery_model = 'Обязательное поле'
    if (form.battery_nominal_capacity <= 0) e.battery_nominal_capacity = 'Должно быть > 0'
    if (!editing && vehicles.find(v => v.vehicle_id === form.vehicle_id.trim())) {
      e.vehicle_id = 'ID уже существует'
    }
    return e
  }

  function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    const v: Vehicle = {
      ...form,
      vehicle_id: form.vehicle_id.trim(),
      plate_number: form.plate_number.trim(),
      make: form.make.trim(),
      model: form.model.trim(),
      battery_brand: form.battery_brand.trim(),
      battery_model: form.battery_model.trim(),
      battery_nominal_capacity: Number(form.battery_nominal_capacity),
      battery_nominal_voltage: Number(form.battery_nominal_voltage),
      cell_count: Number(form.cell_count),
      initial_cycles: Number(form.initial_cycles),
    }
    editing ? updateVehicle(v) : addVehicle(v)
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          backgroundColor: 'rgba(0,0,0,0.65)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* ── Modal: bottom-sheet on mobile, centered dialog on md+ ── */}
      <div
        style={{
          position: 'fixed', zIndex: 201,
          // Mobile: bottom sheet
          bottom: 0, left: 0, right: 0,
          // Desktop override via media query below
          transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        }}
        className="modal-sheet"
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 md:py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 3px 10px rgba(59,130,246,0.3)' }}>
              <Car size={15} color="#fff" />
            </div>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: 15 }}>
              {editing ? 'Редактировать авто' : 'Добавить автомобиль'}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6"
          style={{ WebkitOverflowScrolling: 'touch' }}>

          {/* Section: ТС */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ backgroundColor: 'rgba(59,130,246,0.12)' }}>
                <Car size={11} style={{ color: 'var(--accent)' }} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                Транспортное средство
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="ID (напр. EV-006)" error={errors.vehicle_id}>
                <Input value={form.vehicle_id} placeholder="EV-006"
                  onChange={(e: any) => set('vehicle_id', e.target.value)}
                  disabled={!!editing} />
              </Field>
              <Field label="Гос. номер">
                <Input value={form.plate_number} placeholder="A 001 BC 77"
                  onChange={(e: any) => set('plate_number', e.target.value)} />
              </Field>
              <Field label="Марка" error={errors.make}>
                {form.make && !MAKES.includes(form.make) ? (
                  <Input value={form.make} placeholder="Введите марку"
                    onChange={(e: any) => set('make', e.target.value)} />
                ) : (
                  <Select value={form.make || MAKES[0]} onChange={v => set('make', v)} options={MAKES} />
                )}
              </Field>
              <Field label="Модель" error={errors.model}>
                <Input value={form.model} placeholder="Model 3"
                  onChange={(e: any) => set('model', e.target.value)} />
              </Field>
              <Field label="Год выпуска">
                <Input type="number" value={form.year} min={2010} max={2030}
                  onChange={(e: any) => set('year', +e.target.value)} />
              </Field>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Section: Аккумулятор */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}>
                <Battery size={11} style={{ color: '#22c55e' }} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#22c55e' }}>
                Параметры аккумулятора
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Производитель батареи" error={errors.battery_brand}>
                <Select value={form.battery_brand || BATTERY_BRANDS[0]}
                  onChange={v => set('battery_brand', v)} options={BATTERY_BRANDS} />
              </Field>
              <Field label="Модель батареи" error={errors.battery_model}>
                <Input value={form.battery_model} placeholder="NCM9 Pouch"
                  onChange={(e: any) => set('battery_model', e.target.value)} />
              </Field>
              <Field label="Химия электродов" hint="NMC / LFP / NCA / LTO">
                <Select value={form.battery_chemistry}
                  onChange={v => set('battery_chemistry', v as any)} options={[...CHEMISTRIES]} />
              </Field>
              <Field label="Ёмкость (кВт·ч)" error={errors.battery_nominal_capacity} hint="Используется для расчёта SoC">
                <Input type="number" value={form.battery_nominal_capacity} min={1} max={500} step={0.1}
                  onChange={(e: any) => set('battery_nominal_capacity', e.target.value)} />
              </Field>
              <Field label="Напряжение (В)" hint="Для расчёта мощности">
                <Input type="number" value={form.battery_nominal_voltage} min={100} max={900} step={1}
                  onChange={(e: any) => set('battery_nominal_voltage', e.target.value)} />
              </Field>
              <Field label="Кол-во ячеек" hint="Для балансировки">
                <Input type="number" value={form.cell_count} min={1} max={10000} step={1}
                  onChange={(e: any) => set('cell_count', e.target.value)} />
              </Field>
              <Field label="Конфигурация (S×P)" hint="напр. 96s3p">
                <Input value={form.cell_config} placeholder="96s3p"
                  onChange={(e: any) => set('cell_config', e.target.value)} />
              </Field>
              <Field label="Дата производства">
                <Input type="month" value={form.manufacture_date}
                  onChange={(e: any) => set('manufacture_date', e.target.value)} />
              </Field>
              <Field label="Начальный пробег (циклов)" hint="До начала мониторинга">
                <Input type="number" value={form.initial_cycles} min={0} max={5000} step={1}
                  onChange={(e: any) => set('initial_cycles', e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-4"
          style={{
            borderTop: '1px solid var(--border)',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            Отмена
          </button>
          <button onClick={handleSubmit}
            className="flex-[2] py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            {editing ? 'Сохранить' : 'Добавить автомобиль'}
          </button>
        </div>
      </div>

      {/* Desktop: center override */}
      <style>{`
        @media (min-width: 768px) {
          .modal-sheet {
            bottom: auto !important;
            left: 50% !important;
            right: auto !important;
            top: 50% !important;
            transform: ${visible ? 'translate(-50%, -50%)' : 'translate(-50%, -48%) scale(0.97)'} !important;
            width: 100% !important;
            max-width: 640px !important;
            border-radius: 20px !important;
            border: 1px solid var(--border) !important;
            border-top: 1px solid var(--border) !important;
            max-height: 90vh !important;
            opacity: ${visible ? 1 : 0};
            transition: opacity 0.2s ease, transform 0.2s ease !important;
          }
        }
      `}</style>
    </>
  )
}
