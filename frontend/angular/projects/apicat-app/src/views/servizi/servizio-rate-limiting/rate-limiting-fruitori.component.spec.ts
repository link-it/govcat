import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Subject, of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { RateLimitingFruitoriComponent, valoreQuota } from './rate-limiting-fruitori.component';

describe('RateLimitingFruitoriComponent (Issue #402)', () => {
  let component: RateLimitingFruitoriComponent;
  let mockApi: any;

  const fruitori = {
    content: [
      { id_adesione: 'ad1', id_logico: 'L1', soggetto: { nome: 'Ente 1' }, stato: 'bozza', rate_limiting: [{ id_api: 'a1', quota: 100, periodo: 'giorno' }, { id_api: 'x9', quota: 7, periodo: 'minuto' }] },
      { id_adesione: 'ad2', soggetto: { nome: 'Ente 2' }, stato: 'bozza', rate_limiting: [{ id_api: 'a1', quota: 150, periodo: 'giorno' }] }
    ],
    page: { totalElements: 3 }
  };

  const colonne = [
    { chiave: 'a1|giorno', id_api: 'a1', periodo: 'giorno', quota_fruitore: 120 },
    { chiave: 'a1|ora', id_api: 'a1', periodo: 'ora' }
  ] as any;

  const avvia = (modificabile = true) => {
    component.idServizio = 's1';
    component.ambiente = 'collaudo';
    component.colonne = colonne;
    component.modificabile = modificabile;
    component.ngOnChanges({ idServizio: new SimpleChange(null, 's1', true), colonne: new SimpleChange(null, colonne, true) });
  };

  beforeEach(() => {
    mockApi = {
      getDetails: vi.fn(() => of(fruitori)),
      putElementRelated: vi.fn((_m: string, _id: string, _p: string, body: any) => of(body))
    };
    component = new RateLimitingFruitoriComponent(mockApi, { _queryToHttpParams: (q: any) => q, GetErrorMsg: () => 'Errore' } as any);
  });

  it('should load the first page of consumers of the environment', () => {
    avvia();
    expect(mockApi.getDetails).toHaveBeenCalledWith('servizi', 's1', 'rate-limiting/fruitori', { params: { ambiente: 'collaudo', page: 0, size: 20 } });
    expect(component._fruitori).toHaveLength(2);
    expect(component._altriFruitori).toBe(true);
    expect(component._quota(component._fruitori[0], colonne[0])).toBe(100);
  });

  it('should ignore the responses of a superseded load', () => {
    const lenti: any[] = [];
    mockApi.getDetails = vi.fn(() => { const s$ = new Subject<any>(); lenti.push(s$); return s$; });
    avvia();
    component.ricarica();
    lenti.forEach((s$) => { s$.next(fruitori); s$.complete(); });
    expect(component._fruitori.length).toBe(2);
  });

  it('should search on the server after a pause, starting again from the first page', () => {
    vi.useFakeTimers();
    avvia();
    mockApi.getDetails.mockClear();
    component._filtro = 'ent';
    component._onFiltro();
    component._filtro = 'ente 2';
    component._onFiltro();
    expect(mockApi.getDetails).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(mockApi.getDetails).toHaveBeenCalledTimes(1);
    expect(mockApi.getDetails).toHaveBeenCalledWith('servizi', 's1', 'rate-limiting/fruitori', { params: { ambiente: 'collaudo', q: 'ente 2', page: 0, size: 20 } });
    expect(component._filtriAttivi).toBe(true);
    vi.useRealTimers();
  });

  it('should filter by authorization state', () => {
    avvia();
    mockApi.getDetails.mockClear();
    component._onStato('attesa');
    expect(mockApi.getDetails).toHaveBeenCalledWith('servizi', 's1', 'rate-limiting/fruitori', { params: { ambiente: 'collaudo', autorizzate: 'false', page: 0, size: 20 } });
    component._onStato('autorizzate');
    expect(mockApi.getDetails).toHaveBeenLastCalledWith('servizi', 's1', 'rate-limiting/fruitori', { params: { ambiente: 'collaudo', autorizzate: 'true', page: 0, size: 20 } });
    mockApi.getDetails.mockClear();
    component._onStato('autorizzate');
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
    avvia();
    (component as any)._sentinella = { nativeElement: {} };
    const observer = osservatori[0];
    mockApi.getDetails.mockClear();
    observer.callback([{ isIntersecting: false }]);
    expect(mockApi.getDetails).not.toHaveBeenCalled();
    observer.callback([{ isIntersecting: true }]);
    expect(mockApi.getDetails).toHaveBeenCalledWith('servizi', 's1', 'rate-limiting/fruitori', { params: { ambiente: 'collaudo', page: 1, size: 20 } });
    vi.runAllTimers();
    expect(observer.unobserve).toHaveBeenCalled();
    component.ngOnDestroy();
    expect(observer.disconnect).toHaveBeenCalled();
    (globalThis as any).IntersectionObserver = originale;
    vi.useRealTimers();
  });

  it('should send the quotas being edited and the full list of the consumer, keeping the quotas not shown', () => {
    const modifiche: any[] = [];
    const salvati: any[] = [];
    component.modificaChange.subscribe((m) => modifiche.push(m));
    component.salvato.subscribe(() => salvati.push(true));
    avvia();
    component.modifica(component._fruitori[0]);
    component._formGroup.get('a1|ora')?.setValue(5);
    expect(modifiche.at(-1).valori).toEqual({ 'a1|giorno': 100, 'a1|ora': 5 });
    component._formGroup.get('a1|giorno')?.setValue(130);
    expect(component._formGroup.invalid).toBe(true);
    component._formGroup.get('a1|giorno')?.setValue(100);
    component.salva(component._fruitori[0]);
    expect(mockApi.putElementRelated).toHaveBeenCalledWith('adesioni', 'ad1', 'collaudo/rate-limiting', {
      rate_limiting: [
        { id_api: 'x9', quota: 7, periodo: 'minuto' },
        { id_api: 'a1', quota: 100, periodo: 'giorno' },
        { id_api: 'a1', quota: 5, periodo: 'ora' }
      ]
    });
    expect(component._inModifica).toBeNull();
    expect(modifiche.at(-1)).toBeNull();
    expect(salvati).toHaveLength(1);
  });

  it('should keep editing and show the error when saving fails', () => {
    avvia();
    mockApi.putElementRelated.mockReturnValueOnce(throwError(() => ({ status: 400 })));
    component.modifica(component._fruitori[0]);
    component.salva(component._fruitori[0]);
    expect(component._inModifica).toBe('ad1');
    expect(component._errorMsg).toBe('Errore');
  });

  it('should not edit when read only', () => {
    avvia(false);
    component.modifica(component._fruitori[0]);
    expect(component._inModifica).toBeNull();
  });

  it('should page the sample consumers with a delay, saving locally', () => {
    vi.useFakeTimers();
    const campione = Array.from({ length: 25 }, (_v, i) => ({ id_adesione: `m${i}`, soggetto: { nome: `Ente ${i}` }, stato: 'bozza', autorizzata: i < 5, rate_limiting: [] }));
    component.mock = true;
    component.fruitoriMock = campione as any;
    avvia();
    expect(component._fruitori).toHaveLength(0);
    vi.advanceTimersByTime(300);
    expect(component._fruitori).toHaveLength(20);
    expect(component._totaleFruitori).toBe(25);
    component.modifica(component._fruitori[0]);
    component._formGroup.get('a1|giorno')?.setValue(50);
    component.salva(component._fruitori[0]);
    expect(mockApi.putElementRelated).not.toHaveBeenCalled();
    expect(campione[0].rate_limiting).toEqual([{ id_api: 'a1', quota: 50, periodo: 'giorno' }]);
    vi.advanceTimersByTime(300);
    component._onStato('autorizzate');
    vi.advanceTimersByTime(300);
    expect(component._totaleFruitori).toBe(5);
    vi.useRealTimers();
  });

  it('should accept as quota only whole numbers greater than zero', () => {
    expect(valoreQuota('12')).toBe(12);
    expect(valoreQuota(0)).toBeNull();
    expect(valoreQuota(1.5)).toBeNull();
    expect(valoreQuota('')).toBeNull();
  });
});
