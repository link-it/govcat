import { describe, it, expect } from 'vitest';
import { ServizioApiCreate } from './servizio-api-create';

describe('ServizioApiCreate', () => {
  it('should create with defaults', () => {
    const m = new ServizioApiCreate();
    expect(m.id_api).toBeNull();
    expect(m.nome).toBeNull();
    expect(m.versione).toBeNull();
    expect(m.id_servizio).toBeNull();
    expect(m.ruolo).toBeNull();
    expect(m.protocollo).toBeNull();
    expect(m.descrizione).toBeNull();
    expect(m.codice_asset).toBeNull();
    expect(m.filename).toBeNull();
    expect(m.estensione).toBeNull();
    expect(m.content).toBeNull();
    expect(m.uuid).toBeNull();
    expect(m.url_produzione).toBeNull();
    expect(m.url_collaudo).toBeNull();
    expect(m.proprieta_custom).toBeNull();
    expect(m.nome_gateway).toBeNull();
    expect(m.versione_gateway).toBeNull();
    // Optional properties without defaults should be undefined
    expect(m.specifica).toBeUndefined();
    expect(m.dati_erogazione).toBeUndefined();
  });

  it('should assign data from constructor for own properties', () => {
    const m = new ServizioApiCreate({
      id_api: 'api-001',
      nome: 'Nuova API',
      versione: 1,
      id_servizio: 'srv-001',
      ruolo: 'erogazione',
      protocollo: 'rest',
      descrizione: 'Descrizione API',
      codice_asset: 'ASSET-002',
      filename: 'specifica.yaml',
      estensione: 'yaml',
      content: 'base64content',
      uuid: 'uuid-123',
      url_produzione: 'https://prod.example.com/api',
      url_collaudo: 'https://coll.example.com/api',
      proprieta_custom: [{ nome: 'prop1', valore: 'val1' }],
      nome_gateway: 'gw-nome',
      versione_gateway: 'v1',
    });
    expect(m.id_api).toBe('api-001');
    expect(m.nome).toBe('Nuova API');
    expect(m.versione).toBe(1);
    expect(m.id_servizio).toBe('srv-001');
    expect(m.ruolo).toBe('erogazione');
    expect(m.protocollo).toBe('rest');
    expect(m.descrizione).toBe('Descrizione API');
    expect(m.codice_asset).toBe('ASSET-002');
    expect(m.filename).toBe('specifica.yaml');
    expect(m.estensione).toBe('yaml');
    expect(m.content).toBe('base64content');
    expect(m.uuid).toBe('uuid-123');
    expect(m.url_produzione).toBe('https://prod.example.com/api');
    expect(m.url_collaudo).toBe('https://coll.example.com/api');
    expect(m.proprieta_custom).toEqual([{ nome: 'prop1', valore: 'val1' }]);
    expect(m.nome_gateway).toBe('gw-nome');
    expect(m.versione_gateway).toBe('v1');
  });

  it('should NOT assign optional properties without defaults', () => {
    // specifica and dati_erogazione are declared with ? and no default
    const m = new ServizioApiCreate({
      specifica: { filename: 'spec.yaml' },
      dati_erogazione: { url: 'http://example.com' },
    });
    expect(m.specifica).toBeUndefined();
    expect(m.dati_erogazione).toBeUndefined();
  });

  it('should not overwrite defaults with null or undefined values', () => {
    const m = new ServizioApiCreate({ nome: null, id_api: undefined });
    expect(m.nome).toBeNull();
    expect(m.id_api).toBeNull();
  });

  it('should ignore unknown keys', () => {
    const m = new ServizioApiCreate({ unknown: 'val', extra_field: 123 });
    expect((m as any).unknown).toBeUndefined();
    expect((m as any).extra_field).toBeUndefined();
  });

  it('should handle empty constructor argument', () => {
    const m = new ServizioApiCreate({});
    expect(m.id_api).toBeNull();
    expect(m.nome).toBeNull();
  });
});
