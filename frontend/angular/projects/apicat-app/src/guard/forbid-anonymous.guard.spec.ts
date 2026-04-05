import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbidAnonymousGuard } from './forbid-anonymous.guard';

describe('ForbidAnonymousGuard', () => {
  let guard: ForbidAnonymousGuard;
  let router: any;
  let authService: any;

  beforeEach(() => {
    router = { navigate: vi.fn() };
    authService = { isAnonymous: vi.fn() };
    guard = new ForbidAnonymousGuard(router, authService);
  });

  it('should allow access for authenticated users', () => {
    authService.isAnonymous.mockReturnValue(false);
    const result = guard.canActivate({} as any, { url: '/adesioni' } as any);
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect anonymous users to /servizi', () => {
    authService.isAnonymous.mockReturnValue(true);
    const result = guard.canActivate({} as any, { url: '/adesioni' } as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/servizi']);
  });
});
