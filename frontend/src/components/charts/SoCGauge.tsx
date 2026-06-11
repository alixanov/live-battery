import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { socColor } from '../../utils/battery'

interface Props { value: number; size?: number }

export default function SoCGauge({ value, size = 160 }: Props) {
  const color = socColor(value)
  const data = [{ value: Math.round(value), fill: color }]

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        cx={size / 2}
        cy={size / 2}
        innerRadius={size * 0.35}
        outerRadius={size * 0.48}
        barSize={size * 0.08}
        data={data}
        startAngle={220}
        endAngle={-40}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar
          background={{ fill: 'var(--bg-surface)' }}
          dataKey="value"
          angleAxisId={0}
          cornerRadius={6}
        />
      </RadialBarChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{Math.round(value)}%</span>
        <span className="text-xs muted-text mt-0.5">SoC</span>
      </div>
    </div>
  )
}
