import { Prisma } from '@prisma/client';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStringProp(value: unknown, prop: string): string | undefined {
  if (!isRecord(value)) return undefined;
  const v = value[prop];
  return typeof v === 'string' ? v : undefined;
}

function getArrayProp(value: unknown, prop: string): unknown[] | undefined {
  if (!isRecord(value)) return undefined;
  const v = value[prop];
  return Array.isArray(v) ? v : undefined;
}

export function isPrismaP2002(err: unknown): boolean {
  try {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return err.code === 'P2002';
    }
    return getStringProp(err, 'code') === 'P2002';
  } catch {
    return false;
  }
}

export function getPrismaConstraintFields(err: unknown): string[] {
  if (!isRecord(err)) return [];

  const meta = isRecord(err.meta) ? err.meta : undefined;
  const cause = meta && isRecord(meta.cause) ? meta.cause : undefined;

  const constraint =
    meta && isRecord(meta.constraint) ? meta.constraint : undefined;
  const constraintCause =
    cause && isRecord(cause.constraint) ? cause.constraint : undefined;

  const fieldsFromConstraint =
    getArrayProp(constraint, 'fields') ??
    getArrayProp(constraintCause, 'fields');
  const fieldsFromTarget =
    getArrayProp(meta, 'target') ?? getArrayProp(cause, 'target');

  const fields = fieldsFromConstraint ?? fieldsFromTarget ?? [];
  return fields.map(String);
}

export function buildUniqueViolationMessage(fields: string[]): string {
  if (fields.length === 0) return 'Propriedade única duplicada';
  if (fields.length === 1)
    return `A propriedade ${fields[0]} deve ser única e está duplicada`;
  return `As propriedades ${fields.join(', ')} devem ser únicas e estão duplicadas`;
}
