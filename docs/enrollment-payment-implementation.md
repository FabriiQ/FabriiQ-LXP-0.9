# Enrollment Payment Implementation Plan

This document outlines the comprehensive plan for implementing the enrollment payment system in the LXP platform. The implementation will include database schema updates, API endpoints, service methods, and UI components.

## Table of Contents

1. [Database Schema](#database-schema)
2. [Fee Structure and Discounts](#fee-structure-and-discounts)
3. [Fee Challan Generation](#fee-challan-generation)
4. [API Endpoints](#api-endpoints)
5. [Service Layer](#service-layer)
6. [UI Components](#ui-components)
7. [Implementation Phases](#implementation-phases)
8. [Testing Strategy](#testing-strategy)

## Database Schema

### New Models

#### FeeStructure

```prisma
model FeeStructure {
  id                String               @id @default(cuid())
  name              String
  description       String?
  programCampusId   String
  academicCycleId   String?
  termId            String?
  feeComponents     Json                 // Array of fee components with name, amount, and type
  isRecurring       Boolean              @default(false)
  recurringInterval String?              // MONTHLY, QUARTERLY, SEMESTER, ANNUAL
  status            SystemStatus         @default(ACTIVE)
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  createdById       String
  updatedById       String?
  programCampus     ProgramCampus        @relation(fields: [programCampusId], references: [id])
  academicCycle     AcademicCycle?       @relation(fields: [academicCycleId], references: [id])
  term              Term?                @relation(fields: [termId], references: [id])
  createdBy         User                 @relation("CreatedFeeStructures", fields: [createdById], references: [id])
  updatedBy         User?                @relation("UpdatedFeeStructures", fields: [updatedById], references: [id])
  enrollmentFees    EnrollmentFee[]

  @@index([programCampusId])
  @@index([academicCycleId])
  @@index([termId])
  @@map("fee_structures")
}
```

#### DiscountType

```prisma
model DiscountType {
  id                String               @id @default(cuid())
  name              String
  description       String?
  discountValue     Float                // Amount or percentage
  isPercentage      Boolean              @default(true)
  maxAmount         Float?               // Maximum discount amount if percentage
  applicableFor     String[]             // SIBLING, MERIT, STAFF, FINANCIAL_AID, etc.
  status            SystemStatus         @default(ACTIVE)
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  createdById       String
  updatedById       String?
  createdBy         User                 @relation("CreatedDiscountTypes", fields: [createdById], references: [id])
  updatedBy         User?                @relation("UpdatedDiscountTypes", fields: [updatedById], references: [id])
  feeDiscounts      FeeDiscount[]

  @@map("discount_types")
}
```

#### EnrollmentFee

```prisma
model EnrollmentFee {
  id                String               @id @default(cuid())
  enrollmentId      String               @unique
  feeStructureId    String
  baseAmount        Float                // Original fee amount
  discountedAmount  Float                // Amount after discounts
  finalAmount       Float                // Final amount to be paid
  dueDate           DateTime?
  paymentStatus     PaymentStatusType    // Enum: PAID, PENDING, PARTIAL, WAIVED
  paymentMethod     String?
  notes             String?
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  createdById       String
  updatedById       String?
  enrollment        StudentEnrollment    @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  feeStructure      FeeStructure         @relation(fields: [feeStructureId], references: [id])
  createdBy         User                 @relation("CreatedEnrollmentFees", fields: [createdById], references: [id])
  updatedBy         User?                @relation("UpdatedEnrollmentFees", fields: [updatedById], references: [id])
  transactions      FeeTransaction[]
  discounts         FeeDiscount[]
  additionalCharges AdditionalCharge[]
  arrears           FeeArrear[]
  challans          FeeChallan[]

  @@index([paymentStatus])
  @@index([dueDate])
  @@map("enrollment_fees")
}
```

#### FeeDiscount

```prisma
model FeeDiscount {
  id                String               @id @default(cuid())
  enrollmentFeeId   String
  discountTypeId    String
  amount            Float                // Actual discount amount
  reason            String?
  approvedById      String?
  status            SystemStatus         @default(ACTIVE)
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  createdById       String
  updatedById       String?
  enrollmentFee     EnrollmentFee        @relation(fields: [enrollmentFeeId], references: [id], onDelete: Cascade)
  discountType      DiscountType         @relation(fields: [discountTypeId], references: [id])
  approvedBy        User?                @relation("ApprovedDiscounts", fields: [approvedById], references: [id])
  createdBy         User                 @relation("CreatedDiscounts", fields: [createdById], references: [id])
  updatedBy         User?                @relation("UpdatedDiscounts", fields: [updatedById], references: [id])

  @@index([enrollmentFeeId])
  @@index([discountTypeId])
  @@map("fee_discounts")
}
```

#### AdditionalCharge

```prisma
model AdditionalCharge {
  id                String               @id @default(cuid())
  enrollmentFeeId   String
  name              String
  amount            Float
  reason            String?
  dueDate           DateTime?
  status            SystemStatus         @default(ACTIVE)
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  createdById       String
  updatedById       String?
  enrollmentFee     EnrollmentFee        @relation(fields: [enrollmentFeeId], references: [id], onDelete: Cascade)
  createdBy         User                 @relation("CreatedCharges", fields: [createdById], references: [id])
  updatedBy         User?                @relation("UpdatedCharges", fields: [updatedById], references: [id])

  @@index([enrollmentFeeId])
  @@map("additional_charges")
}
```

#### FeeArrear

```prisma
model FeeArrear {
  id                String               @id @default(cuid())
  enrollmentFeeId   String
  previousFeeId     String?              // Reference to previous fee if applicable
  amount            Float
  dueDate           DateTime?
  reason            String?
  status            SystemStatus         @default(ACTIVE)
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  createdById       String
  updatedById       String?
  enrollmentFee     EnrollmentFee        @relation(fields: [enrollmentFeeId], references: [id], onDelete: Cascade)
  createdBy         User                 @relation("CreatedArrears", fields: [createdById], references: [id])
  updatedBy         User?                @relation("UpdatedArrears", fields: [updatedById], references: [id])

  @@index([enrollmentFeeId])
  @@map("fee_arrears")
}
```

#### FeeChallan

```prisma
model FeeChallan {
  id                String               @id @default(cuid())
  enrollmentFeeId   String
  challanNo         String               @unique
  issueDate         DateTime
  dueDate           DateTime
  totalAmount       Float
  paidAmount        Float                @default(0)
  paymentStatus     PaymentStatusType    // Enum: PAID, PENDING, PARTIAL, WAIVED
  templateId        String?
  challanData       Json                 // Structured data for challan
  bankDetails       Json?
  status            SystemStatus         @default(ACTIVE)
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  createdById       String
  updatedById       String?
  enrollmentFee     EnrollmentFee        @relation(fields: [enrollmentFeeId], references: [id], onDelete: Cascade)
  template          ChallanTemplate?     @relation(fields: [templateId], references: [id])
  createdBy         User                 @relation("CreatedChallans", fields: [createdById], references: [id])
  updatedBy         User?                @relation("UpdatedChallans", fields: [updatedById], references: [id])
  transactions      FeeTransaction[]

  @@index([challanNo])
  @@index([issueDate])
  @@index([dueDate])
  @@index([paymentStatus])
  @@map("fee_challans")
}
```

#### ChallanTemplate

```prisma
model ChallanTemplate {
  id                String               @id @default(cuid())
  name              String
  description       String?
  design            Json                 // Template design data
  copies            Int                  @default(3)  // Number of copies to print
  institutionId     String
  status            SystemStatus         @default(ACTIVE)
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  createdById       String
  updatedById       String?
  institution       Institution          @relation(fields: [institutionId], references: [id])
  createdBy         User                 @relation("CreatedTemplates", fields: [createdById], references: [id])
  updatedBy         User?                @relation("UpdatedTemplates", fields: [updatedById], references: [id])
  challans          FeeChallan[]

  @@index([institutionId])
  @@map("challan_templates")
}
```

#### FeeTransaction

```prisma
model FeeTransaction {
  id                String               @id @default(cuid())
  enrollmentFeeId   String
  challanId         String?
  amount            Float
  date              DateTime
  method            String
  reference         String?
  notes             String?
  receiptUrl        String?
  status            SystemStatus         @default(ACTIVE)
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  createdById       String
  updatedById       String?
  enrollmentFee     EnrollmentFee        @relation(fields: [enrollmentFeeId], references: [id], onDelete: Cascade)
  challan           FeeChallan?          @relation(fields: [challanId], references: [id])
  createdBy         User                 @relation("CreatedFeeTransactions", fields: [createdById], references: [id])
  updatedBy         User?                @relation("UpdatedFeeTransactions", fields: [updatedById], references: [id])

  @@index([enrollmentFeeId])
  @@index([challanId])
  @@index([date])
  @@map("fee_transactions")
}
```

#### PaymentTransaction

```prisma
model PaymentTransaction {
  id                String            @id @default(cuid())
  paymentId         String
  amount            Float
  date              DateTime
  method            String
  reference         String?
  notes             String?
  receiptUrl        String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  createdById       String
  updatedById       String?
  payment           EnrollmentPayment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  createdBy         User              @relation("CreatedTransactions", fields: [createdById], references: [id])
  updatedBy         User?             @relation("UpdatedTransactions", fields: [updatedById], references: [id])

  @@index([date])
  @@map("payment_transactions")
}
```

#### EnrollmentDocument

```prisma
model EnrollmentDocument {
  id                String            @id @default(cuid())
  enrollmentId      String
  name              String
  type              String            // e.g., "RECEIPT", "INVOICE", "CONTRACT"
  url               String
  fileSize          Int?
  mimeType          String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  createdById       String
  updatedById       String?
  enrollment        StudentEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  createdBy         User              @relation("CreatedDocuments", fields: [createdById], references: [id])
  updatedBy         User?             @relation("UpdatedDocuments", fields: [updatedById], references: [id])

  @@index([enrollmentId, type])
  @@map("enrollment_documents")
}
```

#### EnrollmentHistory

```prisma
model EnrollmentHistory {
  id                String            @id @default(cuid())
  enrollmentId      String
  action            String            // e.g., "CREATED", "UPDATED", "PAYMENT_ADDED"
  details           Json?
  notes             String?
  createdAt         DateTime          @default(now())
  createdById       String
  enrollment        StudentEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  createdBy         User              @relation("CreatedHistory", fields: [createdById], references: [id])

  @@index([enrollmentId, action])
  @@index([createdAt])
  @@map("enrollment_history")
}
```

### Enums

```prisma
enum PaymentStatusType {
  PAID
  PENDING
  PARTIAL
  WAIVED
}

enum FeeComponentType {
  TUITION
  ADMISSION
  REGISTRATION
  LIBRARY
  LABORATORY
  SPORTS
  TRANSPORT
  HOSTEL
  EXAMINATION
  MISCELLANEOUS
}

enum DiscountApplicableFor {
  SIBLING
  MERIT
  STAFF
  FINANCIAL_AID
  SCHOLARSHIP
  EARLY_PAYMENT
  SPECIAL
}
```

### Schema Updates

Update the `StudentEnrollment` model to include a relation to `EnrollmentFee`:

```prisma
model StudentEnrollment {
  // Existing fields...
  fee               EnrollmentFee?
  documents         EnrollmentDocument[]
  history           EnrollmentHistory[]
}
```

## Fee Structure and Discounts

The fee structure system is designed to be flexible and support various fee components, discounts, and payment scenarios.

### Fee Components

Fee components are the building blocks of a fee structure. Each component represents a specific charge such as tuition, admission, library, etc. The fee structure stores these components as a JSON array, allowing for flexible configuration:

```json
{
  "components": [
    {
      "name": "Tuition Fee",
      "type": "TUITION",
      "amount": 5000.00,
      "description": "Basic tuition fee"
    },
    {
      "name": "Library Fee",
      "type": "LIBRARY",
      "amount": 500.00,
      "description": "Access to library resources"
    },
    {
      "name": "Laboratory Fee",
      "type": "LABORATORY",
      "amount": 1000.00,
      "description": "Access to laboratory facilities"
    }
  ]
}
```

### Discount Types

The system supports various types of discounts:

1. **Sibling Discount**: Applied when multiple siblings are enrolled in the institution
2. **Merit Discount**: Based on academic performance
3. **Staff Discount**: For children of staff members
4. **Financial Aid**: Based on financial need
5. **Scholarship**: Merit-based or need-based scholarships
6. **Early Payment Discount**: Incentive for early payment
7. **Special Discount**: Any other special cases

Discounts can be configured as either a fixed amount or a percentage of the fee, with an optional maximum amount for percentage-based discounts.

### Fee Calculation Process

The fee calculation process follows these steps:

1. **Base Amount Calculation**: Sum of all fee components from the fee structure
2. **Discount Application**: Apply all applicable discounts to get the discounted amount
3. **Additional Charges**: Add any additional charges (if applicable)
4. **Arrears Addition**: Add any outstanding arrears from previous periods
5. **Final Amount Calculation**: Calculate the final amount to be paid

### Sibling Discount Implementation

Sibling discounts are implemented by:

1. Identifying siblings through family relationships in student profiles
2. Automatically applying the configured discount when multiple siblings are enrolled
3. Requiring approval from authorized personnel
4. Maintaining an audit trail of all discount applications

## Fee Challan Generation

The fee challan system allows for the generation, printing, and tracking of fee payment challans.

### Challan Structure

A fee challan includes the following information:

1. **Header Information**:
   - Institution name and logo
   - Challan number and issue date
   - Student information (name, ID, class, etc.)

2. **Fee Details**:
   - Breakdown of fee components
   - Discounts applied
   - Additional charges
   - Arrears
   - Total amount due

3. **Payment Information**:
   - Due date
   - Bank details
   - Payment instructions

4. **Copies**:
   - Student copy
   - Bank copy
   - Institution copy

### Challan Template Designer

The challan template designer allows administrators to:

1. Create custom challan templates
2. Configure the layout and design
3. Define the number of copies (default is 3)
4. Add custom fields and sections
5. Include terms and conditions
6. Configure bank details

The template design is stored as a JSON structure that defines the layout, styling, and content of the challan:

```json
{
  "layout": {
    "pageSize": "A4",
    "orientation": "portrait",
    "margins": { "top": 20, "right": 20, "bottom": 20, "left": 20 },
    "copies": 3
  },
  "header": {
    "logo": { "position": "left", "width": 100, "height": 50 },
    "title": { "text": "FEE CHALLAN", "fontSize": 16, "fontWeight": "bold", "align": "center" },
    "institutionName": { "fontSize": 14, "fontWeight": "bold", "align": "center" }
  },
  "studentInfo": {
    "fields": [
      { "label": "Student Name", "value": "student.name", "width": "50%" },
      { "label": "Student ID", "value": "student.id", "width": "50%" },
      { "label": "Class", "value": "class.name", "width": "50%" },
      { "label": "Program", "value": "program.name", "width": "50%" }
    ]
  },
  "feeDetails": {
    "table": {
      "headers": ["Description", "Amount"],
      "widths": ["70%", "30%"]
    }
  },
  "summary": {
    "fields": [
      { "label": "Total Amount", "value": "fee.totalAmount", "fontWeight": "bold" },
      { "label": "Due Date", "value": "fee.dueDate", "format": "date" }
    ]
  },
  "footer": {
    "bankDetails": { "fontSize": 10 },
    "terms": { "fontSize": 8 },
    "copyLabel": { "fontSize": 12, "fontWeight": "bold", "align": "center" }
  }
}
```

### Challan Generation Process

The challan generation process follows these steps:

1. **Data Collection**: Gather all necessary data (student, fee, discounts, etc.)
2. **Template Selection**: Select the appropriate challan template
3. **Data Mapping**: Map the data to the template fields
4. **Challan Creation**: Generate the challan with a unique challan number
5. **PDF Generation**: Create a printable PDF with multiple copies
6. **Storage**: Store the challan data and PDF for future reference

### Challan Printing

The system supports printing of challans with the following features:

1. **Multiple Copies**: Print multiple copies (student, bank, institution)
2. **Batch Printing**: Print multiple challans in a batch
3. **Digital Distribution**: Email challans to students/parents
4. **QR Code**: Include QR codes for easy payment tracking

## API Endpoints

### Fee Structure Router

```typescript
// src/server/api/routers/fee-structure.ts
export const feeStructureRouter = createTRPCRouter({
  // Create a fee structure
  createFeeStructure: protectedProcedure
    .input(createFeeStructureSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.createFeeStructure(input);
    }),

  // Get fee structure by ID
  getFeeStructure: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.getFeeStructure(input.id);
    }),

  // Get fee structures by program campus
  getFeeStructuresByProgramCampus: protectedProcedure
    .input(z.object({ programCampusId: z.string() }))
    .query(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.getFeeStructuresByProgramCampus(input.programCampusId);
    }),

  // Update fee structure
  updateFeeStructure: protectedProcedure
    .input(updateFeeStructureSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.updateFeeStructure(input);
    }),

  // Delete fee structure
  deleteFeeStructure: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.deleteFeeStructure(input.id);
    }),
});
```

### Discount Type Router

```typescript
// src/server/api/routers/discount-type.ts
export const discountTypeRouter = createTRPCRouter({
  // Create a discount type
  createDiscountType: protectedProcedure
    .input(createDiscountTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const discountService = new DiscountService({ prisma: ctx.prisma });
      return discountService.createDiscountType(input);
    }),

  // Get discount type by ID
  getDiscountType: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const discountService = new DiscountService({ prisma: ctx.prisma });
      return discountService.getDiscountType(input.id);
    }),

  // Get all discount types
  getAllDiscountTypes: protectedProcedure
    .query(async ({ ctx }) => {
      const discountService = new DiscountService({ prisma: ctx.prisma });
      return discountService.getAllDiscountTypes();
    }),

  // Update discount type
  updateDiscountType: protectedProcedure
    .input(updateDiscountTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const discountService = new DiscountService({ prisma: ctx.prisma });
      return discountService.updateDiscountType(input);
    }),

  // Delete discount type
  deleteDiscountType: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const discountService = new DiscountService({ prisma: ctx.prisma });
      return discountService.deleteDiscountType(input.id);
    }),
});
```

### Enrollment Fee Router

```typescript
// src/server/api/routers/enrollment-fee.ts
export const enrollmentFeeRouter = createTRPCRouter({
  // Create an enrollment fee
  createEnrollmentFee: protectedProcedure
    .input(createEnrollmentFeeSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.createEnrollmentFee(input);
    }),

  // Get enrollment fee by enrollment ID
  getEnrollmentFeeByEnrollment: protectedProcedure
    .input(z.object({ enrollmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.getEnrollmentFeeByEnrollment(input.enrollmentId);
    }),

  // Update enrollment fee
  updateEnrollmentFee: protectedProcedure
    .input(updateEnrollmentFeeSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.updateEnrollmentFee(input);
    }),

  // Add discount to enrollment fee
  addDiscount: protectedProcedure
    .input(addDiscountSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.addDiscount(input);
    }),

  // Remove discount from enrollment fee
  removeDiscount: protectedProcedure
    .input(z.object({ discountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.removeDiscount(input.discountId);
    }),

  // Add additional charge to enrollment fee
  addAdditionalCharge: protectedProcedure
    .input(addChargeSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.addAdditionalCharge(input);
    }),

  // Remove additional charge from enrollment fee
  removeAdditionalCharge: protectedProcedure
    .input(z.object({ chargeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.removeAdditionalCharge(input.chargeId);
    }),

  // Add arrear to enrollment fee
  addArrear: protectedProcedure
    .input(addArrearSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.addArrear(input);
    }),

  // Remove arrear from enrollment fee
  removeArrear: protectedProcedure
    .input(z.object({ arrearId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.removeArrear(input.arrearId);
    }),

  // Add transaction to enrollment fee
  addTransaction: protectedProcedure
    .input(addTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.addTransaction(input);
    }),

  // Get transactions by enrollment fee ID
  getTransactions: protectedProcedure
    .input(z.object({ enrollmentFeeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.getTransactions(input.enrollmentFeeId);
    }),

  // Generate receipt for transaction
  generateReceipt: protectedProcedure
    .input(z.object({ transactionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService({ prisma: ctx.prisma });
      return feeService.generateReceipt(input.transactionId);
    }),
});
```

### Challan Router

```typescript
// src/server/api/routers/challan.ts
export const challanRouter = createTRPCRouter({
  // Create a challan template
  createChallanTemplate: protectedProcedure
    .input(createChallanTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const challanService = new ChallanService({ prisma: ctx.prisma });
      return challanService.createChallanTemplate(input);
    }),

  // Get challan template by ID
  getChallanTemplate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const challanService = new ChallanService({ prisma: ctx.prisma });
      return challanService.getChallanTemplate(input.id);
    }),

  // Get challan templates by institution
  getChallanTemplatesByInstitution: protectedProcedure
    .input(z.object({ institutionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const challanService = new ChallanService({ prisma: ctx.prisma });
      return challanService.getChallanTemplatesByInstitution(input.institutionId);
    }),

  // Update challan template
  updateChallanTemplate: protectedProcedure
    .input(updateChallanTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const challanService = new ChallanService({ prisma: ctx.prisma });
      return challanService.updateChallanTemplate(input);
    }),

  // Generate challan
  generateChallan: protectedProcedure
    .input(generateChallanSchema)
    .mutation(async ({ ctx, input }) => {
      const challanService = new ChallanService({ prisma: ctx.prisma });
      return challanService.generateChallan(input);
    }),

  // Get challan by ID
  getChallan: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const challanService = new ChallanService({ prisma: ctx.prisma });
      return challanService.getChallan(input.id);
    }),

  // Get challans by enrollment fee ID
  getChallansByEnrollmentFee: protectedProcedure
    .input(z.object({ enrollmentFeeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const challanService = new ChallanService({ prisma: ctx.prisma });
      return challanService.getChallansByEnrollmentFee(input.enrollmentFeeId);
    }),

  // Print challan
  printChallan: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const challanService = new ChallanService({ prisma: ctx.prisma });
      return challanService.printChallan(input.id);
    }),

  // Email challan
  emailChallan: protectedProcedure
    .input(z.object({ id: z.string(), email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const challanService = new ChallanService({ prisma: ctx.prisma });
      return challanService.emailChallan(input.id, input.email);
    }),

  // Batch print challans
  batchPrintChallans: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const challanService = new ChallanService({ prisma: ctx.prisma });
      return challanService.batchPrintChallans(input.ids);
    }),
});
```
```

### Document Router

```typescript
// src/server/api/routers/document.ts
export const documentRouter = createTRPCRouter({
  // Upload enrollment document
  uploadDocument: protectedProcedure
    .input(uploadDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      const documentService = new DocumentService({ prisma: ctx.prisma });
      return documentService.uploadDocument(input);
    }),

  // Get enrollment documents
  getDocuments: protectedProcedure
    .input(z.object({ enrollmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const documentService = new DocumentService({ prisma: ctx.prisma });
      return documentService.getDocuments(input.enrollmentId);
    }),

  // Delete document
  deleteDocument: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const documentService = new DocumentService({ prisma: ctx.prisma });
      return documentService.deleteDocument(input.id);
    }),
});
```

### History Router

```typescript
// src/server/api/routers/history.ts
export const historyRouter = createTRPCRouter({
  // Get enrollment history
  getHistory: protectedProcedure
    .input(z.object({ enrollmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const historyService = new HistoryService({ prisma: ctx.prisma });
      return historyService.getHistory(input.enrollmentId);
    }),
});
```

## Service Layer

### Payment Service

```typescript
// src/server/api/services/payment.service.ts
export class PaymentService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async createPayment(input: CreatePaymentInput) {
    const { enrollmentId, amount, dueDate, paymentStatus, paymentMethod, notes, createdById } = input;

    // Create payment
    const payment = await this.prisma.enrollmentPayment.create({
      data: {
        enrollmentId,
        amount,
        dueDate,
        paymentStatus,
        paymentMethod,
        notes,
        createdById,
      },
    });

    // Create history entry
    await this.prisma.enrollmentHistory.create({
      data: {
        enrollmentId,
        action: 'PAYMENT_CREATED',
        details: { paymentId: payment.id, amount, paymentStatus },
        createdById,
      },
    });

    return payment;
  }

  async getPaymentByEnrollment(enrollmentId: string) {
    return this.prisma.enrollmentPayment.findUnique({
      where: { enrollmentId },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  async updatePayment(input: UpdatePaymentInput) {
    const { id, amount, dueDate, paymentStatus, paymentMethod, notes, updatedById } = input;

    // Get current payment
    const currentPayment = await this.prisma.enrollmentPayment.findUnique({
      where: { id },
    });

    if (!currentPayment) {
      throw new Error('Payment not found');
    }

    // Update payment
    const payment = await this.prisma.enrollmentPayment.update({
      where: { id },
      data: {
        amount,
        dueDate,
        paymentStatus,
        paymentMethod,
        notes,
        updatedById,
      },
    });

    // Create history entry
    await this.prisma.enrollmentHistory.create({
      data: {
        enrollmentId: currentPayment.enrollmentId,
        action: 'PAYMENT_UPDATED',
        details: {
          paymentId: payment.id,
          oldAmount: currentPayment.amount,
          newAmount: amount,
          oldStatus: currentPayment.paymentStatus,
          newStatus: paymentStatus
        },
        createdById: updatedById,
      },
    });

    return payment;
  }

  async addTransaction(input: CreateTransactionInput) {
    const { paymentId, amount, date, method, reference, notes, createdById } = input;

    // Get payment
    const payment = await this.prisma.enrollmentPayment.findUnique({
      where: { id: paymentId },
      include: { transactions: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Create transaction
    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        paymentId,
        amount,
        date,
        method,
        reference,
        notes,
        createdById,
      },
    });

    // Calculate total paid amount
    const totalPaid = payment.transactions.reduce((sum, t) => sum + t.amount, 0) + amount;

    // Update payment status
    let newStatus: PaymentStatusType = payment.paymentStatus;
    if (totalPaid >= payment.amount) {
      newStatus = 'PAID';
    } else if (totalPaid > 0) {
      newStatus = 'PARTIAL';
    }

    await this.prisma.enrollmentPayment.update({
      where: { id: paymentId },
      data: {
        paymentStatus: newStatus,
        updatedById: createdById,
      },
    });

    // Create history entry
    await this.prisma.enrollmentHistory.create({
      data: {
        enrollmentId: payment.enrollmentId,
        action: 'TRANSACTION_ADDED',
        details: {
          paymentId,
          transactionId: transaction.id,
          amount,
          method,
          newStatus
        },
        createdById,
      },
    });

    return transaction;
  }

  async getTransactions(paymentId: string) {
    return this.prisma.paymentTransaction.findMany({
      where: { paymentId },
      orderBy: { date: 'desc' },
    });
  }

  async generateReceipt(transactionId: string) {
    // Implementation for generating a receipt PDF
    // This would typically involve:
    // 1. Fetching the transaction with related data
    // 2. Using a PDF generation library to create a receipt
    // 3. Storing the PDF in a file storage system
    // 4. Updating the transaction with the receipt URL

    // For now, we'll just return the transaction
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        payment: {
          include: {
            enrollment: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
                class: true,
              },
            },
          },
        },
        createdBy: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // In a real implementation, generate PDF and update receiptUrl
    // For now, just return the transaction
    return transaction;
  }
}
```

### Document Service

```typescript
// src/server/api/services/document.service.ts
export class DocumentService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async uploadDocument(input: UploadDocumentInput) {
    const { enrollmentId, name, type, url, fileSize, mimeType, createdById } = input;

    // Create document
    const document = await this.prisma.enrollmentDocument.create({
      data: {
        enrollmentId,
        name,
        type,
        url,
        fileSize,
        mimeType,
        createdById,
      },
    });

    // Create history entry
    await this.prisma.enrollmentHistory.create({
      data: {
        enrollmentId,
        action: 'DOCUMENT_UPLOADED',
        details: { documentId: document.id, name, type },
        createdById,
      },
    });

    return document;
  }

  async getDocuments(enrollmentId: string) {
    return this.prisma.enrollmentDocument.findMany({
      where: { enrollmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteDocument(id: string) {
    const document = await this.prisma.enrollmentDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete document
    await this.prisma.enrollmentDocument.delete({
      where: { id },
    });

    // Create history entry
    await this.prisma.enrollmentHistory.create({
      data: {
        enrollmentId: document.enrollmentId,
        action: 'DOCUMENT_DELETED',
        details: { documentId: id, name: document.name, type: document.type },
        createdById: document.createdById, // Using the original creator for simplicity
      },
    });

    return { success: true };
  }
}
```

### History Service

```typescript
// src/server/api/services/history.service.ts
export class HistoryService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async getHistory(enrollmentId: string) {
    return this.prisma.enrollmentHistory.findMany({
      where: { enrollmentId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: true,
      },
    });
  }
}
```

## UI Components

### Core Components

1. **PaymentStatusBadge**
   - Display payment status with appropriate color
   - Used in payment lists and details

2. **PaymentSummary**
   - Display payment amount, due date, and status
   - Used in enrollment details and payment dashboard

3. **TransactionList**
   - Display list of payment transactions
   - Used in payment details

4. **PaymentMethodSelector**
   - Dropdown for selecting payment methods
   - Used in payment forms

5. **DocumentUploader**
   - Upload and manage enrollment documents
   - Used in enrollment and payment forms

6. **PaymentHistoryTimeline**
   - Display payment history in a timeline format
   - Used in payment details

7. **FeeComponentList**
   - Display list of fee components with amounts
   - Used in fee structure and enrollment fee details

8. **DiscountBadge**
   - Display discount type and amount/percentage
   - Used in discount lists and details

9. **ChallanPreview**
   - Preview of challan with all details
   - Used in challan generation and printing

### Shared Components

1. **FeeStructureForm**
   - Form for creating/updating fee structures
   - Used in fee structure management

2. **FeeComponentForm**
   - Form for adding/editing fee components
   - Used in fee structure form

3. **DiscountTypeForm**
   - Form for creating/updating discount types
   - Used in discount management

4. **EnrollmentFeeForm**
   - Form for creating/updating enrollment fees
   - Used in enrollment creation and fee management

5. **DiscountForm**
   - Form for adding discounts to enrollment fees
   - Used in fee management

6. **AdditionalChargeForm**
   - Form for adding additional charges
   - Used in fee management

7. **ArrearForm**
   - Form for adding arrears
   - Used in fee management

8. **TransactionForm**
   - Form for adding payment transactions
   - Used in payment management

9. **ChallanTemplateDesigner**
   - Interface for designing challan templates
   - Used in challan template management

10. **ChallanGenerationForm**
    - Form for generating challans
    - Used in fee management

11. **ChallanPrintPreview**
    - Preview of challan for printing
    - Used in challan printing

12. **FeeDetailCard**
    - Card displaying fee details with components, discounts, and charges
    - Used in enrollment details

13. **DiscountList**
    - List of discounts applied to a fee
    - Used in fee details

14. **AdditionalChargeList**
    - List of additional charges applied to a fee
    - Used in fee details

15. **ArrearList**
    - List of arrears applied to a fee
    - Used in fee details

16. **ChallanList**
    - List of challans generated for a fee
    - Used in fee details

17. **DocumentList**
    - List of enrollment documents with download options
    - Used in enrollment details

## Implementation Phases

### Phase 1: Database Schema and Basic API

1. Update Prisma schema with new models for fee structure, discounts, and challans
2. Run migrations
3. Implement basic service methods for fee management
4. Create API endpoints for fee structure and discount types
5. Test API functionality

### Phase 2: Fee Structure and Discount Management

1. Implement FeeStructureForm and FeeComponentForm
2. Implement DiscountTypeForm
3. Implement FeeComponentList and DiscountBadge
4. Create fee structure management pages
5. Create discount type management pages
6. Test fee structure and discount management functionality

### Phase 3: Enrollment Fee Management

1. Implement EnrollmentFeeForm
2. Implement DiscountForm, AdditionalChargeForm, and ArrearForm
3. Implement FeeDetailCard, DiscountList, AdditionalChargeList, and ArrearList
4. Update enrollment creation flow to include fee assignment
5. Create fee management pages
6. Test enrollment fee management functionality

### Phase 4: Transaction Management

1. Implement TransactionForm
2. Implement TransactionList and PaymentStatusBadge
3. Implement PaymentSummary and PaymentHistoryTimeline
4. Create transaction management pages
5. Test transaction management functionality

### Phase 5: Challan Management

1. Implement ChallanTemplateDesigner
2. Implement ChallanGenerationForm
3. Implement ChallanPreview and ChallanPrintPreview
4. Implement ChallanList
5. Create challan template management pages
6. Create challan generation and printing pages
7. Test challan management functionality

### Phase 6: Document Management

1. Implement DocumentUploader
2. Implement DocumentList
3. Create document management pages
4. Test document management functionality

### Phase 7: Integration and Testing

1. Integrate all components with API
2. Update enrollment creation and detail pages
3. Implement comprehensive fee management dashboard
4. Implement reporting and analytics for fees
5. Test end-to-end functionality
6. Fix bugs and optimize performance

### Phase 8: Deployment and Training

1. Deploy to staging environment
2. Conduct user acceptance testing
3. Prepare training materials
4. Train administrative staff
5. Deploy to production environment
6. Monitor and support post-deployment

## Testing Strategy

### Unit Tests

1. Test service methods for fee structure, discounts, enrollment fees, and challans
2. Test API endpoints for all fee-related operations
3. Test UI components in isolation
4. Test fee calculation logic
5. Test discount application logic
6. Test challan generation logic

### Integration Tests

1. Test fee structure creation and management flow
2. Test discount type creation and management flow
3. Test enrollment fee assignment and management flow
4. Test discount application flow
5. Test additional charge and arrear addition flow
6. Test transaction addition flow
7. Test challan generation and printing flow
8. Test document upload flow
9. Test payment status updates

### End-to-End Tests

1. Test complete enrollment and fee assignment flow
2. Test fee payment flow with various payment methods
3. Test discount application scenarios (siblings, merit, etc.)
4. Test challan generation, printing, and payment tracking
5. Test fee reporting and analytics
6. Test batch operations (bulk fee assignment, batch challan printing)

### Performance Tests

1. Test fee calculation performance with large number of components
2. Test challan generation performance with multiple copies
3. Test batch operations performance
4. Test reporting performance with large datasets

### Security Tests

1. Test authorization for fee management operations
2. Test data validation for all fee-related inputs
3. Test secure handling of payment information
4. Test audit trail for all fee-related operations

## Conclusion

This implementation plan provides a comprehensive approach to adding fee management functionality to the enrollment system. By following this plan, we will create a robust fee management system that supports various fee structures, discounts, payment tracking, and challan generation.

The implementation will be done in phases to ensure that each component is properly tested before moving on to the next phase. This approach will minimize the risk of introducing bugs and ensure that the fee management system meets all requirements.

The fee management system will provide the following benefits:

1. **Flexible Fee Structure**: Support for various fee components and recurring fees
2. **Discount Management**: Ability to configure and apply different types of discounts
3. **Additional Charges and Arrears**: Support for adding extra charges and tracking arrears
4. **Challan Generation**: Customizable challan templates with multiple copies
5. **Payment Tracking**: Comprehensive tracking of payments and transactions
6. **Reporting and Analytics**: Insights into fee collection, pending payments, and discounts

This system will streamline the fee management process, reduce administrative overhead, and provide a better experience for both administrators and students/parents.
