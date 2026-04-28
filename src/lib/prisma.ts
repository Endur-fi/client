/**
 * Prisma Client Singleton (lazy)
 *
 * We intentionally avoid importing `@prisma/client` at module scope because
 * if `prisma generate` hasn't run yet, Next will crash while evaluating imports
 * (before route handlers execute).
 */

export type PrismaClientType = import("@prisma/client").PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | PrismaClientType;
}

export async function getPrisma() {
  const g = global as typeof global & { prisma?: PrismaClientType };
  if (g.prisma) return g.prisma;

  try {
    const mod = await import("@prisma/client");
    const PrismaClient = (mod as unknown as { PrismaClient: PrismaClientType })
      .PrismaClient as unknown as new (args: unknown) => PrismaClientType;
    const prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });

    if (process.env.NODE_ENV !== "production") g.prisma = prisma;

    return prisma;
  } catch {
    throw new Error(
      "Prisma client is not generated. Run `pnpm approve-builds` then `pnpm prisma generate` (or reinstall), and restart the dev server.",
    );
  }
}

