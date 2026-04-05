import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegistrazioneGuard } from './registrazione.guard';

describe('RegistrazioneGuard', () => {
  let guard: RegistrazioneGuard;
  let router: any;
  let authService: any;

  beforeEach(() => {
    router = { navigate: vi.fn() };
    authService = { getCurrentSession: vi.fn() };
    guard = new RegistrazioneGuard(router, authService);
  });

  it('should allow access when session has no registrazione_richiesta state', () => {
    authService.getCurrentSession.mockReturnValue({ utente: { ruolo: 'referente' } });
    const result = guard.canActivate({} as any, { url: '/servizi' } as any);
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /auth/registrazione when stato is registrazione_richiesta', () => {
    authService.getCurrentSession.mockReturnValue({ stato: 'registrazione_richiesta' });
    const result = guard.canActivate({} as any, { url: '/servizi' } as any);
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/registrazione']);
  });

  it('should not redirect when already on /auth/registrazione (avoid loop)', () => {
    authService.getCurrentSession.mockReturnValue({ stato: 'registrazione_richiesta' });
    const result = guard.canActivate({} as any, { url: '/auth/registrazione' } as any);
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should allow access when session is null', () => {
    authService.getCurrentSession.mockReturnValue(null);
    const result = guard.canActivate({} as any, { url: '/servizi' } as any);
    expect(result).toBe(true);
  });

  it('should allow access when stato is different from registrazione_richiesta', () => {
    authService.getCurrentSession.mockReturnValue({ stato: 'attivo' });
    const result = guard.canActivate({} as any, { url: '/servizi' } as any);
    expect(result).toBe(true);
  });
});
