import { describe, it, expect } from 'vitest';
import { ServizioApi } from './servizio-api';

describe('ServizioApi', () => {
  it('should create with defaults', () => {
    const m = new ServizioApi();
    expect(m.id_api).toBeNull();
    expect(m.nome).toBeNull();
    expect(m.versione).toBeNull();
    expect(m.descrizione).toBeNull();
    expect(m.ruolo).toBe('');
    expect(m.codice_asset).toBeNull();
    expect(m.protocollo).toBeNull();
    expect(m.protocollo_dettaglio).toBeNull();
    expect(m.profilo).toBeNull();
    expect(m.nome_gateway).toBeNull();
    expect(m.gruppo_gateway).toBeNull();
    // Optional properties without defaults should be undefined
    expect(m.allegati).toBeUndefined();
    expect(m.specifica).toBeUndefined();
    expect(m.dati_erogazione).toBeUndefined();
  });

  it('should assign data from constructor for own properties', () => {
    const m = new ServizioApi({
      id_api: 42,
      nome: 'API Test',
      versione: 3,
      descrizione: 'erogazione',
      ruolo: 'erogazione',
      codice_asset: 'ASSET-001',
      protocollo: 'rest',
      protocollo_dettaglio: 'OpenAPI 3.0',
      profilo: { tipo: 'ModI' },
      nome_gateway: 'gw-api',
      gruppo_gateway: 'gruppo-gw',
    });
    expect(m.id_api).toBe(42);
    expect(m.nome).toBe('API Test');
    expect(m.versione).toBe(3);
    expect(m.descrizione).toBe('erogazione');
    expect(m.ruolo).toBe('erogazione');
    expect(m.codice_asset).toBe('ASSET-001');
    expect(m.protocollo).toBe('rest');
    expect(m.protocollo_dettaglio).toBe('OpenAPI 3.0');
    expect(m.profilo).toEqual({ tipo: 'ModI' });
    expect(m.nome_gateway).toBe('gw-api');
    expect(m.gruppo_gateway).toBe('gruppo-gw');
  });

  it('should NOT assign optional properties without defaults', () => {
    // allegati, specifica, dati_erogazione are declared with ? and no default
    const m = new ServizioApi({
      allegati: [{ nome: 'file.pdf' }],
      specifica: { filename: 'spec.yaml' },
      dati_erogazione: { url: 'http://example.com' },
    });
    expect(m.allegati).toBeUndefined();
    expect(m.specifica).toBeUndefined();
    expect(m.dati_erogazione).toBeUndefined();
  });

  it('should not overwrite defaults with null or undefined values', () => {
    const m = new ServizioApi({ nome: null, ruolo: undefined });
    expect(m.nome).toBeNull();
    expect(m.ruolo).toBe('');
  });

  it('should ignore unknown keys', () => {
    const m = new ServizioApi({ unknown: 'val', extra_field: 123 });
    expect((m as any).unknown).toBeUndefined();
    expect((m as any).extra_field).toBeUndefined();
  });

  it('should handle empty constructor argument', () => {
    const m = new ServizioApi({});
    expect(m.id_api).toBeNull();
    expect(m.ruolo).toBe('');
  });
});
