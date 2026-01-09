import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

export function shouldPaginate(query?: PaginationQueryDto): boolean {
  if (!query) return false;
  if (query.all) return false;
  return query.page != null || query.pageSize != null;
}

export function getPagination(
  query: PaginationQueryDto,
  defaults: { page: number; pageSize: number } = { page: 1, pageSize: 20 },
): { skip: number; take: number; page: number; pageSize: number } {
  const page = query.page ?? defaults.page;
  const pageSize = query.pageSize ?? defaults.pageSize;
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { skip, take, page, pageSize };
}

export function buildMeta(args: {
  total: number;
  page: number;
  pageSize: number;
}) {
  const totalPages =
    args.pageSize > 0 ? Math.ceil(args.total / args.pageSize) : 0;
  return {
    total: args.total,
    page: args.page,
    pageSize: args.pageSize,
    totalPages,
  };
}
