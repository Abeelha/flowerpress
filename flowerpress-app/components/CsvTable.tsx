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
        <div className="text-gray-500">Loading CSV data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto border rounded-lg">
      <div className="p-4 border-b">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
          className="px-4 py-2 border rounded-md w-full max-w-sm"
        />
      </div>
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b bg-gray-50">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
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
            <tr key={row.id} className="border-b hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-4 text-sm text-gray-600">
        Showing {table.getFilteredRowModel().rows.length} of {data.length} rows
      </div>
    </div>
  )
}