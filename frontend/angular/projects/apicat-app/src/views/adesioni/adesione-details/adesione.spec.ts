import { describe, it, expect } from 'vitest';
import { Adesione } from './adesione';

describe('Adesione', () => {
  it('should create with defaults', () => {
    const a = new Adesione();
    expect(a.id).toBeNull();
    expect(a.id_adesione).toBeNull();
    expect(a.id_logico).toBeNull();
    expect(a.data_creazione).toBe('');
    expect(a.data_ultimo_aggiornamento).toBe('');
    expect(a.stato).toBe('bozza');
    expect(a.servizio).toBeNull();
    expect(a.soggetto).toBeNull();
    expect(a.organizzazione).toBeNull();
    expect(a.skip_collaudo).toBe(false);
  });

  it('should assign data from constructor', () => {
    const a = new Adesione({
      id_adesione: 'ade-1',
      id_logico: 'log-1',
      stato: 'configurata',
      id_servizio: 'srv-1',
      servizio_nome: 'Servizio Test',
      id_soggetto: 'sog-1',
      soggetto_nome: 'Soggetto Test',
      skip_collaudo: true,
    });
    expect(a.id_adesione).toBe('ade-1');
    expect(a.stato).toBe('configurata');
    expect(a.id_servizio).toBe('srv-1');
    expect(a.servizio_nome).toBe('Servizio Test');
    expect(a.skip_collaudo).toBe(true);
  });

  it('should ignore null and undefined values', () => {
    const a = new Adesione({ id_adesione: null, stato: undefined });
    expect(a.id_adesione).toBeNull();
    expect(a.stato).toBe('bozza');
  });

  it('should ignore unknown keys', () => {
    const a = new Adesione({ unknown: 'value' });
    expect((a as any).unknown).toBeUndefined();
  });
});
