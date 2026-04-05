import { describe, it, expect } from 'vitest';
import { AdesioneCreate } from './adesioneCreate';

describe('AdesioneCreate', () => {
  it('should create with defaults', () => {
    const a = new AdesioneCreate();
    expect(a.id_logico).toBeNull();
    expect(a.referenti).toEqual([]);
    expect(a.visibilita).toBeNull();
    expect(a.referente).toBe('');
    expect(a.referente_tecnico).toBe('');
    expect(a.servizio).toBeNull();
    expect(a.id_servizio).toBeNull();
    expect(a.soggetto).toBeNull();
    expect(a.id_soggetto).toBeNull();
    expect(a.organizzazione).toBeNull();
    expect(a.id_organizzazione).toBeNull();
    expect(a.skip_collaudo).toBe(false);
  });

  it('should assign data from constructor', () => {
    const a = new AdesioneCreate({
      id_logico: 'log-1',
      id_servizio: 'srv-1',
      id_soggetto: 'sog-1',
      referente: 'ref-1',
      skip_collaudo: true,
    });
    expect(a.id_logico).toBe('log-1');
    expect(a.id_servizio).toBe('srv-1');
    expect(a.id_soggetto).toBe('sog-1');
    expect(a.referente).toBe('ref-1');
    expect(a.skip_collaudo).toBe(true);
  });

  it('should ignore unknown keys', () => {
    const a = new AdesioneCreate({ foo: 'bar' });
    expect((a as any).foo).toBeUndefined();
  });
});
