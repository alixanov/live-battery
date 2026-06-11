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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children}
      {hint && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder, min, max, step }: any) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      min={min} max={max} step={step}
      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
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
        className="w-full px-3 py-2 rounded-lg text-sm outline-none appearance-none transition-colors pr-8"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
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

  useEffect(() => {
    if (editing) {
      setForm({ ...editing })
    } else {
      const nextNum = vehicles.length + 1
      setForm({ vehicle_id: `EV-${String(nextNum).padStart(3, '0')}`, ...EMPTY })
    }
    setErrors({})
  }, [editing, open])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(59,130,246,0.12)' }}>
              <Car size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {editing ? 'Редактировать транспортное средство' : 'Добавить транспортное средство'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">

          {/* Section: ТС */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Car size={14} style={{ color: 'var(--accent)' }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                Транспортное средство
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="ID транспортного средства" hint="Уникальный идентификатор (напр. EV-006)">
                <Input value={form.vehicle_id} placeholder="EV-006"
                  onChange={(e: any) => set('vehicle_id', e.target.value)}
                  disabled={!!editing} />
                {errors.vehicle_id && <p className="text-xs text-red-400 mt-1">{errors.vehicle_id}</p>}
              </Field>
              <Field label="Гос. номер">
                <Input value={form.plate_number} placeholder="A 001 BC 77"
                  onChange={(e: any) => set('plate_number', e.target.value)} />
              </Field>
              <Field label="Марка">
                {form.make && !MAKES.includes(form.make) ? (
                  <Input value={form.make} placeholder="Введите марку"
                    onChange={(e: any) => set('make', e.target.value)} />
                ) : (
                  <Select value={form.make || MAKES[0]} onChange={v => set('make', v)} options={MAKES} />
                )}
                {errors.make && <p className="text-xs text-red-400 mt-1">{errors.make}</p>}
              </Field>
              <Field label="Модель">
                <Input value={form.model} placeholder="Model 3"
                  onChange={(e: any) => set('model', e.target.value)} />
                {errors.model && <p className="text-xs text-red-400 mt-1">{errors.model}</p>}
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
              <Battery size={14} style={{ color: '#22c55e' }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#22c55e' }}>
                Параметры аккумулятора
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Производитель батареи">
                <Select value={form.battery_brand || BATTERY_BRANDS[0]}
                  onChange={v => set('battery_brand', v)} options={BATTERY_BRANDS} />
                {errors.battery_brand && <p className="text-xs text-red-400 mt-1">{errors.battery_brand}</p>}
              </Field>
              <Field label="Модель батареи">
                <Input value={form.battery_model} placeholder="NCM9 Pouch"
                  onChange={(e: any) => set('battery_model', e.target.value)} />
                {errors.battery_model && <p className="text-xs text-red-400 mt-1">{errors.battery_model}</p>}
              </Field>
              <Field label="Химия электродов" hint="Влияет на расчёт SoH, IR и деградации">
                <Select value={form.battery_chemistry}
                  onChange={v => set('battery_chemistry', v as any)} options={[...CHEMISTRIES]} />
              </Field>
              <Field label="Номинальная ёмкость (кВт·ч)" hint="Используется для расчёта SoC и RUL">
                <Input type="number" value={form.battery_nominal_capacity} min={1} max={500} step={0.1}
                  onChange={(e: any) => set('battery_nominal_capacity', e.target.value)} />
                {errors.battery_nominal_capacity && <p className="text-xs text-red-400 mt-1">{errors.battery_nominal_capacity}</p>}
              </Field>
              <Field label="Номинальное напряжение (В)" hint="Используется для расчёта мощности">
                <Input type="number" value={form.battery_nominal_voltage} min={100} max={900} step={1}
                  onChange={(e: any) => set('battery_nominal_voltage', e.target.value)} />
              </Field>
              <Field label="Количество ячеек" hint="Всего ячеек в пакете (для балансировки)">
                <Input type="number" value={form.cell_count} min={1} max={10000} step={1}
                  onChange={(e: any) => set('cell_count', e.target.value)} />
              </Field>
              <Field label="Конфигурация ячеек (S×P)" hint="Напр: 96s3p — 96 последовательно, 3 параллельно">
                <Input value={form.cell_config} placeholder="96s3p"
                  onChange={(e: any) => set('cell_config', e.target.value)} />
              </Field>
              <Field label="Дата производства батареи">
                <Input type="month" value={form.manufacture_date}
                  onChange={(e: any) => set('manufacture_date', e.target.value)} />
              </Field>
              <Field label="Начальный пробег (циклов)" hint="Циклы до начала мониторинга">
                <Input type="number" value={form.initial_cycles} min={0} max={5000} step={1}
                  onChange={(e: any) => set('initial_cycles', e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--border)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}>
            Отмена
          </button>
          <button onClick={handleSubmit}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            {editing ? 'Сохранить изменения' : 'Добавить транспортное средство'}
          </button>
        </div>
      </div>
    </div>
  )
}
