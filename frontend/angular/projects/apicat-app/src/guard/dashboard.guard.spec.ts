import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardGuard } from './dashboard.guard';

describe('DashboardGuard', () => {
  let guard: DashboardGuard;
  let router: any;
  let authService: any;
  let configService: any;

  beforeEach(() => {
    router = { navigate: vi.fn() };
    authService = {
      isAnonymous: vi.fn().mockReturnValue(false),
      getUser: vi.fn().mockReturnValue({ ruolo: 'gestore' })
    };
    configService = {
      getAppConfig: vi.fn().mockReturnValue({ Layout: { dashboard: { enabled: true } } })
    };
    guard = new DashboardGuard(router, authService, configService);
  });

  it('should allow access when dashboard enabled, user authenticated with role', () => {
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBe(true);
  });

  it('should redirect when dashboard is disabled', () => {
    configService.getAppConfig.mockReturnValue({ Layout: { dashboard: { enabled: false } } });
    guard = new DashboardGuard(router, authService, configService);
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/servizi']);
  });

  it('should redirect anonymous users', () => {
    authService.isAnonymous.mockReturnValue(true);
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/servizi']);
  });

  it('should redirect users without a role', () => {
    authService.getUser.mockReturnValue({ ruolo: '' });
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/servizi']);
  });

  it('should redirect when user is null', () => {
    authService.getUser.mockReturnValue(null);
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/servizi']);
  });

  it('should allow referente with valid role', () => {
    authService.getUser.mockReturnValue({ ruolo: 'referente' });
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBe(true);
  });

  it('should handle missing Layout config gracefully', () => {
    configService.getAppConfig.mockReturnValue({});
    guard = new DashboardGuard(router, authService, configService);
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/servizi']);
  });
});
