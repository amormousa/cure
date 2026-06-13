'use client'

import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'

export interface Column<T> {
  header: string
  accessorKey?: keyof T | string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchKey?: keyof T | string
  searchPlaceholder?: string
  filterOptions?: {
    key: keyof T | string
    label: string
    options: { label: string; value: any }[]
  }
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Search...',
  filterOptions,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [filterValue, setFilterValue] = useState<string>('all')

  // Resolve nested object path access (e.g., 'patient.name')
  const getRowValue = (row: T, path: string): any => {
    return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), row)
  }

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Process data (filter + search + sort)
  const processedData = useMemo(() => {
    let result = [...data]

    // 1. Filter
    if (filterOptions && filterValue !== 'all') {
      result = result.filter((row) => {
        const val = getRowValue(row, filterOptions.key as string)
        return String(val) === filterValue
      })
    }

    // 2. Search
    if (searchQuery && searchKey) {
      result = result.filter((row) => {
        const val = getRowValue(row, searchKey as string)
        return String(val || '').toLowerCase().includes(searchQuery.toLowerCase())
      })
    }

    // 3. Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = getRowValue(a, sortConfig.key)
        const bVal = getRowValue(b, sortConfig.key)

        if (aVal === undefined || aVal === null) return 1
        if (bVal === undefined || bVal === null) return -1

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        }

        return sortConfig.direction === 'asc'
          ? (aVal > bVal ? 1 : aVal < bVal ? -1 : 0)
          : (bVal > aVal ? 1 : bVal < aVal ? -1 : 0)
      })
    }

    return result
  }, [data, searchQuery, searchKey, sortConfig, filterOptions, filterValue])

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {searchKey && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}

        {filterOptions && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">{filterOptions.label}:</span>
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All</option>
              {filterOptions.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600 border-b border-gray-200">
              <tr>
                {columns.map((col, idx) => {
                  const key = (col.accessorKey || idx) as string
                  const isSorted = sortConfig?.key === col.accessorKey
                  return (
                    <th
                      key={idx}
                      onClick={() => col.sortable && col.accessorKey && handleSort(col.accessorKey as string)}
                      className={`px-6 py-4 font-semibold ${
                        col.sortable ? 'cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {col.header}
                        {col.sortable && col.accessorKey && (
                          <span className="text-gray-400">
                            {isSorted ? (
                              sortConfig.direction === 'asc' ? (
                                <ChevronUp className="h-4 w-4 text-indigo-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-indigo-600" />
                              )
                            ) : (
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {processedData.length > 0 ? (
                processedData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50/75 transition-colors">
                    {columns.map((col, colIdx) => {
                      const value = col.accessorKey ? getRowValue(row, col.accessorKey as string) : undefined
                      return (
                        <td key={colIdx} className="whitespace-nowrap px-6 py-4 text-gray-700">
                          {col.render ? col.render(row) : value !== undefined && value !== null ? String(value) : '-'}
                        </td>
                      )
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-400">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export default DataTable
