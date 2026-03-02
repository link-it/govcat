import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockApiService: any;
  let mockAuthService: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockApiService = {
      getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 } }))
    };
    mockAuthService = {
      getUser: vi.fn().mockReturnValue(null)
    };
    mockConfigService = {
      getConfiguration: vi.fn().mockReturnValue({ AppConfig: { Layout: {} } })
    };

    service = new DashboardService(mockApiService, mockAuthService, mockConfigService);

    // Reset Tools.Configurazione
    (Tools as any).Configurazione = null;
  });

  afterEach(() => {
    service.stopDashboardPolling();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('computeRoleConfig', () => {
    describe('gestore', () => {
      it('should enable all sections', () => {
        const config = service.computeRoleConfig('gestore', []);
        expect(config.servizi).toBe(true);
        expect(config.adesioni).toBe(true);
        expect(config.client).toBe(true);
        expect(config.utenti).toBe(true);
      });

      it('should show comunicazioni by default', () => {
        const config = service.computeRoleConfig('gestore', []);
        expect(config.comunicazioni).toBe(true);
      });

      it('should hide comunicazioni when hideNotificationGestore is true', () => {
        mockConfigService.getConfiguration.mockReturnValue({
          AppConfig: { Layout: { dashboard: { hideNotificationGestore: true } } }
        });
        const config = service.computeRoleConfig('gestore', []);
        expect(config.comunicazioni).toBe(false);
      });
    });

    describe('coordinatore', () => {
      it('should enable servizi, adesioni, comunicazioni, utenti', () => {
        const config = service.computeRoleConfig('coordinatore', []);
        expect(config.servizi).toBe(true);
        expect(config.adesioni).toBe(true);
        expect(config.comunicazioni).toBe(true);
        expect(config.utenti).toBe(true);
      });

      it('should not enable client', () => {
        const config = service.computeRoleConfig('coordinatore', []);
        expect(config.client).toBe(false);
      });
    });

    describe('referente', () => {
      it('should show only comunicazioni when no ruoli referente', () => {
        const config = service.computeRoleConfig('referente', []);
        expect(config.servizi).toBe(false);
        expect(config.adesioni).toBe(false);
        expect(config.client).toBe(false);
        expect(config.comunicazioni).toBe(true);
        expect(config.utenti).toBe(false);
      });

      it('should map referente_dominio to referente_superiore role', () => {
        (Tools as any).Configurazione = {
          servizio: { workflow: { stati_dashboard: [{ ruolo: 'referente_superiore', stati: ['in_revisione'] }] } },
          adesione: { workflow: { stati_dashboard: [{ ruolo: 'referente_superiore', stati: ['da_approvare'] }] }, stati_dashboard_client: ['attivo'] }
        };
        const config = service.computeRoleConfig('referente', ['referente_dominio']);
        expect(config.servizi).toBe(true);
        expect(config.adesioni).toBe(true);
        expect(config.client).toBe(true);
      });

      it('should map referente_servizio to referente role', () => {
        (Tools as any).Configurazione = {
          servizio: { workflow: { stati_dashboard: [{ ruolo: 'referente', stati: ['bozza'] }] } },
          adesione: { workflow: { stati_dashboard: [] } }
        };
        const config = service.computeRoleConfig('referente', ['referente_servizio']);
        expect(config.servizi).toBe(true);
        expect(config.adesioni).toBe(false);
        expect(config.client).toBe(false);
      });

      it('should map richiedente_servizio to richiedente role', () => {
        (Tools as any).Configurazione = {
          servizio: { workflow: { stati_dashboard: [{ ruolo: 'richiedente', stati: ['inviato'] }] } },
          adesione: { workflow: { stati_dashboard: [{ ruolo: 'richiedente', stati: ['bozza'] }] } }
        };
        const config = service.computeRoleConfig('referente', ['richiedente_servizio']);
        expect(config.servizi).toBe(true);
        expect(config.adesioni).toBe(true);
        expect(config.client).toBe(false);
      });

      it('should not enable client for non-superiore roles', () => {
        (Tools as any).Configurazione = {
          servizio: { workflow: { stati_dashboard: [{ ruolo: 'referente', stati: ['bozza'] }] } },
          adesione: { workflow: { stati_dashboard: [] }, stati_dashboard_client: ['attivo'] }
        };
        const config = service.computeRoleConfig('referente', ['referente_servizio']);
        expect(config.client).toBe(false);
      });
    });

    it('should handle null ruoliReferente', () => {
      const config = service.computeRoleConfig('referente', null as any);
      expect(config.comunicazioni).toBe(true);
      expect(config.servizi).toBe(false);
    });
  });

  describe('data fetching methods', () => {
    it('should call getList for ruoli profilo', () => {
      service.getRuoliProfilo().subscribe();
      expect(mockApiService.getList).toHaveBeenCalledWith('profilo/ruoli');
    });

    it('should call getList for servizi with dashboard param', () => {
      service.getServizi().subscribe();
      const callArgs = mockApiService.getList.mock.calls[0];
      expect(callArgs[0]).toBe('servizi');
      expect(callArgs[1].params.get('dashboard')).toBe('true');
    });

    it('should call getList for adesioni with dashboard param', () => {
      service.getAdesioni().subscribe();
      expect(mockApiService.getList.mock.calls[0][0]).toBe('adesioni');
    });

    it('should call getList for client', () => {
      service.getClient().subscribe();
      expect(mockApiService.getList.mock.calls[0][0]).toBe('client');
    });

    it('should call getList for comunicazioni (notifiche endpoint)', () => {
      service.getComunicazioni().subscribe();
      expect(mockApiService.getList.mock.calls[0][0]).toBe('notifiche');
    });

    it('should call getList for utenti', () => {
      service.getUtenti().subscribe();
      expect(mockApiService.getList.mock.calls[0][0]).toBe('utenti');
    });
  });

  describe('getDashboardCount', () => {
    it('should return observable', () => {
      mockAuthService.getUser.mockReturnValue({ ruolo: 'gestore' });
      const obs = service.getDashboardCount(60000);
      expect(obs).toBeDefined();
    });

    it('should cache the observable on second call', () => {
      mockAuthService.getUser.mockReturnValue({ ruolo: 'gestore' });
      const obs1 = service.getDashboardCount(60000);
      const obs2 = service.getDashboardCount(60000);
      expect(obs1).toBe(obs2);
    });

    it('should reset cache on stopDashboardPolling', () => {
      mockAuthService.getUser.mockReturnValue({ ruolo: 'gestore' });
      const obs1 = service.getDashboardCount(60000);
      service.stopDashboardPolling();
      const obs2 = service.getDashboardCount(60000);
      expect(obs1).not.toBe(obs2);
    });
  });

  describe('stopDashboardPolling', () => {
    it('should not throw when called without active polling', () => {
      expect(() => service.stopDashboardPolling()).not.toThrow();
    });
  });
});
