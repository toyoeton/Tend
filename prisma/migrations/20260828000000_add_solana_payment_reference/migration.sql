ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';

ALTER TABLE "Booking" ADD COLUMN "paymentReference" TEXT;

CREATE UNIQUE INDEX "Booking_paymentReference_key" ON "Booking"("paymentReference");
