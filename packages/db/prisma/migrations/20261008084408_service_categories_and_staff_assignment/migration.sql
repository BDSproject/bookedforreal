-- AlterTable
ALTER TABLE "services" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "service_categories" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ServiceToStaff" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ServiceToStaff_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "service_categories_salonId_idx" ON "service_categories"("salonId");

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_salonId_name_key" ON "service_categories"("salonId", "name");

-- CreateIndex
CREATE INDEX "_ServiceToStaff_B_index" ON "_ServiceToStaff"("B");

-- CreateIndex
CREATE INDEX "services_categoryId_idx" ON "services"("categoryId");

-- AddForeignKey
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "salons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceToStaff" ADD CONSTRAINT "_ServiceToStaff_A_fkey" FOREIGN KEY ("A") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceToStaff" ADD CONSTRAINT "_ServiceToStaff_B_fkey" FOREIGN KEY ("B") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
