import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { VerificheComponent, ViewType } from './verifiche.component';

describe('VerificheComponent', () => {
  let component: VerificheComponent;

  const mockRoute = {
    params: of({}),
    queryParams: of({})
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
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    }),
    getConfig: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockTools = {} as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    getMonitor: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({
      api: { profili: [] }
    })
  } as any;

  const mockUtilService = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({})
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.getCurrentNavigation.mockReturnValue(null);
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockTranslate.instant.mockImplementation((key: string) => key);
    component = new VerificheComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService,
      mockAuthenticationService,
      mockUtilService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(VerificheComponent.Name).toBe('VerificheComponent');
  });

  it('should have model set to verifiche', () => {
    expect(component.model).toBe('verifiche');
  });

  it('should have default property values', () => {
    expect(component.environmentId).toBe('collaudo');
    expect(component.viewType).toBe(ViewType.All);
    expect(component.period).toEqual({});
    expect(component.service).toBeNull();
    expect(component.serviceApi).toEqual([]);
    expect(component._spin).toBe(true);
    expect(component.desktop).toBe(false);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._preventMultiCall).toBe(false);
    expect(component._twoCol).toBe(false);
    expect(component._fromDashboard).toBe(false);
    expect(component.data).toEqual([]);
    expect(component.adhesions).toEqual([]);
  });

  it('should expose ViewType enum', () => {
    expect(component.ViewType).toBe(ViewType);
  });

  it('should set config from configService in constructor', () => {
    expect(component.config).toEqual({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    });
  });

  it('should set api_url from config', () => {
    expect(component.api_url).toBe('http://localhost');
  });

  it('should set service to null when getCurrentNavigation returns null', () => {
    expect(component.service).toBeNull();
  });

  it('should set service from navigation state if available', () => {
    mockRouter.getCurrentNavigation.mockReturnValue({
      extras: { state: { service: { nome: 'TestService' } } }
    });
    const comp = new VerificheComponent(
      mockRoute, mockRouter, mockTranslate, mockConfigService,
      mockTools, mockApiService, mockAuthenticationService, mockUtilService
    );
    expect(comp.service).toEqual({ nome: 'TestService' });
  });

  it('should have default breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(2);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
  });

  it('should set error messages on _setErrorMessages true', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('should reset error messages on _setErrorMessages false', () => {
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.SelectStatistic');
    expect(component._messageHelp).toBe('APP.MESSAGE.SelectVerifichelp');
  });

  it('should return true for _isCollaudo when environmentId is collaudo', () => {
    component.environmentId = 'collaudo';
    expect(component._isCollaudo()).toBe(true);
  });

  it('should return false for _isCollaudo when environmentId is produzione', () => {
    component.environmentId = 'produzione';
    expect(component._isCollaudo()).toBe(false);
  });

  it('should switch to collaudo on _showCollaudo', () => {
    component.environmentId = 'produzione';
    component._showCollaudo();
    expect(component.environmentId).toBe('collaudo');
  });

  it('should switch to produzione on _showProduzione', () => {
    component.environmentId = 'collaudo';
    component._showProduzione();
    expect(component.environmentId).toBe('produzione');
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
  });

  it('should return true for _isViewTypeAll when viewType is All', () => {
    component.viewType = ViewType.All;
    expect(component._isViewTypeAll()).toBe(true);
  });

  it('should return false for _isViewTypeAll when viewType is not All', () => {
    component.viewType = ViewType.Certificati;
    expect(component._isViewTypeAll()).toBe(false);
  });

  it('should return true for _isViewTypeEventi for EventiConnection', () => {
    component.viewType = ViewType.EventiConnection;
    expect(component._isViewTypeEventi()).toBe(true);
  });

  it('should return true for _isViewTypeEventi for EventiRead', () => {
    component.viewType = ViewType.EventiRead;
    expect(component._isViewTypeEventi()).toBe(true);
  });

  it('should return false for _isViewTypeEventi for All', () => {
    component.viewType = ViewType.All;
    expect(component._isViewTypeEventi()).toBe(false);
  });

  it('should return true for _isViewTypeViolazioni when Violazioni', () => {
    component.viewType = ViewType.Violazioni;
    expect(component._isViewTypeViolazioni()).toBe(true);
  });

  it('should return false for _isViewTypeViolazioni when not Violazioni', () => {
    component.viewType = ViewType.All;
    expect(component._isViewTypeViolazioni()).toBe(false);
  });

  it('should return correct icon for _getIconTypeEventiConnettivita', () => {
    component.viewType = ViewType.Violazioni;
    expect(component._getIconTypeEventiConnettivita()).toBe('triangle');

    component.viewType = ViewType.EventiConnection;
    expect(component._getIconTypeEventiConnettivita()).toBe('clock');

    component.viewType = ViewType.EventiRead;
    expect(component._getIconTypeEventiConnettivita()).toBe('clock');

    component.viewType = ViewType.All;
    expect(component._getIconTypeEventiConnettivita()).toBe('hdd-network');
  });

  it('should return correct title for _getTitleTypeEventiConnettivita', () => {
    component.viewType = ViewType.Violazioni;
    expect(component._getTitleTypeEventiConnettivita()).toBe('APP.TITLE.ViolazioniPolicyRateLimiting');

    component.viewType = ViewType.EventiConnection;
    expect(component._getTitleTypeEventiConnettivita()).toBe('APP.TITLE.EventiConnectionTimeout');

    component.viewType = ViewType.EventiRead;
    expect(component._getTitleTypeEventiConnettivita()).toBe('APP.TITLE.EventiReadTimeout');

    component.viewType = ViewType.All;
    expect(component._getTitleTypeEventiConnettivita()).toBe('APP.TITLE.Connettivita');
  });

  it('should return true for _isErogatoSoggettoDominioMapper with matching role', () => {
    expect(component._isErogatoSoggettoDominioMapper({ ruolo: 'erogato_soggetto_dominio' })).toBe(true);
  });

  it('should return false for _isErogatoSoggettoDominioMapper with non-matching role', () => {
    expect(component._isErogatoSoggettoDominioMapper({ ruolo: 'erogato_soggetto_aderente' })).toBe(false);
  });

  it('should return erogazioni for _tipoVerificaMapper with erogato_soggetto_dominio and no soggetto_interno', () => {
    component.service = { dominio: { soggetto_referente: { nome: 'test' } } };
    expect(component._tipoVerificaMapper({ ruolo: 'erogato_soggetto_dominio' })).toBe('erogazioni');
  });

  it('should return fruizioni for _tipoVerificaMapper with erogato_soggetto_dominio and soggetto_interno', () => {
    component.service = { soggetto_interno: { nome: 'test' } };
    expect(component._tipoVerificaMapper({ ruolo: 'erogato_soggetto_dominio' })).toBe('fruizioni');
  });

  it('should return fruizioni for _tipoVerificaMapper with other roles', () => {
    expect(component._tipoVerificaMapper({ ruolo: 'erogato_soggetto_aderente' })).toBe('fruizioni');
  });
});
