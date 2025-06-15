/*
  Warnings:

  - You are about to drop the column `type` on the `academic_periods` table. All the data in the column will be lost.
  - You are about to drop the column `academicYear` on the `feedback_base` table. All the data in the column will be lost.
  - You are about to drop the column `academicYearId` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the `academic_years` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `academic_periods` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `academic_periods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `academic_periods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicCycleId` to the `terms` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "academic_years" DROP CONSTRAINT "academic_years_institutionId_fkey";

-- DropForeignKey
ALTER TABLE "terms" DROP CONSTRAINT "terms_academicYearId_fkey";

-- DropIndex
DROP INDEX "terms_academicYearId_startDate_endDate_idx";

-- AlterTable
ALTER TABLE "academic_periods" DROP COLUMN "type",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "feedback_base" DROP COLUMN "academicYear",
ADD COLUMN     "academicCycle" TEXT;

-- AlterTable
ALTER TABLE "terms" DROP COLUMN "academicYearId",
ADD COLUMN     "academicCycleId" TEXT NOT NULL;

-- DropTable
DROP TABLE "academic_years";

-- CreateTable
CREATE TABLE "academic_cycles" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_cycles_code_key" ON "academic_cycles"("code");

-- CreateIndex
CREATE INDEX "academic_cycles_institutionId_startDate_endDate_idx" ON "academic_cycles"("institutionId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "academic_periods_code_key" ON "academic_periods"("code");

-- CreateIndex
CREATE INDEX "terms_academicCycleId_startDate_endDate_idx" ON "terms"("academicCycleId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "terms" ADD CONSTRAINT "terms_academicCycleId_fkey" FOREIGN KEY ("academicCycleId") REFERENCES "academic_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_cycles" ADD CONSTRAINT "academic_cycles_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
