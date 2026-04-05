import { describe, it, expect } from 'vitest';
import { Datispecifici, PeriodEnum } from './datispecifici';

describe('Datispecifici', () => {
  it('should create with defaults', () => {
    const d = new Datispecifici();
    expect(d.auth_type).toBeNull();
    expect(d.richiesta).toBeUndefined();
    expect(d.modulo_richiesta).toBeUndefined();
    expect(d.certificato_autenticazione).toBeUndefined();
    expect(d.certificato_firma).toBeUndefined();
    expect(d.url_redirezione).toBeNull();
    expect(d.username).toBeNull();
    expect(d.client_id).toBeNull();
    expect(d.rate_limiting).toBeNull();
    expect(d.finalita).toBeNull();
  });

  it('should assign data from constructor', () => {
    const d = new Datispecifici({
      auth_type: 'https',
      username: 'user1',
      client_id: 'client-123',
      url_redirezione: 'https://redirect.example.com',
      rate_limiting: { quota: 100, periodo: PeriodEnum.Ora },
      finalita: 'uuid-final',
    });
    expect(d.auth_type).toBe('https');
    expect(d.username).toBe('user1');
    expect(d.client_id).toBe('client-123');
    expect(d.rate_limiting?.quota).toBe(100);
    expect(d.finalita).toBe('uuid-final');
  });

  it('should assign properties with defaults', () => {
    const d = new Datispecifici({
      auth_type: 'https',
      url_redirezione: 'https://example.com',
      help_desk: 'mailto:help@example.com',
    });
    expect(d.auth_type).toBe('https');
    expect(d.url_redirezione).toBe('https://example.com');
    expect(d.help_desk).toBe('mailto:help@example.com');
  });

  it('should ignore unknown keys', () => {
    const d = new Datispecifici({ foo: 'bar' });
    expect((d as any).foo).toBeUndefined();
  });
});

describe('PeriodEnum', () => {
  it('should have correct values', () => {
    expect(PeriodEnum.Giorno).toBe('giorno');
    expect(PeriodEnum.Ora).toBe('ora');
    expect(PeriodEnum.Minuti).toBe('minuti');
  });
});
