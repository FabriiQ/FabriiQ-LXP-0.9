-- Create enums if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentstatustype') THEN
        CREATE TYPE "PaymentStatusType" AS ENUM ('PAID', 'PENDING', 'PARTIAL', 'WAIVED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feecomponenttype') THEN
        CREATE TYPE "FeeComponentType" AS ENUM ('TUITION', 'ADMISSION', 'REGISTRATION', 'LIBRARY', 'LABORATORY', 'SPORTS', 'TRANSPORT', 'HOSTEL', 'EXAMINATION', 'MISCELLANEOUS');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discountapplicablefor') THEN
        CREATE TYPE "DiscountApplicableFor" AS ENUM ('SIBLING', 'MERIT', 'STAFF', 'FINANCIAL_AID', 'SCHOLARSHIP', 'EARLY_PAYMENT', 'SPECIAL');
    END IF;
END
$$;

-- Create tables
CREATE TABLE IF NOT EXISTS "fee_structures" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "programCampusId" TEXT NOT NULL,
    "academicCycleId" TEXT,
    "termId" TEXT,
    "feeComponents" JSONB NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringInterval" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "discount_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "isPercentage" BOOLEAN NOT NULL DEFAULT true,
    "maxAmount" DOUBLE PRECISION,
    "applicableFor" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "discount_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "enrollment_fees" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "discountedAmount" DOUBLE PRECISION NOT NULL,
    "finalAmount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paymentStatus" "PaymentStatusType" NOT NULL,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "enrollment_fees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fee_discounts" (
    "id" TEXT NOT NULL,
    "enrollmentFeeId" TEXT NOT NULL,
    "discountTypeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "approvedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "fee_discounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "additional_charges" (
    "id" TEXT NOT NULL,
    "enrollmentFeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "additional_charges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fee_arrears" (
    "id" TEXT NOT NULL,
    "enrollmentFeeId" TEXT NOT NULL,
    "previousFeeId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "fee_arrears_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fee_challans" (
    "id" TEXT NOT NULL,
    "enrollmentFeeId" TEXT NOT NULL,
    "challanNo" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatusType" NOT NULL,
    "templateId" TEXT,
    "challanData" JSONB NOT NULL,
    "bankDetails" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "fee_challans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "challan_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "design" JSONB NOT NULL,
    "copies" INTEGER NOT NULL DEFAULT 3,
    "institutionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "challan_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fee_transactions" (
    "id" TEXT NOT NULL,
    "enrollmentFeeId" TEXT NOT NULL,
    "challanId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "receiptUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "fee_transactions_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "enrollment_fees_enrollmentId_key" ON "enrollment_fees"("enrollmentId");
CREATE INDEX IF NOT EXISTS "fee_structures_programCampusId_idx" ON "fee_structures"("programCampusId");
CREATE INDEX IF NOT EXISTS "fee_structures_academicCycleId_idx" ON "fee_structures"("academicCycleId");
CREATE INDEX IF NOT EXISTS "fee_structures_termId_idx" ON "fee_structures"("termId");
CREATE INDEX IF NOT EXISTS "enrollment_fees_paymentStatus_idx" ON "enrollment_fees"("paymentStatus");
CREATE INDEX IF NOT EXISTS "enrollment_fees_dueDate_idx" ON "enrollment_fees"("dueDate");
CREATE INDEX IF NOT EXISTS "fee_discounts_enrollmentFeeId_idx" ON "fee_discounts"("enrollmentFeeId");
CREATE INDEX IF NOT EXISTS "fee_discounts_discountTypeId_idx" ON "fee_discounts"("discountTypeId");
CREATE INDEX IF NOT EXISTS "additional_charges_enrollmentFeeId_idx" ON "additional_charges"("enrollmentFeeId");
CREATE INDEX IF NOT EXISTS "fee_arrears_enrollmentFeeId_idx" ON "fee_arrears"("enrollmentFeeId");
CREATE UNIQUE INDEX IF NOT EXISTS "fee_challans_challanNo_key" ON "fee_challans"("challanNo");
CREATE INDEX IF NOT EXISTS "fee_challans_challanNo_idx" ON "fee_challans"("challanNo");
CREATE INDEX IF NOT EXISTS "fee_challans_issueDate_idx" ON "fee_challans"("issueDate");
CREATE INDEX IF NOT EXISTS "fee_challans_dueDate_idx" ON "fee_challans"("dueDate");
CREATE INDEX IF NOT EXISTS "fee_challans_paymentStatus_idx" ON "fee_challans"("paymentStatus");
CREATE INDEX IF NOT EXISTS "challan_templates_institutionId_idx" ON "challan_templates"("institutionId");
CREATE INDEX IF NOT EXISTS "fee_transactions_enrollmentFeeId_idx" ON "fee_transactions"("enrollmentFeeId");
CREATE INDEX IF NOT EXISTS "fee_transactions_challanId_idx" ON "fee_transactions"("challanId");
CREATE INDEX IF NOT EXISTS "fee_transactions_date_idx" ON "fee_transactions"("date");

-- Add foreign key constraints
ALTER TABLE "enrollment_fees" ADD CONSTRAINT "enrollment_fees_feeStructureId_fkey" 
FOREIGN KEY ("feeStructureId") REFERENCES "fee_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fee_discounts" ADD CONSTRAINT "fee_discounts_enrollmentFeeId_fkey" 
FOREIGN KEY ("enrollmentFeeId") REFERENCES "enrollment_fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fee_discounts" ADD CONSTRAINT "fee_discounts_discountTypeId_fkey" 
FOREIGN KEY ("discountTypeId") REFERENCES "discount_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "additional_charges" ADD CONSTRAINT "additional_charges_enrollmentFeeId_fkey" 
FOREIGN KEY ("enrollmentFeeId") REFERENCES "enrollment_fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fee_arrears" ADD CONSTRAINT "fee_arrears_enrollmentFeeId_fkey" 
FOREIGN KEY ("enrollmentFeeId") REFERENCES "enrollment_fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fee_challans" ADD CONSTRAINT "fee_challans_enrollmentFeeId_fkey" 
FOREIGN KEY ("enrollmentFeeId") REFERENCES "enrollment_fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fee_challans" ADD CONSTRAINT "fee_challans_templateId_fkey" 
FOREIGN KEY ("templateId") REFERENCES "challan_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fee_transactions" ADD CONSTRAINT "fee_transactions_enrollmentFeeId_fkey" 
FOREIGN KEY ("enrollmentFeeId") REFERENCES "enrollment_fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fee_transactions" ADD CONSTRAINT "fee_transactions_challanId_fkey" 
FOREIGN KEY ("challanId") REFERENCES "fee_challans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
