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
      canMonitoraggio: vi.fn().mockReturnValue(true),
      getUser: vi.fn().mockReturnValue({ id_utente: 'u1' })
    };
    apiService = {
      getDetails: vi.fn((nome: string, id: string, tipo: string) => of(tipo === 'referenti'
        ? { content: [{ utente: { id_utente: 'u1' } }] }
        : { ruoli: ['referente'] })),
      getList: vi.fn().mockReturnValue(of({ monitoraggio: { abilitato: true } }))
    };
    guard = new MonitoraggioGuard(router, authService, apiService);
  });

  it('should check the enabled roles against the grant of the service in the route', async () => {
    expect(await firstValueFrom(guard.canActivate(rotta('s1'), {} as any))).toBe(true);
    expect(apiService.getDetails).toHaveBeenCalledWith('servizi', 's1', 'grant');
    expect(authService.canMonitoraggio).toHaveBeenCalledWith(['referente'], expect.objectContaining({ abilitato: true }));
  });

  it('should not count the referente role of an API operator who is not a referent of the service', async () => {
    authService.getUser.mockReturnValue({ id_utente: 'operatore' });
    expect(await firstValueFrom(guard.canActivate(rotta('s1'), {} as any))).toBe(true);
    expect(apiService.getDetails).toHaveBeenCalledWith('servizi', 's1', 'referenti', { params: { tipo_referente: 'referente', size: '100' } });
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
});
