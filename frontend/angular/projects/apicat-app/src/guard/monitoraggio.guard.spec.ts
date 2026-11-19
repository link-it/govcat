import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';
import { MonitoraggioGuard } from './monitoraggio.guard';

describe('MonitoraggioGuard (Issue #418)', () => {
  let guard: MonitoraggioGuard;
  let router: any;
  let authService: any;
  let apiService: any;
  const negato = { url: '/servizi' };
  const rotta = (id: string | null, data: any = {}) => ({ paramMap: { get: (k: string) => (k === 'id' ? id : null) }, data }) as any;

  beforeEach(() => {
    router = { createUrlTree: vi.fn().mockReturnValue(negato) };
    authService = {
      _getConfigModule: vi.fn().mockReturnValue({ abilitato: true, ruoli_abilitati: ['gestore', 'referente'] }),
      canMonitoraggio: vi.fn().mockReturnValue(true)
    };
    apiService = {
      getDetails: vi.fn().mockReturnValue(of({ ruoli: ['referente'] })),
      getList: vi.fn().mockReturnValue(of({ monitoraggio: { abilitato: true } }))
    };
    guard = new MonitoraggioGuard(router, authService, apiService);
  });

  it('should check the enabled roles against the grant of the service in the route', async () => {
    expect(await firstValueFrom(guard.canActivate(rotta('s1'), {} as any))).toBe(true);
    expect(apiService.getDetails).toHaveBeenCalledWith('servizi', 's1', 'grant');
    expect(authService.canMonitoraggio).toHaveBeenCalledWith(['referente'], expect.objectContaining({ abilitato: true }));
  });

  it('should check an empty list of roles when the grant has none', async () => {
    apiService.getDetails.mockReturnValue(of({}));
    await firstValueFrom(guard.canActivate(rotta('s1'), {} as any));
    expect(apiService.getDetails).toHaveBeenCalledTimes(1);
    expect(authService.canMonitoraggio).toHaveBeenCalledWith([], expect.objectContaining({ abilitato: true }));
  });

  it('should redirect to the services when the user has no enabled role on the service', async () => {
    authService.canMonitoraggio.mockReturnValue(false);
    expect(await firstValueFrom(guard.canActivate(rotta('s1'), {} as any))).toBe(negato);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/servizi']);
  });

  it('should redirect when monitoring is disabled or not configured, without loading the grant', async () => {
    authService._getConfigModule.mockReturnValue({ abilitato: false });
    expect(await firstValueFrom(guard.canActivate(rotta('s1'), {} as any))).toBe(negato);
    authService._getConfigModule.mockReturnValue(null);
    apiService.getList.mockReturnValue(of({}));
    expect(await firstValueFrom(guard.canActivate(rotta('s1'), {} as any))).toBe(negato);
    expect(apiService.getDetails).not.toHaveBeenCalled();
  });

  it('should load the remote configuration when it is not available yet', async () => {
    authService._getConfigModule.mockReturnValue(null);
    expect(await firstValueFrom(guard.canActivate(rotta('s1'), {} as any))).toBe(true);
    expect(apiService.getList).toHaveBeenCalledWith('configurazione');
    expect(apiService.getDetails).toHaveBeenCalledWith('servizi', 's1', 'grant');
    expect(authService.canMonitoraggio).toHaveBeenCalledWith(['referente'], { abilitato: true });
  });

  it('should redirect when the grant cannot be loaded or the service id is missing', async () => {
    apiService.getDetails.mockReturnValue(throwError(() => ({ status: 403 })));
    expect(await firstValueFrom(guard.canActivate(rotta('s1'), {} as any))).toBe(negato);
    expect(await firstValueFrom(guard.canActivate(rotta(null), {} as any))).toBe(negato);
  });

  it('should require the audit monitoring on the audit route (Issue #404)', async () => {
    expect(await firstValueFrom(guard.canActivate(rotta('s1', { audit: true }), {} as any))).toBe(negato);
    expect(apiService.getDetails).not.toHaveBeenCalled();
    authService._getConfigModule.mockReturnValue({ abilitato: true, audit_abilitato: true });
    expect(await firstValueFrom(guard.canActivate(rotta('s1', { audit: true }), {} as any))).toBe(true);
  });

  it('should require the function enabled in the configuration on the routes with data.funzione', async () => {
    for (const funzione of ['transazioni', 'statistiche', 'verifiche']) {
      authService._getConfigModule.mockReturnValue({ abilitato: true });
      expect(await firstValueFrom(guard.canActivate(rotta('s1', { funzione }), {} as any))).toBe(negato);
      authService._getConfigModule.mockReturnValue({ abilitato: true, [`${funzione}_abilitate`]: false });
      expect(await firstValueFrom(guard.canActivate(rotta('s1', { funzione }), {} as any))).toBe(negato);
      expect(apiService.getDetails).not.toHaveBeenCalled();
      authService._getConfigModule.mockReturnValue({ abilitato: true, [`${funzione}_abilitate`]: true });
      expect(await firstValueFrom(guard.canActivate(rotta('s1', { funzione }), {} as any))).toBe(true);
      apiService.getDetails.mockClear();
    }
  });

  it('should check the function on the remote configuration loaded after a page refresh', async () => {
    authService._getConfigModule.mockReturnValue(null);
    apiService.getList.mockReturnValue(of({ monitoraggio: { abilitato: true, verifiche_abilitate: false } }));
    expect(await firstValueFrom(guard.canActivate(rotta('s1', { funzione: 'verifiche' }), {} as any))).toBe(negato);
    apiService.getList.mockReturnValue(of({ monitoraggio: { abilitato: true, verifiche_abilitate: true } }));
    expect(await firstValueFrom(guard.canActivate(rotta('s1', { funzione: 'verifiche' }), {} as any))).toBe(true);
  });
});
