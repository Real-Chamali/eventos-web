'use client'

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ChartData {
  name: string
  value: number
  [key: string]: string | number
}

interface ChartProps {
  data: ChartData[]
  type?: 'bar' | 'line'
  dataKey?: string
  height?: number
  showLegend?: boolean
}

export default function Chart({
  data,
  type = 'bar',
  dataKey = 'value',
  height = 300,
  showLegend = false,
}: ChartProps) {
  const ChartComponent = type === 'bar' ? BarChart : LineChart
  const DataComponent = type === 'bar' ? Bar : Line

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" opacity={0.3} />
        <XAxis
          dataKey="name"
          className="text-xs text-gray-600 dark:text-gray-400 font-medium"
          stroke="currentColor"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis
          className="text-xs text-gray-600 dark:text-gray-400 font-medium"
          stroke="currentColor"
          tick={{ fill: 'currentColor' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(229, 231, 235, 0.6)',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '0.75rem',
          }}
          labelStyle={{
            color: '#111827',
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}
        />
        {showLegend && <Legend />}
        <DataComponent
          dataKey={dataKey}
          fill="url(#gradient)"
          stroke="#6366f1"
          strokeWidth={2}
          {...(type === 'bar' && { radius: 8 })}
        />
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#818cf8" stopOpacity={0.4} />
          </linearGradient>
        </defs>
      </ChartComponent>
    </ResponsiveContainer>
  )
}
