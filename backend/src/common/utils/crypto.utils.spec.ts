import { decryptSecret, encryptSecret } from './crypto.utils';

describe('crypto.utils', () => {
  const ORIGINAL_ENV = process.env;

  function setKeyFromBytes(bytes: Buffer): void {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = bytes.toString('base64');
  }

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.restoreAllMocks();
  });

  it('encryptSecret/decryptSecret: roundtrip com chave válida (base64)', () => {
    setKeyFromBytes(Buffer.alloc(32, 7));

    const payload = encryptSecret('segredo');
    expect(typeof payload).toBe('string');

    const parts = payload.split('.');
    expect(parts.length).toBe(4);
    expect(parts[0]).toBe('v1');

    const plain = decryptSecret(payload);
    expect(plain).toBe('segredo');
  });

  it('encryptSecret: lança erro quando GOOGLE_TOKEN_ENCRYPTION_KEY não está definido', () => {
    delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;

    expect(() => encryptSecret('x')).toThrow(/GOOGLE_TOKEN_ENCRYPTION_KEY/);
  });

  it('encryptSecret: lança erro quando GOOGLE_TOKEN_ENCRYPTION_KEY tem tamanho inválido', () => {
    setKeyFromBytes(Buffer.alloc(31, 1));

    expect(() => encryptSecret('x')).toThrow(/esperado 32 bytes/);
  });

  it('decryptSecret: lança erro para payload inválido (formato)', () => {
    setKeyFromBytes(Buffer.alloc(32, 7));

    expect(() => decryptSecret('invalido')).toThrow(/formato/);
    expect(() => decryptSecret('v2.a.b.c')).toThrow(/formato/);
  });

  it('decryptSecret: falha quando chave muda (auth tag inválida)', () => {
    setKeyFromBytes(Buffer.alloc(32, 7));
    const payload = encryptSecret('segredo');

    setKeyFromBytes(Buffer.alloc(32, 8));

    expect(() => decryptSecret(payload)).toThrow();
  });
});
