-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "recurringInterval" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "recurringUntil" TIMESTAMP(3);
