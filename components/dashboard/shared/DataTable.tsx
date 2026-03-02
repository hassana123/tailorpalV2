'use client'

import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  header: string
  cell: (item: T) => React.ReactNode
  sortable?: boolean
  accessor?: (item: T) => string | number
  hiddenOnMobile?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  searchable?: boolean
  searchKeys?: (keyof T)[]
  pageSize?: number
  pageSizeOptions?: number[]
  emptyMessage?: string
  onRowClick?: (item: T) => void
  actions?: (item: T) => { label: string; onClick: () => void; variant?: 'default' | 'destructive' | 'outline' }[]
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchKeys,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  emptyMessage = 'No data found',
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(pageSize)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: string | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...data]

    // Search filter
    if (searchable && searchQuery && searchKeys) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key]
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query)
          }
          if (typeof value === 'number') {
            return value.toString().includes(query)
          }
          return false
        })
      )
    }

    // Sorting
    if (sortConfig.key) {
      const column = columns.find((c) => c.key === sortConfig.key)
      if (column?.accessor) {
        result.sort((a, b) => {
          const aVal = column.accessor!(a)
          const bVal = column.accessor!(b)
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
          return 0
        })
      }
    }

    return result
  }, [data, searchQuery, searchKeys, sortConfig, columns, searchable])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    )
  }

  // Mobile card view for small screens
  const MobileCard = ({ item }: { item: T }) => (
    <div className="bg-white rounded-xl border border-brand-border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {columns
            .filter((c) => !c.hiddenOnMobile)
            .slice(0, 3)
            .map((column) => (
              <div key={column.key} className="mb-2">
                <p className="text-[10px] uppercase tracking-wider text-brand-stone font-semibold">
                  {column.header}
                </p>
                <div className="text-sm text-brand-ink">{column.cell(item)}</div>
              </div>
            ))}
        </div>
        {actions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions(item).map((action, idx) => (
                <DropdownMenuItem
                  key={idx}
                  onClick={action.onClick}
                  className={cn(
                    action.variant === 'destructive' && 'text-red-600 focus:text-red-600'
                  )}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {onRowClick && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onRowClick(item)}
        >
          View Details
        </Button>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Search and controls */}
      {searchable && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-stone" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-brand-stone">
            <span>Showing {paginatedData.length} of {filteredData.length}</span>
          </div>
        </div>
      )}

      {/* Mobile View (Card Layout) */}
      <div className="lg:hidden space-y-3">
        {paginatedData.length === 0 ? (
          <div className="text-center py-8 text-brand-stone">{emptyMessage}</div>
        ) : (
          paginatedData.map((item) => (
            <MobileCard key={keyExtractor(item)} item={item} />
          ))
        )}
      </div>

      {/* Desktop View (Table Layout) */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-brand-border bg-white">
        <table className="w-full">
          <thead className="bg-brand-cream/50 border-b border-brand-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-brand-stone uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:bg-brand-cream transition-colors',
                    column.hiddenOnMobile && 'hidden xl:table-cell'
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-8 text-center text-brand-stone"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className={cn(
                    'hover:bg-brand-cream/30 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-sm text-brand-ink',
                        column.hiddenOnMobile && 'hidden xl:table-cell'
                      )}
                    >
                      {column.cell(item)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions(item).map((action, idx) => (
                            <DropdownMenuItem
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation()
                                action.onClick()
                              }}
                              className={cn(
                                action.variant === 'destructive' &&
                                  'text-red-600 focus:text-red-600'
                              )}
                            >
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-brand-stone">Rows per page:</span>
            <Select
              value={`${itemsPerPage}`}
              onValueChange={(value) => {
                setItemsPerPage(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="hidden sm:flex h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-brand-stone min-w-[100px] text-center">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden sm:flex h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}