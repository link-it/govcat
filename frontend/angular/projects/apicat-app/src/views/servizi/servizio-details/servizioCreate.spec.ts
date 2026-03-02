import { describe, it, expect } from 'vitest';
import { ServizioCreate } from './servizioCreate';

describe('ServizioCreate', () => {
  it('should create with defaults', () => {
    const m = new ServizioCreate();
    expect(m.nome).toBe('');
    expect(m.versione).toBe('');
    expect(m.id_dominio).toBe('');
    expect(m.id_gruppo).toBe('');
    expect(m.referenti).toEqual([]);
    expect(m.descrizione).toBe('');
    expect(m.descrizione_sintetica).toBe('');
    expect(m.immagine).toBeNull();
    expect(m.tags).toBeNull();
    expect(m.visibilita).toBeNull();
    expect(m.tassonomie).toBeNull();
    expect(m.termini_ricerca).toBeNull();
    expect(m.note).toBeNull();
    expect(m.multi_adesione).toBe(false);
    expect(m.referente).toBe('');
    expect(m.referente_tecnico).toBe('');
    expect(m.classi).toEqual([]);
    expect(m.dominio).toBeNull();
    expect(m.gruppo).toBeNull();
    expect(m.stato).toBe('bozza');
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
    const m = new ServizioCreate({
      nome: 'Nuovo Servizio',
      versione: '2.0',
      id_dominio: 'dom-002',
      id_gruppo: 'grp-002',
      referenti: [{ id: 'ref1' }],
      descrizione: 'Descrizione completa',
      descrizione_sintetica: 'Breve descrizione',
      immagine: { filename: 'logo.png' },
      tags: ['api', 'rest'],
      visibilita: 'pubblica',
      tassonomie: [{ id: 't1' }],
      termini_ricerca: 'cerca questo',
      note: 'Note importanti',
      multi_adesione: true,
      referente: 'mario.rossi',
      referente_tecnico: 'tech.user',
      classi: [{ nome: 'classe1' }],
      dominio: { nome: 'Dominio Test' },
      gruppo: { nome: 'Gruppo Test' },
      stato: 'pubblicato',
      adesione_disabilitata: true,
      id_organizzazione_interna: 10,
      id_soggetto_interno: 20,
      soggetto_interno: { nome: 'Soggetto' },
      package: true,
      tipo: 'Generico',
      skip_collaudo: true,
      vincola_skip_collaudo: true,
      fruizione: true,
    });
    expect(m.nome).toBe('Nuovo Servizio');
    expect(m.versione).toBe('2.0');
    expect(m.id_dominio).toBe('dom-002');
    expect(m.id_gruppo).toBe('grp-002');
    expect(m.referenti).toEqual([{ id: 'ref1' }]);
    expect(m.descrizione).toBe('Descrizione completa');
    expect(m.descrizione_sintetica).toBe('Breve descrizione');
    expect(m.immagine).toEqual({ filename: 'logo.png' });
    expect(m.tags).toEqual(['api', 'rest']);
    expect(m.visibilita).toBe('pubblica');
    expect(m.tassonomie).toEqual([{ id: 't1' }]);
    expect(m.termini_ricerca).toBe('cerca questo');
    expect(m.note).toBe('Note importanti');
    expect(m.multi_adesione).toBe(true);
    expect(m.referente).toBe('mario.rossi');
    expect(m.referente_tecnico).toBe('tech.user');
    expect(m.classi).toEqual([{ nome: 'classe1' }]);
    expect(m.dominio).toEqual({ nome: 'Dominio Test' });
    expect(m.gruppo).toEqual({ nome: 'Gruppo Test' });
    expect(m.stato).toBe('pubblicato');
    expect(m.adesione_disabilitata).toBe(true);
    expect(m.id_organizzazione_interna).toBe(10);
    expect(m.id_soggetto_interno).toBe(20);
    expect(m.soggetto_interno).toEqual({ nome: 'Soggetto' });
    expect(m.package).toBe(true);
    expect(m.tipo).toBe('Generico');
    expect(m.skip_collaudo).toBe(true);
    expect(m.vincola_skip_collaudo).toBe(true);
    expect(m.fruizione).toBe(true);
  });

  it('should not overwrite defaults with null or undefined values', () => {
    const m = new ServizioCreate({ nome: null, stato: undefined });
    expect(m.nome).toBe('');
    expect(m.stato).toBe('bozza');
  });

  it('should ignore unknown keys', () => {
    const m = new ServizioCreate({ unknown: 'val', extra_field: 123 });
    expect((m as any).unknown).toBeUndefined();
    expect((m as any).extra_field).toBeUndefined();
  });

  it('should handle empty constructor argument', () => {
    const m = new ServizioCreate({});
    expect(m.nome).toBe('');
    expect(m.stato).toBe('bozza');
  });
});
