"use client";

import { Badge, BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type DiscountType =
  | "SIBLING"
  | "MERIT"
  | "STAFF"
  | "FINANCIAL_AID"
  | "SCHOLARSHIP"
  | "EARLY_PAYMENT"
  | "SPECIAL";

export interface DiscountBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  type: DiscountType;
  value: number;
  isPercentage?: boolean;
  showValue?: boolean;
  className?: string;
}

export function DiscountBadge({
  type,
  value,
  isPercentage = true,
  showValue = true,
  className,
  ...props
}: DiscountBadgeProps) {
  const getVariant = (type: DiscountType): string => {
    switch (type) {
      case "SIBLING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      case "MERIT":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      case "STAFF":
        return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
      case "FINANCIAL_AID":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      case "SCHOLARSHIP":
        return "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100";
      case "EARLY_PAYMENT":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-100";
      case "SPECIAL":
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    }
  };

  const getLabel = (type: DiscountType): string => {
    switch (type) {
      case "SIBLING":
        return "Sibling";
      case "MERIT":
        return "Merit";
      case "STAFF":
        return "Staff";
      case "FINANCIAL_AID":
        return "Financial Aid";
      case "SCHOLARSHIP":
        return "Scholarship";
      case "EARLY_PAYMENT":
        return "Early Payment";
      case "SPECIAL":
        return "Special";
      default:
        return String(type).replace(/_/g, " ");
    }
  };

  return (
    <Badge
      className={cn(
        "font-normal",
        getVariant(type),
        className
      )}
      {...props}
    >
      {getLabel(type)}
      {showValue && (
        <span className="ml-1 font-medium">
          {isPercentage ? `${value}%` : `$${value.toFixed(2)}`}
        </span>
      )}
    </Badge>
  );
}
