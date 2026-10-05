-- CreateEnum
CREATE TYPE "SalonType" AS ENUM ('HAIR_SALON', 'BARBER_SHOP');

-- AlterTable
ALTER TABLE "salons" ADD COLUMN     "district" TEXT,
ADD COLUMN     "type" "SalonType" NOT NULL DEFAULT 'HAIR_SALON';
