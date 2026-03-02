import { describe, it, expect } from 'vitest';
import { AdesioneUpdate } from './adesioneUpdate';

describe('AdesioneUpdate', () => {
  it('should create with defaults', () => {
    const a = new AdesioneUpdate();
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
    expect(a.stato).toBe('');
    expect(a.data_creazione).toBe('');
    expect(a.data_ultimo_aggiornamento).toBe('');
    expect(a.skip_collaudo).toBe(false);
    expect(a.id_adesione).toBeNull();
  });

  it('should assign data from constructor', () => {
    const servizio = { id_servizio: 'srv-1', nome: 'Srv', versione: '1', descrizione: null, descrizione_sintetica: null, visibilita: null, stato: null, multi_adesione: false, id_dominio: null };
    const soggetto = { aderente: true, id_soggetto: 'sog-1', nome: 'Sog', organizzazione: { id_organizzazione: 'org-1', nome: 'Org' }, referente: false };
    const a = new AdesioneUpdate({
      id_adesione: 'ade-1',
      id_logico: 'log-1',
      stato: 'configurata',
      servizio,
      soggetto,
      skip_collaudo: true,
    });
    expect(a.id_adesione).toBe('ade-1');
    expect(a.stato).toBe('configurata');
    expect(a.servizio).toEqual(servizio);
    expect(a.soggetto).toEqual(soggetto);
    expect(a.skip_collaudo).toBe(true);
  });

  it('should ignore unknown keys', () => {
    const a = new AdesioneUpdate({ foo: 'bar' });
    expect((a as any).foo).toBeUndefined();
  });
});
