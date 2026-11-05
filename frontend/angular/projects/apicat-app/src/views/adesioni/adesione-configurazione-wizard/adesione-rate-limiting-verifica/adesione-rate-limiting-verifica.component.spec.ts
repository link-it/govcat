import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { AdesioneRateLimitingVerificaComponent } from './adesione-rate-limiting-verifica.component';

describe('AdesioneRateLimitingVerificaComponent (Issue #402)', () => {
  let component: AdesioneRateLimitingVerificaComponent;
  let mockApi: any;
  let mockModal: any;

  const verifica = (rientra: boolean) => ({
    rientra,
    api: [{ id_api: 'a1', nome: 'API 1', versione: 1, rate_limiting: [] }]
  });

  const avvia = () => {
    component.adesione = { id_adesione: 'ad1', servizio: { id_servizio: 's1', nome: 'Servizio', versione: 1 }, soggetto: { nome: 'Ente' } };
    component.ambiente = 'collaudo';
    component.ngOnChanges({ adesione: new SimpleChange(null, component.adesione, true) });
  };

  beforeEach(() => {
    mockApi = {
      getDetails: vi.fn().mockReturnValue(of(verifica(false))),
      getList: vi.fn().mockReturnValue(of({ content: [{ id_api: 'a1', nome: 'API 1', versione: 1 }] }))
    };
    mockModal = { show: vi.fn() };
    component = new AdesioneRateLimitingVerificaComponent(mockApi, { _queryToHttpParams: (q: any) => q } as any, mockModal);
  });

  it('should load the check of the environment and signal the quotas exceeding the remaining quota', () => {
    avvia();
    expect(mockApi.getDetails).toHaveBeenCalledWith('adesioni', 'ad1', 'collaudo/rate-limiting/verifica', expect.anything());
    expect(component._icona).toContain('bi-exclamation-triangle-fill');
    expect(component._esito).toBe('APP.ADESIONI.RATE_LIMITING_VERIFICA.EsitoSfora');
  });

  it('should signal the quotas within the remaining quota and check again after the quotas are saved', () => {
    mockApi.getDetails.mockReturnValue(of(verifica(true)));
    avvia();
    expect(component._icona).toContain('bi-check-circle-fill');
    expect(component._esito).toBe('APP.ADESIONI.RATE_LIMITING_VERIFICA.EsitoRientra');
    mockApi.getDetails.mockClear();
    component.aggiorna = 1;
    component.ngOnChanges({ aggiorna: new SimpleChange(0, 1, false) });
    expect(mockApi.getDetails).toHaveBeenCalledWith('adesioni', 'ad1', 'collaudo/rate-limiting/verifica', expect.anything());
  });

  it('should hide the button without quotas to check or when the check fails', () => {
    mockApi.getDetails.mockReturnValue(of({ rientra: true, api: [] }));
    avvia();
    expect(component._verifica).toBeNull();
    mockApi.getDetails.mockReturnValue(throwError(() => ({ status: 404 })));
    component.carica();
    expect(component._verifica).toBeNull();
  });

  it('should build a sample check from the service APIs and the saved quotas', () => {
    mockApi.getDetails.mockReturnValue(of({ rate_limiting: [] }));
    component.mock = true;
    avvia();
    expect(mockApi.getList).toHaveBeenCalledWith('api', { params: { id_servizio: 's1', ruolo: 'erogato_soggetto_dominio', size: 100 } });
    expect(component._verifica?.api.map((a) => a.id_api)).toEqual(['a1', 'mock-api-2', 'mock-api-3']);
    component.apri();
    const stato = mockModal.show.mock.calls[0][1].initialState;
    expect(stato.fruitoriMock[0]).toMatchObject({ id_adesione: 'ad1', autorizzata: false });
    expect(stato.fruitoriMock).toHaveLength(46);
  });

  it('should open the dialog with the check and the outcome', () => {
    avvia();
    component.apri();
    expect(mockModal.show).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      initialState: expect.objectContaining({ esito: 'APP.ADESIONI.RATE_LIMITING_VERIFICA.EsitoSfora', ambiente: 'collaudo', sottotitolo: 'Ente · Servizio v. 1', idServizio: 's1', idAdesione: 'ad1' })
    }));
  });
});
