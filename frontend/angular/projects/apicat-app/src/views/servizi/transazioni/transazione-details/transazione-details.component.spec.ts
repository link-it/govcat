import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { TransazioneDetailsComponent } from './transazione-details.component';

describe('TransazioneDetailsComponent', () => {
  let component: TransazioneDetailsComponent;

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
    getConfig: vi.fn().mockReturnValue(of({})),
    getJson: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockTools = {} as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    getMonitorDetails: vi.fn().mockReturnValue(of({}))
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
    component = new TransazioneDetailsComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService,
      mockUtilService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(TransazioneDetailsComponent.Name).toBe('TransazioneDetailsComponent');
  });

  it('should have model set to transazioni', () => {
    expect(component.model).toBe('transazioni');
  });

  it('should have default property values', () => {
    expect(component.id).toBeNull();
    expect(component.data).toBeNull();
    expect(component.config).toBeNull();
    expect(component.service).toBeNull();
    expect(component.sid).toBeNull();
    expect(component.environmentId).toBe('collaudo');
    expect(component._spin).toBe(true);
    expect(component._downloading).toBe(true);
    expect(component.desktop).toBe(false);
    expect(component._useRoute).toBe(true);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._isEdit).toBe(false);
    expect(component._closeEdit).toBe(true);
    expect(component._isNew).toBe(false);
    expect(component._editable).toBe(true);
    expect(component._deleteable).toBe(false);
    expect(component._singleColumn).toBe(false);
    expect(component._hasFocus).toBe(false);
    expect(component._fromDashboard).toBe(false);
    expect(component._hasInvocazioneApi).toBe(false);
    expect(component._hasInformazioniToken).toBe(false);
  });

  it('should set appConfig from configService in constructor', () => {
    expect(component.appConfig).toEqual({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    });
  });

  it('should set apiUrl from appConfig', () => {
    expect(component.apiUrl).toBe('http://localhost');
  });

  it('should set service to null when getCurrentNavigation returns null', () => {
    expect(component.service).toBeNull();
  });

  it('should set service from navigation state if available', () => {
    mockRouter.getCurrentNavigation.mockReturnValue({
      extras: { state: { service: { nome: 'TestService' }, environment: 'produzione' } }
    });
    const comp = new TransazioneDetailsComponent(
      mockRoute, mockRouter, mockTranslate, mockConfigService,
      mockTools, mockApiService, mockUtilService
    );
    expect(comp.service).toEqual({ nome: 'TestService' });
    expect(comp.environment).toBe('produzione');
  });

  it('should have default environment as collaudo', () => {
    expect(component.environment).toBe('collaudo');
  });

  it('should have default tabs', () => {
    expect(component.tabs.length).toBe(3);
    expect(component.tabs[0].link).toBe('InformazioniGenerali');
    expect(component.tabs[1].link).toBe('InformazioniMittente');
    expect(component.tabs[2].link).toBe('DettaglioMessaggio');
  });

  it('should have default _currentTab', () => {
    expect(component._currentTab).toBe('InformazioniGenerali');
  });

  it('should switch tab on _onTabs', () => {
    component._onTabs('DettaglioMessaggio');
    expect(component._currentTab).toBe('DettaglioMessaggio');
  });

  it('should have default breadcrumbs as empty array', () => {
    expect(component.breadcrumbs).toEqual([]);
  });

  it('should navigate on onBreadcrumb when _useRoute is true', () => {
    component._useRoute = true;
    component.onBreadcrumb({ url: '/servizi', params: null });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], {
      state: null,
      queryParamsHandling: 'preserve'
    });
  });

  it('should not navigate on onBreadcrumb when _useRoute is false', () => {
    component._useRoute = false;
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should return form controls via f getter', () => {
    expect(component.f).toBeDefined();
  });

  it('should have imagePlaceHolder set', () => {
    expect(component._imagePlaceHolder).toBe('./assets/images/logo-placeholder.png');
  });

  it('should have hasTab as true', () => {
    expect(component.hasTab).toBe(true);
  });
});
