import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';

import { AuthenticationService } from '../services/authentication.service';
import { OpenAPIService } from '../services/openAPI.service';
import { funzioneMonitoraggioAbilitata, funzioneMonitoraggioGuard } from './funzione-monitoraggio.guard';

describe('funzioneMonitoraggioAbilitata', () => {
  it('should require the monitoring and the function enabled', () => {
    expect(funzioneMonitoraggioAbilitata(null, 'verifiche')).toBe(false);
    expect(funzioneMonitoraggioAbilitata({ abilitato: false, verifiche_abilitate: true }, 'verifiche')).toBe(false);
    expect(funzioneMonitoraggioAbilitata({ abilitato: true }, 'verifiche')).toBe(false);
    expect(funzioneMonitoraggioAbilitata({ abilitato: true, verifiche_abilitate: true }, 'verifiche')).toBe(true);
    expect(funzioneMonitoraggioAbilitata({ abilitato: true, statistiche_abilitate: true }, 'transazioni')).toBe(false);
  });

  it('should only require the monitoring when no function is given', () => {
    expect(funzioneMonitoraggioAbilitata({ abilitato: true }, undefined)).toBe(true);
    expect(funzioneMonitoraggioAbilitata({ abilitato: false }, null)).toBe(false);
  });
});

describe('funzioneMonitoraggioGuard', () => {
  let authService: any;
  let apiService: any;
  let router: Router;

  const esegui = (url: string, data: any = { funzione: 'verifiche' }) =>
    TestBed.runInInjectionContext(() =>
      funzioneMonitoraggioGuard({ data } as any, { url } as any)) as Observable<boolean | UrlTree>;

  beforeEach(() => {
    authService = { _getConfigModule: vi.fn().mockReturnValue({ abilitato: true, verifiche_abilitate: true }) };
    apiService = { getList: vi.fn().mockReturnValue(of({ monitoraggio: { abilitato: true, verifiche_abilitate: true } })) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthenticationService, useValue: authService },
        { provide: OpenAPIService, useValue: apiService }
      ]
    });
    router = TestBed.inject(Router);
  });

  it('should allow the page when the function is enabled', async () => {
    expect(await firstValueFrom(esegui('/soggetti/s1/verifiche'))).toBe(true);
    expect(apiService.getList).not.toHaveBeenCalled();
  });

  it('should redirect to the parent page when the function is disabled', async () => {
    authService._getConfigModule.mockReturnValue({ abilitato: true, verifiche_abilitate: false });
    const esito = await firstValueFrom(esegui('/client/c1/verifiche?x=1'));
    expect(router.serializeUrl(esito as UrlTree)).toBe('/client/c1');
  });

  it('should load the remote configuration when it is not available yet', async () => {
    authService._getConfigModule.mockReturnValue(null);
    apiService.getList.mockReturnValue(of({ monitoraggio: { abilitato: true, verifiche_abilitate: false } }));
    const esito = await firstValueFrom(esegui('/soggetti/s1/verifiche'));
    expect(apiService.getList).toHaveBeenCalledWith('configurazione');
    expect(router.serializeUrl(esito as UrlTree)).toBe('/soggetti/s1');
  });

  it('should redirect when the configuration cannot be loaded', async () => {
    authService._getConfigModule.mockReturnValue(null);
    apiService.getList.mockReturnValue(throwError(() => ({ status: 500 })));
    const esito = await firstValueFrom(esegui('/soggetti/s1/verifiche'));
    expect(router.serializeUrl(esito as UrlTree)).toBe('/soggetti/s1');
  });
});
