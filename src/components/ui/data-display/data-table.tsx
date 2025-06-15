'use client';

import { useState, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type Column,
  type Header,
  type HeaderGroup,
  type Row,
  type Cell,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/atoms/input';

// Types
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumn?: string;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  showFilters?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
}

// Loading Skeleton Component
const TableSkeleton = ({ columns, rows }: { columns: number; rows: number }) => {
  return (
    <div className="w-full animate-pulse">
      <div className="flex border-b border-border py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 px-4">
            <div className="h-6 bg-muted rounded-md"></div>
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex border-b border-border py-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1 px-4">
              <div className="h-5 bg-muted rounded-md w-3/4"></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Empty State Component
const EmptyState = ({ message }: { message: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="rounded-full bg-muted p-3 mb-4">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No results found</h3>
      <p className="text-muted-foreground text-sm mt-1">{message}</p>
    </div>
  );
};

// Data Table Component
export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = 'Search...',
  pagination = true,
  pageSize = 10,
  showFilters = true,
  emptyMessage = 'No data available.',
  className,
  onRowClick,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Initialize table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Apply search filter
  useEffect(() => {
    if (searchColumn && searchQuery) {
      table.getColumn(searchColumn)?.setFilterValue(searchQuery);
    }
  }, [searchQuery, searchColumn, table]);

  // Animation variants
  const filterMenuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Table Controls */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          {/* Search Input */}
          {searchColumn && (
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-[300px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-md border border-input text-sm",
                showFilterMenu ? "bg-muted" : "bg-background"
              )}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
              <ChevronDown className={cn("h-4 w-4 transition-transform", showFilterMenu && "transform rotate-180")} />
            </button>

            {/* Filter Menu */}
            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={filterMenuVariants}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-card rounded-md shadow-lg border border-border z-10"
                >
                  <div className="p-3 border-b border-border">
                    <h3 className="font-medium">Column Visibility</h3>
                  </div>
                  <div className="p-3 max-h-[300px] overflow-y-auto">
                    {table.getAllColumns()
                      .filter((column: Column<TData, unknown>) => column.getCanHide())
                      .map((column: Column<TData, unknown>) => (
                        <div key={column.id} className="flex items-center mb-2 last:mb-0">
                          <input
                            type="checkbox"
                            id={`column-${column.id}`}
                            checked={column.getIsVisible()}
                            onChange={(e) => column.toggleVisibility(e.target.checked)}
                            className="mr-2"
                          />
                          <label htmlFor={`column-${column.id}`} className="text-sm cursor-pointer">
                            {column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                          </label>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <TableSkeleton columns={columns.length} rows={5} />
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50">
                {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header: Header<TData, unknown>) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              header.column.getCanSort() && "cursor-pointer select-none"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <div className="ml-1">
                                {{
                                  asc: <ChevronUp className="h-4 w-4" />,
                                  desc: <ChevronDown className="h-4 w-4" />,
                                  false: <ChevronsUpDown className="h-4 w-4 opacity-50" />,
                                }[header.column.getIsSorted() as string] ?? null}
                              </div>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row: Row<TData>) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-border last:border-0 hover:bg-muted/50 transition-colors",
                        onRowClick && "cursor-pointer"
                      )}
                      onClick={() => onRowClick && onRowClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell: Cell<TData, unknown>) => (
                        <td key={cell.id} className="px-4 py-3 text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="p-0">
                      <EmptyState message={emptyMessage} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination && table.getRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              className={cn(
                "p-2 rounded-md border border-input",
                !table.getCanPreviousPage() && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <button
              className={cn(
                "p-2 rounded-md border border-input",
                !table.getCanNextPage() && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable; 
