-- AlterTable
ALTER TABLE "resource_categories" ADD COLUMN     "closing_time" VARCHAR(5) NOT NULL DEFAULT '18:00',
ADD COLUMN     "opening_time" VARCHAR(5) NOT NULL DEFAULT '08:00';
