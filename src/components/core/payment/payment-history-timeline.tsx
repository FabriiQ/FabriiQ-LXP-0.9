"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { format } from "date-fns";
import { PaymentStatusBadge, PaymentStatus } from "./payment-status-badge";
import { cn } from "@/lib/utils";

export interface HistoryEvent {
  id: string;
  action: string;
  details: any;
  notes?: string;
  createdAt: Date | string;
  createdBy: {
    id: string;
    name: string;
  };
}

interface PaymentHistoryTimelineProps {
  events: HistoryEvent[];
  className?: string;
  emptyMessage?: string;
}

export function PaymentHistoryTimeline({
  events,
  className,
  emptyMessage = "No history available",
}: PaymentHistoryTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Enrollment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  const getActionLabel = (action: string): string => {
    switch (action) {
      case "ENROLLMENT_CREATED":
        return "Enrollment Created";
      case "ENROLLMENT_UPDATED":
        return "Enrollment Updated";
      case "PAYMENT_CREATED":
        return "Payment Added";
      case "PAYMENT_UPDATED":
        return "Payment Updated";
      case "TRANSACTION_ADDED":
        return "Payment Received";
      case "DOCUMENT_UPLOADED":
        return "Document Uploaded";
      case "DOCUMENT_DELETED":
        return "Document Removed";
      default:
        return action.replace(/_/g, " ");
    }
  };

  const getActionIcon = (action: string): React.ReactNode => {
    // This would be better with actual icons
    return (
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
          action.includes("PAYMENT") || action.includes("TRANSACTION")
            ? "bg-green-500"
            : action.includes("DOCUMENT")
            ? "bg-blue-500"
            : "bg-gray-500"
        )}
      >
        {action.charAt(0)}
      </div>
    );
  };

  const renderDetails = (event: HistoryEvent) => {
    const { action, details } = event;

    if (action === "PAYMENT_CREATED" || action === "PAYMENT_UPDATED") {
      return (
        <div className="mt-1">
          <p className="text-sm">
            Amount: ${details.amount?.toFixed(2) || "N/A"}
            {details.paymentStatus && (
              <span className="ml-2">
                <PaymentStatusBadge status={details.paymentStatus as PaymentStatus} />
              </span>
            )}
          </p>
        </div>
      );
    }

    if (action === "TRANSACTION_ADDED") {
      return (
        <div className="mt-1">
          <p className="text-sm">
            Amount: ${details.amount?.toFixed(2) || "N/A"} • Method: {details.method || "N/A"}
            {details.newStatus && (
              <span className="ml-2">
                <PaymentStatusBadge status={details.newStatus as PaymentStatus} />
              </span>
            )}
          </p>
        </div>
      );
    }

    if (action === "DOCUMENT_UPLOADED" || action === "DOCUMENT_DELETED") {
      return (
        <div className="mt-1">
          <p className="text-sm">
            {details.name || "Unnamed document"} ({details.type || "Unknown type"})
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Enrollment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={event.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className="absolute left-0 top-0">{getActionIcon(event.action)}</div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{getActionLabel(event.action)}</h3>
                    <time className="text-sm text-muted-foreground">
                      {typeof event.createdAt === "string"
                        ? event.createdAt
                        : format(event.createdAt, "MMM d, yyyy h:mm a")}
                    </time>
                  </div>
                  
                  {renderDetails(event)}
                  
                  {event.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">{event.notes}</p>
                  )}
                  
                  <p className="mt-1 text-xs text-muted-foreground">
                    By: {event.createdBy.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
