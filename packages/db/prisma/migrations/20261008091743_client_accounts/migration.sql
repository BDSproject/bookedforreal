-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "accountId" TEXT;

-- CreateTable
CREATE TABLE "client_accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_accounts_email_key" ON "client_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "client_accounts_googleId_key" ON "client_accounts"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "client_accounts_verificationToken_key" ON "client_accounts"("verificationToken");

-- CreateIndex
CREATE INDEX "clients_accountId_idx" ON "clients"("accountId");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "client_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
