-- CreateEnum
CREATE TYPE "operating_hours_mode" AS ENUM ('STANDARD', 'WEEKLY', 'ALWAYS_OPEN');

-- AlterTable
ALTER TABLE "resource_categories" ADD COLUMN     "operating_hours_mode" "operating_hours_mode" NOT NULL DEFAULT 'STANDARD';

-- CreateTable
CREATE TABLE "resource_category_schedules" (
    "schedule_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "opening_time" VARCHAR(5) NOT NULL DEFAULT '08:00',
    "closing_time" VARCHAR(5) NOT NULL DEFAULT '18:00',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "resource_category_schedules_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateIndex
CREATE INDEX "resource_category_schedules_category_id_idx" ON "resource_category_schedules"("category_id");

-- CreateIndex
CREATE INDEX "resource_category_schedules_created_by_idx" ON "resource_category_schedules"("created_by");

-- CreateIndex
CREATE INDEX "resource_category_schedules_updated_by_idx" ON "resource_category_schedules"("updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "resource_category_schedules_category_id_day_of_week_key" ON "resource_category_schedules"("category_id", "day_of_week");

-- AddForeignKey
ALTER TABLE "resource_category_schedules" ADD CONSTRAINT "resource_category_schedules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "resource_categories"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_category_schedules" ADD CONSTRAINT "resource_category_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_category_schedules" ADD CONSTRAINT "resource_category_schedules_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ensure weekday is between Sunday (0) and Saturday (6)
ALTER TABLE "resource_category_schedules" ADD CONSTRAINT "resource_category_schedules_day_of_week_check" CHECK ("day_of_week" BETWEEN 0 AND 6);

-- Ensure opening time uses valid 24-hour HH:mm format
ALTER TABLE "resource_category_schedules" ADD CONSTRAINT "resource_category_schedules_opening_time_check" CHECK ("opening_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

-- Ensure closing time uses valid 24-hour HH:mm format
ALTER TABLE "resource_category_schedules" ADD CONSTRAINT "resource_category_schedules_closing_time_check" CHECK ("closing_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

-- Prevent identical opening and closing times on open days
ALTER TABLE "resource_category_schedules" ADD CONSTRAINT "resource_category_schedules_time_range_check" CHECK ("is_closed" = true OR "opening_time" <> "closing_time");

ALTER TABLE "resource_categories" ADD CONSTRAINT "resource_categories_opening_time_check" CHECK ("opening_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

ALTER TABLE "resource_categories" ADD CONSTRAINT "resource_categories_closing_time_check" CHECK ("closing_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

ALTER TABLE "resource_categories" ADD CONSTRAINT "resource_categories_time_range_check" CHECK ("operating_hours_mode" <> 'STANDARD' OR "opening_time" <> "closing_time");

