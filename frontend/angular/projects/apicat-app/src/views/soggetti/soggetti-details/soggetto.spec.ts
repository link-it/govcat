import { describe, it, expect } from 'vitest';
import { Soggetto, TipoGateway } from './soggetto';

describe('Soggetto', () => {
  it('should create with defaults', () => {
    const s = new Soggetto();
    expect(s.id).toBeNull();
    expect(s.id_soggetto).toBeNull();
    expect(s.aderente).toBe(false);
    expect(s.nome).toBeNull();
    expect(s.referente).toBe(false);
    expect(s.organizzazione).toBeNull();
    expect(s.descrizione).toBeNull();
    expect(s.codice_ente).toBeNull();
    expect(s.codice_fiscale_soggetto).toBeNull();
    expect(s.id_tipo_utente).toBeNull();
    expect(s.id_organizzazione).toBeNull();
    expect(s.vincola_aderente).toBe(false);
    expect(s.vincola_referente).toBe(false);
    expect(s.nome_gateway).toBeNull();
    expect(s.tipo_gateway).toBeNull();
    expect(s.url_invocazione).toBeNull();
    expect(s.url_prefix_collaudo).toBeNull();
    expect(s.url_prefix_produzione).toBeNull();
    expect(s.skip_collaudo).toBe(false);
    expect(s.vincola_skip_collaudo).toBe(false);
  });

  it('should assign data from constructor', () => {
    const s = new Soggetto({
      id: 42,
      id_soggetto: 'sog-1',
      nome: 'Test Soggetto',
      aderente: true,
      referente: true,
      descrizione: 'Desc',
      codice_ente: 'ENT-001',
      codice_fiscale_soggetto: 'RSSMRA80A01H501U',
    });
    expect(s.id).toBe(42);
    expect(s.id_soggetto).toBe('sog-1');
    expect(s.nome).toBe('Test Soggetto');
    expect(s.aderente).toBe(true);
    expect(s.referente).toBe(true);
    expect(s.descrizione).toBe('Desc');
  });

  it('should assign organizzazione', () => {
    const org = { id_organizzazione: 'org-1', nome: 'Org Test' };
    const s = new Soggetto({ organizzazione: org });
    expect(s.organizzazione).toEqual(org);
  });

  it('should assign gateway fields', () => {
    const s = new Soggetto({
      nome_gateway: 'GW-1',
      tipo_gateway: TipoGateway.ModIPA,
      url_invocazione: 'https://gw.example.com',
      url_prefix_collaudo: '/test',
      url_prefix_produzione: '/prod',
    });
    expect(s.nome_gateway).toBe('GW-1');
    expect(s.tipo_gateway).toBe('ModIPA');
    expect(s.url_invocazione).toBe('https://gw.example.com');
  });

  it('should assign skip_collaudo flags', () => {
    const s = new Soggetto({
      skip_collaudo: true,
      vincola_skip_collaudo: true,
    });
    expect(s.skip_collaudo).toBe(true);
    expect(s.vincola_skip_collaudo).toBe(true);
  });

  it('should ignore null and undefined values', () => {
    const s = new Soggetto({ nome: null, descrizione: undefined });
    expect(s.nome).toBeNull();
    expect(s.descrizione).toBeNull();
  });

  it('should ignore unknown keys', () => {
    const s = new Soggetto({ unknown: 'value' });
    expect((s as any).unknown).toBeUndefined();
  });
});

describe('TipoGateway', () => {
  it('should have correct enum values', () => {
    expect(TipoGateway.APIGateway).toBe('APIGateway');
    expect(TipoGateway.ModIPA).toBe('ModIPA');
    expect(TipoGateway.SPCoop).toBe('SPCoop');
    expect(TipoGateway.FatturaPA).toBe('FatturaPA');
    expect(TipoGateway.eDelivery).toBe('eDelivery');
  });
});
