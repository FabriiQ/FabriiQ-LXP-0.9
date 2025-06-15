"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FeeComponentType = 
  | "TUITION"
  | "ADMISSION"
  | "REGISTRATION"
  | "LIBRARY"
  | "LABORATORY"
  | "SPORTS"
  | "TRANSPORT"
  | "HOSTEL"
  | "EXAMINATION"
  | "MISCELLANEOUS";

export interface FeeComponent {
  id?: string;
  name: string;
  type: FeeComponentType;
  amount: number;
  description?: string;
}

interface FeeComponentListProps {
  components: FeeComponent[];
  totalAmount?: number;
  showTotal?: boolean;
  className?: string;
  compact?: boolean;
  onComponentClick?: (component: FeeComponent) => void;
}

export function FeeComponentList({
  components,
  totalAmount,
  showTotal = true,
  className,
  compact = false,
  onComponentClick,
}: FeeComponentListProps) {
  // Calculate total if not provided
  const calculatedTotal = totalAmount ?? components.reduce((sum, component) => sum + component.amount, 0);

  // Get badge color based on component type
  const getTypeColor = (type: FeeComponentType): string => {
    switch (type) {
      case "TUITION":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      case "ADMISSION":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      case "REGISTRATION":
        return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
      case "LIBRARY":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      case "LABORATORY":
        return "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100";
      case "SPORTS":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      case "TRANSPORT":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100";
      case "HOSTEL":
        return "bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100";
      case "EXAMINATION":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-100";
      case "MISCELLANEOUS":
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    }
  };

  return (
    <Card className={className}>
      <CardHeader className={compact ? "px-4 py-3" : undefined}>
        <CardTitle className={compact ? "text-base" : undefined}>Fee Components</CardTitle>
      </CardHeader>
      <CardContent className={compact ? "px-4 py-2" : undefined}>
        {components.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fee components defined</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component, index) => (
                <TableRow 
                  key={component.id || index}
                  className={cn(onComponentClick && "cursor-pointer hover:bg-muted")}
                  onClick={() => onComponentClick && onComponentClick(component)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{component.name}</p>
                      {component.description && (
                        <p className="text-xs text-muted-foreground">{component.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("font-normal", getTypeColor(component.type))}>
                      {component.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${component.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              
              {showTotal && (
                <TableRow className="border-t-2">
                  <TableCell colSpan={2} className="font-bold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${calculatedTotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
