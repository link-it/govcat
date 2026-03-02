import { describe, it, expect } from 'vitest';
import { Organizzazione } from './organizzazione';

describe('Organizzazione', () => {
  it('should create with defaults', () => {
    const o = new Organizzazione();
    expect(o.id_organizzazione).toBeNull();
    expect(o.nome).toBeNull();
    expect(o.descrizione).toBeNull();
    expect(o.codice_ente).toBeNull();
    expect(o.codice_fiscale_soggetto).toBeNull();
    expect(o.id_tipo_utente).toBeNull();
    expect(o.referente).toBe(false);
    expect(o.aderente).toBe(false);
    expect(o.esterna).toBe(false);
    expect(o.cambio_esterna_consentito).toBe(false);
    expect(o.vincola_aderente).toBe(false);
    expect(o.vincola_referente).toBe(false);
    expect(o.id_soggetto_default).toBeNull();
    expect(o.soggetto_default).toBeNull();
  });

  it('should assign data from constructor', () => {
    const o = new Organizzazione({
      id_organizzazione: 1,
      nome: 'Org Test',
      descrizione: 'Desc',
      codice_ente: 'ENT-001',
      codice_fiscale_soggetto: 'RSSMRA80A01H501U',
      referente: true,
      aderente: true,
      esterna: true,
    });
    expect(o.id_organizzazione).toBe(1);
    expect(o.nome).toBe('Org Test');
    expect(o.descrizione).toBe('Desc');
    expect(o.codice_ente).toBe('ENT-001');
    expect(o.codice_fiscale_soggetto).toBe('RSSMRA80A01H501U');
    expect(o.referente).toBe(true);
    expect(o.aderente).toBe(true);
    expect(o.esterna).toBe(true);
  });

  it('should assign soggetto_default', () => {
    const soggetto = { id_soggetto: 1, nome: 'Sog', aderente: true, referente: false };
    const o = new Organizzazione({
      soggetto_default: soggetto,
      id_soggetto_default: 'sog-1',
    });
    expect(o.soggetto_default).toEqual(soggetto);
    expect(o.id_soggetto_default).toBe('sog-1');
  });

  it('should assign vincola flags', () => {
    const o = new Organizzazione({
      vincola_aderente: true,
      vincola_referente: true,
      cambio_esterna_consentito: true,
    });
    expect(o.vincola_aderente).toBe(true);
    expect(o.vincola_referente).toBe(true);
    expect(o.cambio_esterna_consentito).toBe(true);
  });

  it('should ignore null and undefined values', () => {
    const o = new Organizzazione({ nome: null, descrizione: undefined });
    expect(o.nome).toBeNull();
    expect(o.descrizione).toBeNull();
  });

  it('should ignore unknown keys', () => {
    const o = new Organizzazione({ foo: 'bar' });
    expect((o as any).foo).toBeUndefined();
  });
});
