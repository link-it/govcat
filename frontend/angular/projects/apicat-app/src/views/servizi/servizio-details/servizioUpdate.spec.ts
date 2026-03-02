import { describe, it, expect } from 'vitest';
import { ServizioUpdate } from './servizioUpdate';

describe('ServizioUpdate', () => {
  it('should create with defaults', () => {
    const m = new ServizioUpdate();
    // Both properties are declared with ? and no default value,
    // so they will be undefined on the instance
    expect(m.identificativo).toBeUndefined();
    expect(m.dati_generici).toBeUndefined();
  });

  it('should NOT assign data from constructor (no own properties)', () => {
    // Properties declared as field?: Type WITHOUT default values
    // do not pass hasOwnProperty check, so the constructor won't assign them
    const m = new ServizioUpdate({
      identificativo: { nome: 'test', versione: '1' },
      dati_generici: { descrizione: 'desc' },
    });
    expect(m.identificativo).toBeUndefined();
    expect(m.dati_generici).toBeUndefined();
  });

  it('should ignore unknown keys', () => {
    const m = new ServizioUpdate({ unknown: 'val' });
    expect((m as any).unknown).toBeUndefined();
  });

  it('should handle empty constructor argument', () => {
    const m = new ServizioUpdate({});
    expect(m.identificativo).toBeUndefined();
    expect(m.dati_generici).toBeUndefined();
  });
});
