import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
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

  it('should include stack and cause in non-production for unexpected errors', () => {
    const { host, status, json, req } = mockHost();
    process.env.NODE_ENV = 'development';

    const err = new Error('boom');
    (err as any).cause = { reason: 'db-failure' };

    filter.catch(err, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        path: req.url,
        stack: expect.any(String),
        cause: expect.any(Object),
      }),
    );
  });

  it('should not include stack/cause in production', () => {
    const { host, status, json, req } = mockHost();
    process.env.NODE_ENV = 'production';

    const err = new Error('boom');
    (err as any).cause = { reason: 'db-failure' };

    filter.catch(err, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, path: req.url }),
    );
    const body = (json as jest.Mock).mock.calls[0][0];
    expect(body.stack).toBeUndefined();
    expect(body.cause).toBeUndefined();
  });

  it('should handle HttpException and include stack in non-prod', () => {
    const { host, status, json, req } = mockHost();
    process.env.NODE_ENV = 'development';

    const http = new HttpException('Bad', HttpStatus.BAD_REQUEST);
    (http as any).cause = { reason: 'bad-input' };

    filter.catch(http, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: req.url,
        stack: expect.any(String),
        cause: expect.any(Object),
      }),
    );
  });
});
