-- Check if PaymentStatusType enum exists and create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentstatustype') THEN
        CREATE TYPE "PaymentStatusType" AS ENUM ('PAID', 'PENDING', 'PARTIAL', 'WAIVED');
    END IF;
END
$$;

-- Check if FeeComponentType enum exists and create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feecomponenttype') THEN
        CREATE TYPE "FeeComponentType" AS ENUM ('TUITION', 'ADMISSION', 'REGISTRATION', 'LIBRARY', 'LABORATORY', 'SPORTS', 'TRANSPORT', 'HOSTEL', 'EXAMINATION', 'MISCELLANEOUS');
    END IF;
END
$$;

-- Check if DiscountApplicableFor enum exists and create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discountapplicablefor') THEN
        CREATE TYPE "DiscountApplicableFor" AS ENUM ('SIBLING', 'MERIT', 'STAFF', 'FINANCIAL_AID', 'SCHOLARSHIP', 'EARLY_PAYMENT', 'SPECIAL');
    END IF;
END
$$;

-- Create tables if they don't exist
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
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
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
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
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
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
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
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
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
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
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
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
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
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
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
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "fee_transactions_pkey" PRIMARY KEY ("id")
);

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_structures_programCampusId_idx') THEN
        CREATE INDEX "fee_structures_programCampusId_idx" ON "fee_structures"("programCampusId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_structures_academicCycleId_idx') THEN
        CREATE INDEX "fee_structures_academicCycleId_idx" ON "fee_structures"("academicCycleId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_structures_termId_idx') THEN
        CREATE INDEX "fee_structures_termId_idx" ON "fee_structures"("termId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'enrollment_fees_enrollmentId_key') THEN
        CREATE UNIQUE INDEX "enrollment_fees_enrollmentId_key" ON "enrollment_fees"("enrollmentId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'enrollment_fees_paymentStatus_idx') THEN
        CREATE INDEX "enrollment_fees_paymentStatus_idx" ON "enrollment_fees"("paymentStatus");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'enrollment_fees_dueDate_idx') THEN
        CREATE INDEX "enrollment_fees_dueDate_idx" ON "enrollment_fees"("dueDate");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_discounts_enrollmentFeeId_idx') THEN
        CREATE INDEX "fee_discounts_enrollmentFeeId_idx" ON "fee_discounts"("enrollmentFeeId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_discounts_discountTypeId_idx') THEN
        CREATE INDEX "fee_discounts_discountTypeId_idx" ON "fee_discounts"("discountTypeId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'additional_charges_enrollmentFeeId_idx') THEN
        CREATE INDEX "additional_charges_enrollmentFeeId_idx" ON "additional_charges"("enrollmentFeeId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_arrears_enrollmentFeeId_idx') THEN
        CREATE INDEX "fee_arrears_enrollmentFeeId_idx" ON "fee_arrears"("enrollmentFeeId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_challans_challanNo_key') THEN
        CREATE UNIQUE INDEX "fee_challans_challanNo_key" ON "fee_challans"("challanNo");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_challans_challanNo_idx') THEN
        CREATE INDEX "fee_challans_challanNo_idx" ON "fee_challans"("challanNo");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_challans_issueDate_idx') THEN
        CREATE INDEX "fee_challans_issueDate_idx" ON "fee_challans"("issueDate");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_challans_dueDate_idx') THEN
        CREATE INDEX "fee_challans_dueDate_idx" ON "fee_challans"("dueDate");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_challans_paymentStatus_idx') THEN
        CREATE INDEX "fee_challans_paymentStatus_idx" ON "fee_challans"("paymentStatus");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'challan_templates_institutionId_idx') THEN
        CREATE INDEX "challan_templates_institutionId_idx" ON "challan_templates"("institutionId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_transactions_enrollmentFeeId_idx') THEN
        CREATE INDEX "fee_transactions_enrollmentFeeId_idx" ON "fee_transactions"("enrollmentFeeId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_transactions_challanId_idx') THEN
        CREATE INDEX "fee_transactions_challanId_idx" ON "fee_transactions"("challanId");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fee_transactions_date_idx') THEN
        CREATE INDEX "fee_transactions_date_idx" ON "fee_transactions"("date");
    END IF;
END
$$;

-- Add foreign key constraints for tables we just created
DO $$
BEGIN
    -- Check if the constraint doesn't exist before adding it
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollment_fees_feeStructureId_fkey') THEN
        ALTER TABLE "enrollment_fees" ADD CONSTRAINT "enrollment_fees_feeStructureId_fkey" 
        FOREIGN KEY ("feeStructureId") REFERENCES "fee_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_discounts_enrollmentFeeId_fkey') THEN
        ALTER TABLE "fee_discounts" ADD CONSTRAINT "fee_discounts_enrollmentFeeId_fkey" 
        FOREIGN KEY ("enrollmentFeeId") REFERENCES "enrollment_fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_discounts_discountTypeId_fkey') THEN
        ALTER TABLE "fee_discounts" ADD CONSTRAINT "fee_discounts_discountTypeId_fkey" 
        FOREIGN KEY ("discountTypeId") REFERENCES "discount_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'additional_charges_enrollmentFeeId_fkey') THEN
        ALTER TABLE "additional_charges" ADD CONSTRAINT "additional_charges_enrollmentFeeId_fkey" 
        FOREIGN KEY ("enrollmentFeeId") REFERENCES "enrollment_fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_arrears_enrollmentFeeId_fkey') THEN
        ALTER TABLE "fee_arrears" ADD CONSTRAINT "fee_arrears_enrollmentFeeId_fkey" 
        FOREIGN KEY ("enrollmentFeeId") REFERENCES "enrollment_fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_challans_enrollmentFeeId_fkey') THEN
        ALTER TABLE "fee_challans" ADD CONSTRAINT "fee_challans_enrollmentFeeId_fkey" 
        FOREIGN KEY ("enrollmentFeeId") REFERENCES "enrollment_fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_challans_templateId_fkey') THEN
        ALTER TABLE "fee_challans" ADD CONSTRAINT "fee_challans_templateId_fkey" 
        FOREIGN KEY ("templateId") REFERENCES "challan_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_transactions_enrollmentFeeId_fkey') THEN
        ALTER TABLE "fee_transactions" ADD CONSTRAINT "fee_transactions_enrollmentFeeId_fkey" 
        FOREIGN KEY ("enrollmentFeeId") REFERENCES "enrollment_fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_transactions_challanId_fkey') THEN
        ALTER TABLE "fee_transactions" ADD CONSTRAINT "fee_transactions_challanId_fkey" 
        FOREIGN KEY ("challanId") REFERENCES "fee_challans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;
