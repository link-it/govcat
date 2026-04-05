import { describe, it, expect } from 'vitest';
import { Client, PeriodEnum } from './client';

describe('Client', () => {
  it('should create with defaults', () => {
    const c = new Client();
    expect(c.id_client).toBeNull();
    expect(c.nome).toBeNull();
    expect(c.auth_type).toBeNull();
    expect(c.stato).toBeNull();
    expect(c.ambiente).toBeNull();
    expect(c.tipo_certificato).toEqual([]);
    expect(c.tipo_certificato_firma).toEqual([]);
    expect(c.utilizzato_in_adesioni_configurate).toBe(false);
    expect(c.soggetto).toBeNull();
    expect(c.rate_limiting).toBeNull();
    expect(c.dati_specifici).toBeNull();
  });

  it('should assign data from constructor', () => {
    const c = new Client({
      id_client: 'cl-1',
      nome: 'Test Client',
      auth_type: 'https',
      stato: 'nuovo',
      ambiente: 'collaudo',
    });
    expect(c.id_client).toBe('cl-1');
    expect(c.nome).toBe('Test Client');
    expect(c.auth_type).toBe('https');
    expect(c.stato).toBe('nuovo');
    expect(c.ambiente).toBe('collaudo');
  });

  it('should assign soggetto', () => {
    const soggetto = {
      id_soggetto: 'sog-1',
      nome: 'Soggetto',
      aderente: true,
      organizzazione: { id_organizzazione: 'org-1', nome: 'Org' },
    };
    const c = new Client({ soggetto });
    expect(c.soggetto).toEqual(soggetto);
  });

  it('should assign rate_limiting', () => {
    const c = new Client({
      rate_limiting: { quota: 100, periodo: PeriodEnum.Ora },
    });
    expect(c.rate_limiting?.quota).toBe(100);
    expect(c.rate_limiting?.periodo).toBe('ora');
  });

  it('should assign certificate fields', () => {
    const c = new Client({
      cn: 'CN=test',
      cert_fornito_filename: 'cert.pem',
      cert_fornito_uuid: 'uuid-1',
      csr_richiesta_filename: 'csr.pem',
    });
    expect(c.cn).toBe('CN=test');
    expect(c.cert_fornito_filename).toBe('cert.pem');
    expect(c.cert_fornito_uuid).toBe('uuid-1');
    expect(c.csr_richiesta_filename).toBe('csr.pem');
  });

  it('should assign OAuth fields', () => {
    const c = new Client({
      client_id: 'my-client-id',
      username: 'user1',
      url_redirezione: 'https://redirect.example.com',
      url_esposizione: 'https://expose.example.com',
    });
    expect(c.client_id).toBe('my-client-id');
    expect(c.username).toBe('user1');
    expect(c.url_redirezione).toBe('https://redirect.example.com');
  });

  it('should ignore null and undefined values', () => {
    const c = new Client({ nome: null, stato: undefined });
    expect(c.nome).toBeNull();
    expect(c.stato).toBeNull();
  });

  it('should ignore unknown keys', () => {
    const c = new Client({ unknown_field: 'test' });
    expect((c as any).unknown_field).toBeUndefined();
  });
});

describe('PeriodEnum', () => {
  it('should have correct values', () => {
    expect(PeriodEnum.Giorno).toBe('giorno');
    expect(PeriodEnum.Ora).toBe('ora');
    expect(PeriodEnum.Minuti).toBe('minuti');
  });
});
