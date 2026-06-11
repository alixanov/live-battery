import { useLatestPrediction, useVehicleAlerts } from '../../api/hooks'
import { socColor, sohColor, sohLabel } from '../../utils/battery'
import { AlertTriangle, Battery } from 'lucide-react'

interface Props { vehicle: any }

export default function VehicleCard({ vehicle }: Props) {
  const { data: pred } = useLatestPrediction(vehicle.vehicle_id)
  const { data: alerts } = useVehicleAlerts(vehicle.vehicle_id, true)
  const alertCount = (alerts as any[])?.length ?? 0

  return (
    <div className="card-hover h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {vehicle.make} {vehicle.model}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {vehicle.vehicle_id} · {vehicle.year}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {alertCount > 0 && (
            <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
              <AlertTriangle size={13} /> {alertCount}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
            {vehicle.battery_chemistry}
          </span>
        </div>
      </div>

      {pred ? (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="stat-box">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Заряд (SoC)</p>
            <div className="flex items-center gap-2">
              <Battery size={14} style={{ color: socColor(pred.soc) }} />
              <span className="text-lg font-bold" style={{ color: socColor(pred.soc) }}>
                {pred.soc.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="stat-box">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Здоровье (SoH)</p>
            <span className="text-lg font-bold" style={{ color: sohColor(pred.soh) }}>
              {pred.soh.toFixed(1)}%
            </span>
            <span className="text-xs ml-1" style={{ color: sohColor(pred.soh) }}>
              {sohLabel(pred.soh)}
            </span>
          </div>

          <div className="stat-box">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Ресурс (RUL)</p>
            <span className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {pred.rul_cycles} цикл.
            </span>
          </div>

          <div className="stat-box">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Сопротивление</p>
            <span className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {pred.internal_resistance.toFixed(1)} mΩ
            </span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Нет данных</div>
      )}
    </div>
  )
}
