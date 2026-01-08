import type { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { buildMeta, getPagination, shouldPaginate } from './pagination.utils';

describe('pagination.utils', () => {
  it('shouldPaginate: false quando query undefined ou all=true', () => {
    expect(shouldPaginate(undefined)).toBe(false);

    expect(shouldPaginate({ all: true } as PaginationQueryDto)).toBe(false);
  });

  it('shouldPaginate: true quando page ou pageSize presentes (e all não)', () => {
    expect(shouldPaginate({ page: 1 } as PaginationQueryDto)).toBe(true);
    expect(shouldPaginate({ pageSize: 10 } as PaginationQueryDto)).toBe(true);
    expect(shouldPaginate({ page: 2, pageSize: 5 } as PaginationQueryDto)).toBe(
      true,
    );
  });

  it('getPagination: usa defaults quando page/pageSize ausentes', () => {
    const result = getPagination({} as PaginationQueryDto);
    expect(result).toEqual({ skip: 0, take: 20, page: 1, pageSize: 20 });
  });

  it('getPagination: calcula skip/take a partir de page/pageSize', () => {
    const result = getPagination({
      page: 2,
      pageSize: 5,
    } as PaginationQueryDto);
    expect(result).toEqual({ skip: 5, take: 5, page: 2, pageSize: 5 });
  });

  it('getPagination: aceita defaults customizados', () => {
    const result = getPagination({} as PaginationQueryDto, {
      page: 3,
      pageSize: 7,
    });
    expect(result).toEqual({ skip: 14, take: 7, page: 3, pageSize: 7 });
  });

  it('buildMeta: calcula totalPages corretamente (inclui pageSize=0)', () => {
    expect(buildMeta({ total: 12, page: 2, pageSize: 5 })).toEqual({
      total: 12,
      page: 2,
      pageSize: 5,
      totalPages: 3,
    });

    expect(buildMeta({ total: 12, page: 1, pageSize: 0 })).toEqual({
      total: 12,
      page: 1,
      pageSize: 0,
      totalPages: 0,
    });
  });
});
