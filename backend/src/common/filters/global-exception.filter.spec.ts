import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

declare const process: {
  env: {
    NODE_ENV?: string;
  };
};

type MockResponse = {
  status: (statusCode: number) => MockResponse;
  json: (body: unknown) => MockResponse;
};

type MockRequest = { url: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
  });

  it('should include stack and cause in non-production for unexpected errors', () => {
    const statusCalls: number[] = [];
    const jsonCalls: unknown[] = [];

    const res: MockResponse = {
      status: (code: number) => {
        statusCalls.push(code);
        return res;
      },
      json: (body: unknown) => {
        jsonCalls.push(body);
        return res;
      },
    };

    const req: MockRequest = { url: '/test' };
    const host = {
      switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
    } as unknown as ArgumentsHost;

    Reflect.set(process.env as unknown as object, 'NODE_ENV', 'development');

    const err = new Error('boom', { cause: { reason: 'db-failure' } });

    filter.catch(err, host);

    expect(statusCalls).toEqual([500]);
    expect(jsonCalls).toHaveLength(1);
    expect(jsonCalls[0]).toEqual(
      expect.objectContaining({
        statusCode: 500,
        path: req.url,
        stack: expect.any(String),
        cause: expect.any(Object),
      }),
    );
  });

  it('should not include stack/cause in production', () => {
    const statusCalls: number[] = [];
    const jsonCalls: unknown[] = [];

    const res: MockResponse = {
      status: (code: number) => {
        statusCalls.push(code);
        return res;
      },
      json: (body: unknown) => {
        jsonCalls.push(body);
        return res;
      },
    };

    const req: MockRequest = { url: '/test' };
    const host = {
      switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
    } as unknown as ArgumentsHost;

    Reflect.set(process.env as unknown as object, 'NODE_ENV', 'production');

    const err = new Error('boom', { cause: { reason: 'db-failure' } });

    filter.catch(err, host);

    expect(statusCalls).toEqual([500]);
    expect(jsonCalls).toHaveLength(1);
    expect(jsonCalls[0]).toEqual(
      expect.objectContaining({ statusCode: 500, path: req.url }),
    );

    const body = jsonCalls[0];
    if (!isRecord(body)) throw new Error('body inválido');
    expect(body.stack).toBeUndefined();
    expect(body.cause).toBeUndefined();
  });

  it('should handle HttpException and include stack in non-prod', () => {
    const statusCalls: number[] = [];
    const jsonCalls: unknown[] = [];

    const res: MockResponse = {
      status: (code: number) => {
        statusCalls.push(code);
        return res;
      },
      json: (body: unknown) => {
        jsonCalls.push(body);
        return res;
      },
    };

    const req: MockRequest = { url: '/test' };
    const host = {
      switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
    } as unknown as ArgumentsHost;

    Reflect.set(process.env as unknown as object, 'NODE_ENV', 'development');

    const http = new HttpException('Bad', HttpStatus.BAD_REQUEST, {
      cause: { reason: 'bad-input' },
    });

    filter.catch(http, host);

    expect(statusCalls).toEqual([400]);
    expect(jsonCalls).toHaveLength(1);
    expect(jsonCalls[0]).toEqual(
      expect.objectContaining({
        statusCode: 400,
        path: req.url,
        stack: expect.any(String),
        cause: expect.any(Object),
      }),
    );
  });
});
