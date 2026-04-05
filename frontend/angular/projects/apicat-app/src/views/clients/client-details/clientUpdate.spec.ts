import { describe, it, expect, beforeEach } from 'vitest';
import { ClientUpdate } from './clientUpdate';

describe('ClientUpdate', () => {

  it('should create an instance with default values', () => {
    const model = new ClientUpdate();
    expect(model).toBeTruthy();
    expect(model.dati_specifici).toBeNull();
    expect(model.ambiente).toBeNull();
    expect(model.id_soggetto).toBeNull();
    expect(model.nome).toBeNull();
    expect(model.indirizzi_ip).toBeNull();
    expect(model.descrizione).toBeNull();
  });

  it('should assign properties from data using hasOwnProperty pattern', () => {
    const data = {
      dati_specifici: { auth_type: 'mtls' },
      ambiente: 'collaudo',
      id_soggetto: 'sogg-1',
      nome: 'Client Test',
      indirizzi_ip: '192.168.1.1',
      descrizione: 'Test description'
    };
    const model = new ClientUpdate(data);
    expect(model.dati_specifici).toEqual({ auth_type: 'mtls' });
    expect(model.ambiente).toBe('collaudo');
    expect(model.id_soggetto).toBe('sogg-1');
    expect(model.nome).toBe('Client Test');
    expect(model.indirizzi_ip).toBe('192.168.1.1');
    expect(model.descrizione).toBe('Test description');
  });

  it('should ignore null values in data', () => {
    const data = { nome: null, ambiente: 'produzione' };
    const model = new ClientUpdate(data);
    expect(model.nome).toBeNull(); // keeps default
    expect(model.ambiente).toBe('produzione');
  });

  it('should ignore undefined values in data', () => {
    const data = { nome: undefined, id_soggetto: 'sogg-2' };
    const model = new ClientUpdate(data);
    expect(model.nome).toBeNull(); // keeps default
    expect(model.id_soggetto).toBe('sogg-2');
  });

  it('should ignore extra properties not defined on the class', () => {
    const data = { nome: 'test', nonExistent: 'extra' };
    const model = new ClientUpdate(data);
    expect(model.nome).toBe('test');
    expect((model as any).nonExistent).toBeUndefined();
  });

  it('should not assign optional properties without default values (rate_limiting, finalita)', () => {
    // rate_limiting and finalita are declared without default values (no = initializer)
    // so they don't exist as own properties and won't be assigned by the hasOwnProperty pattern
    const data = { rate_limiting: { quota: 100, periodo: 'giornaliero' }, finalita: 'test purpose' };
    const model = new ClientUpdate(data);
    expect(model.rate_limiting).toBeUndefined();
    expect(model.finalita).toBeUndefined();
  });

  it('should handle empty data object', () => {
    const model = new ClientUpdate({});
    expect(model.dati_specifici).toBeNull();
    expect(model.ambiente).toBeNull();
    expect(model.nome).toBeNull();
  });

  it('should handle no data argument', () => {
    const model = new ClientUpdate();
    expect(model.dati_specifici).toBeNull();
  });

  it('should assign complex dati_specifici object', () => {
    const datiSpec = {
      auth_type: 'pdnd',
      url_redirezione: 'https://example.com/redirect',
      client_id: 'client-abc',
      rate_limiting: { quota: 1000, periodo: 'giornaliero' },
      certificato_autenticazione: {
        tipo_certificato: 'x509',
        cn: 'CN=Test',
        certificato: {
          tipo_documento: 'pem',
          content_type: 'application/x-pem-file',
          content: 'base64content',
          filename: 'cert.pem'
        }
      }
    };
    const model = new ClientUpdate({ dati_specifici: datiSpec });
    expect(model.dati_specifici).toEqual(datiSpec);
    expect(model.dati_specifici!.auth_type).toBe('pdnd');
    expect(model.dati_specifici!.rate_limiting!.quota).toBe(1000);
  });
});
