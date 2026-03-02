import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { StatisticheComponent } from './statistiche.component';

describe('StatisticheComponent', () => {
  let component: StatisticheComponent;

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
    postMonitor: vi.fn().mockReturnValue(of({})),
    downloadMonitor: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({})
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.getCurrentNavigation.mockReturnValue(null);
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockTranslate.instant.mockImplementation((key: string) => key);
    component = new StatisticheComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService,
      mockAuthenticationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(StatisticheComponent.Name).toBe('StatisticheComponent');
  });

  it('should have model set to statistiche', () => {
    expect(component.model).toBe('statistiche');
  });

  it('should have default property values', () => {
    expect(component.id).toBeNull();
    expect(component.environmentId).toBe('collaudo');
    expect(component.service).toBeNull();
    expect(component._showFilter).toBe(true);
    expect(component._spin).toBe(true);
    expect(component.desktop).toBe(false);
    expect(component._error).toBe(false);
    expect(component._fromDashboard).toBe(false);
    expect(component.single).toEqual([]);
    expect(component.multi).toEqual([]);
    expect(component.multi_bar_chart).toEqual([]);
    expect(component.view).toBeNull();
  });

  it('should set config from configService in constructor', () => {
    expect(component.config).toEqual({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    });
  });

  it('should set service to null when getCurrentNavigation returns null', () => {
    expect(component.service).toBeNull();
  });

  it('should set service from navigation state if available', () => {
    mockRouter.getCurrentNavigation.mockReturnValue({
      extras: { state: { service: { nome: 'TestService' } } }
    });
    const comp = new StatisticheComponent(
      mockRoute, mockRouter, mockTranslate, mockConfigService,
      mockTools, mockApiService, mockAuthenticationService
    );
    expect(comp.service).toEqual({ nome: 'TestService' });
  });

  it('should have chart options defaults', () => {
    expect(component.showXAxis).toBe(true);
    expect(component.showYAxis).toBe(true);
    expect(component.gradient).toBe(false);
    expect(component.showLegend).toBe(true);
    expect(component.animations).toBe(true);
    expect(component.showGridLines).toBe(true);
  });

  it('should have default exportListDefault', () => {
    expect(component.exportListDefault.length).toBe(4);
    expect(component.exportListDefault[0].label).toBe('CSV');
    expect(component.exportListDefault[1].label).toBe('XLS');
    expect(component.exportListDefault[2].label).toBe('PDF');
    expect(component.exportListDefault[3].label).toBe('PNG');
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
    expect(component._messageHelp).toBe('APP.MESSAGE.SelectStatisticHelp');
  });

  it('should reset data on _resetData', () => {
    component._spin = true;
    component.single = [{ name: 'a', value: 1 }];
    component.multi = [{ name: 'a', series: [] }];
    component._resetData();
    expect(component._spin).toBe(false);
    expect(component.single).toEqual([]);
    expect(component.multi).toEqual([]);
    expect(component._error).toBe(false);
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

  it('should toggle _showFilter on _toggleFilter', () => {
    component._showFilter = true;
    component._toggleFilter();
    expect(component._showFilter).toBe(false);
    component._toggleFilter();
    expect(component._showFilter).toBe(true);
  });

  it('should set tipoGrafico on setTipoGrafico', () => {
    component.setTipoGrafico('pie');
    expect(component.tipoGrafico).toBe('pie');
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], { queryParamsHandling: 'preserve' });
  });
});
