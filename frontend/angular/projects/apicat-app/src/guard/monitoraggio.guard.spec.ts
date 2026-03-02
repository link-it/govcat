import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonitoraggioGuard } from './monitoraggio.guard';

describe('MonitoraggioGuard', () => {
  let guard: MonitoraggioGuard;
  let router: any;
  let authService: any;
  let configService: any;

  beforeEach(() => {
    router = { navigate: vi.fn() };
    authService = {
      _getConfigModule: vi.fn().mockReturnValue({ abilitato: true, ruoli_abilitati: ['gestore', 'referente'] }),
      hasRole: vi.fn().mockReturnValue(true)
    };
    configService = { getAppConfig: vi.fn().mockReturnValue({}) };
    guard = new MonitoraggioGuard(router, authService, configService);
  });

  it('should allow access when monitoraggio enabled and user has required role', () => {
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBe(true);
    expect(authService.hasRole).toHaveBeenCalledWith(['gestore', 'referente']);
  });

  it('should redirect when monitoraggio is disabled', () => {
    authService._getConfigModule.mockReturnValue({ abilitato: false });
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/servizi']);
  });

  it('should deny access when user does not have required role', () => {
    authService.hasRole.mockReturnValue(false);
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBe(false);
  });

  it('should allow access when enabled with empty ruoli_abilitati (open to all)', () => {
    authService._getConfigModule.mockReturnValue({ abilitato: true, ruoli_abilitati: [] });
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBe(true);
  });

  it('should handle null config gracefully', () => {
    authService._getConfigModule.mockReturnValue(null);
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/servizi']);
  });
});
