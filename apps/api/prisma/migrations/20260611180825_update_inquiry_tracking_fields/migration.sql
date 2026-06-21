-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "lookbookSentAt" TIMESTAMP(3),
ADD COLUMN     "lookbookSentBy" TEXT,
ADD COLUMN     "paymentLinkSentAt" TIMESTAMP(3),
ADD COLUMN     "paymentLinkSentBy" TEXT,
ADD COLUMN     "stripePaymentLink" TEXT;
