import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../../store'
import { Vehicle } from '../../utils/mockData'
import VehicleFormModal from '../../components/VehicleFormModal'
import { Plus, Pencil, Trash2, ChevronRight, Battery, Zap, Car } from 'lucide-react'

const CHEM_COLOR: Record<string, string> = {
  NMC: '#3b82f6',
  LFP: '#22c55e',
  NCA: '#f59e0b',
  LTO: '#a78bfa',
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
        <button onClick={() => onEdit(vehicle)}
          title="Редактировать"
          className="p-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          <Pencil size={14} />
        </button>
        <button onClick={handleDelete}
          title="Удалить"
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
            { label: 'Химия', value: vehicle.battery_chemistry },
            { label: 'Ёмкость', value: `${vehicle.battery_nominal_capacity} кВт·ч` },
            { label: 'Напряжение', value: `${vehicle.battery_nominal_voltage} В` },
            { label: 'Ячейки', value: vehicle.cell_config || `${vehicle.cell_count} шт.` },
            { label: 'Пр-во', value: vehicle.manufacture_date || '—' },
            { label: 'Нач. циклов', value: String(vehicle.initial_cycles) },
          ].map(item => (
            <div key={item.label} className="px-2.5 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Link to detail */}
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
  const vehicles = useAppStore(s => s.vehicles)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(v: Vehicle) { setEditing(v); setModalOpen(true) }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Мои автомобили</h1>
          <p className="page-subtitle">Управление автомобилями · {vehicles.length} {vehicles.length === 1 ? 'авто' : 'авто'}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
          <Plus size={15} /> Добавить ТС
        </button>
      </div>

      {/* Grid */}
      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4"
          style={{ color: 'var(--text-muted)' }}>
          <Car size={48} style={{ opacity: 0.3 }} />
          <p className="text-sm">Вы ещё не добавили автомобиль. Добавьте свой первый электромобиль.</p>
          <button onClick={openAdd}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
            <Plus size={15} /> Добавить ТС
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map(v => <VehicleCard key={v.vehicle_id} vehicle={v} onEdit={openEdit} />)}
        </div>
      )}

      <VehicleFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </div>
  )
}
