// Core fee components
export { FeeComponentList } from "@/components/core/fee/fee-component-list";
export type { FeeComponent, FeeComponentType } from "@/components/core/fee/fee-component-list";

export { DiscountBadge } from "@/components/core/fee/discount-badge";
export type { DiscountType } from "@/components/core/fee/discount-badge";

export { ChallanPreview } from "@/components/core/fee/challan-preview";
export type { ChallanData } from "@/components/core/fee/challan-preview";

// Shared fee components
export { FeeStructureForm } from "./fee-structure-form";
export type { FeeStructureFormValues, FeeComponentFormValues } from "./fee-structure-form";

export { DiscountTypeForm } from "./discount-type-form";
export type { DiscountTypeFormValues } from "./discount-type-form";

export { EnrollmentFeeForm } from "./enrollment-fee-form";
export type { EnrollmentFeeFormValues } from "./enrollment-fee-form";

export { DiscountForm } from "./discount-form";
export type { DiscountFormValues } from "./discount-form";

export { AdditionalChargeForm } from "./additional-charge-form";
export type { AdditionalChargeFormValues } from "./additional-charge-form";

export { ArrearForm } from "./arrear-form";
export type { ArrearFormValues } from "./arrear-form";

export { ChallanGenerationForm } from "./challan-generation-form";
export type { ChallanFormValues } from "./challan-generation-form";

export { FeeDetailCard } from "./fee-detail-card";
export type {
  FeeDetailCardProps,
  Discount,
  AdditionalCharge,
  Arrear,
  Challan,
  FeeStructure as FeeStructureDetail,
  DiscountTypeOption as DiscountTypeDetail,
  ChallanTemplate
} from "./fee-detail-card";

// Re-export payment components that are used with fees
export { PaymentStatusBadge } from "@/components/core/payment/payment-status-badge";
export type { PaymentStatus } from "@/components/core/payment/payment-status-badge";

export { TransactionList } from "@/components/core/payment/transaction-list";
export type { Transaction } from "@/components/core/payment/transaction-list";

export { PaymentMethodSelector, PAYMENT_METHODS } from "@/components/core/payment/payment-method-selector";

export { PaymentHistoryTimeline } from "@/components/core/payment/payment-history-timeline";
export type { HistoryEvent } from "@/components/core/payment/payment-history-timeline";

export { TransactionForm } from "../enrollment/transaction-form";
export type { TransactionFormValues } from "../enrollment/transaction-form";
