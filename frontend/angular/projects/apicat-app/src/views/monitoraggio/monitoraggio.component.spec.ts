import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { MonitoraggioComponent } from './monitoraggio.component';

describe('MonitoraggioComponent', () => {
  let component: MonitoraggioComponent;
  const mockRoute = {} as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { GOVAPI: { HOST: 'http://api' } }
    }),
    getConfig: vi.fn().mockReturnValue(of({ useTheme: false, reduced: true })),
  } as any;
  const mockEventsManager = {
    broadcast: vi.fn(),
    on: vi.fn(),
  } as any;
  const mockAuthService = {
    _getConfigModule: vi.fn().mockReturnValue({
      ambiente_default: 'collaudo',
      periodi: { periodo_1: 120, periodo_2: 1440 }
    }),
    hasPermission: vi.fn().mockReturnValue(true),
  } as any;
  const mockApiService = {
    getMonitor: vi.fn().mockReturnValue(of({ content: [], page: {}, _links: {} })),
  } as any;
  const mockUtilService = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { GOVAPI: { HOST: 'http://api' } }
    });
    mockConfigService.getConfig.mockReturnValue(of({ useTheme: false, reduced: true }));
    mockAuthService._getConfigModule.mockReturnValue({
      ambiente_default: 'collaudo',
      periodi: { periodo_1: 120, periodo_2: 1440 }
    });
    mockAuthService.hasPermission.mockReturnValue(true);
    mockApiService.getMonitor.mockReturnValue(of({ content: [], page: {}, _links: {} }));
    component = new MonitoraggioComponent(
      mockRoute, mockRouter, mockModalService, mockTranslate,
      mockConfigService, mockEventsManager, mockAuthService,
      mockApiService, mockUtilService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(MonitoraggioComponent.Name).toBe('MonitoraggioComponent');
  });

  it('should have breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(1);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Monitoring');
  });

  it('should set api_url from config', () => {
    expect(component.api_url).toBe('http://api');
  });

  it('should set environmentId from dashboard config', () => {
    expect(component.environmentId).toBe('collaudo');
  });

  it('should set periods from config', () => {
    expect(component._minutesPeriodo1).toBe(120);
    expect(component._minutesPeriodo2).toBe(1440);
  });

  it('should have periodo1 and periodo2 set', () => {
    expect(component.periodo1).toBeDefined();
    expect(component.periodo1.periodo1_data_inizio_verifica).toBeTruthy();
    expect(component.periodo2).toBeDefined();
    expect(component.periodo2.periodo2_data_inizio_verifica).toBeTruthy();
  });

  it('should set error messages', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
  });

  it('should show choose environment when no environmentId', () => {
    component.environmentId = '' as any;
    component._setErrorMessages(false);
    expect(component._message).toBe('APP.MESSAGE.ChooseEnvironment');
  });

  it('should show/check collaudo', () => {
    component._showCollaudo();
    expect(component.environmentId).toBe('collaudo');
    expect(component._isCollaudo()).toBe(true);
    expect(component._isProduzione()).toBe(false);
  });

  it('should show/check produzione', () => {
    component._showProduzione();
    expect(component.environmentId).toBe('produzione');
    expect(component._isProduzione()).toBe(true);
    expect(component._isCollaudo()).toBe(false);
  });

  it('should toggle theme', () => {
    expect(component._useTheme).toBe(false);
    component._toggleTheme();
    expect(component._useTheme).toBe(true);
    component._toggleTheme();
    expect(component._useTheme).toBe(false);
  });

  it('should toggle reduced', () => {
    const initial = component._dashboardReduced;
    component._toggleReduced();
    expect(component._dashboardReduced).toBe(!initial);
  });

  it('should clear all state', () => {
    component.currentSection = { title: 'test' };
    component.currentBlock = { name: 'test' };
    component.currentElement = { id: '1' };
    component.elements = [{ id: '1' }];
    component.clearAll();
    expect(component.currentSection).toBeNull();
    expect(component.currentBlock).toBeNull();
    expect(component.currentElement).toBeNull();
    expect(component.elements).toEqual([]);
  });

  it('should close details', () => {
    component.showDetails = true;
    component.closeDetails();
    expect(component.showDetails).toBe(false);
  });

  it('should check permission', () => {
    expect(component._hasPermission({ permission: 'monitoraggio' })).toBe(true);
    expect(mockAuthService.hasPermission).toHaveBeenCalledWith('monitoraggio', 'view');
  });

  it('should build data URI', () => {
    component.environmentId = 'collaudo' as any;
    component.currentBlock = { path: 'certificati/scadenza' };
    expect(component._getDataUri()).toBe('collaudo/certificati/scadenza');
  });

  it('should return empty URI when no environmentId', () => {
    component.environmentId = '' as any;
    component.currentBlock = null;
    expect(component._getDataUri()).toBe('');
  });

  it('should return block period', () => {
    expect(component._getBlockPeriod({ name: 'periodo1' })).toBe(120);
    expect(component._getBlockPeriod(null)).toBe(0);
  });

  it('should return block period hours', () => {
    expect(component._getBlockPeriodHours({ name: 'periodo1' })).toBe(2);
    expect(component._getBlockPeriodHours({ name: 'periodo2' })).toBe(24);
    expect(component._getBlockPeriodHours(null)).toBe(0);
  });

  it('should return block translate data', () => {
    const data = component._getBlockTranslateData({ name: 'periodo1' });
    expect(data!.hours).toBe('2');
    expect(data!.minutes).toBe('');
    expect(component._getBlockTranslateData(null)).toBeNull();
  });

  it('should return tooltip period', () => {
    const tooltip = component._tooltipPeriod();
    expect(tooltip).toContain(component.periodo1.periodo1_data_inizio_verifica);
    expect(tooltip).toContain(component.periodo2.periodo2_data_inizio_verifica);
  });

  it('should prepare services data', () => {
    const data = [{ id_servizio: 's1', nome: 'Test', versione: '1', descrizione_sintetica: 'Desc', stato: 'pubblicato', visibilita: 'dominio' }];
    const result = component._prepareServicesData(data);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('s1');
    expect(result[0].nome).toBe('Test');
  });

  it('should return empty array for null services data', () => {
    expect(component._prepareServicesData(null as any)).toEqual([]);
  });

  it('should prepare clients data', () => {
    const data = [{ id_client: 'c1', nome: 'Client1' }];
    const result = component._prepareClientsData(data);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('c1');
    expect(result[0].nome).toBe('Client1');
  });

  it('should return empty array for null clients data', () => {
    expect(component._prepareClientsData(null as any)).toEqual([]);
  });

  it('should refresh and broadcast event', () => {
    component.refresh();
    expect(mockEventsManager.broadcast).toHaveBeenCalled();
  });

  it('should handle keyboard Ctrl+T for theme toggle', () => {
    const initial = component._useTheme;
    component.keyEvent({ key: 't', ctrlKey: true } as KeyboardEvent);
    expect(component._useTheme).toBe(!initial);
  });

  it('should handle keyboard Ctrl+R for reduced toggle', () => {
    const initial = component._dashboardReduced;
    component.keyEvent({ key: 'r', ctrlKey: true } as KeyboardEvent);
    expect(component._dashboardReduced).toBe(!initial);
  });

  it('should get block period params for periodo1', () => {
    component.currentBlock = { name: 'periodo1' };
    const params = component._getBlockPeriodParams();
    expect(params.data_inizio_verifica).toBe(component.periodo1.periodo1_data_inizio_verifica);
    expect(params.data_fine_verifica).toBe(component.periodo1.periodo1_data_fine_verifica);
  });

  it('should get block period params for periodo2', () => {
    component.currentBlock = { name: 'periodo2' };
    const params = component._getBlockPeriodParams();
    expect(params.data_inizio_verifica).toBe(component.periodo2.periodo2_data_inizio_verifica);
  });

  it('should return empty object for unknown period', () => {
    component.currentBlock = { name: 'unknown' };
    expect(component._getBlockPeriodParams()).toEqual({});
  });
});
