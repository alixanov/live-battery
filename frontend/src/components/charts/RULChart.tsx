import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import { BatterySnapshot } from '../../utils/mockData'

interface Props { history: BatterySnapshot[] }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs shadow-xl">
      <p className="muted-text mb-1">{label}</p>
      <p className="font-semibold text-blue-400">SoH: {Number(payload[0]?.value).toFixed(1)}%</p>
    </div>
  )
}

export default function RULChart({ history }: Props) {
  const data = history.slice(-30).map((d, i) => ({
    t: i + 1,
    soh: d.soh,
    upper: Math.min(100, d.soh + d.confidence * 3),
    lower: Math.max(50, d.soh - d.confidence * 3),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="sohGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
          </linearGradient>
          <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.08} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="t" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} label={{ value: 'Отсчёты', fill: 'var(--text-muted)', fontSize: 10, position: 'insideBottomRight', offset: 0 }} />
        <YAxis domain={[50, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${v}%`} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 3" label={{ value: 'EOL 80%', fill: '#ef4444', fontSize: 10 }} />
        <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confGrad)" />
        <Area type="monotone" dataKey="lower" stroke="none" fill="var(--bg-base)" />
        <Area type="monotone" dataKey="soh" stroke="#3b82f6" strokeWidth={2} fill="url(#sohGrad)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
