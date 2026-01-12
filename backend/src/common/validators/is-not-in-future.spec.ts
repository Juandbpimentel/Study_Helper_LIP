import { validate } from 'class-validator';
import { IsNotInFuture } from './is-not-in-future.validator';

class TestDto {
  @IsNotInFuture()
  date?: string;
}

describe('IsNotInFuture validator', () => {
  it('allows undefined', async () => {
    const dto = new TestDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('rejects dates in the future', async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const dto = new TestDto();
    dto.date = future;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toBeDefined();
  });

  it('accepts past or present dates', async () => {
    const now = new Date().toISOString();
    const dto = new TestDto();
    dto.date = now;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);

    const past = new Date(Date.now() - 86_400_000).toISOString();
    dto.date = past;
    const errors2 = await validate(dto);
    expect(errors2.length).toBe(0);
  });
});
