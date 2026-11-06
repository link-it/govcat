import { describe, it, expect } from 'vitest';
import { nomeUtente, risorsaStoricoStati, storicoStatiAttivo, storicoStatiMock, storicoStatiMockAttivo } from './storico-stati';

describe('storico-stati', () => {
  const workflow = {
    cambi_stato: [
      { stato_attuale: 'bozza', stato_successivo: { nome: 'richiesto_collaudo' } },
      { stato_attuale: 'richiesto_collaudo', stato_successivo: { nome: 'autorizzato_collaudo' } },
      { stato_attuale: 'autorizzato_collaudo', stato_successivo: { nome: 'pubblicato_collaudo' } }
    ]
  };
  const adesso = new Date('2026-11-06T10:00:00.000Z');

  it('should read the configuration flags', () => {
    expect(storicoStatiAttivo({ AppConfig: { Workflow: { showStatusHistory: true } } })).toBe(true);
    expect(storicoStatiAttivo({ AppConfig: {} })).toBe(false);
    expect(storicoStatiMockAttivo({ AppConfig: { Workflow: { statusHistoryMock: true } } })).toBe(true);
    expect(storicoStatiMockAttivo(null)).toBe(false);
  });

  it('should resolve the resource of the module', () => {
    expect(risorsaStoricoStati('servizio', { id_servizio: 's1' })).toEqual({ model: 'servizi', id: 's1' });
    expect(risorsaStoricoStati('adesione', { id_adesione: 'a1' })).toEqual({ model: 'adesioni', id: 'a1' });
    expect(risorsaStoricoStati('adesione', { id_servizio: 's1' })).toBeNull();
  });

  it('should compose the user name', () => {
    expect(nomeUtente({ nome: 'Paolo', cognome: 'Rossi' })).toBe('Paolo Rossi');
    expect(nomeUtente(null)).toBe('');
  });

  it('should build the mock history from the creation to the current status, newest first', () => {
    const storico = storicoStatiMock('autorizzato_collaudo', workflow, null, adesso);
    expect(storico.map((v) => [v.stato_precedente, v.stato])).toEqual([
      ['richiesto_collaudo', 'autorizzato_collaudo'],
      ['bozza', 'richiesto_collaudo'],
      [null, 'bozza']
    ]);
    expect(storico[0].data).toBe(adesso.toISOString());
    expect(storico.every((v, i) => i === 0 || v.data < storico[i - 1].data)).toBe(true);
    expect(storico.every((v) => !!v.utente?.nome)).toBe(true);
  });

  it('should end an archived history with the archiving after the previous status', () => {
    const storico = storicoStatiMock('archiviato', workflow, 'richiesto_collaudo', adesso);
    expect(storico.map((v) => v.stato)).toEqual(['archiviato', 'richiesto_collaudo', 'bozza']);
    expect(storico[0].stato_precedente).toBe('richiesto_collaudo');
  });

  it('should add the current status when it is not on the main path', () => {
    const storico = storicoStatiMock('pubblicato_produzione', workflow, null, adesso);
    expect(storico[0]).toEqual(expect.objectContaining({ stato_precedente: 'pubblicato_collaudo', stato: 'pubblicato_produzione' }));
  });
});
