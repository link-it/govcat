import { describe, it, expect, beforeEach } from 'vitest';
import { SoggettoCreate } from './soggettoCreate';

describe('SoggettoCreate', () => {

  it('should create an instance with default values', () => {
    const model = new SoggettoCreate();
    expect(model).toBeTruthy();
    expect(model.id_soggetto).toBe('');
    expect(model.aderente).toBe(false);
    expect(model.referente).toBe(false);
    expect(model.nome).toBe('');
    expect(model.id_organizzazione).toBe('');
    expect(model.organizzazione).toEqual({ id_organizzazione: '', nome: '' });
    expect(model.descrizione).toBe('');
    expect(model.nome_gateway).toBeNull();
    expect(model.tipo_gateway).toBeNull();
    expect(model.url_invocazione).toBeNull();
    expect(model.url_prefix_collaudo).toBeNull();
    expect(model.url_prefix_produzione).toBeNull();
    expect(model.skip_collaudo).toBe(false);
    expect(model.vincola_skip_collaudo).toBe(false);
  });

  it('should assign properties from data using hasOwnProperty pattern', () => {
    const data = {
      id_soggetto: 'sogg-1',
      aderente: true,
      referente: true,
      nome: 'Soggetto Test',
      id_organizzazione: 'org-1',
      organizzazione: { id_organizzazione: 'org-1', nome: 'Org Test' },
      descrizione: 'Descrizione test',
      nome_gateway: 'GW1',
      tipo_gateway: 'ModIPA',
      url_invocazione: 'https://gw.example.com',
      url_prefix_collaudo: 'https://coll.example.com',
      url_prefix_produzione: 'https://prod.example.com',
      skip_collaudo: true,
      vincola_skip_collaudo: true
    };
    const model = new SoggettoCreate(data);
    expect(model.id_soggetto).toBe('sogg-1');
    expect(model.aderente).toBe(true);
    expect(model.referente).toBe(true);
    expect(model.nome).toBe('Soggetto Test');
    expect(model.id_organizzazione).toBe('org-1');
    expect(model.organizzazione).toEqual({ id_organizzazione: 'org-1', nome: 'Org Test' });
    expect(model.descrizione).toBe('Descrizione test');
    expect(model.nome_gateway).toBe('GW1');
    expect(model.tipo_gateway).toBe('ModIPA');
    expect(model.url_invocazione).toBe('https://gw.example.com');
    expect(model.url_prefix_collaudo).toBe('https://coll.example.com');
    expect(model.url_prefix_produzione).toBe('https://prod.example.com');
    expect(model.skip_collaudo).toBe(true);
    expect(model.vincola_skip_collaudo).toBe(true);
  });

  it('should ignore null values in data (keeps defaults)', () => {
    const data = { nome: null, id_soggetto: 'sogg-2' };
    const model = new SoggettoCreate(data);
    expect(model.nome).toBe(''); // keeps default empty string
    expect(model.id_soggetto).toBe('sogg-2');
  });

  it('should ignore undefined values in data', () => {
    const data = { nome: undefined, aderente: true };
    const model = new SoggettoCreate(data);
    expect(model.nome).toBe(''); // keeps default
    expect(model.aderente).toBe(true);
  });

  it('should ignore extra properties not defined on the class', () => {
    const data = { nome: 'test', nonExistent: 'extra' };
    const model = new SoggettoCreate(data);
    expect(model.nome).toBe('test');
    expect((model as any).nonExistent).toBeUndefined();
  });

  it('should handle empty data object', () => {
    const model = new SoggettoCreate({});
    expect(model.id_soggetto).toBe('');
    expect(model.aderente).toBe(false);
    expect(model.organizzazione).toEqual({ id_organizzazione: '', nome: '' });
  });

  it('should handle no data argument', () => {
    const model = new SoggettoCreate();
    expect(model.id_soggetto).toBe('');
  });

  it('should accept partial data and keep remaining defaults', () => {
    const data = { nome: 'Partial', skip_collaudo: true };
    const model = new SoggettoCreate(data);
    expect(model.nome).toBe('Partial');
    expect(model.skip_collaudo).toBe(true);
    expect(model.aderente).toBe(false);
    expect(model.id_organizzazione).toBe('');
  });
});
