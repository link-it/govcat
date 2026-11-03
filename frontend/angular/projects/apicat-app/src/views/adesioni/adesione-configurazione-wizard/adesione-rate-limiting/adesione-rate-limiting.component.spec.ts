import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { AdesioneRateLimitingComponent } from './adesione-rate-limiting.component';

describe('AdesioneRateLimitingComponent', () => {
  let component: AdesioneRateLimitingComponent;
  let mockApi: any;
  let mockAuth: any;

  const apiDettaglio = (id: string, collaudo: any[] | undefined) => ({
    id_api: id, nome: 'API ' + id, versione: 1, ruolo: 'erogato_soggetto_dominio',
    configurazione_collaudo: { rate_limiting: collaudo }, configurazione_produzione: {}
  });

  beforeEach(() => {
    mockApi = {
      getList: vi.fn().mockReturnValue(of({ content: [{ id_api: 'a1' }, { id_api: 'a2' }] })),
      getDetails: vi.fn((model: string, id: string, sub?: string) => {
        if (model === 'api') { return of(id === 'a1' ? apiDettaglio('a1', [{ quota: 20, periodo: 'ora' }, { quota: 300, periodo: 'giorno' }]) : apiDettaglio('a2', undefined)); }
        return of({ rate_limiting: [{ id_api: 'a1', quota: 100, periodo: 'giorno' }] });
      }),
      putElementRelated: vi.fn((_m: string, _id: string, _p: string, body: any) => of(body))
    };
    mockAuth = { isGestore: vi.fn().mockReturnValue(false) };
    component = new AdesioneRateLimitingComponent(mockApi, { _queryToHttpParams: (q: any) => q, GetErrorMsg: () => 'Errore' } as any, mockAuth);
    component.adesione = { id_adesione: 'ad1', stato: 'bozza', servizio: { id_servizio: 's1' } };
    component.environment = 'collaudo';
    component.grant = { ruoli: ['referente'], collaudo: 'scrittura' } as any;
    component.ngOnChanges({ adesione: new SimpleChange(null, component.adesione, true) });
  });

  it('should show a field only for the APIs and periods declared by the service', () => {
    expect(mockApi.getDetails).toHaveBeenCalledWith('adesioni', 'ad1', 'collaudo/rate-limiting');
    expect(component._api.map((a) => a.id_api)).toEqual(['a1']);
    expect(component._api[0].quote.map((q) => q.periodo)).toEqual(['giorno', 'ora']);
    expect(component._formGroup.getRawValue()).toEqual({ 'a1|giorno': 100, 'a1|ora': null });
  });

  it('should send the full list of the environment', () => {
    component.modifica();
    component._formGroup.get('a1|ora')?.setValue(5);
    component.salva();
    expect(mockApi.putElementRelated).toHaveBeenCalledWith('adesioni', 'ad1', 'collaudo/rate-limiting', {
      rate_limiting: [{ id_api: 'a1', quota: 100, periodo: 'giorno' }, { id_api: 'a1', quota: 5, periodo: 'ora' }]
    });
    expect(component._editing).toBe(false);
    expect(component._quotaSalvata('a1', 'ora')).toBe(5);
  });

  it('should keep editing and show the error when saving fails', () => {
    mockApi.putElementRelated.mockReturnValueOnce(throwError(() => ({ status: 400 })));
    component.modifica();
    component.salva();
    expect(component._editing).toBe(true);
    expect(component._errorMsg).toBe('Errore');
  });

  it('should let the subscriber edit with the environment data editable, the service managers in any state but archived', () => {
    expect(component._canEdit).toBe(true);
    component.grant = { ruoli: ['referente'], collaudo: 'lettura' } as any;
    expect(component._canEdit).toBe(false);
    component.grant = { ruoli: ['referente_superiore'], collaudo: 'lettura' } as any;
    expect(component._canEdit).toBe(true);
    component.adesione = { ...component.adesione, stato: 'archiviato' };
    expect(component._canEdit).toBe(false);
  });
});
