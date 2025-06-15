'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/atoms/input';

// Types
interface VirtualizedDataTableProps<TData, TValue> {
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
  estimatedRowHeight?: number;
  containerHeight?: number | string;
  overscan?: number;
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

// Virtualized Data Table Component
export function VirtualizedDataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = 'Search...',
  pagination = true,
  pageSize = 50,
  showFilters = true,
  emptyMessage = 'No data available.',
  className,
  onRowClick,
  isLoading = false,
  estimatedRowHeight = 56,
  containerHeight = 600,
  overscan = 10,
}: VirtualizedDataTableProps<TData, TValue>) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const parentRef = useRef<HTMLDivElement>(null);

  // Initialize table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // Apply search filter
  useEffect(() => {
    if (searchColumn && searchQuery) {
      table.getColumn(searchColumn)?.setFilterValue(searchQuery);
    }
  }, [searchQuery, searchColumn, table]);

  // Get filtered rows
  const filteredRows = table.getFilteredRowModel().rows;

  // Calculate total pages
  const totalPages = Math.ceil(filteredRows.length / pageSize);

  // Get current page rows
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRows.length);
  const currentPageRows = filteredRows.slice(startIndex, endIndex);

  // Set up virtualization
  const rowVirtualizer = useVirtualizer({
    count: currentPageRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan,
  });

  // Animation variants
  const filterMenuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  // Render row function
  const renderRow = useCallback((rowIndex: number) => {
    const row = currentPageRows[rowIndex];
    if (!row) return null;

    // Ensure we have a unique key for the row
    const rowKey = `row-${row.id || rowIndex}`;

    return (
      <tr
        key={rowKey}
        className={cn(
          "border-b border-border last:border-0 hover:bg-muted/50 transition-colors",
          onRowClick && "cursor-pointer"
        )}
        onClick={() => onRowClick && onRowClick(row.original)}
      >
        {row.getVisibleCells().map((cell) => (
          <td key={cell.id} className="px-4 py-3 text-sm">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    );
  }, [currentPageRows, onRowClick]);

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
                      .filter((column) => column.getCanHide())
                      .map((column) => (
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
        {isLoading ? (
          <TableSkeleton columns={columns.length} rows={10} />
        ) : (
          <div
            ref={parentRef}
            style={{
              height: typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight,
              overflow: 'auto'
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
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
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="p-0">
                        <EmptyState message={emptyMessage} />
                      </td>
                    </tr>
                  ) : (
                    currentPageRows.map((row, index) => (
                      <React.Fragment key={`row-${row.id || index}`}>
                        {renderRow(index)}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && filteredRows.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredRows.length)} of {filteredRows.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              className={cn(
                "p-2 rounded-md border border-input",
                currentPage === 0 && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm">
              Page {currentPage + 1} of {totalPages || 1}
            </div>
            <button
              className={cn(
                "p-2 rounded-md border border-input",
                currentPage >= totalPages - 1 && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VirtualizedDataTable;
