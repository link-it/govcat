import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ServizioApiPdndInformationsComponent } from './servizio-api-pdnd-informations.component';

describe('ServizioApiPdndInformationsComponent', () => {
  let component: ServizioApiPdndInformationsComponent;

  const mockRoute = {
    data: of({}),
    params: of({ id: '1', aid: '10' }),
    queryParams: of({}),
    parent: { params: of({ id: '1' }) }
  } as any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null)
  } as any;

  const mockTranslate = {
    instant: vi.fn().mockImplementation((key: string) => key)
  } as any;

  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        Services: { hideVersions: false }
      }
    }),
    getConfig: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockTools = {} as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({}))
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ServizioApiPdndInformationsComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioApiPdndInformationsComponent.Name).toBe('ServizioApiPdndInformationsComponent');
  });

  it('should have model set to api', () => {
    expect(component.model).toBe('api');
  });

  it('should read config from configService in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(component.config).toBeDefined();
  });

  it('should have default values', () => {
    expect(component.id).toBe(0);
    expect(component.sid).toBeNull();
    expect(component.environmentId).toBe('');
    expect(component.eserviceId).toBe('');
    expect(component.producerId).toBe('');
    expect(component._spin).toBe(true);
    expect(component._useRoute).toBe(false);
    expect(component._hasTabCollaudo).toBe(false);
    expect(component._hasTabProduzione).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.ChooseEnvironment');
    expect(component._messageHelp).toBe('APP.MESSAGE.ChooseEnvironmentHelp');
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
  });

  it('should set environmentId to collaudo on _showCollaudo', () => {
    component.servizioApi = { proprieta_custom: [] };
    component._showCollaudo();
    expect(component.environmentId).toBe('collaudo');
  });

  it('should set environmentId to produzione on _showProduzione', () => {
    component.servizioApi = { proprieta_custom: [] };
    component._showProduzione();
    expect(component.environmentId).toBe('produzione');
  });

  it('should return true for _isCollaudo when environmentId is collaudo', () => {
    component.environmentId = 'collaudo';
    expect(component._isCollaudo()).toBe(true);
    expect(component._isProduzione()).toBe(false);
  });

  it('should return true for _isProduzione when environmentId is produzione', () => {
    component.environmentId = 'produzione';
    expect(component._isProduzione()).toBe(true);
    expect(component._isCollaudo()).toBe(false);
  });

  it('should return false for _hasPDNDConfiguredMapper when no proprieta_custom', () => {
    component.servizioApi = null;
    expect(component._hasPDNDConfiguredMapper('collaudo')).toBe(false);
  });

  it('should return false for _hasPDNDConfiguredMapper when proprieta_custom is empty', () => {
    component.servizioApi = { proprieta_custom: [] };
    expect(component._hasPDNDConfiguredMapper('collaudo')).toBe(false);
  });

  it('should return eservice id from _getEService when found', () => {
    component.servizioApi = {
      proprieta_custom: [
        {
          gruppo: 'PDNDCollaudo_identificativo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'eservice-123' }]
        }
      ]
    };
    expect(component._getEService('collaudo')).toBe('eservice-123');
  });

  it('should fallback to old convention in _getEService', () => {
    component.servizioApi = {
      proprieta_custom: [
        {
          gruppo: 'PDNDCollaudo',
          proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: 'eservice-old' }]
        }
      ]
    };
    expect(component._getEService('collaudo')).toBe('eservice-old');
  });

  it('should return empty string from _getEService when not found', () => {
    component.servizioApi = { proprieta_custom: [] };
    expect(component._getEService('collaudo')).toBe('');
  });

  it('should handle _setLoading', () => {
    vi.useFakeTimers();
    component._setLoading(true);
    vi.advanceTimersByTime(30);
    expect(component._spin).toBe(true);
    component._setLoading(false);
    vi.advanceTimersByTime(30);
    expect(component._spin).toBe(false);
    vi.useRealTimers();
  });

  it('should handle onActionMonitor backview', () => {
    component.service = { id_servizio: '42' };
    component.onActionMonitor({ action: 'backview' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
  });

  it('should handle onActionMonitor unknown action', () => {
    mockRouter.navigate.mockClear();
    component.onActionMonitor({ action: 'unknown' });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should set hideVersions from config', () => {
    expect(component.hideVersions).toBe(false);
  });

  it('should _autoSelectTab when servizioApi has no PDND', () => {
    component.servizioApi = { proprieta_custom: [] };
    component._autoSelectTab();
    expect(component._hasTabCollaudo).toBe(false);
    expect(component._hasTabProduzione).toBe(false);
  });
});
