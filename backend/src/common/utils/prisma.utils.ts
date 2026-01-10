import { Prisma } from '@prisma/client';

export function isPrismaP2002(err: unknown): boolean {
  try {
    return (
      (err as any)?.code === 'P2002' ||
      (err instanceof Prisma.PrismaClientKnownRequestError &&
        (err as any).code === 'P2002')
    );
  } catch {
    return false;
  }
}

export function getPrismaConstraintFields(err: unknown): string[] {
  return (
    (err as any)?.meta?.constraint?.fields ??
    (err as any)?.meta?.cause?.constraint?.fields ??
    []
  );
}
