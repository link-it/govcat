import { describe, it, expect, beforeEach } from 'vitest';
import { Taxonomy } from './taxonomy';

describe('Taxonomy', () => {

  it('should create an instance with default values', () => {
    const model = new Taxonomy();
    expect(model).toBeTruthy();
    expect(model.id_tassonomia).toBeNull();
    expect(model.nome).toBeNull();
    expect(model.descrizione).toBeNull();
    expect(model.visibile).toBe(false);
    expect(model.obbligatorio).toBe(false);
  });

  it('should assign properties from data using hasOwnProperty pattern', () => {
    const data = {
      id_tassonomia: 'tax-1',
      nome: 'Tassonomia Test',
      descrizione: 'Descrizione tassonomia',
      visibile: true,
      obbligatorio: true
    };
    const model = new Taxonomy(data);
    expect(model.id_tassonomia).toBe('tax-1');
    expect(model.nome).toBe('Tassonomia Test');
    expect(model.descrizione).toBe('Descrizione tassonomia');
    expect(model.visibile).toBe(true);
    expect(model.obbligatorio).toBe(true);
  });

  it('should not assign optional properties without default values (immagine, categorie)', () => {
    // immagine and categorie are declared without default values
    // so they don't exist as own properties and won't be assigned by the hasOwnProperty pattern
    const data = {
      immagine: 'base64image',
      categorie: [{ id_tassonomia: 'tax-1', id_categoria: 'cat-1', nome: 'Cat', nome_tassonomia: 'Tax' }]
    };
    const model = new Taxonomy(data);
    expect(model.immagine).toBeUndefined();
    expect(model.categorie).toBeUndefined();
  });

  it('should ignore null values in data (keeps default)', () => {
    const data = { nome: null, visibile: true };
    const model = new Taxonomy(data);
    expect(model.nome).toBeNull(); // default is null, null skipped, so stays null
    expect(model.visibile).toBe(true);
  });

  it('should ignore undefined values in data', () => {
    const data = { nome: undefined, obbligatorio: true };
    const model = new Taxonomy(data);
    expect(model.nome).toBeNull();
    expect(model.obbligatorio).toBe(true);
  });

  it('should ignore extra properties not defined on the class', () => {
    const data = { nome: 'test', extraProp: 'extra' };
    const model = new Taxonomy(data);
    expect(model.nome).toBe('test');
    expect((model as any).extraProp).toBeUndefined();
  });

  it('should handle empty data object', () => {
    const model = new Taxonomy({});
    expect(model.id_tassonomia).toBeNull();
    expect(model.visibile).toBe(false);
  });

  it('should handle no data argument', () => {
    const model = new Taxonomy();
    expect(model.id_tassonomia).toBeNull();
  });

  it('should accept partial data and keep remaining defaults', () => {
    const data = { nome: 'Partial', visibile: true };
    const model = new Taxonomy(data);
    expect(model.nome).toBe('Partial');
    expect(model.visibile).toBe(true);
    expect(model.id_tassonomia).toBeNull();
    expect(model.obbligatorio).toBe(false);
  });
});
