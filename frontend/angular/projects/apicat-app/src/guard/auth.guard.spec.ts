import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: any;
  let authService: any;

  beforeEach(() => {
    router = { navigate: vi.fn() };
    authService = { isLogged: vi.fn() };
    guard = new AuthGuard(router, authService);
  });

  it('should allow access when user is logged in', () => {
    authService.isLogged.mockReturnValue(true);
    const result = guard.canActivate({} as any, { url: '/servizi' } as any);
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not logged in', () => {
    authService.isLogged.mockReturnValue(false);
    const result = guard.canActivate({} as any, { url: '/adesioni' } as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { returnUrl: '/adesioni' } });
  });

  it('should pass the current URL as returnUrl', () => {
    authService.isLogged.mockReturnValue(false);
    guard.canActivate({} as any, { url: '/dashboard' } as any);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { returnUrl: '/dashboard' } });
  });
});
