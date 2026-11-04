import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Subject, of, throwError } from 'rxjs';
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

  const fruitori = {
    content: [
      { id_adesione: 'ad1', id_logico: 'L1', soggetto: { nome: 'Ente 1' }, stato: 'bozza', rate_limiting: [{ id_api: 'a1', quota: 100, periodo: 'giorno' }, { id_api: 'x9', quota: 7, periodo: 'minuto' }] },
      { id_adesione: 'ad2', soggetto: { nome: 'Ente 2' }, stato: 'bozza', rate_limiting: [{ id_api: 'a1', quota: 150, periodo: 'giorno' }] }
    ],
    page: { totalElements: 3 }
  };

  const avvia = (ruoli: string[]) => {
    component.idServizio = 's1';
    component.ambiente = 'collaudo';
    component.ruoli = ruoli;
    component.ngOnChanges({ idServizio: new SimpleChange(null, 's1', true) });
  };

  beforeEach(() => {
    mockApi = {
      getDetails: vi.fn((_m: string, _id: string, sub?: string) => of(sub === 'rate-limiting' ? riepilogo : fruitori)),
      putElementRelated: vi.fn((_m: string, _id: string, _p: string, body: any) => of(body))
    };
    component = new ServizioRateLimitingRiepilogoComponent(mockApi, { _queryToHttpParams: (q: any) => q, GetErrorMsg: () => 'Errore' } as any);
  });

  it('should not load anything for users who do not manage the service', () => {
    avvia(['aderente']);
    expect(component._visibile).toBe(false);
    expect(mockApi.getDetails).not.toHaveBeenCalled();
  });

  it('should list the quotas of the environment sorted by period, and the consumers', () => {
    avvia(['referente']);
    expect(component._colonne.map((c) => c.chiave)).toEqual(['a1|giorno', 'a1|ora']);
    expect(mockApi.getDetails).toHaveBeenCalledWith('servizi', 's1', 'rate-limiting/fruitori', { params: { ambiente: 'collaudo', page: 0, size: 20 } });
    expect(component._fruitori.length).toBe(2);
    expect(component._altriFruitori).toBe(true);
    expect(component._quota(component._fruitori[0], component._colonne[0])).toBe(100);
  });

  it('should ignore the responses of a superseded load', () => {
    const lenti: any[] = [];
    mockApi.getDetails = vi.fn((_m: string, _id: string, sub?: string) => {
      if (sub === 'rate-limiting') { return of(riepilogo); }
      const s$ = new Subject<any>(); lenti.push(s$); return s$;
    });
    avvia(['gestore']);
    component.carica();
    lenti.forEach((s$) => { s$.next(fruitori); s$.complete(); });
    expect(component._fruitori.length).toBe(2);
  });

  it('should recompute assigned and remaining quota while editing', () => {
    avvia(['gestore']);
    const giorno = component._colonne[0];
    component.modifica(component._fruitori[0]);
    component._formGroup.get('a1|giorno')?.setValue(200);
    expect(component._assegnata(giorno)).toBe(350);
    expect(component._residua(giorno)).toBe(-50);
    expect(component._superata(giorno)).toBe(true);
    component.annulla();
    expect(component._superata(giorno)).toBe(false);
  });

  it('should send the full list of the consumer, keeping the quotas not shown', () => {
    avvia(['gestore']);
    component.modifica(component._fruitori[0]);
    component._formGroup.get('a1|ora')?.setValue(5);
    component.salva(component._fruitori[0]);
    expect(mockApi.putElementRelated).toHaveBeenCalledWith('adesioni', 'ad1', 'collaudo/rate-limiting', {
      rate_limiting: [
        { id_api: 'x9', quota: 7, periodo: 'minuto' },
        { id_api: 'a1', quota: 100, periodo: 'giorno' },
        { id_api: 'a1', quota: 5, periodo: 'ora' }
      ]
    });
    expect(component._inModifica).toBeNull();
  });

  it('should handle the periods with the maximum per consumer only, without remaining quota', () => {
    const soloFruitore = {
      api: [{
        id_api: 'a1', nome: 'API 1', versione: 1,
        collaudo: [{ periodo: 'giorno', quota_fruitore: 120, quota_assegnata: 250, numero_fruitori: 2, superata: false }],
        produzione: []
      }]
    };
    mockApi.getDetails.mockImplementation((_m: string, _id: string, sub?: string) => of(sub === 'rate-limiting' ? soloFruitore : fruitori));
    avvia(['gestore']);
    const colonna = component._colonne[0];
    expect(component._residua(colonna)).toBeNull();
    expect(component._superata(colonna)).toBe(false);
    component.modifica(component._fruitori[0]);
    component._formGroup.get('a1|giorno')?.setValue(130);
    expect(component._formGroup.invalid).toBe(true);
    component._formGroup.get('a1|giorno')?.setValue(120);
    expect(component._formGroup.valid).toBe(true);
    expect(component._superata(colonna)).toBe(false);
  });

  it('should show only the APIs with quotas in the environment, the first one selected', () => {
    avvia(['gestore']);
    expect(component._api.map((a) => a.id_api)).toEqual(['a1']);
    expect(component._apiSelezionata?.id_api).toBe('a1');
    expect(component._tabs).toEqual([{ key: 'a1', label: 'API 1 v1', badge: undefined }]);
  });

  it('should show sample data with a tab per API, saving the consumer quotas locally', () => {
    vi.useFakeTimers();
    component.mock = true;
    avvia(['gestore']);
    vi.advanceTimersByTime(300);
    expect(component._api.map((a) => a.id_api)).toEqual(['a1', 'a2', 'mock-api-3']);
    expect(component._tabs[0].badge).toBeUndefined();
    expect(component._fruitori).toHaveLength(20);
    expect(component._totaleFruitori).toBe(45);
    expect(component._colonne.map((c) => c.chiave)).toEqual(['a1|giorno', 'a1|ora']);

    component.seleziona('a2');
    expect(component._colonne.map((c) => c.chiave)).toEqual(['a2|giorno']);
    expect(component._colonne[0]).toMatchObject({ quota: 5000, quota_assegnata: 4875, superata: false });
    const fruitore = component._fruitori[0];
    component.modifica(fruitore);
    expect(Object.keys(component._formGroup.controls)).toEqual(['a2|giorno']);
    component._formGroup.get('a2|giorno')?.setValue(2000);
    component.salva(fruitore);
    expect(mockApi.putElementRelated).not.toHaveBeenCalled();
    expect(component._apiSelezionata?.id_api).toBe('a2');
    expect(component._colonne[0]).toMatchObject({ quota_assegnata: 5625, quota_residua: -625, superata: true });
    expect(component._tabs[1].badge).toMatchObject({ tone: 'warning' });
    expect(fruitore.rate_limiting.filter((q) => q.id_api === 'a1')).toHaveLength(2);
    vi.useRealTimers();
  });

  it('should filter the loaded consumers by name or logical id', () => {
    avvia(['gestore']);
    component._filtro = 'L1';
    component._applicaFiltro();
    expect(component._fruitoriVisibili.map((f) => f.id_adesione)).toEqual(['ad1']);
    component._filtro = 'ente 2';
    component._applicaFiltro();
    expect(component._fruitoriVisibili.map((f) => f.id_adesione)).toEqual(['ad2']);
    component._filtro = '';
    component._applicaFiltro();
    expect(component._fruitoriVisibili).toHaveLength(2);
  });

  it('should load all the consumers at the first search, so that the filter considers them all', () => {
    avvia(['gestore']);
    expect(component._altriFruitori).toBe(true);
    mockApi.getDetails.mockClear();
    component._filtro = 'ente 2';
    component._onFiltro();
    expect(mockApi.getDetails).toHaveBeenCalledWith('servizi', 's1', 'rate-limiting/fruitori', { params: { ambiente: 'collaudo', page: 0, size: 100 } });
    expect(component._loadingTutti).toBe(false);
    expect(component._altriFruitori).toBe(false);
    expect(component._fruitoriVisibili.map((f) => f.id_adesione)).toEqual(['ad2']);
    mockApi.getDetails.mockClear();
    component._filtro = 'ente';
    component._onFiltro();
    expect(mockApi.getDetails).not.toHaveBeenCalled();
  });

  it('should load the next page when the end of the table becomes visible, checking again after each page', () => {
    vi.useFakeTimers();
    const osservatori: any[] = [];
    const originale = (globalThis as any).IntersectionObserver;
    (globalThis as any).IntersectionObserver = class {
      callback: any;
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      constructor(cb: any) { this.callback = cb; osservatori.push(this); }
    };
    avvia(['gestore']);
    (component as any)._sentinella = { nativeElement: {} };
    const observer = osservatori[0];
    expect(observer.observe).toHaveBeenCalled();

    mockApi.getDetails.mockClear();
    observer.callback([{ isIntersecting: false }]);
    expect(mockApi.getDetails).not.toHaveBeenCalled();
    observer.callback([{ isIntersecting: true }]);
    expect(mockApi.getDetails).toHaveBeenCalledWith('servizi', 's1', 'rate-limiting/fruitori', { params: { ambiente: 'collaudo', page: 1, size: 20 } });

    vi.runAllTimers();
    expect(observer.unobserve).toHaveBeenCalled();
    expect(observer.observe.mock.calls.length).toBeGreaterThan(1);

    component.ngOnDestroy();
    expect(observer.disconnect).toHaveBeenCalled();
    (globalThis as any).IntersectionObserver = originale;
    vi.useRealTimers();
  });

  it('should close the editing when changing API', () => {
    vi.useFakeTimers();
    component.mock = true;
    avvia(['gestore']);
    vi.advanceTimersByTime(300);
    component.modifica(component._fruitori[0]);
    component.seleziona('a2');
    expect(component._inModifica).toBeNull();
    vi.useRealTimers();
  });

  it('should keep editing and show the error when saving fails', () => {
    avvia(['gestore']);
    mockApi.putElementRelated.mockReturnValueOnce(throwError(() => ({ status: 400 })));
    component.modifica(component._fruitori[1]);
    component.salva(component._fruitori[1]);
    expect(component._inModifica).toBe('ad2');
    expect(component._errorMsg).toBe('Errore');
  });
});
