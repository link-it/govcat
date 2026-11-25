import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';

import { Tools } from '@linkit/components';
import { GestoreGuard } from './gestore.guard';

describe('GestoreGuard', () => {
  let guard: GestoreGuard;
  let router: any;
  let authService: any;
  let configService: any;
  let apiService: any;
  const negato = { url: '/servizi' };
  const configurazione = {
    servizio: { tassonomie_abilitate: false },
    dashboard: { abilitato: false },
    amministrazione: { soggetti: { lettura: ['coordinatore'] } }
  };
  let configurazioneOriginale: any;

  const esegui = (url: string) => firstValueFrom(guard.canActivate({} as any, { url } as any));

  beforeEach(() => {
    configurazioneOriginale = Tools.Configurazione;
    Tools.Configurazione = configurazione;
    router = { createUrlTree: vi.fn().mockReturnValue(negato) };
    authService = {
      isGestore: vi.fn().mockReturnValue(false),
      verificacanPermessiMenuAmministrazione: vi.fn().mockReturnValue({ canRead: false, canWrite: false })
    };
    configService = { getAppConfig: vi.fn().mockReturnValue({}) };
    apiService = { getList: vi.fn().mockReturnValue(of(configurazione)) };
    guard = new GestoreGuard(router, authService, configService, apiService);
  });

  afterEach(() => {
    Tools.Configurazione = configurazioneOriginale;
  });

  it('should allow access for gestore', async () => {
    authService.isGestore.mockReturnValue(true);
    expect(await esegui('/soggetti')).toBe(true);
  });

  it('should allow access when user has read permission on menu', async () => {
    authService.verificacanPermessiMenuAmministrazione.mockReturnValue({ canRead: true, canWrite: false });
    expect(await esegui('/soggetti/123')).toBe(true);
    expect(authService.verificacanPermessiMenuAmministrazione).toHaveBeenCalledWith('soggetti', configurazione);
    expect(apiService.getList).not.toHaveBeenCalled();
  });

  it('should redirect to /servizi when user has no permission', async () => {
    expect(await esegui('/soggetti')).toBe(negato);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/servizi']);
  });

  it('should load the remote configuration before checking the permissions after a page refresh', async () => {
    Tools.Configurazione = null;
    authService.verificacanPermessiMenuAmministrazione.mockImplementation((menu: string, config: any) =>
      ({ canRead: !!config?.amministrazione?.[menu], canWrite: false }));
    expect(await esegui('/soggetti')).toBe(true);
    expect(apiService.getList).toHaveBeenCalledWith('configurazione');
    expect(authService.verificacanPermessiMenuAmministrazione).toHaveBeenCalledWith('soggetti', configurazione);
    expect(await esegui('/utenti')).toBe(negato);
  });

  it('should still allow the gestore when the remote configuration cannot be loaded', async () => {
    Tools.Configurazione = null;
    apiService.getList.mockReturnValue(throwError(() => ({ status: 500 })));
    expect(await esegui('/soggetti')).toBe(negato);
    authService.isGestore.mockReturnValue(true);
    expect(await esegui('/soggetti')).toBe(true);
  });

  it('should redirect to /servizi for /tassonomie when taxonomies disabled', async () => {
    authService.isGestore.mockReturnValue(true);
    expect(await esegui('/tassonomie')).toBe(negato);
  });

  it('should allow /tassonomie when taxonomies enabled and user is gestore', async () => {
    Tools.Configurazione = { ...configurazione, servizio: { tassonomie_abilitate: true } };
    authService.isGestore.mockReturnValue(true);
    expect(await esegui('/tassonomie')).toBe(true);
  });

  it('should allow /monitoraggio for gestore when dashboard is enabled', async () => {
    Tools.Configurazione = { ...configurazione, dashboard: { abilitato: true } };
    authService.isGestore.mockReturnValue(true);
    expect(await esegui('/monitoraggio')).toBe(true);
  });

  it('should redirect /monitoraggio when dashboard is disabled', async () => {
    authService.isGestore.mockReturnValue(true);
    expect(await esegui('/monitoraggio')).toBe(negato);
  });

  it('should check the dashboard on the remote configuration loaded after a page refresh', async () => {
    Tools.Configurazione = null;
    apiService.getList.mockReturnValue(of({ ...configurazione, dashboard: { abilitato: true } }));
    authService.isGestore.mockReturnValue(true);
    expect(await esegui('/monitoraggio')).toBe(true);
  });

  it('should allow /monitoraggio for non-gestore with menu permission', async () => {
    Tools.Configurazione = { ...configurazione, dashboard: { abilitato: true } };
    authService.verificacanPermessiMenuAmministrazione.mockReturnValue({ canRead: true, canWrite: false });
    expect(await esegui('/monitoraggio')).toBe(true);
  });
});
