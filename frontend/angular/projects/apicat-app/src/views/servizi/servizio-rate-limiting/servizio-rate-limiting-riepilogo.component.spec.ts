import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { ServizioRateLimitingRiepilogoComponent } from './servizio-rate-limiting-riepilogo.component';

describe('ServizioRateLimitingRiepilogoComponent (Issue #402)', () => {
  let component: ServizioRateLimitingRiepilogoComponent;
  let mockApi: any;

  const riepilogo = {
    api: [
      {
        id_api: 'a1', nome: 'API 1', versione: 1,
        collaudo: [
          { periodo: 'ora', quota: 20, quota_assegnata: 0, quota_residua: 20, numero_fruitori: 0, superata: false },
          { periodo: 'giorno', quota: 300, quota_assegnata: 250, quota_residua: 50, numero_fruitori: 2, superata: false }
        ],
        produzione: []
      },
      { id_api: 'a2', nome: 'API 2', versione: 1, collaudo: [], produzione: [] }
    ]
  };

  const fruitore = { id_adesione: 'ad1', soggetto: { nome: 'Ente 1' }, stato: 'bozza', rate_limiting: [{ id_api: 'a1', quota: 100, periodo: 'giorno' }] } as any;

  const avvia = (ruoli: string[]) => {
    component.idServizio = 's1';
    component.ambiente = 'collaudo';
    component.ruoli = ruoli;
    component.ngOnChanges({ idServizio: new SimpleChange(null, 's1', true) });
  };

  beforeEach(() => {
    mockApi = { getDetails: vi.fn(() => of(riepilogo)) };
    component = new ServizioRateLimitingRiepilogoComponent(mockApi);
  });

  it('should not load anything for users who do not manage the service', () => {
    avvia(['aderente']);
    expect(component._visibile).toBe(false);
    expect(mockApi.getDetails).not.toHaveBeenCalled();
  });

  it('should show only the APIs with quotas in the environment, sorted by period, the first one selected', () => {
    avvia(['referente']);
    expect(component._api.map((a) => a.id_api)).toEqual(['a1']);
    expect(component._colonne.map((c) => c.chiave)).toEqual(['a1|giorno', 'a1|ora']);
    expect(component._tabs).toEqual([{ key: 'a1', label: 'API 1 v1', badge: undefined }]);
  });

  it('should recompute assigned and remaining quota with the quotas being edited', () => {
    avvia(['gestore']);
    const giorno = component._colonne[0];
    component._onModifica({ fruitore, valori: { 'a1|giorno': 200, 'a1|ora': null } });
    expect(component._assegnata(giorno)).toBe(350);
    expect(component._residua(giorno)).toBe(-50);
    expect(component._superata(giorno)).toBe(true);
    component._onModifica(null);
    expect(component._superata(giorno)).toBe(false);
  });

  it('should handle the periods with the maximum per consumer only, without remaining quota', () => {
    mockApi.getDetails.mockReturnValue(of({
      api: [{ id_api: 'a1', nome: 'API 1', versione: 1, collaudo: [{ periodo: 'giorno', quota_fruitore: 120, quota_assegnata: 250, numero_fruitori: 2, superata: false }], produzione: [] }]
    }));
    avvia(['gestore']);
    const colonna = component._colonne[0];
    expect(component._residua(colonna)).toBeNull();
    expect(component._superata(colonna)).toBe(false);
  });

  it('should show sample data with a tab per API, recomputing the summary after a local save', () => {
    component.mock = true;
    avvia(['gestore']);
    expect(component._api.map((a) => a.id_api)).toEqual(['a1', 'a2', 'mock-api-3']);
    expect(component._fruitoriMock).toHaveLength(45);
    component.seleziona('a2');
    expect(component._colonne[0]).toMatchObject({ quota: 5000, quota_assegnata: 4875, superata: false });
    component._fruitoriMock![0].rate_limiting = component._fruitoriMock![0].rate_limiting
      .map((q) => q.id_api === 'a2' ? { ...q, quota: 2000 } : q);
    component.carica();
    expect(component._apiSelezionata?.id_api).toBe('a2');
    expect(component._colonne[0]).toMatchObject({ quota_assegnata: 5625, quota_residua: -625, superata: true });
    expect(component._tabs[1].badge).toMatchObject({ tone: 'warning' });
  });

  it('should forget the editing when changing API', () => {
    component.mock = true;
    avvia(['gestore']);
    component._onModifica({ fruitore, valori: { 'a1|giorno': 200 } });
    component.seleziona('a2');
    expect(component._modifica).toBeNull();
  });
});
