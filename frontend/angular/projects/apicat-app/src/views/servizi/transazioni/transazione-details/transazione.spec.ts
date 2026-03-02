import { describe, it, expect } from 'vitest';
import { Transazione } from './transazione';

describe('Transazione', () => {
  it('should create with defaults', () => {
    const m = new Transazione();
    expect(m.id_transazione).toBeNull();
    expect(m.nome).toBeNull();
    expect(m.versione).toBeNull();
    expect(m.dominio).toBeNull();
    expect(m.visibilita).toBeNull();
    expect(m.multi_adesione).toBe(false);
    expect(m.gruppo).toBeNull();
    expect(m.descrizione).toBeNull();
    expect(m.descrizione_sintetica).toBeNull();
    expect(m.termini_ricerca).toBeNull();
    expect(m.note).toBeNull();
    expect(m.tags).toEqual([]);
    expect(m.tassonomie).toEqual([]);
    expect(m.allegati).toEqual([]);
    expect(m.stato).toBe('bozza');
    expect(m.utente_richiedente).toBe('');
    expect(m.data_creazione).toBe('');
    expect(m.data_ultima_modifica).toBe('');
    expect(m.utente_ultima_modifica).toBe('');
    expect(m.immagine).toBeNull();
    expect(m.label).toBeNull();
    expect(m.classi).toEqual([]);
  });

  it('should assign data from constructor', () => {
    const m = new Transazione({
      id_transazione: 99,
      nome: 'Transazione Test',
      versione: '2.0',
      dominio: 'dominio-test',
      visibilita: 'privata',
      multi_adesione: true,
      gruppo: 'gruppo-test',
      descrizione: 'Descrizione transazione',
      descrizione_sintetica: 'Breve',
      termini_ricerca: 'ricerca test',
      note: 'Note di test',
      tags: ['tag1', 'tag2'],
      tassonomie: [{ id: 1 }],
      allegati: [{ nome: 'allegato.pdf' }],
      stato: 'pubblicato',
      utente_richiedente: 'utente1',
      data_creazione: '2026-01-15',
      data_ultima_modifica: '2026-02-20',
      utente_ultima_modifica: 'utente2',
      immagine: { url: 'img.png' },
      label: 'Etichetta transazione',
      classi: [{ id: 'c1' }, { id: 'c2' }],
    });
    expect(m.id_transazione).toBe(99);
    expect(m.nome).toBe('Transazione Test');
    expect(m.versione).toBe('2.0');
    expect(m.dominio).toBe('dominio-test');
    expect(m.visibilita).toBe('privata');
    expect(m.multi_adesione).toBe(true);
    expect(m.gruppo).toBe('gruppo-test');
    expect(m.descrizione).toBe('Descrizione transazione');
    expect(m.descrizione_sintetica).toBe('Breve');
    expect(m.termini_ricerca).toBe('ricerca test');
    expect(m.note).toBe('Note di test');
    expect(m.tags).toEqual(['tag1', 'tag2']);
    expect(m.tassonomie).toEqual([{ id: 1 }]);
    expect(m.allegati).toEqual([{ nome: 'allegato.pdf' }]);
    expect(m.stato).toBe('pubblicato');
    expect(m.utente_richiedente).toBe('utente1');
    expect(m.data_creazione).toBe('2026-01-15');
    expect(m.data_ultima_modifica).toBe('2026-02-20');
    expect(m.utente_ultima_modifica).toBe('utente2');
    expect(m.immagine).toEqual({ url: 'img.png' });
    expect(m.label).toBe('Etichetta transazione');
    expect(m.classi).toEqual([{ id: 'c1' }, { id: 'c2' }]);
  });

  it('should not overwrite defaults with null or undefined values', () => {
    const m = new Transazione({ nome: null, stato: undefined });
    expect(m.nome).toBeNull();
    expect(m.stato).toBe('bozza');
  });

  it('should ignore unknown keys', () => {
    const m = new Transazione({ unknown: 'val', extra_field: 123 });
    expect((m as any).unknown).toBeUndefined();
    expect((m as any).extra_field).toBeUndefined();
  });

  it('should handle empty constructor argument', () => {
    const m = new Transazione({});
    expect(m.id_transazione).toBeNull();
    expect(m.stato).toBe('bozza');
  });
});
