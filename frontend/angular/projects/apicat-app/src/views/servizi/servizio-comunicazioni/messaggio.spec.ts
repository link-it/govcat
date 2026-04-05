import { describe, it, expect } from 'vitest';
import { Messaggio } from './messaggio';

describe('Messaggio', () => {
  it('should create with defaults', () => {
    const m = new Messaggio();
    expect(m.oggetto).toBe('');
    expect(m.testo).toBe('');
    // Optional properties without defaults should be undefined
    expect(m.target).toBeUndefined();
    expect(m.includi_tecnici).toBeUndefined();
    expect(m.allegati).toBeUndefined();
  });

  it('should assign data from constructor for own properties', () => {
    const m = new Messaggio({
      oggetto: 'Oggetto del messaggio',
      testo: 'Corpo del messaggio di test',
    });
    expect(m.oggetto).toBe('Oggetto del messaggio');
    expect(m.testo).toBe('Corpo del messaggio di test');
  });

  it('should NOT assign optional properties without defaults', () => {
    // target, includi_tecnici, allegati are declared with ? and no default
    const m = new Messaggio({
      target: ['referente_servizio'],
      includi_tecnici: true,
      allegati: [{ filename: 'doc.pdf' }],
    });
    expect(m.target).toBeUndefined();
    expect(m.includi_tecnici).toBeUndefined();
    expect(m.allegati).toBeUndefined();
  });

  it('should not overwrite defaults with null or undefined values', () => {
    const m = new Messaggio({ oggetto: null, testo: undefined });
    expect(m.oggetto).toBe('');
    expect(m.testo).toBe('');
  });

  it('should ignore unknown keys', () => {
    const m = new Messaggio({ unknown: 'val', extra_field: 123 });
    expect((m as any).unknown).toBeUndefined();
    expect((m as any).extra_field).toBeUndefined();
  });

  it('should handle empty constructor argument', () => {
    const m = new Messaggio({});
    expect(m.oggetto).toBe('');
    expect(m.testo).toBe('');
  });
});
