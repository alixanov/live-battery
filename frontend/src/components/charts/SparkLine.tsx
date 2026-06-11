import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface Props {
  data: number[]
  color: string
  height?: number
}

export default function SparkLine({ data, color, height = 40 }: Props) {
  const d = data.map(v => ({ v }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={d}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
