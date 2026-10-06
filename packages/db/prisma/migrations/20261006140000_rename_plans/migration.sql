-- Rename the plan tiers to their customer-facing names (Solo / Salon) and add the
-- pay-as-you-go (USAGE) and multi-shop (GROUP) tiers.
--
-- `RENAME VALUE` keeps existing rows intact, so no data migration is needed.
ALTER TYPE "Plan" RENAME VALUE 'STARTER' TO 'SOLO';
ALTER TYPE "Plan" RENAME VALUE 'PRO' TO 'SALON';

-- Added but not used in this transaction (PostgreSQL requirement).
-- USAGE is inserted first so the database order matches the Prisma schema order.
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'USAGE' BEFORE 'SOLO';
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'GROUP';
