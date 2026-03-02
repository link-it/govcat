import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { TransazioniComponent } from './transazioni.component';

describe('TransazioniComponent', () => {
  let component: TransazioniComponent;

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
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        DEFAULT_TRANSACTION_INTERVAL: 30
      }
    }),
    getConfig: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockEventsManagerService = {
    on: vi.fn(),
    broadcast: vi.fn()
  } as any;

  const mockTools = {} as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    postMonitor: vi.fn().mockReturnValue(of({})),
    getMonitor: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({
      stati_scheda_adesione: []
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
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        DEFAULT_TRANSACTION_INTERVAL: 30
      }
    });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockTranslate.instant.mockImplementation((key: string) => key);
    mockEventsManagerService.on.mockImplementation(() => {});
    component = new TransazioniComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockConfigService,
      mockEventsManagerService,
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
    expect(TransazioniComponent.Name).toBe('TransazioniComponent');
  });

  it('should have model set to transazioni', () => {
    expect(component.model).toBe('transazioni');
  });

  it('should have default property values', () => {
    expect(component.id).toBeNull();
    expect(component.environmentId).toBe('collaudo');
    expect(component.service).toBeNull();
    expect(component._hasFilter).toBe(true);
    expect(component._spin).toBe(true);
    expect(component._spinExport).toBe(false);
    expect(component.desktop).toBe(false);
    expect(component._error).toBe(false);
    expect(component._isEdit).toBe(false);
    expect(component._preventMultiCall).toBe(false);
    expect(component.showHistory).toBe(false);
    expect(component.showSearch).toBe(true);
    expect(component.showSorting).toBe(true);
    expect(component.viewBoxed).toBe(false);
    expect(component._fromDashboard).toBe(false);
    expect(component._isBack).toBe(false);
  });

  it('should set config from configService in constructor', () => {
    expect(component.config).toEqual({
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        DEFAULT_TRANSACTION_INTERVAL: 30
      }
    });
  });

  it('should set api_url from config', () => {
    expect(component.api_url).toBe('http://localhost');
  });

  it('should set defaultTransactionInterval from config', () => {
    expect(component.defaultTransactionInterval).toBe(30);
  });

  it('should set service to null when getCurrentNavigation returns null', () => {
    expect(component.service).toBeNull();
  });

  it('should set service from navigation state if available', () => {
    mockRouter.getCurrentNavigation.mockReturnValue({
      extras: { state: { service: { nome: 'TestService' }, back: true } }
    });
    const comp = new TransazioniComponent(
      mockRoute, mockRouter, mockTranslate, mockConfigService,
      mockEventsManagerService, mockTools, mockApiService,
      mockAuthenticationService, mockUtilService
    );
    expect(comp.service).toEqual({ nome: 'TestService' });
    expect(comp._isBack).toBe(true);
  });

  it('should have elements as empty array', () => {
    expect(component.elements).toEqual([]);
  });

  it('should have default breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(2);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
  });

  it('should have default sort settings', () => {
    expect(component.sortField).toBe('date');
    expect(component.sortDirection).toBe('asc');
  });

  it('should set error messages on _setErrorMessages true', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('should set unauthorized message on 403 error', () => {
    component.service = { id_servizio: '123' };
    component._setErrorMessages(true, { error: { status: 403 } });
    expect(component._message).toBe('APP.MESSAGE.ERROR.Unauthorized');
  });

  it('should reset error messages on _setErrorMessages false', () => {
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
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

  it('should navigate on _onNew', () => {
    component._onNew();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['transazioni', 'new']);
  });

  it('should return form controls via f getter', () => {
    expect(component.f).toBeDefined();
    expect(component.f['data_da']).toBeDefined();
    expect(component.f['data_a']).toBeDefined();
  });

  it('should have _useNewSearchUI as true', () => {
    expect(component._useNewSearchUI).toBe(true);
  });

  it('should have searchFields defined', () => {
    expect(component.searchFields.length).toBeGreaterThan(0);
  });

  it('should _getSoggettoNome from service soggetto_interno', () => {
    component.service = { soggetto_interno: { nome: 'SogInterno' } };
    expect((component as any)._getSoggettoNome()).toBe('SogInterno');
  });

  it('should _getSoggettoNome from service dominio when soggetto_interno is missing', () => {
    component.service = { dominio: { soggetto_referente: { nome: 'SogRef' } } };
    expect((component as any)._getSoggettoNome()).toBe('SogRef');
  });
});
