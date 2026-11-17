import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';

import { OpenAPIService } from '../services/openAPI.service';
import { gestioneServizioGuard } from './gestione-servizio.guard';

describe('gestioneServizioGuard', () => {
  let apiService: any;
  let router: Router;

  const rotta = (id: string | null) => ({ paramMap: { get: (k: string) => (k === 'id' ? id : null) } }) as any;
  const esegui = (id: string | null) =>
    TestBed.runInInjectionContext(() => gestioneServizioGuard(rotta(id), {} as any));

  beforeEach(() => {
    apiService = { getDetails: vi.fn().mockReturnValue(of({ ruoli: ['referente'] })) };
    TestBed.configureTestingModule({
      providers: [{ provide: OpenAPIService, useValue: apiService }]
    });
    router = TestBed.inject(Router);
  });

  it('should open the management page when the user has a role on the service', async () => {
    expect(await firstValueFrom(esegui('s1') as Observable<boolean | UrlTree>)).toBe(true);
    expect(apiService.getDetails).toHaveBeenCalledWith('servizi', 's1', 'grant');
  });

  it('should redirect to the service view when the grant has no roles', async () => {
    apiService.getDetails.mockReturnValue(of({ ruoli: [] }));
    const esito = await firstValueFrom(esegui('s1') as Observable<boolean | UrlTree>);
    expect(router.serializeUrl(esito as UrlTree)).toBe('/servizi/s1/view');

    apiService.getDetails.mockReturnValue(of({}));
    const esitoSenzaRuoli = await firstValueFrom(esegui('s1') as Observable<boolean | UrlTree>);
    expect(router.serializeUrl(esitoSenzaRuoli as UrlTree)).toBe('/servizi/s1/view');
  });

  it('should let the page handle the error when the grant cannot be loaded', async () => {
    apiService.getDetails.mockReturnValue(throwError(() => ({ status: 404 })));
    expect(await firstValueFrom(esegui('s1') as Observable<boolean | UrlTree>)).toBe(true);
  });

  it('should not load the grant without a service id', () => {
    expect(esegui(null)).toBe(true);
    expect(apiService.getDetails).not.toHaveBeenCalled();
  });
});
