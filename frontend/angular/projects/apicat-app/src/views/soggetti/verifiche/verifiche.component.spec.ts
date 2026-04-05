import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { VerificheComponent } from './verifiche.component';

describe('VerificheComponent (soggetti)', () => {
  let component: VerificheComponent;
  const mockRoute = { params: of({ id: '1' }) } as any;
  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null),
  } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: { GOVAPI: { HOST: 'http://test' } } }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({ nome: 'TestSoggetto' })),
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    getMonitor: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockAuthenticationService = {
    _getConfigModule: vi.fn().mockReturnValue([]),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: { GOVAPI: { HOST: 'http://test' } } });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({ nome: 'TestSoggetto' }));
    mockRouter.getCurrentNavigation.mockReturnValue(null);
    mockTranslate.instant.mockImplementation((k: string) => k);
    mockAuthenticationService._getConfigModule.mockReturnValue([]);
    component = new VerificheComponent(
      mockRoute, mockRouter, mockTranslate,
      mockConfigService, mockTools, mockApiService, mockAuthenticationService
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

  it('should have default environmentId as collaudo', () => {
    expect(component.environmentId).toBe('collaudo');
  });

  it('should have default values', () => {
    expect(component._spin).toBe(true);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component.soggetto).toBeNull();
    expect(component._twoCol).toBe(false);
    expect(component._isPDND).toBe(false);
    expect(component._listTokenPolicy).toEqual([]);
  });

  it('should call getConfiguration in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should set api_url from config', () => {
    expect(component.api_url).toBe('http://test');
  });

  it('should have initial breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(1);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Checks');
  });

  it('should set error messages when error is true', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('should reset error messages when error is false', () => {
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.SelectStatistic');
    expect(component._messageHelp).toBe('APP.MESSAGE.SelectVerifichelp');
  });

  it('should switch to collaudo with _showCollaudo', () => {
    component.environmentId = 'produzione';
    component.soggetto = { nome: 'Test' };
    mockAuthenticationService._getConfigModule.mockReturnValue([
      { nome_soggetto: 'Test', collaudo: { lista_policy: ['p1'] } }
    ]);
    component._showCollaudo();
    expect(component.environmentId).toBe('collaudo');
  });

  it('should switch to produzione with _showProduzione', () => {
    component.soggetto = { nome: 'Test' };
    mockAuthenticationService._getConfigModule.mockReturnValue([
      { nome_soggetto: 'Test', produzione: { lista_policy: ['p2'] } }
    ]);
    component._showProduzione();
    expect(component.environmentId).toBe('produzione');
  });

  it('should return true for _isCollaudo when environmentId is collaudo', () => {
    component.environmentId = 'collaudo';
    expect(component._isCollaudo()).toBe(true);
  });

  it('should return false for _isCollaudo when environmentId is produzione', () => {
    component.environmentId = 'produzione';
    expect(component._isCollaudo()).toBe(false);
  });

  it('should init breadcrumb with soggetto name', () => {
    component.soggetto = { nome: 'MySoggetto' };
    component.id = 5;
    component._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(4);
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Subjects');
    expect(component.breadcrumbs[2].label).toBe('MySoggetto');
    expect(component.breadcrumbs[3].label).toBe('APP.TITLE.Checks');
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/soggetti' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/soggetti']);
  });
});
