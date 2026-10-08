import { randomBytes } from "node:crypto";

import { prisma } from "@bookedforreal/db";

import { sendVerificationEmail } from "../lib/email";

function webAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * Ensures a client account exists for an email and (re)sends the verification
 * link when the inbox has not been confirmed yet.
 *
 * A verified email is trusted, so the token is not refreshed and no email is
 * sent again. Returns the account id so the booking can be linked to it.
 */
export async function ensureClientAccount(params: {
  email: string;
  name: string;
  locale?: string;
}): Promise<string> {
  const email = params.email.toLowerCase();
  const locale = params.locale ?? "fr";
  const token = randomBytes(24).toString("hex");

  const existing = await prisma.clientAccount.findUnique({ where: { email } });
  if (existing) {
    if (existing.emailVerified) {
      return existing.id;
    }

    const account = await prisma.clientAccount.update({
      where: { email },
      data: { verificationToken: token, name: params.name || existing.name },
    });
    const verifyUrl = `${webAppUrl()}/${locale}/client/verify?token=${token}`;
    void sendVerificationEmail({ to: email, name: account.name, verifyUrl }).catch(() => undefined);
    return account.id;
  }

  const account = await prisma.clientAccount.create({
    data: { email, name: params.name, verificationToken: token },
  });
  const verifyUrl = `${webAppUrl()}/${locale}/client/verify?token=${token}`;
  void sendVerificationEmail({ to: email, name: account.name, verifyUrl }).catch(() => undefined);
  return account.id;
}
