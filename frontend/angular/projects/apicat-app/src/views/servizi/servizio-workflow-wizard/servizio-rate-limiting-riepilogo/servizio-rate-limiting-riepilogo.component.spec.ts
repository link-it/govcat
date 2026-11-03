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

  it('should keep editing and show the error when saving fails', () => {
    avvia(['gestore']);
    mockApi.putElementRelated.mockReturnValueOnce(throwError(() => ({ status: 400 })));
    component.modifica(component._fruitori[1]);
    component.salva(component._fruitori[1]);
    expect(component._inModifica).toBe('ad2');
    expect(component._errorMsg).toBe('Errore');
  });
});
