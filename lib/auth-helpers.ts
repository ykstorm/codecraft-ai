import { db } from "@/lib/db";

/**
 * Minimal user/account lookups used by the NextAuth jwt callback. Previously
 * these lived in the (now-removed) modules/auth/actions tree; they're kept here
 * as tiny standalone helpers so auth.ts has no dependency on application
 * modules.
 */

export async function getUserById(id: string) {
  try {
    return await db.user.findUnique({
      where: { id },
      include: { accounts: true },
    });
  } catch {
    return null;
  }
}

export async function getAccountByUserId(userId: string) {
  try {
    return await db.account.findFirst({ where: { userId } });
  } catch {
    return null;
  }
}
