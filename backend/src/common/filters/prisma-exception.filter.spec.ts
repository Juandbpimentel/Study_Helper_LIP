import { PrismaExceptionFilter } from './prisma-exception.filter';
import { ArgumentsHost } from '@nestjs/common';

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;

  beforeEach(() => {
    filter = new PrismaExceptionFilter();
  });

  function mockHost() {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const res = { status, json };
    const req = { url: '/test' };
    const host = {
      switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
    } as unknown as ArgumentsHost;
    return { host, status, json, req };
  }

  it('should return 503 for ETIMEDOUT', () => {
    const { host, status, json, req } = mockHost();
    const err = { code: 'ETIMEDOUT', meta: { modelName: 'Usuario' } } as any;

    filter.catch(err, host);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 503, path: req.url }),
    );
  });

  it('should return 409 for P2002', () => {
    const { host, status, json, req } = mockHost();
    const err = {
      code: 'P2002',
      meta: { constraint: { fields: ['email'] } },
    } as any;

    filter.catch(err, host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, path: req.url }),
    );
  });
});
