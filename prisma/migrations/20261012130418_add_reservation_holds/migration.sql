-- CreateTable
CREATE TABLE "reservation_holds" (
    "hold_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resource_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "start_time" TIMESTAMPTZ(6) NOT NULL,
    "end_time" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_holds_pkey" PRIMARY KEY ("hold_id")
);

-- CreateIndex
CREATE INDEX "reservation_holds_user_id_idx" ON "reservation_holds"("user_id");

-- CreateIndex
CREATE INDEX "reservation_holds_resource_id_start_time_idx" ON "reservation_holds"("resource_id", "start_time");

-- CreateIndex
CREATE INDEX "reservation_holds_expires_at_idx" ON "reservation_holds"("expires_at");

-- AddForeignKey
ALTER TABLE "reservation_holds" ADD CONSTRAINT "reservation_holds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_holds" ADD CONSTRAINT "reservation_holds_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("resource_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ensure that a hold has a valid reservation time range.
ALTER TABLE "reservation_holds"
ADD CONSTRAINT "valid_hold_time"
CHECK ("start_time" < "end_time");

-- Ensure that the hold expires after it was created.
ALTER TABLE "reservation_holds"
ADD CONSTRAINT "valid_hold_expiration"
CHECK ("expires_at" > "created_at");
