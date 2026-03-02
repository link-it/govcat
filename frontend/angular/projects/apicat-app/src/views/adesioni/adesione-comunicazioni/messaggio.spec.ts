import { describe, it, expect } from 'vitest';
import { Messaggio } from './messaggio';

describe('Messaggio', () => {
  it('should create with defaults', () => {
    const m = new Messaggio();
    expect(m.oggetto).toBe('');
    expect(m.testo).toBe('');
    expect(m.target).toBeUndefined();
    expect(m.includi_tecnici).toBeUndefined();
    expect(m.allegati).toBeUndefined();
  });

  it('should assign data from constructor', () => {
    const m = new Messaggio({
      oggetto: 'Subject',
      testo: 'Body text',
    });
    expect(m.oggetto).toBe('Subject');
    expect(m.testo).toBe('Body text');
  });

  it('should ignore unknown keys', () => {
    const m = new Messaggio({ unknown: 'val' });
    expect((m as any).unknown).toBeUndefined();
  });
});
