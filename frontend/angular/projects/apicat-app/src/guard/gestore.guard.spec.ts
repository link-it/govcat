import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GestoreGuard } from './gestore.guard';

describe('GestoreGuard', () => {
  let guard: GestoreGuard;
  let router: any;
  let authService: any;
  let configService: any;

  beforeEach(() => {
    router = { navigate: vi.fn() };
    authService = {
      isGestore: vi.fn().mockReturnValue(false),
      verificacanPermessiMenuAmministrazione: vi.fn().mockReturnValue({ canRead: false, canWrite: false }),
      _getConfigModule: vi.fn().mockReturnValue({})
    };
    configService = { getAppConfig: vi.fn().mockReturnValue({}) };
    guard = new GestoreGuard(router, authService, configService);
  });

  it('should allow access for gestore', () => {
    authService.isGestore.mockReturnValue(true);
    const result = guard.canActivate({} as any, { url: '/soggetti' } as any);
    expect(result).toBe(true);
  });

  it('should allow access when user has read permission on menu', () => {
    authService.verificacanPermessiMenuAmministrazione.mockReturnValue({ canRead: true, canWrite: false });
    const result = guard.canActivate({} as any, { url: '/soggetti' } as any);
    expect(result).toBe(true);
    expect(authService.verificacanPermessiMenuAmministrazione).toHaveBeenCalledWith('soggetti');
  });

  it('should redirect to /servizi when user has no permission', () => {
    const result = guard.canActivate({} as any, { url: '/soggetti' } as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/servizi']);
  });

  it('should redirect to /servizi for /tassonomie when taxonomies disabled', () => {
    authService._getConfigModule.mockReturnValue({ tassonomie_abilitate: false });
    const result = guard.canActivate({} as any, { url: '/tassonomie' } as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/servizi']);
  });

  it('should allow /tassonomie when taxonomies enabled and user is gestore', () => {
    authService._getConfigModule.mockReturnValue({ tassonomie_abilitate: true });
    authService.isGestore.mockReturnValue(true);
    const result = guard.canActivate({} as any, { url: '/tassonomie' } as any);
    expect(result).toBe(true);
  });

  it('should allow /monitoraggio for gestore when dashboard is enabled', () => {
    authService._getConfigModule.mockImplementation((mod: string) => {
      if (mod === 'servizio') return {};
      if (mod === 'dashboard') return { abilitato: true };
      return {};
    });
    authService.isGestore.mockReturnValue(true);
    const result = guard.canActivate({} as any, { url: '/monitoraggio' } as any);
    expect(result).toBe(true);
  });

  it('should redirect /monitoraggio when dashboard is disabled', () => {
    authService._getConfigModule.mockImplementation((mod: string) => {
      if (mod === 'dashboard') return { abilitato: false };
      return {};
    });
    const result = guard.canActivate({} as any, { url: '/monitoraggio' } as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/servizi']);
  });

  it('should allow /monitoraggio for non-gestore with menu permission', () => {
    authService._getConfigModule.mockImplementation((mod: string) => {
      if (mod === 'dashboard') return { abilitato: true };
      return {};
    });
    authService.verificacanPermessiMenuAmministrazione.mockReturnValue({ canRead: true, canWrite: false });
    const result = guard.canActivate({} as any, { url: '/monitoraggio' } as any);
    expect(result).toBe(true);
  });
});
