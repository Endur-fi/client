/* eslint-env es2020 */
/**
 * Prisma Client Singleton (lazy)
 *
 * We intentionally avoid importing `@prisma/client` at module scope because
 * if `prisma generate` hasn't run yet, Next will crash while evaluating imports
 * (before route handlers execute).
 */

export type PrismaClientType = unknown;

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | PrismaClientType;
}

export async function getPrisma() {
  if (globalThis.prisma) return globalThis.prisma as any;

  try {
    const mod = await import("@prisma/client");
    const PrismaClient = (mod as any).PrismaClient as any;
    const prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });

    if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

    return prisma;
  } catch (err: any) {
    throw new Error(
      "Prisma client is not generated. Run `pnpm approve-builds` then `pnpm prisma generate` (or reinstall), and restart the dev server.",
    );
  }
}

