// app/components/dashboard/NursePerformance.tsx
'use client'

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table'
import { Badge } from '@/app/components/ui/badge'
import { Trophy, Zap } from 'lucide-react'

interface NursePerformanceData {
  nurseId: string
  name: string
  completed: number
  averageTime?: number
  rating?: number
}

interface NursePerformanceProps {
  data?: NursePerformanceData[]
  title?: string
}

export function NursePerformance({ data, title = 'Top Performers (This Month)' }: NursePerformanceProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>
        <p className="text-center text-sm text-gray-500 py-8">No performance data available yet</p>
      </div>
    )
  }

  // Calculate rankings and ratings
  const maxCompleted = Math.max(...data.map(d => d.completed), 1)
  const performanceData = data.map((nurse, idx) => ({
    ...nurse,
    rank: idx + 1,
    performanceScore: (nurse.completed / maxCompleted) * 100,
  }))

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Trophy className="h-5 w-5 text-amber-500" />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Nurse Name</TableHead>
              <TableHead className="text-right">Completed</TableHead>
              <TableHead className="text-right">Performance</TableHead>
              <TableHead className="text-right">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performanceData.map((nurse) => (
              <TableRow key={nurse.nurseId} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center justify-center font-bold">
                    {nurse.rank === 1 && '🥇'}
                    {nurse.rank === 2 && '🥈'}
                    {nurse.rank === 3 && '🥉'}
                    {nurse.rank > 3 && <span className="text-gray-500">{nurse.rank}</span>}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{nurse.name}</TableCell>
                <TableCell className="text-right font-semibold">{nurse.completed}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
                        style={{ width: `${nurse.performanceScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 w-10 text-right">
                      {Math.round(nurse.performanceScore)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="default" className="gap-1">
                    <Zap className="h-3 w-3" />
                    {nurse.rating ? `${nurse.rating.toFixed(1)}⭐` : '—'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
