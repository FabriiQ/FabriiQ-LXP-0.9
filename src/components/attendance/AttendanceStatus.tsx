"use client";

import { cn } from "@/lib/utils";
import { AttendanceStatus as AttendanceStatusType } from "@/types/attendance";
import { Check, X, Clock, AlertCircle } from "lucide-react";

interface AttendanceStatusProps {
  status: AttendanceStatusType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function AttendanceStatus({
  status,
  size = "md",
  showIcon = true,
  showLabel = true,
  className,
}: AttendanceStatusProps) {
  // Define configuration based on status
  const config = {
    PRESENT: {
      label: "Present",
      icon: Check,
      className: "bg-green-100 text-green-800 border-green-200",
    },
    ABSENT: {
      label: "Absent",
      icon: X,
      className: "bg-red-100 text-red-800 border-red-200",
    },
    LATE: {
      label: "Late",
      icon: Clock,
      className: "bg-amber-100 text-amber-800 border-amber-200",
    },
    EXCUSED: {
      label: "Excused",
      icon: AlertCircle,
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
  };

  // Get configuration for the current status
  const currentConfig = config[status] || config.ABSENT;
  const Icon = currentConfig.icon;

  // Define size classes
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 rounded",
    md: "text-sm px-2 py-1 rounded-md",
    lg: "text-base px-3 py-1.5 rounded-lg",
  };

  // Define icon sizes
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center border font-medium",
        currentConfig.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn("mr-1", iconSizes[size])} />}
      {showLabel && currentConfig.label}
    </span>
  );
} 