import { useState } from "react";
import { Card } from "@/components/ui/data-display/card";
import { DataTable } from "@/components/ui/data-display/data-table";
import { DatePicker } from "@/components/ui/forms/date-picker";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";

type ActivityLogProps = {
  userId: string;
};

export const ActivityLog = ({ userId }: ActivityLogProps) => {
  const [dateRange, setDateRange] = useState({
    from: null as Date | null,
    to: null as Date | null
  });

  const { data, isLoading } = api.user.getActivity.useQuery({
    userId,
    dateRange
  });

  const columns = [
    { header: "Action", accessorKey: "action" },
    { header: "Details", accessorKey: "details" },
    {
      header: "Timestamp",
      accessorKey: "timestamp",
      cell: ({ row }: { row: { original: { timestamp: Date } } }) =>
        new Date(row.original.timestamp).toLocaleString()
    },
    { header: "IP Address", accessorKey: "ipAddress" }
  ];

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex gap-4">
          <DatePicker
            selected={dateRange.from || undefined}
            onSelect={(date: Date | undefined) => setDateRange({ ...dateRange, from: date || null })}
            placeholder="From date"
          />
          <DatePicker
            selected={dateRange.to || undefined}
            onSelect={(date: Date | undefined) => setDateRange({ ...dateRange, to: date || null })}
            placeholder="To date"
          />
        </div>

        <DataTable
          columns={columns}
          data={data || []}
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
};