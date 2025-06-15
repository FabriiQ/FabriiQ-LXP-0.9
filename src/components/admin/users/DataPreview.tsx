import { DataTable } from "~/components/ui";
import { Card } from "~/components/ui";

type DataPreviewProps = {
  data: any[];
};

export const DataPreview = ({ data }: DataPreviewProps) => {
  const columns = Object.keys(data[0] || {}).map(key => ({
    header: key,
    accessorKey: key
  }));

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Data Preview</h3>
        <DataTable
          columns={columns}
          data={data.slice(0, 5)} // Show first 5 rows as preview
          isLoading={false}
        />
        <p className="text-sm text-gray-500">
          Showing preview of first 5 records out of {data.length} total records
        </p>
      </div>
    </Card>
  );
}; 