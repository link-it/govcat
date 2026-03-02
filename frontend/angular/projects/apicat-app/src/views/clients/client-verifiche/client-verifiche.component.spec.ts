import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ClientVerificheComponent } from './client-verifiche.component';

describe('ClientVerificheComponent', () => {
  let component: ClientVerificheComponent;
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
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    getMonitor: vi.fn().mockReturnValue(of({})),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: { GOVAPI: { HOST: 'http://test' } } });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({}));
    mockRouter.getCurrentNavigation.mockReturnValue(null);
    mockTranslate.instant.mockImplementation((k: string) => k);
    component = new ClientVerificheComponent(
      mockRoute, mockRouter, mockTranslate,
      mockConfigService, mockTools, mockApiService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name as VerificheComponent', () => {
    expect(ClientVerificheComponent.Name).toBe('VerificheComponent');
  });

  it('should have model set to verifiche', () => {
    expect(component.model).toBe('verifiche');
  });

  it('should have default environmentId as collaudo', () => {
    expect(component.environmentId).toBe('collaudo');
  });

  it('should have included as false by default', () => {
    expect(component.included).toBe(false);
  });

  it('should have default values', () => {
    expect(component._spin).toBe(true);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component.client).toBeNull();
    expect(component._twoCol).toBe(false);
    expect(component._preventMultiCall).toBe(false);
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
    component.client = { dati_specifici: { auth_type: 'pdnd' }, soggetto: { nome: 'S1' }, nome: 'C1' };
    mockApiService.getMonitor.mockReturnValue(of({ esito: 'ok' }));
    component._showCollaudo();
    expect(component.environmentId).toBe('collaudo');
  });

  it('should switch to produzione with _showProduzione', () => {
    component.client = { dati_specifici: { auth_type: 'pdnd' }, soggetto: { nome: 'S1' }, nome: 'C1' };
    mockApiService.getMonitor.mockReturnValue(of({ esito: 'ok' }));
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

  it('should have esiti list with expected values', () => {
    expect(component._esiti.length).toBe(7);
    const values = component._esiti.map((e: any) => e.value);
    expect(values).toContain('valido');
    expect(values).toContain('in_scadenza');
    expect(values).toContain('scaduto');
    expect(values).toContain('http_error');
    expect(values).toContain('ok');
    expect(values).toContain('warning');
    expect(values).toContain('errore');
  });

  it('should normalize result: valido -> ok', () => {
    const result = component._normalizeResult({ esito: 'valido', dettagli: 'test' });
    expect(result.esito).toBe('ok');
    expect(result.dettagli).toBe('test');
  });

  it('should normalize result: in_scadenza -> warning', () => {
    const result = component._normalizeResult({ esito: 'in_scadenza' });
    expect(result.esito).toBe('warning');
  });

  it('should normalize result: scaduto -> errore', () => {
    const result = component._normalizeResult({ esito: 'scaduto' });
    expect(result.esito).toBe('errore');
  });

  it('should keep unknown esiti unchanged in normalizeResult', () => {
    const result = component._normalizeResult({ esito: 'something_else' });
    expect(result.esito).toBe('something_else');
  });

  it('should return color for known esito with _getColor', () => {
    expect(component._getColor({ esito: 'ok' })).toBe('success');
    expect(component._getColor({ esito: 'warning' })).toBe('warning');
    expect(component._getColor({ esito: 'errore' })).toBe('danger');
  });

  it('should return secondary for unknown esito with _getColor', () => {
    expect(component._getColor({ esito: 'unknown' })).toBe('secondary');
  });

  it('should return colorHex for known esito with _getColorHex', () => {
    expect(component._getColorHex({ esito: 'ok' })).toBe('#a6d75b');
    expect(component._getColorHex({ esito: 'warning' })).toBe('#f0ad4e');
    expect(component._getColorHex({ esito: 'errore' })).toBe('#dd2b0e');
  });

  it('should return default colorHex for unknown esito', () => {
    expect(component._getColorHex({ esito: 'unknown' })).toBe('#f1f1f1');
  });

  it('should return label for known esito with _getLabel', () => {
    expect(component._getLabel({ esito: 'ok' })).toBe('APP.VERIFY.ESITO.Ok');
    expect(component._getLabel({ esito: 'valido' })).toBe('APP.VERIFY.ESITO.Valido');
  });

  it('should return raw esito for unknown esito with _getLabel', () => {
    expect(component._getLabel({ esito: 'custom_esito' })).toBe('custom_esito');
  });

  it('should detect not-valid-ok correctly with _isNotValidoOk', () => {
    expect(component._isNotValidoOk({ esito: 'valido' })).toBe(false);
    expect(component._isNotValidoOk({ esito: 'ok' })).toBe(false);
    expect(component._isNotValidoOk({ esito: 'errore' })).toBe(true);
    expect(component._isNotValidoOk({ esito: 'warning' })).toBe(true);
  });

  it('should detect valid-ok correctly with _isValidOk', () => {
    expect(component._isValidOk({ esito: 'valido' })).toBe(true);
    expect(component._isValidOk({ esito: 'ok' })).toBe(true);
    expect(component._isValidOk({ esito: 'errore' })).toBe(false);
    expect(component._isValidOk(null)).toBe(false);
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/client' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/client']);
  });

  it('should init breadcrumb with client name', () => {
    component.client = { nome: 'MyClient', stato: 'attivo' };
    component.id = 7;
    component._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(4);
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Client');
    expect(component.breadcrumbs[2].label).toBe('MyClient');
    expect(component.breadcrumbs[3].label).toBe('APP.TITLE.Checks');
  });

  it('should have null _result by default', () => {
    expect(component._result).toBeNull();
  });

  it('should have _showDetails as false by default', () => {
    expect(component._showDetails).toBe(false);
  });

  it('should have _stato as scaduti by default', () => {
    expect(component._stato).toBe('scaduti');
  });
});
