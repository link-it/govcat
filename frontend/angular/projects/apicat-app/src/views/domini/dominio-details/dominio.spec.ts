import { describe, it, expect } from 'vitest';
import { Dominio } from './dominio';

describe('Dominio', () => {
  it('should create with defaults', () => {
    const d = new Dominio();
    expect(d.id_dominio).toBeNull();
    expect(d.nome).toBeNull();
    expect(d.visibilita).toBeNull();
    expect(d.soggetto_referente).toBeNull();
    expect(d.descrizione).toBeNull();
    expect(d.classi).toEqual([]);
    expect(d.tag).toBeNull();
    expect(d.deprecato).toBe(false);
    expect(d.url_invocazione).toBeNull();
    expect(d.url_prefix_collaudo).toBeNull();
    expect(d.url_prefix_produzione).toBeNull();
    expect(d.skip_collaudo).toBe(false);
    expect(d.vincola_skip_collaudo).toBe(false);
  });

  it('should assign data from constructor', () => {
    const d = new Dominio({
      id_dominio: 'dom-1',
      nome: 'Test Dominio',
      visibilita: 'pubblico',
      descrizione: 'Desc',
      deprecato: true,
      skip_collaudo: true,
    });
    expect(d.id_dominio).toBe('dom-1');
    expect(d.nome).toBe('Test Dominio');
    expect(d.visibilita).toBe('pubblico');
    expect(d.descrizione).toBe('Desc');
    expect(d.deprecato).toBe(true);
    expect(d.skip_collaudo).toBe(true);
  });

  it('should assign soggetto_referente', () => {
    const soggetto = {
      aderente: true,
      id_soggetto: 'sog-1',
      nome: 'Soggetto Test',
      organizzazione: { id_organizzazione: 'org-1', nome: 'Org' },
      referente: false,
    };
    const d = new Dominio({ soggetto_referente: soggetto });
    expect(d.soggetto_referente).toEqual(soggetto);
  });

  it('should ignore null and undefined values', () => {
    const d = new Dominio({ nome: null, descrizione: undefined });
    expect(d.nome).toBeNull();
    expect(d.descrizione).toBeNull();
  });

  it('should ignore unknown keys', () => {
    const d = new Dominio({ unknown_key: 'value' });
    expect((d as any).unknown_key).toBeUndefined();
  });

  it('should assign classi array', () => {
    const d = new Dominio({ classi: [{ id: 1 }, { id: 2 }] });
    expect(d.classi).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('should assign url fields', () => {
    const d = new Dominio({
      url_invocazione: 'https://example.com',
      url_prefix_collaudo: '/test',
      url_prefix_produzione: '/prod',
    });
    expect(d.url_invocazione).toBe('https://example.com');
    expect(d.url_prefix_collaudo).toBe('/test');
    expect(d.url_prefix_produzione).toBe('/prod');
  });
});
