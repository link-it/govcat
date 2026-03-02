import { describe, it, expect } from 'vitest';
import { Servizio } from './servizio';

describe('Servizio', () => {
  it('should create with defaults', () => {
    const m = new Servizio();
    expect(m.id_servizio).toBeNull();
    expect(m.nome).toBeNull();
    expect(m.versione).toBeNull();
    expect(m.id_dominio).toBeNull();
    expect(m.visibilita).toBeNull();
    expect(m.multi_adesione).toBe(false);
    expect(m.eliminabile).toBe(false);
    expect(m.id_gruppo).toBeNull();
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
    expect(m.gruppo).toBeNull();
    expect(m.dominio).toBeNull();
    expect(m.adesione_disabilitata).toBe(false);
    expect(m.id_organizzazione_interna).toBeNull();
    expect(m.id_soggetto_interno).toBeNull();
    expect(m.soggetto_interno).toBeNull();
    expect(m.package).toBe(false);
    expect(m.tipo).toBe('API');
    expect(m.skip_collaudo).toBe(false);
    expect(m.vincola_skip_collaudo).toBe(false);
    expect(m.fruizione).toBe(false);
  });

  it('should assign data from constructor', () => {
    const m = new Servizio({
      id_servizio: 'srv-001',
      nome: 'Test Servizio',
      versione: '1.0',
      id_dominio: 'dom-001',
      visibilita: 'pubblica',
      multi_adesione: true,
      eliminabile: true,
      id_gruppo: 'grp-001',
      descrizione: 'Una descrizione',
      descrizione_sintetica: 'Breve',
      termini_ricerca: 'term1 term2',
      note: 'Nota di test',
      tags: ['tag1', 'tag2'],
      tassonomie: [{ id: 1 }],
      allegati: [{ nome: 'file.pdf' }],
      stato: 'pubblicato',
      utente_richiedente: 'utente1',
      data_creazione: '2026-01-01',
      data_ultima_modifica: '2026-02-01',
      utente_ultima_modifica: 'utente2',
      immagine: { url: 'img.png' },
      label: 'Etichetta',
      classi: [{ id: 'c1' }],
      gruppo: { id: 'g1' },
      dominio: { id: 'd1' },
      adesione_disabilitata: true,
      id_organizzazione_interna: 42,
      id_soggetto_interno: 7,
      soggetto_interno: { nome: 'Sogg' },
      package: true,
      tipo: 'Generico',
      skip_collaudo: true,
      vincola_skip_collaudo: true,
      fruizione: true,
    });
    expect(m.id_servizio).toBe('srv-001');
    expect(m.nome).toBe('Test Servizio');
    expect(m.versione).toBe('1.0');
    expect(m.id_dominio).toBe('dom-001');
    expect(m.visibilita).toBe('pubblica');
    expect(m.multi_adesione).toBe(true);
    expect(m.eliminabile).toBe(true);
    expect(m.id_gruppo).toBe('grp-001');
    expect(m.descrizione).toBe('Una descrizione');
    expect(m.descrizione_sintetica).toBe('Breve');
    expect(m.termini_ricerca).toBe('term1 term2');
    expect(m.note).toBe('Nota di test');
    expect(m.tags).toEqual(['tag1', 'tag2']);
    expect(m.tassonomie).toEqual([{ id: 1 }]);
    expect(m.allegati).toEqual([{ nome: 'file.pdf' }]);
    expect(m.stato).toBe('pubblicato');
    expect(m.utente_richiedente).toBe('utente1');
    expect(m.data_creazione).toBe('2026-01-01');
    expect(m.data_ultima_modifica).toBe('2026-02-01');
    expect(m.utente_ultima_modifica).toBe('utente2');
    expect(m.immagine).toEqual({ url: 'img.png' });
    expect(m.label).toBe('Etichetta');
    expect(m.classi).toEqual([{ id: 'c1' }]);
    expect(m.gruppo).toEqual({ id: 'g1' });
    expect(m.dominio).toEqual({ id: 'd1' });
    expect(m.adesione_disabilitata).toBe(true);
    expect(m.id_organizzazione_interna).toBe(42);
    expect(m.id_soggetto_interno).toBe(7);
    expect(m.soggetto_interno).toEqual({ nome: 'Sogg' });
    expect(m.package).toBe(true);
    expect(m.tipo).toBe('Generico');
    expect(m.skip_collaudo).toBe(true);
    expect(m.vincola_skip_collaudo).toBe(true);
    expect(m.fruizione).toBe(true);
  });

  it('should not overwrite defaults with null or undefined values', () => {
    const m = new Servizio({ nome: null, stato: undefined });
    expect(m.nome).toBeNull();
    expect(m.stato).toBe('bozza');
  });

  it('should ignore unknown keys', () => {
    const m = new Servizio({ unknown: 'val', extra_field: 123 });
    expect((m as any).unknown).toBeUndefined();
    expect((m as any).extra_field).toBeUndefined();
  });

  it('should handle empty constructor argument', () => {
    const m = new Servizio({});
    expect(m.id_servizio).toBeNull();
    expect(m.stato).toBe('bozza');
  });
});
