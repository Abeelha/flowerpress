'use client'

import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  SortingState,
  FilterFn
} from '@tanstack/react-table'

interface CsvTableProps {
  csvUrl: string
}

export default function CsvTable({ csvUrl }: CsvTableProps) {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<ColumnDef<any, any>[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAndParseCsv = async () => {
      try {
        setLoading(true)
        const response = await fetch(csvUrl)
        const text = await response.text()

        Papa.parse(text, {
          header: true,
          complete: (result) => {
            if (result.data && result.data.length > 0) {
              setData(result.data)

              const columnHelper = createColumnHelper<any>()
              const cols = Object.keys(result.data[0]).map((key) =>
                columnHelper.accessor(key, {
                  header: key,
                  cell: (info) => info.getValue()
                })
              )
              setColumns(cols)
            }
            setLoading(false)
          },
          error: (error) => {
            setError(error.message)
            setLoading(false)
          }
        })
      } catch (err) {
        setError('Failed to load CSV file')
        setLoading(false)
      }
    }

    if (csvUrl) {
      fetchAndParseCsv()
    }
  }, [csvUrl])

  const globalFilterFn: FilterFn<any> = (row, columnId, value) => {
    const search = value.toLowerCase()
    return Object.values(row.original).some((val) =>
      String(val).toLowerCase().includes(search)
    )
  }

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">Loading CSV data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500 dark:text-red-400">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md w-full max-w-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() && (
                      <span className="text-xs">
                        {header.column.getIsSorted() === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2 text-gray-900 dark:text-gray-100">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {table.getFilteredRowModel().rows.length} of {data.length} rows
      </div>
    </div>
  )
}