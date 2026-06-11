import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'

interface Props {
  data: any[]
  dataKey: string
  color: string
  label: string
  unit: string
  referenceValue?: number
  referenceLabel?: string
  domain?: [number, number]
}

function CustomTooltip({ active, payload, label, unit, metricLabel }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs shadow-xl" style={{ minWidth: 120 }}>
      <p className="muted-text mb-1">{label}</p>
      <p className="font-semibold" style={{ color: payload[0].color }}>
        {metricLabel}: {Number(payload[0].value).toFixed(1)}{unit}
      </p>
    </div>
  )
}

export default function MetricLine({
  data, dataKey, color, label, unit, referenceValue, referenceLabel, domain,
}: Props) {
  const formatted = data.map((d) => ({
    ...d,
    _time: format(new Date(d.timestamp), 'HH:mm'),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="_time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <YAxis
          domain={domain}
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          tickFormatter={(v) => `${v}${unit}`}
        />
        <Tooltip content={<CustomTooltip unit={unit} metricLabel={label} />} />
        {referenceValue !== undefined && (
          <ReferenceLine
            y={referenceValue}
            stroke="#ef4444"
            strokeDasharray="4 2"
            label={{ value: referenceLabel, fill: '#ef4444', fontSize: 10 }}
          />
        )}
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
