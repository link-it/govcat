import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategorieGuard } from './categorie.guard';

describe('CategorieGuard', () => {
  let guard: CategorieGuard;
  let router: any;
  let authService: any;
  let configService: any;

  beforeEach(() => {
    router = { navigate: vi.fn() };
    authService = {
      _getConfigModule: vi.fn().mockReturnValue({ tassonomie_abilitate: true })
    };
    configService = { getAppConfig: vi.fn().mockReturnValue({}) };
    guard = new CategorieGuard(router, authService, configService);
  });

  it('should allow access to /categorie when taxonomies enabled', () => {
    const result = guard.canActivate({} as any, { url: '/categorie' } as any);
    expect(result).toBe(true);
  });

  it('should redirect from /categorie when taxonomies disabled', () => {
    authService._getConfigModule.mockReturnValue({ tassonomie_abilitate: false });
    const result = guard.canActivate({} as any, { url: '/categorie' } as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/servizi']);
  });

  it('should allow non-categorie routes regardless of taxonomy setting', () => {
    authService._getConfigModule.mockReturnValue({ tassonomie_abilitate: false });
    const result = guard.canActivate({} as any, { url: '/servizi' } as any);
    expect(result).toBe(true);
  });

  it('should handle missing config gracefully', () => {
    authService._getConfigModule.mockReturnValue({});
    const result = guard.canActivate({} as any, { url: '/categorie' } as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/servizi']);
  });
});
