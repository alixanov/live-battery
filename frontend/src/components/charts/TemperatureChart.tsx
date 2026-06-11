import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { BatterySnapshot } from '../../utils/mockData'
import { format } from 'date-fns'

interface Props { history: BatterySnapshot[] }

export default function TemperatureChart({ history }: Props) {
  const data = history.slice(-40).map(d => ({
    t: format(new Date(d.timestamp), 'HH:mm'),
    temp: d.temperature,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="t" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <YAxis domain={[10, 60]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${v}°`} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
          labelStyle={{ color: 'var(--text-muted)', fontSize: 11 }}
          formatter={(v: number) => [`${v.toFixed(1)}°C`, 'Температура']}
        />
        <ReferenceLine y={45} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'Перегрев 45°', fill: '#ef4444', fontSize: 10 }} />
        <Area type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2}
          fill="url(#tempGrad)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
