import { PrismaExceptionFilter } from './prisma-exception.filter';
import { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type MockResponse = {
  status: jest.Mock<MockResponse, [number]>;
  json: jest.Mock<MockResponse, [unknown]>;
};

type MockRequest = { url: string };

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;

  beforeEach(() => {
    filter = new PrismaExceptionFilter();
  });

  function mockHost() {
    const res = {
      status: jest.fn<MockResponse, [number]>(),
      json: jest.fn<MockResponse, [unknown]>(),
    } as MockResponse;
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);

    const req: MockRequest = { url: '/test' };
    const host = {
      switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
    } as unknown as ArgumentsHost;
    return { host, status: res.status, json: res.json, req };
  }

  it('should return 503 for ETIMEDOUT', () => {
    const { host, status, json, req } = mockHost();
    const err = {
      code: 'ETIMEDOUT',
      meta: { modelName: 'Usuario' },
    } as unknown as Prisma.PrismaClientKnownRequestError;

    filter.catch(err, host);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 503, path: req.url }),
    );
  });

  it('should return 400 for P2002', () => {
    const { host, status, json, req } = mockHost();
    const err = {
      code: 'P2002',
      meta: { constraint: { fields: ['email'] } },
    } as unknown as Prisma.PrismaClientKnownRequestError;

    filter.catch(err, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: req.url,
        fields: ['email'],
      }),
    );
  });
});
