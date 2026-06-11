import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { BatterySnapshot } from '../../utils/mockData'
import { format } from 'date-fns'

interface Props { history: BatterySnapshot[] }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const current = payload[0]?.value as number
  return (
    <div className="card px-3 py-2 text-xs shadow-xl space-y-1">
      <p className="muted-text">{label}</p>
      <p style={{ color: current >= 0 ? '#22c55e' : '#f87171' }} className="font-semibold">
        {current >= 0 ? 'Заряд' : 'Разряд'}: {Math.abs(current).toFixed(1)} А
      </p>
      {payload[1] && <p className="text-orange-400">{Number(payload[1].value).toFixed(1)}°C</p>}
    </div>
  )
}

export default function PowerChart({ history }: Props) {
  const data = history.slice(-40).map(d => ({
    t: format(new Date(d.timestamp), 'HH:mm'),
    current: d.current,
    temp: d.temperature,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="negGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="t" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${v}А`} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="var(--border-hover)" strokeWidth={1.5} />
        <Area type="monotone" dataKey="current" stroke="#3b82f6" strokeWidth={2}
          fill="url(#posGrad)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
