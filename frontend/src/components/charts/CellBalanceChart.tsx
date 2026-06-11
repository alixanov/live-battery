import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

interface Props { voltages: number[] }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0].value as number
  return (
    <div className="card px-3 py-2 text-xs shadow-xl">
      <p style={{ color: 'var(--text-muted)' }}>Ячейка {payload[0].payload.cell}</p>
      <p className="font-semibold" style={{ color: payload[0].fill }}>{v.toFixed(3)} В</p>
    </div>
  )
}

export default function CellBalanceChart({ voltages }: Props) {
  const avg = voltages.reduce((a, b) => a + b, 0) / voltages.length
  const data = voltages.map((v, i) => ({ cell: i + 1, voltage: v, delta: +(v - avg).toFixed(4) }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="cell" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} label={{ value: 'Ячейка', fill: 'var(--text-muted)', fontSize: 10, position: 'insideBottom', offset: -2 }} />
        <YAxis domain={['dataMin - 0.02', 'dataMax + 0.02']} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => v.toFixed(2)} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={avg} stroke="#3b82f6" strokeDasharray="4 2" />
        <Bar dataKey="voltage" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => {
            const diff = Math.abs(d.delta) * 1000
            const color = diff < 20 ? '#22c55e' : diff < 50 ? '#f59e0b' : '#ef4444'
            return <Cell key={i} fill={color} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
