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
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
        <XAxis
          dataKey="name"
          className="text-xs text-gray-600 dark:text-gray-400"
          stroke="currentColor"
        />
        <YAxis
          className="text-xs text-gray-600 dark:text-gray-400"
          stroke="currentColor"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
          }}
        />
        {showLegend && <Legend />}
        <DataComponent
          dataKey={dataKey}
          fill="#3b82f6"
          stroke="#3b82f6"
          {...(type === 'bar' && { radius: 4 })}
        />
      </ChartComponent>
    </ResponsiveContainer>
  )
}

