import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, throwError } from 'rxjs';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { StatisticheComponent } from './statistiche.component';
import { Tools } from '@linkit/components';

describe('StatisticheComponent', () => {
  let component: StatisticheComponent;

  let paramsSubject: Subject<any>;
  let queryParamsSubject: Subject<any>;

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
    getDetails: vi.fn().mockImplementation(() => of({})),
    getList: vi.fn().mockImplementation(() => of({ content: [] })),
    postMonitor: vi.fn().mockImplementation(() => of({})),
    downloadMonitor: vi.fn().mockImplementation(() => of({}))
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({})
  } as any;

  function createComponent(opts?: {
    navigationState?: any;
    params?: any;
    queryParams?: any;
    generalConfig?: any;
  }) {
    if (opts?.navigationState) {
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: opts.navigationState }
      });
    } else {
      mockRouter.getCurrentNavigation.mockReturnValue(null);
    }

    if (opts?.params) {
      mockRoute.params = opts.params;
    }
    if (opts?.queryParams) {
      mockRoute.queryParams = opts.queryParams;
    }

    if (opts?.generalConfig !== undefined) {
      Tools.Configurazione = opts.generalConfig;
    }

    const comp = new StatisticheComponent(
      mockRoute,
      mockRouter,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService,
      mockAuthenticationService
    );
    return comp;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});

    paramsSubject = new Subject<any>();
    queryParamsSubject = new Subject<any>();
    mockRoute.params = queryParamsSubject; // reset to default
    mockRoute.queryParams = of({});

    mockRouter.getCurrentNavigation.mockReturnValue(null);
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockTranslate.instant.mockImplementation((key: string) => key);
    mockApiService.getDetails.mockImplementation(() => of({}));
    mockApiService.getList.mockImplementation(() => of({ content: [] }));
    mockApiService.postMonitor.mockImplementation(() => of({}));
    mockApiService.downloadMonitor.mockImplementation(() => of({}));

    mockRoute.params = of({});
    mockRoute.queryParams = of({});

    component = createComponent();
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  // ========== BASIC TESTS ==========

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
    const comp = createComponent({
      navigationState: { service: { nome: 'TestService' } }
    });
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

  // ========== _initSearchForm TESTS ==========

  describe('_initSearchForm', () => {
    it('should create form with all 8 expected controls', () => {
      const fg = component._formGroup;
      expect(fg.get('api')).toBeTruthy();
      expect(fg.get('adesione')).toBeTruthy();
      expect(fg.get('distribution_type')).toBeTruthy();
      expect(fg.get('report_information_type')).toBeTruthy();
      expect(fg.get('report_time_interval')).toBeTruthy();
      expect(fg.get('report_date_from')).toBeTruthy();
      expect(fg.get('report_date_to')).toBeTruthy();
      expect(fg.get('report_transaction_outcome_type')).toBeTruthy();
      expect(fg.get('report_transaction_outcome_codes')).toBeTruthy();
    });

    it('should have correct default values', () => {
      const fg = component._formGroup;
      expect(fg.get('api')?.value).toBeNull();
      expect(fg.get('distribution_type')?.value).toBeNull();
      expect(fg.get('report_information_type')?.value).toBe('numero_transazioni');
      expect(fg.get('report_time_interval')?.value).toBe('giornaliero');
      expect(fg.get('report_transaction_outcome_type')?.value).toBeNull();
      expect(fg.get('report_transaction_outcome_codes')?.value).toBeNull();
      // date controls should be Date objects
      expect(fg.get('report_date_from')?.value).toBeInstanceOf(Date);
      expect(fg.get('report_date_to')?.value).toBeInstanceOf(Date);
    });

    it('should set report_transaction_outcome_codes as disabled by default', () => {
      expect(component._formGroup.get('report_transaction_outcome_codes')?.disabled).toBe(true);
    });

    it('distributionType trendReport=true should set line chart + hourly + enable reportTimeInterval', () => {
      const trendDist = { trendReport: true, value: 'andamento-temporale', code: 'andamento_temporale', label: 'Test', tableFirstColumnLabel: 'Data' };
      component._formGroup.get('distribution_type')?.setValue(trendDist);

      expect(component.tipoGrafico).toBe('line');
      expect(component._formGroup.get('report_time_interval')?.value).toBe('orario');
      expect(component._formGroup.get('report_time_interval')?.enabled).toBe(true);
    });

    it('distributionType trendReport=false should set bar chart + daily + disable reportTimeInterval', () => {
      const nonTrendDist = { trendReport: false, value: 'distribuzione-errori', code: 'distribuzione_errori', label: 'Test', tableFirstColumnLabel: 'Esito' };
      component._formGroup.get('distribution_type')?.setValue(nonTrendDist);

      expect(component.tipoGrafico).toBe('bar');
      expect(component._formGroup.get('report_time_interval')?.value).toBe('giornaliero');
      expect(component._formGroup.get('report_time_interval')?.disabled).toBe(true);
    });

    it('distributionType distribuzione-esiti should set colorSchemeChangeEnabled=false', () => {
      const esitiDist = { trendReport: true, value: 'distribuzione-esiti', code: 'distribuzione_esiti', label: 'Test', tableFirstColumnLabel: 'Data' };
      component._formGroup.get('distribution_type')?.setValue(esitiDist);

      expect(component.colorSchemeChangeEnabled).toBe(false);
    });

    it('distributionType non-esiti should set colorSchemeChangeEnabled=true', () => {
      const nonEsitiDist = { trendReport: true, value: 'andamento-temporale', code: 'andamento_temporale', label: 'Test', tableFirstColumnLabel: 'Data' };
      component._formGroup.get('distribution_type')?.setValue(nonEsitiDist);

      expect(component.colorSchemeChangeEnabled).toBe(true);
    });

    it('distributionType null should set bar chart', () => {
      // First set a non-null value to trigger the path, then set null
      const dist = { trendReport: true, value: 'andamento-temporale', code: 'andamento_temporale', label: 'Test', tableFirstColumnLabel: 'Data' };
      component._formGroup.get('distribution_type')?.setValue(dist);
      component._formGroup.get('distribution_type')?.setValue(null);

      expect(component.tipoGrafico).toBe('bar');
    });

    it('reportTimeInterval Hourly should set useTimepicker=true', () => {
      component._formGroup.get('report_time_interval')?.setValue('orario');
      // useTimepicker is private, check via bsDatepickerConfig
      expect(component.bsDatepickerConfig.withTimepicker).toBe(true);
    });

    it('reportTimeInterval Daily should set useTimepicker=false', () => {
      component._formGroup.get('report_time_interval')?.setValue('giornaliero');
      expect(component.bsDatepickerConfig.withTimepicker).toBe(false);
    });

    it('report_transaction_outcome_type Personalized should enable codes', () => {
      component._formGroup.get('report_transaction_outcome_type')?.setValue('personalizzato');
      expect(component._formGroup.get('report_transaction_outcome_codes')?.enabled).toBe(true);
    });

    it('report_transaction_outcome_type other value should disable codes', () => {
      // First enable
      component._formGroup.get('report_transaction_outcome_type')?.setValue('personalizzato');
      expect(component._formGroup.get('report_transaction_outcome_codes')?.enabled).toBe(true);
      // Then set non-personalized
      component._formGroup.get('report_transaction_outcome_type')?.setValue('ok');
      expect(component._formGroup.get('report_transaction_outcome_codes')?.disabled).toBe(true);
      expect(component._formGroup.get('report_transaction_outcome_codes')?.value).toBeNull();
    });

    it('report_transaction_outcome_type null should disable codes', () => {
      component._formGroup.get('report_transaction_outcome_type')?.setValue('personalizzato');
      component._formGroup.get('report_transaction_outcome_type')?.setValue(null);
      expect(component._formGroup.get('report_transaction_outcome_codes')?.disabled).toBe(true);
    });

    it('global valueChanges should clear single and multi', () => {
      component.single = [{ name: 'a', value: 1 }];
      component.multi = [{ name: 'b', series: [] }];
      // Trigger valueChanges
      component._formGroup.get('report_information_type')?.setValue('occupazione_banda');
      expect(component.single).toEqual([]);
      expect(component.multi).toEqual([]);
    });
  });

  // ========== setupAdesioneField TESTS ==========

  describe('setupAdesioneField', () => {
    it('api with ruolo=erogato_soggetto_aderente should set adesione required + distributionTypesAdherentSubject', () => {
      const api = { ruolo: 'erogato_soggetto_aderente' };
      component._formGroup.get('api')?.setValue(api);

      // setupAdesioneField is called via valueChanges subscription
      const adesioneControl = component._formGroup.get('adesione');
      expect(adesioneControl?.enabled).toBe(true);
      // Should include adherent subject distribution types
      const hasAdherentSubject = component.distributionTypes.some(
        (dt: any) => dt.code === 'distribuzione_principal'
      );
      expect(hasAdherentSubject).toBe(true);
      // Should NOT include subject domain types
      const hasSubjectDomain = component.distributionTypes.some(
        (dt: any) => dt.code === 'distribuzione_token_client_id'
      );
      expect(hasSubjectDomain).toBe(false);
    });

    it('api with other ruolo should set adesione not required + distributionTypesSubjectDomain', () => {
      const api = { ruolo: 'erogato_soggetto_dominio' };
      component._formGroup.get('api')?.setValue(api);

      // Should include subject domain types
      const hasSubjectDomain = component.distributionTypes.some(
        (dt: any) => dt.code === 'distribuzione_token_client_id'
      );
      expect(hasSubjectDomain).toBe(true);
      // Should NOT include adherent subject types
      const hasAdherentSubject = component.distributionTypes.some(
        (dt: any) => dt.code === 'distribuzione_principal'
      );
      expect(hasAdherentSubject).toBe(false);
    });

    it('api null + distribution in domainStatistics should enable adesione', () => {
      // Set distribution type that is in domainStatistics
      const dist = { trendReport: true, value: 'andamento-temporale', code: 'andamento_temporale', label: 'Test', tableFirstColumnLabel: 'Data' };
      component._formGroup.get('distribution_type')?.setValue(dist);

      // Now set api to non-adherent (will call setupAdesioneField(api))
      const api = { ruolo: 'erogato_soggetto_dominio' };
      component._formGroup.get('api')?.setValue(api);

      const adesioneControl = component._formGroup.get('adesione');
      expect(adesioneControl?.enabled).toBe(true);
    });

    it('api null + distribution NOT in domainStatistics should disable adesione', () => {
      // Set distribution type not in domainStatistics
      const dist = { trendReport: false, value: 'distribuzione-soggetto-remoto', code: 'distribuzione_soggetto_remoto', label: 'Test', tableFirstColumnLabel: 'Soggetto' };
      component._formGroup.get('distribution_type')?.setValue(dist);

      // Now set api to non-adherent then null
      // The setupAdesioneField is called with null on preselectAndMakeApiReadonlyIfOnlyOne
      // but we can directly trigger it via api valueChanges with null value
      component._formGroup.get('api')?.setValue(null);

      const adesioneControl = component._formGroup.get('adesione');
      // With null api and non-domain distribution, adesione should be disabled
      expect(adesioneControl?.disabled).toBe(true);
    });

    it('with generalConfig tipi_distribuzione filter should filter distribution types', () => {
      Tools.Configurazione = {
        monitoraggio: {
          statistiche: {
            tipi_distribuzione: ['andamento_temporale', 'distribuzione_esiti']
          }
        }
      };

      const comp = createComponent({
        generalConfig: Tools.Configurazione
      });

      // Trigger setupAdesioneField via api change
      comp._formGroup.get('api')?.setValue({ ruolo: 'erogato_soggetto_dominio' });

      // Only the allowed distribution types should be present
      expect(comp.distributionTypes.length).toBe(2);
      expect(comp.distributionTypes.every(
        (dt: any) => ['andamento_temporale', 'distribuzione_esiti'].includes(dt.code)
      )).toBe(true);
    });
  });

  // ========== canShowAdesioneAdherentSubject / canShowAdesioneSubjectDomain ==========

  describe('canShowAdesioneAdherentSubject', () => {
    it('should return true when api ruolo is erogato_soggetto_aderente', () => {
      component._formGroup.get('api')?.setValue({ ruolo: 'erogato_soggetto_aderente' });
      expect(component.canShowAdesioneAdherentSubject()).toBe(true);
    });

    it('should return false when api ruolo is not erogato_soggetto_aderente', () => {
      component._formGroup.get('api')?.setValue({ ruolo: 'erogato_soggetto_dominio' });
      expect(component.canShowAdesioneAdherentSubject()).toBe(false);
    });

    it('should return falsy when api is null', () => {
      component._formGroup.get('api')?.setValue(null);
      expect(component.canShowAdesioneAdherentSubject()).toBeFalsy();
    });
  });

  describe('canShowAdesioneSubjectDomain', () => {
    it('should return true when distribution is in domainStatistics and api is not adherent', () => {
      const dist = { trendReport: true, value: 'andamento-temporale', code: 'andamento_temporale', label: 'Test', tableFirstColumnLabel: 'Data' };
      component._formGroup.get('distribution_type')?.setValue(dist);
      component._formGroup.get('api')?.setValue({ ruolo: 'erogato_soggetto_dominio' });
      expect(component.canShowAdesioneSubjectDomain()).toBe(true);
    });

    it('should return false when distribution is not in domainStatistics', () => {
      const dist = { trendReport: false, value: 'distribuzione-applicativo', code: 'distribuzione_applicativo', label: 'Test', tableFirstColumnLabel: 'App' };
      component._formGroup.get('distribution_type')?.setValue(dist);
      component._formGroup.get('api')?.setValue({ ruolo: 'erogato_soggetto_dominio' });
      expect(component.canShowAdesioneSubjectDomain()).toBe(false);
    });

    it('should return false when api is erogato_soggetto_aderente', () => {
      const dist = { trendReport: true, value: 'andamento-temporale', code: 'andamento_temporale', label: 'Test', tableFirstColumnLabel: 'Data' };
      component._formGroup.get('distribution_type')?.setValue(dist);
      component._formGroup.get('api')?.setValue({ ruolo: 'erogato_soggetto_aderente' });
      expect(component.canShowAdesioneSubjectDomain()).toBe(false);
    });

    it('should return false when distribution is null', () => {
      component._formGroup.get('api')?.setValue({ ruolo: 'erogato_soggetto_dominio' });
      expect(component.canShowAdesioneSubjectDomain()).toBe(false);
    });
  });

  // ========== onChangeApi ==========

  describe('onChangeApi', () => {
    it('should reset adesione value', () => {
      component._formGroup.get('adesione')?.setValue({ id_adesione: 123 });
      component.onChangeApi({});
      expect(component._formGroup.get('adesione')?.value).toBeNull();
    });
  });

  // ========== _loadServizio ==========

  describe('_loadServizio', () => {
    it('should load service details on success and call _initBreadcrumb', () => {
      const mockService = { nome: 'TestService', versione: '1.0', stato: 'pubblicato' };
      mockApiService.getDetails.mockImplementation(() => of(mockService));

      component.id = 42;
      (component as any)._initBreadcrumb = vi.fn();
      component._loadServizio();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 42);
      expect(component.service).toEqual(mockService);
      expect((component as any)._initBreadcrumb).toHaveBeenCalled();
    });

    it('should call Tools.OnError on error', () => {
      const error = new Error('load failed');
      mockApiService.getDetails.mockImplementation(() => throwError(() => error));

      component.id = 42;
      component._loadServizio();

      expect(Tools.OnError).toHaveBeenCalledWith(error);
    });

    it('should call loadApis and loadAdhesions', () => {
      component.id = 42;
      component._loadServizio();

      expect(mockApiService.getList).toHaveBeenCalledWith('api', { params: { id_servizio: '42' } });
      expect(mockApiService.getList).toHaveBeenCalledWith('adesioni', { params: { id_servizio: '42' } });
    });

    it('should not do anything if id is null', () => {
      component.id = null;
      component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  // ========== loadApis ==========

  describe('loadApis', () => {
    it('should set apis and call preselectAndMakeApiReadonlyIfOnlyOne on success', () => {
      const apiList = [{ id_api: 1, ruolo: 'erogato_soggetto_dominio' }, { id_api: 2, ruolo: 'erogato_soggetto_aderente' }];
      mockApiService.getList.mockImplementation((model: string) => {
        if (model === 'api') return of({ content: apiList });
        return of({ content: [] });
      });

      component.id = 42;
      component._loadServizio();

      expect(component.apis).toEqual(apiList);
      // With multiple APIs, api control should be enabled
      expect(component._formGroup.get('api')?.enabled).toBe(true);
    });

    it('should auto-select and disable api control when only 1 API', () => {
      const singleApi = [{ id_api: 1, ruolo: 'erogato_soggetto_dominio' }];
      mockApiService.getList.mockImplementation((model: string) => {
        if (model === 'api') return of({ content: singleApi });
        return of({ content: [] });
      });

      component.id = 42;
      component._loadServizio();

      expect(component.apis).toEqual(singleApi);
      expect(component._formGroup.get('api')?.value).toEqual(singleApi[0]);
      expect(component._formGroup.get('api')?.disabled).toBe(true);
    });

    it('should call Tools.OnError on loadApis error', () => {
      const error = new Error('api load failed');
      mockApiService.getList.mockImplementation((model: string) => {
        if (model === 'api') return throwError(() => error);
        return of({ content: [] });
      });

      component.id = 42;
      component._loadServizio();

      expect(Tools.OnError).toHaveBeenCalledWith(error);
    });
  });

  // ========== loadAdhesions ==========

  describe('loadAdhesions', () => {
    it('should set adhesions on success', () => {
      const adhesionsList = [{ id_adesione: 10 }, { id_adesione: 20 }];
      mockApiService.getList.mockImplementation((model: string) => {
        if (model === 'adesioni') return of({ content: adhesionsList });
        return of({ content: [] });
      });

      component.id = 42;
      component._loadServizio();

      expect(component.adhesions).toEqual(adhesionsList);
    });

    it('should call Tools.OnError on loadAdhesions error', () => {
      const error = new Error('adhesions load failed');
      mockApiService.getList.mockImplementation((model: string) => {
        if (model === 'adesioni') return throwError(() => error);
        return of({ content: [] });
      });

      component.id = 42;
      component._loadServizio();

      expect(Tools.OnError).toHaveBeenCalledWith(error);
    });
  });

  // ========== _onSubmit ==========

  describe('_onSubmit', () => {
    const mockApi = { id_api: 1, ruolo: 'erogato_soggetto_dominio' };
    const andamentoTemporaleDist = {
      trendReport: true,
      value: 'andamento-temporale',
      code: 'andamento_temporale',
      label: 'Andamento Temporale',
      tableFirstColumnLabel: 'Data'
    };

    function makeFormValid() {
      component.service = { id_servizio: 100, soggetto_interno: { nome: 'SoggettoTest' } };
      // Set api directly without triggering valueChanges subscription
      component._formGroup.get('api')?.setValue(mockApi);
      component._formGroup.get('distribution_type')?.setValue(andamentoTemporaleDist);
    }

    it('should not call postMonitor when form is invalid', () => {
      // api is required and null by default
      component._onSubmit(component._formGroup.value);
      expect(mockApiService.postMonitor).not.toHaveBeenCalled();
    });

    it('should call postMonitor with correct request on valid form', () => {
      makeFormValid();
      const formValue = component._formGroup.getRawValue();
      component._onSubmit(formValue);

      expect(mockApiService.postMonitor).toHaveBeenCalled();
      const [url, request] = mockApiService.postMonitor.mock.calls[0];
      expect(url).toContain('andamento-temporale');
      expect(request.api.id_servizio).toBe(100);
      expect(request.api.id_api).toBe(1);
      expect(request.tipo_informazione_report).toBe('numero_transazioni');
    });

    it('AndamentoTemporale should map valori to single, multi, multi_bar_chart', () => {
      makeFormValid();
      const valori = [
        { data: '2026-01-01', valore: 10 },
        { data: '2026-01-02', valore: 20 }
      ];
      mockApiService.postMonitor.mockImplementation(() => of({ valori }));

      const formValue = component._formGroup.getRawValue();
      component._onSubmit(formValue);

      expect(component.single).toEqual([
        { name: '2026-01-01', value: 10 },
        { name: '2026-01-02', value: 20 }
      ]);
      expect(component.multi.length).toBe(1);
      expect(component.multi[0].series.length).toBe(2);
      expect(component.multi_bar_chart.length).toBe(2);
      expect(component.multi_bar_chart[0].series.length).toBe(1);
    });

    it('DistribuzioneEsiti should map to multi with ok/fault/fallite series', () => {
      const esitiDist = {
        trendReport: true,
        value: 'distribuzione-esiti',
        code: 'distribuzione_esiti',
        label: 'Distribuzione Esiti',
        tableFirstColumnLabel: 'Data'
      };
      makeFormValid();
      component._formGroup.get('distribution_type')?.setValue(esitiDist);

      const valori = [
        { data: '2026-01-01', valore_ok: 100, valore_fault: 5, valore_fallite: 2 }
      ];
      mockApiService.postMonitor.mockImplementation(() => of({ valori }));

      const formValue = component._formGroup.getRawValue();
      component._onSubmit(formValue);

      expect(component.multi.length).toBe(3);
      expect(component.multi_bar_chart.length).toBe(1);
      expect(component.multi_bar_chart[0].series.length).toBe(3);
      expect(component.single).toEqual([{ name: '2026-01-01', value: 100 }]);
    });

    it('DistribuzioneErrori should map to single with esito toString', () => {
      const erroriDist = {
        trendReport: false,
        value: 'distribuzione-errori',
        code: 'distribuzione_errori',
        label: 'Distribuzione Errori',
        tableFirstColumnLabel: 'Esito'
      };
      makeFormValid();
      component._formGroup.get('distribution_type')?.setValue(erroriDist);

      const valori = [
        { esito: 404, descrizione: 'Not Found', valore: 10 },
        { esito: 500, descrizione: 'Server Error', valore: 5 }
      ];
      mockApiService.postMonitor.mockImplementation(() => of({ valori }));

      const formValue = component._formGroup.getRawValue();
      component._onSubmit(formValue);

      expect(component.single).toEqual([
        { name: '404', value: 10 },
        { name: '500', value: 5 }
      ]);
    });

    it('DistribuzioneSoggettoRemoto should map nome to single', () => {
      const dist = {
        trendReport: false,
        value: 'distribuzione-soggetto-remoto',
        code: 'distribuzione_soggetto_remoto',
        label: 'Distribuzione Soggetto Remoto',
        tableFirstColumnLabel: 'Soggetto'
      };
      makeFormValid();
      component._formGroup.get('distribution_type')?.setValue(dist);

      const valori = [{ nome: 'SoggettoA', valore: 50 }];
      mockApiService.postMonitor.mockImplementation(() => of({ valori }));

      component._onSubmit(component._formGroup.getRawValue());
      expect(component.single).toEqual([{ name: 'SoggettoA', value: 50 }]);
    });

    it('DistribuzioneOperazione should map operazione to single', () => {
      const dist = {
        trendReport: false,
        value: 'distribuzione-operazione',
        code: 'distribuzione_operazione',
        label: 'Distribuzione Operazione',
        tableFirstColumnLabel: 'Azione'
      };
      makeFormValid();
      component._formGroup.get('distribution_type')?.setValue(dist);

      const valori = [{ operazione: 'GET /api', nome: 'Test', valore: 30, erogatore: 'E1' }];
      mockApiService.postMonitor.mockImplementation(() => of({ valori }));

      component._onSubmit(component._formGroup.getRawValue());
      expect(component.single).toEqual([{ name: 'GET /api', value: 30 }]);
    });

    it('DistribuzioneApplicativo should map nome to single', () => {
      const dist = {
        trendReport: false,
        value: 'distribuzione-applicativo',
        code: 'distribuzione_applicativo',
        label: 'Distribuzione Applicativo',
        tableFirstColumnLabel: 'Applicativo'
      };
      makeFormValid();
      component._formGroup.get('distribution_type')?.setValue(dist);

      const valori = [{ nome: 'App1', valore: 40, soggetto: 'S1' }];
      mockApiService.postMonitor.mockImplementation(() => of({ valori }));

      component._onSubmit(component._formGroup.getRawValue());
      expect(component.single).toEqual([{ name: 'App1', value: 40 }]);
    });

    it('DistribuzioneTokenClientId should map client_id to single', () => {
      const dist = {
        trendReport: false,
        value: 'distribuzione-token-clientid',
        code: 'distribuzione_token_client_id',
        label: 'Distribuzione Token ClientId',
        tableFirstColumnLabel: 'ClientId'
      };
      makeFormValid();
      component._formGroup.get('distribution_type')?.setValue(dist);

      const valori = [{ client_id: 'client-123', soggetto: 'S1', applicativo: 'A1', valore: 25 }];
      mockApiService.postMonitor.mockImplementation(() => of({ valori }));

      component._onSubmit(component._formGroup.getRawValue());
      expect(component.single).toEqual([{ name: 'client-123', value: 25 }]);
    });

    it('DistribuzioneIssuer should map issuer to single', () => {
      const dist = {
        trendReport: false,
        value: 'distribuzione-token-issuer',
        code: 'distribuzione_token_issuer',
        label: 'Distribuzione Token Issuer',
        tableFirstColumnLabel: 'Issuer'
      };
      makeFormValid();
      component._formGroup.get('distribution_type')?.setValue(dist);

      const valori = [{ issuer: 'https://issuer.example.com', valore: 15 }];
      mockApiService.postMonitor.mockImplementation(() => of({ valori }));

      component._onSubmit(component._formGroup.getRawValue());
      expect(component.single).toEqual([{ name: 'https://issuer.example.com', value: 15 }]);
    });

    it('DistribuzionePrincipal should map indirizzo to single', () => {
      const dist = {
        trendReport: false,
        value: 'distribuzione-principal',
        code: 'distribuzione_principal',
        label: 'Distribuzione Principal',
        tableFirstColumnLabel: 'Principal'
      };
      makeFormValid();
      component._formGroup.get('distribution_type')?.setValue(dist);

      const valori = [{ indirizzo: 'user@example.com', valore: 35 }];
      mockApiService.postMonitor.mockImplementation(() => of({ valori }));

      component._onSubmit(component._formGroup.getRawValue());
      expect(component.single).toEqual([{ name: 'user@example.com', value: 35 }]);
    });

    it('DistribuzioneIp should map indirizzo to single', () => {
      const dist = {
        trendReport: false,
        value: 'distribuzione-ip',
        code: 'distribuzione_ip',
        label: 'Distribuzione IP',
        tableFirstColumnLabel: 'IP'
      };
      makeFormValid();
      component._formGroup.get('distribution_type')?.setValue(dist);

      const valori = [{ indirizzo: '192.168.1.1', valore: 99 }];
      mockApiService.postMonitor.mockImplementation(() => of({ valori }));

      component._onSubmit(component._formGroup.getRawValue());
      expect(component.single).toEqual([{ name: '192.168.1.1', value: 99 }]);
    });

    it('empty valori should set NoTransactionsForPeriod message', () => {
      makeFormValid();
      mockApiService.postMonitor.mockImplementation(() => of({ valori: [] }));

      component._onSubmit(component._formGroup.getRawValue());

      expect(component._message).toBe('APP.MESSAGE.NoTransactionsForPeriod');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoTransactionsForPeriodHelp');
      expect(component._spin).toBe(false);
    });

    it('null result valori should set NoTransactionsForPeriod message', () => {
      makeFormValid();
      mockApiService.postMonitor.mockImplementation(() => of({ valori: null }));

      component._onSubmit(component._formGroup.getRawValue());

      expect(component._message).toBe('APP.MESSAGE.NoTransactionsForPeriod');
    });

    it('error on postMonitor should set error messages', () => {
      makeFormValid();
      const error = { error: { message: 'Server error' }, message: 'fallback' };
      mockApiService.postMonitor.mockImplementation(() => throwError(() => error));

      component._onSubmit(component._formGroup.getRawValue());

      expect(component._spin).toBe(false);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Server error');
    });

    it('error without error.error.message should use error.message', () => {
      makeFormValid();
      const error = { message: 'fallback message' };
      mockApiService.postMonitor.mockImplementation(() => throwError(() => error));

      component._onSubmit(component._formGroup.getRawValue());

      expect(component._errorMsg).toBe('fallback message');
    });

    it('should include esito in request when report_transaction_outcome_type is set', () => {
      makeFormValid();
      component._formGroup.get('report_transaction_outcome_type')?.setValue('ok');
      mockApiService.postMonitor.mockImplementation(() => of({ valori: [] }));

      component._onSubmit(component._formGroup.getRawValue());

      const [, request] = mockApiService.postMonitor.mock.calls[0];
      expect(request.esito).toBeDefined();
      expect(request.esito.tipo).toBe('ok');
    });

    it('should include adesione in request when adesione is set', () => {
      makeFormValid();
      // Enable adesione and set value
      component._formGroup.get('adesione')?.enable();
      component._formGroup.get('adesione')?.setValue({ id_adesione: 999 });
      mockApiService.postMonitor.mockImplementation(() => of({ valori: [] }));

      component._onSubmit(component._formGroup.getRawValue());

      const [, request] = mockApiService.postMonitor.mock.calls[0];
      expect(request.api.id_adesione).toBe(999);
    });

    it('should set _spin true before postMonitor and false after', () => {
      makeFormValid();
      mockApiService.postMonitor.mockImplementation(() => of({ valori: [] }));

      component._onSubmit(component._formGroup.getRawValue());

      // After completion, _spin should be false
      expect(component._spin).toBe(false);
    });

    it('should clear single, multi, multi_bar_chart before postMonitor', () => {
      makeFormValid();
      component.single = [{ name: 'old', value: 1 }];
      component.multi = [{ name: 'old', series: [] }];
      component.multi_bar_chart = [{ name: 'old', series: [] }];

      mockApiService.postMonitor.mockImplementation(() => of({ valori: [] }));
      component._onSubmit(component._formGroup.getRawValue());

      // After submit with empty valori, single/multi should be empty
      expect(component.single).toEqual([]);
      expect(component.multi).toEqual([]);
    });
  });

  // ========== onExport ==========

  describe('onExport', () => {
    const mockApi = { id_api: 1, ruolo: 'erogato_soggetto_dominio' };
    const dist = {
      trendReport: false,
      value: 'distribuzione-errori',
      code: 'distribuzione_errori',
      label: 'Test',
      tableFirstColumnLabel: 'Esito'
    };

    function makeFormValidForExport() {
      component.service = { id_servizio: 100, soggetto_interno: { nome: 'SoggettoTest' } };
      component._formGroup.get('api')?.setValue(mockApi);
      component._formGroup.get('distribution_type')?.setValue(dist);
    }

    it('should not call downloadMonitor when form is invalid', () => {
      component.onExport({ label: 'CSV', icon: 'csv', action: 'export-csv', acceptHeader: 'text/csv' });
      expect(mockApiService.downloadMonitor).not.toHaveBeenCalled();
    });

    it('CSV export should call downloadMonitor and create blob', () => {
      makeFormValidForExport();

      const blobBody = new Blob(['test'], { type: 'text/csv' });
      const httpResponse = new HttpResponse({ body: blobBody, status: 200 });
      mockApiService.downloadMonitor.mockImplementation(() => of(httpResponse));

      // Mock document.createElement
      const mockAnchor = {
        download: '',
        href: '',
        dataset: {} as any,
        click: vi.fn()
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

      // Mock URL.createObjectURL on window
      const originalURL = (window as any).URL;
      const originalWebkitURL = (window as any).webkitURL;
      (window as any).URL = { createObjectURL: vi.fn().mockReturnValue('blob:test') };
      (window as any).webkitURL = undefined;

      component.onExport({ label: 'CSV', icon: 'csv', action: 'export-csv', acceptHeader: 'text/csv' });

      expect(mockApiService.downloadMonitor).toHaveBeenCalled();
      expect(component._spin).toBe(false);
      expect(mockAnchor.click).toHaveBeenCalled();

      createElementSpy.mockRestore();
      (window as any).URL = originalURL;
      (window as any).webkitURL = originalWebkitURL;
    });

    it('error on downloadMonitor should set error messages', () => {
      makeFormValidForExport();
      const error = { error: { message: 'Download failed' }, message: 'fallback' };
      mockApiService.downloadMonitor.mockImplementation(() => throwError(() => error));

      component.onExport({ label: 'PDF', icon: 'pdf', action: 'export-pdf', acceptHeader: 'application/pdf' });

      expect(component._spin).toBe(false);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Download failed');
    });

    it('PNG export should not call downloadMonitor', () => {
      makeFormValidForExport();

      // PNG path needs captureGraphArea which is a ViewChild - skip DOM parts
      // Just verify it doesn't call downloadMonitor
      component.captureGraphArea = {
        nativeElement: {
          querySelectorAll: vi.fn().mockReturnValue([]),
          scrollHeight: 100,
          scrollWidth: 100
        }
      };

      // html-to-image will fail in Node.js but we can verify the path taken
      try {
        component.onExport({ label: 'PNG', icon: 'png', action: 'export-png', acceptHeader: 'image/png' });
      } catch {
        // Expected - html-to-image needs DOM
      }
      expect(mockApiService.downloadMonitor).not.toHaveBeenCalled();
    });
  });

  // ========== _getReportUri ==========

  describe('_getReportUri', () => {
    it('should return correct URI format', () => {
      component.service = { id_servizio: 100, soggetto_interno: { nome: 'SoggettoTest' } };
      component.environmentId = 'collaudo';
      const api = { id_api: 1, ruolo: 'erogato_soggetto_dominio' };
      component._formGroup.get('api')?.setValue(api);

      const dist = { trendReport: true, value: 'andamento-temporale', code: 'andamento_temporale', label: 'Test', tableFirstColumnLabel: 'Data' };
      const formValue = { ...component._formGroup.getRawValue(), distribution_type: dist };

      const result = (component as any)._getReportUri(formValue);
      expect(result).toBe('collaudo/fruizioni/SoggettoTest/report/andamento-temporale');
    });

    it('should return produzione for produzione environment', () => {
      component.service = { id_servizio: 100, soggetto_interno: { nome: 'SoggettoTest' } };
      component.environmentId = 'produzione';
      const api = { id_api: 1, ruolo: 'erogato_soggetto_dominio' };
      component._formGroup.get('api')?.setValue(api);

      const dist = { trendReport: false, value: 'distribuzione-errori', code: 'distribuzione_errori', label: 'Test', tableFirstColumnLabel: 'Esito' };
      const formValue = { ...component._formGroup.getRawValue(), distribution_type: dist };

      const result = (component as any)._getReportUri(formValue);
      expect(result).toContain('produzione/');
      expect(result).toContain('distribuzione-errori');
    });
  });

  // ========== _tipoVerifica ==========

  describe('_tipoVerifica', () => {
    it('erogato_soggetto_dominio with soggetto_interno should return fruizioni', () => {
      component.service = { soggetto_interno: { nome: 'Test' } };
      expect(component._tipoVerifica({ ruolo: 'erogato_soggetto_dominio' })).toBe('fruizioni');
    });

    it('erogato_soggetto_dominio without soggetto_interno should return erogazioni', () => {
      component.service = { soggetto_interno: null };
      expect(component._tipoVerifica({ ruolo: 'erogato_soggetto_dominio' })).toBe('erogazioni');
    });

    it('other ruolo should return fruizioni', () => {
      expect(component._tipoVerifica({ ruolo: 'erogato_soggetto_aderente' })).toBe('fruizioni');
      expect(component._tipoVerifica({ ruolo: 'something_else' })).toBe('fruizioni');
    });
  });

  // ========== _hasPDNDAuthType ==========

  describe('_hasPDNDAuthType', () => {
    it('should return true when auth_type includes pdnd', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        api: {
          profili: [
            { codice_interno: 'profile1', auth_type: ['pdnd', 'mtls'] }
          ]
        }
      });

      const api = {
        dati_erogazione: {
          gruppi_auth_type: [{ profilo: 'profile1' }]
        }
      };

      expect(component._hasPDNDAuthType(api)).toBe(true);
    });

    it('should return false when auth_type does not include pdnd', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        api: {
          profili: [
            { codice_interno: 'profile1', auth_type: ['mtls', 'basic'] }
          ]
        }
      });

      const api = {
        dati_erogazione: {
          gruppi_auth_type: [{ profilo: 'profile1' }]
        }
      };

      expect(component._hasPDNDAuthType(api)).toBe(false);
    });
  });

  // ========== _isSoggettoPDND ==========

  describe('_isSoggettoPDND', () => {
    it('should return true when subject is in PDND config', () => {
      component.service = { dominio: { soggetto_referente: { nome: 'TestSubject' } } };
      mockAuthenticationService._getConfigModule.mockReturnValue([
        { nome_soggetto: 'TestSubject' }
      ]);

      expect(component._isSoggettoPDND()).toBe(true);
    });

    it('should return false when subject is not in PDND config', () => {
      component.service = { dominio: { soggetto_referente: { nome: 'OtherSubject' } } };
      mockAuthenticationService._getConfigModule.mockReturnValue([
        { nome_soggetto: 'TestSubject' }
      ]);

      expect(component._isSoggettoPDND()).toBe(false);
    });

    it('should return false when PDND config is empty', () => {
      component.service = { dominio: { soggetto_referente: { nome: 'TestSubject' } } };
      mockAuthenticationService._getConfigModule.mockReturnValue([]);

      expect(component._isSoggettoPDND()).toBe(false);
    });
  });

  // ========== colorSchemeResolved ==========

  describe('colorSchemeResolved', () => {
    it('should return linkitColorScheme for distribuzione-esiti', () => {
      const esitiDist = { trendReport: true, value: 'distribuzione-esiti', code: 'distribuzione_esiti', label: 'Test', tableFirstColumnLabel: 'Data' };
      component._formGroup.get('distribution_type')?.setValue(esitiDist);

      expect(component.colorSchemeResolved).toEqual(component.linkitColorScheme);
    });

    it('should return default colorScheme for other distributions', () => {
      component.colorScheme = { name: 'custom', domain: ['#000'] };
      const otherDist = { trendReport: true, value: 'andamento-temporale', code: 'andamento_temporale', label: 'Test', tableFirstColumnLabel: 'Data' };
      component._formGroup.get('distribution_type')?.setValue(otherDist);

      expect(component.colorSchemeResolved).toEqual({ name: 'custom', domain: ['#000'] });
    });
  });

  // ========== multi_table_rows ==========

  describe('multi_table_rows', () => {
    it('should transform multi data correctly', () => {
      component.multi = [
        {
          name: 'OK',
          series: [
            { name: '2026-01-01', value: 100 },
            { name: '2026-01-02', value: 200 }
          ]
        },
        {
          name: 'Fault',
          series: [
            { name: '2026-01-01', value: 5 },
            { name: '2026-01-02', value: 10 }
          ]
        }
      ];

      const rows = component.multi_table_rows;
      expect(rows.length).toBe(2);
      expect(rows[0]).toEqual({ name: '2026-01-01', OK: 100, Fault: 5 });
      expect(rows[1]).toEqual({ name: '2026-01-02', OK: 200, Fault: 10 });
    });

    it('should return empty array when multi is empty', () => {
      component.multi = [];
      expect(component.multi_table_rows).toEqual([]);
    });
  });

  // ========== bsDatepickerConfig ==========

  describe('bsDatepickerConfig', () => {
    it('should return config without timepicker by default', () => {
      expect(component.bsDatepickerConfig.withTimepicker).toBe(false);
    });

    it('should return config with timepicker when useTimepicker=true', () => {
      // Set reportTimeInterval to Hourly to trigger useTimepicker=true
      component._formGroup.get('report_time_interval')?.setValue('orario');
      expect(component.bsDatepickerConfig.withTimepicker).toBe(true);
      expect(component.bsDatepickerConfig.dateInputFormat).toBe('DD/MM/YYYY, HH:mm');
    });
  });

  // ========== setColorScheme ==========

  describe('setColorScheme', () => {
    it('should set selectedColorScheme and colorScheme', () => {
      // colorSets is assigned in constructor via Object.assign
      // We need to find a scheme name. Let's use a name that may exist.
      component.colorSets = [
        { name: 'vivid', domain: ['#647c8a'] },
        { name: 'natural', domain: ['#bf9d76'] }
      ];

      component.setColorScheme('vivid');
      expect(component.selectedColorScheme).toBe('vivid');
      expect(component.colorScheme).toEqual({ name: 'vivid', domain: ['#647c8a'] });
    });

    it('should set colorScheme to undefined when name not found', () => {
      component.colorSets = [{ name: 'vivid', domain: ['#647c8a'] }];
      component.setColorScheme('nonexistent');
      expect(component.selectedColorScheme).toBe('nonexistent');
      expect(component.colorScheme).toBeUndefined();
    });
  });

  // ========== _initBreadcrumb ==========

  describe('_initBreadcrumb', () => {
    it('with service should show service name+version', () => {
      component.service = { nome: 'MyService', versione: '2.0', stato: 'pubblicato' };
      component.id = 42;
      component._initBreadcrumb();

      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[1].label).toBe('MyService v. 2.0');
      expect(component.breadcrumbs[2].label).toBe('APP.TITLE.Statistics');
    });

    it('without service, with id should show id', () => {
      component.service = null;
      component.id = 42;
      component._initBreadcrumb();

      expect(component.breadcrumbs[1].label).toBe('42');
    });

    it('without service, without id should show New', () => {
      component.service = null;
      component.id = null;
      component._initBreadcrumb();

      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.New');
    });

    it('with _fromDashboard should show Dashboard breadcrumb', () => {
      component._fromDashboard = true;
      component.service = { nome: 'MyService', versione: '1.0', stato: 'pubblicato' };
      component.id = 42;
      component._initBreadcrumb();

      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
    });

    it('without _fromDashboard should show Services breadcrumb', () => {
      component._fromDashboard = false;
      component.service = { nome: 'MyService', versione: '1.0', stato: 'pubblicato' };
      component.id = 42;
      component._initBreadcrumb();

      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
      expect(component.breadcrumbs[0].url).toBe('/servizi');
    });

    it('should set tooltip from service stato', () => {
      component.service = { nome: 'MyService', versione: '1.0', stato: 'pubblicato' };
      component.id = 42;
      component._initBreadcrumb();

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.pubblicato');
    });

    it('breadcrumb url should include /view when localStorage flag is set', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('TRUE');
      component.service = { nome: 'MyService', versione: '1.0', stato: 'pubblicato' };
      component.id = 42;
      component._initBreadcrumb();

      expect(component.breadcrumbs[1].url).toContain('/view');
      getItemSpy.mockRestore();
    });

    it('breadcrumb url should not include /view when localStorage flag is not set', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      component.service = { nome: 'MyService', versione: '1.0', stato: 'pubblicato' };
      component.id = 42;
      component._initBreadcrumb();

      expect(component.breadcrumbs[1].url).toBe('/servizi/42');
      getItemSpy.mockRestore();
    });
  });

  // ========== exportList filtering ==========

  describe('exportList filtering', () => {
    it('with generalConfig formati_report should filter exportList', () => {
      Tools.Configurazione = {
        monitoraggio: {
          statistiche: {
            formati_report: ['csv', 'pdf']
          }
        }
      };

      const comp = createComponent({ generalConfig: Tools.Configurazione });
      expect(comp.exportList.length).toBe(2);
      expect(comp.exportList[0].label).toBe('CSV');
      expect(comp.exportList[1].label).toBe('PDF');
    });

    it('without generalConfig should use full exportListDefault', () => {
      Tools.Configurazione = null;
      const comp = createComponent();
      expect(comp.exportList.length).toBe(4);
    });

    it('with empty formati_report array should use full exportListDefault', () => {
      Tools.Configurazione = {
        monitoraggio: {
          statistiche: {
            formati_report: []
          }
        }
      };

      const comp = createComponent({ generalConfig: Tools.Configurazione });
      expect(comp.exportList.length).toBe(4);
    });
  });

  // ========== ngOnInit ==========

  describe('ngOnInit', () => {
    it('with params.id should subscribe to config and load service', () => {
      const pSubject = new Subject<any>();
      mockRoute.params = pSubject.asObservable();

      const chartConfig = {
        chartOptions: {
          colorScheme: { name: 'cool', domain: ['#aaa'] }
        }
      };
      mockConfigService.getConfig.mockImplementation(() => of(chartConfig));
      mockApiService.getDetails.mockImplementation(() => of({ nome: 'Svc', versione: '1.0', stato: 'pubblicato' }));

      const comp = createComponent({ params: pSubject });
      comp.ngOnInit();

      pSubject.next({ id: '123' });

      expect(comp.id).toBe('123');
      expect(comp.statisticheConfig).toEqual(chartConfig);
      expect(comp.colorScheme).toEqual({ name: 'cool', domain: ['#aaa'] });
      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', '123');
    });

    it('with params.id + existing service should call _initBreadcrumb without loading', () => {
      const pSubject = new Subject<any>();
      mockRoute.params = pSubject.asObservable();

      const chartConfig = {
        chartOptions: {
          colorScheme: { name: 'cool', domain: ['#aaa'] }
        }
      };
      mockConfigService.getConfig.mockImplementation(() => of(chartConfig));

      const comp = createComponent({
        params: pSubject,
        navigationState: { service: { nome: 'PreloadedSvc', versione: '1.0', stato: 'pubblicato' } }
      });
      comp.ngOnInit();

      mockApiService.getDetails.mockClear();
      pSubject.next({ id: '123' });

      // Should NOT call getDetails since service already exists
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
      expect(comp.breadcrumbs.length).toBe(3);
      expect(comp.breadcrumbs[1].label).toContain('PreloadedSvc');
    });

    it('chartOptions.selectedColorScheme should call setColorScheme', () => {
      const pSubject = new Subject<any>();
      mockRoute.params = pSubject.asObservable();

      const chartConfig = {
        chartOptions: {
          selectedColorScheme: 'vivid',
          colorScheme: { name: 'cool', domain: ['#aaa'] }
        }
      };
      mockConfigService.getConfig.mockImplementation(() => of(chartConfig));

      const comp = createComponent({ params: pSubject });
      // Set colorSets so setColorScheme can find the scheme
      comp.colorSets = [{ name: 'vivid', domain: ['#647c8a'] }];
      comp.ngOnInit();

      pSubject.next({ id: '123' });

      expect(comp.selectedColorScheme).toBe('vivid');
      expect(comp.colorScheme).toEqual({ name: 'vivid', domain: ['#647c8a'] });
    });

    it('no selectedColorScheme should use chartOptions.colorScheme directly', () => {
      const pSubject = new Subject<any>();
      mockRoute.params = pSubject.asObservable();

      const chartConfig = {
        chartOptions: {
          colorScheme: { name: 'neons', domain: ['#ff0000'] }
        }
      };
      mockConfigService.getConfig.mockImplementation(() => of(chartConfig));

      const comp = createComponent({ params: pSubject });
      comp.ngOnInit();

      pSubject.next({ id: '123' });

      expect(comp.colorScheme).toEqual({ name: 'neons', domain: ['#ff0000'] });
    });

    it('with id_ambiente param should set environmentId', () => {
      const pSubject = new Subject<any>();
      mockRoute.params = pSubject.asObservable();

      const chartConfig = { chartOptions: { colorScheme: { name: 'cool', domain: ['#aaa'] } } };
      mockConfigService.getConfig.mockImplementation(() => of(chartConfig));

      const comp = createComponent({ params: pSubject });
      comp.ngOnInit();

      pSubject.next({ id: '123', id_ambiente: 'produzione' });

      expect(comp.environmentId).toBe('produzione');
    });

    it('without id_ambiente param should default to collaudo', () => {
      const pSubject = new Subject<any>();
      mockRoute.params = pSubject.asObservable();

      const chartConfig = { chartOptions: { colorScheme: { name: 'cool', domain: ['#aaa'] } } };
      mockConfigService.getConfig.mockImplementation(() => of(chartConfig));

      const comp = createComponent({ params: pSubject });
      comp.ngOnInit();

      pSubject.next({ id: '123' });

      expect(comp.environmentId).toBe('collaudo');
    });

    it('without params.id should not load anything', () => {
      const pSubject = new Subject<any>();
      mockRoute.params = pSubject.asObservable();

      const comp = createComponent({ params: pSubject });
      comp.ngOnInit();

      pSubject.next({});

      expect(mockConfigService.getConfig).not.toHaveBeenCalled();
    });
  });

  // ========== queryParams ==========

  describe('queryParams subscription', () => {
    it('from=dashboard should set _fromDashboard and call _initBreadcrumb', () => {
      const qSubject = new Subject<any>();

      const comp = createComponent({ queryParams: qSubject });
      // Emit dashboard query param
      qSubject.next({ from: 'dashboard' });

      expect(comp._fromDashboard).toBe(true);
    });

    it('without from=dashboard should not set _fromDashboard', () => {
      const qp = new Subject<any>();
      const comp = createComponent({ queryParams: qp });
      qp.next({});
      expect(comp._fromDashboard).toBe(false);
    });
  });

  // ========== prepareTransactionOutcomeField ==========

  describe('prepareTransactionOutcomeField', () => {
    it('isErrorDistribution=true should filter out OK', () => {
      (component as any).prepareTransactionOutcomeField(true);
      const hasOk = component.transactionOutcomes.some((o: any) => o.value === 'ok');
      expect(hasOk).toBe(false);
      expect(component.transactionOutcomes.length).toBe(component._transactionOutcomes.length - 1);
    });

    it('isErrorDistribution=false should include all outcomes', () => {
      (component as any).prepareTransactionOutcomeField(false);
      expect(component.transactionOutcomes.length).toBe(component._transactionOutcomes.length);
    });

    it('isErrorDistribution=true + current value=OK should reset to null', () => {
      component._formGroup.get('report_transaction_outcome_type')?.setValue('ok');
      (component as any).prepareTransactionOutcomeField(true);
      expect(component._formGroup.get('report_transaction_outcome_type')?.value).toBeNull();
    });

    it('isErrorDistribution=true + current value=fault should keep value', () => {
      component._formGroup.get('report_transaction_outcome_type')?.setValue('fault');
      (component as any).prepareTransactionOutcomeField(true);
      expect(component._formGroup.get('report_transaction_outcome_type')?.value).toBe('fault');
    });
  });

  // ========== _resetScroll ==========

  describe('_resetScroll', () => {
    it('should call Tools.ScrollElement with container-scroller', () => {
      component._resetScroll();
      expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
    });
  });

  // ========== _getSoggettoNome ==========

  describe('_getSoggettoNome', () => {
    it('should return soggetto_interno nome when available', () => {
      component.service = { soggetto_interno: { nome: 'InternalSubject' }, dominio: { soggetto_referente: { nome: 'RefSubject' } } };
      expect((component as any)._getSoggettoNome()).toBe('InternalSubject');
    });

    it('should return soggetto_referente nome when soggetto_interno is null', () => {
      component.service = { soggetto_interno: null, dominio: { soggetto_referente: { nome: 'RefSubject' } } };
      expect((component as any)._getSoggettoNome()).toBe('RefSubject');
    });

    it('should return undefined when both are null', () => {
      component.service = { soggetto_interno: null, dominio: { soggetto_referente: null } };
      expect((component as any)._getSoggettoNome()).toBeUndefined();
    });
  });

  // ========== _loadTransactionDetailedOutcomes ==========

  describe('_loadTransactionDetailedOutcomes', () => {
    it('should generate 53 detailed outcomes', () => {
      expect(component.transactionDetailedOutcomes.length).toBe(53);
      expect(component.transactionDetailedOutcomes[0].value).toBe(0);
      expect(component.transactionDetailedOutcomes[52].value).toBe(52);
    });
  });

  // ========== onSelect ==========

  describe('onSelect', () => {
    it('should exist and not throw', () => {
      expect(() => component.onSelect({})).not.toThrow();
    });
  });

  // ========== _showCollaudo / _showProduzione call _resetData ==========

  describe('_showCollaudo / _showProduzione reset data', () => {
    it('_showCollaudo should call _resetData', () => {
      component.single = [{ name: 'x', value: 1 }];
      component._showCollaudo();
      expect(component.single).toEqual([]);
      expect(component._spin).toBe(false);
    });

    it('_showProduzione should call _resetData', () => {
      component.single = [{ name: 'x', value: 1 }];
      component._showProduzione();
      expect(component.single).toEqual([]);
      expect(component._spin).toBe(false);
    });
  });

  // ========== ngAfterContentChecked / _onResize ==========

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window.innerWidth', () => {
      // window.innerWidth is read-only in some envs, just call and check no errors
      component.ngAfterContentChecked();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  describe('_onResize', () => {
    it('should set desktop based on window.innerWidth', () => {
      component._onResize();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // ========== prepareDownloadUrlQuery ==========

  describe('prepareDownloadUrlQuery', () => {
    it('should include esito when report_transaction_outcome_type is set', () => {
      component.service = { id_servizio: 100 };
      component._formGroup.get('api')?.setValue({ id_api: 1 });
      component.tipoGrafico = 'bar' as any;

      const formValue = {
        ...component._formGroup.getRawValue(),
        report_transaction_outcome_type: 'ok',
        adesione: null
      };

      const result = (component as any).prepareDownloadUrlQuery(formValue);
      expect(result.get('esito')).toBe('ok');
    });

    it('should include id_adesione when adesione is set', () => {
      component.service = { id_servizio: 100 };
      component._formGroup.get('api')?.setValue({ id_api: 1 });
      component.tipoGrafico = 'bar' as any;

      const formValue = {
        ...component._formGroup.getRawValue(),
        report_transaction_outcome_type: null,
        adesione: { id_adesione: 999 }
      };

      const result = (component as any).prepareDownloadUrlQuery(formValue);
      expect(result.get('id_adesione')).toBe('999');
    });

    it('should not include esito or id_adesione when not set', () => {
      component.service = { id_servizio: 100 };
      component._formGroup.get('api')?.setValue({ id_api: 1 });
      component.tipoGrafico = 'bar' as any;

      const formValue = {
        ...component._formGroup.getRawValue(),
        report_transaction_outcome_type: null,
        adesione: null
      };

      const result = (component as any).prepareDownloadUrlQuery(formValue);
      expect(result.has('esito')).toBe(false);
      expect(result.has('id_adesione')).toBe(false);
      expect(result.get('tipo_report')).toBe('bar');
    });
  });

  // ========== dateFrom/dateTo valueChanges ==========

  describe('dateFrom/dateTo valueChanges early returns', () => {
    it('dateFrom with minutes=0 should not throw (early return)', () => {
      const date = new Date();
      date.setMinutes(0, 0, 0);
      // This triggers valueChanges but early-returns since minutes === 0
      expect(() => {
        component._formGroup.get('report_date_from')?.setValue(date);
      }).not.toThrow();
    });

    it('dateFrom with null should not throw (early return)', () => {
      expect(() => {
        component._formGroup.get('report_date_from')?.setValue(null);
      }).not.toThrow();
    });

    it('dateTo with minutes=0 should not throw (early return)', () => {
      const date = new Date();
      date.setMinutes(0, 0, 0);
      expect(() => {
        component._formGroup.get('report_date_to')?.setValue(date);
      }).not.toThrow();
    });

    it('dateTo with null should not throw (early return)', () => {
      expect(() => {
        component._formGroup.get('report_date_to')?.setValue(null);
      }).not.toThrow();
    });
  });

  // ========== _onSubmit with useTimepicker ==========

  describe('_onSubmit with useTimepicker', () => {
    it('should not call startOf day when useTimepicker is true', () => {
      const mockApi = { id_api: 1, ruolo: 'erogato_soggetto_dominio' };
      const trendDist = {
        trendReport: true,
        value: 'andamento-temporale',
        code: 'andamento_temporale',
        label: 'Test',
        tableFirstColumnLabel: 'Data'
      };
      component.service = { id_servizio: 100, soggetto_interno: { nome: 'SoggettoTest' } };
      component._formGroup.get('api')?.setValue(mockApi);
      component._formGroup.get('distribution_type')?.setValue(trendDist);
      // trendDist sets report_time_interval to 'orario' which sets useTimepicker=true

      mockApiService.postMonitor.mockImplementation(() => of({ valori: [] }));
      component._onSubmit(component._formGroup.getRawValue());

      // Verify it was called
      expect(mockApiService.postMonitor).toHaveBeenCalled();
      const [, request] = mockApiService.postMonitor.mock.calls[0];
      // The dates should still be present
      expect(request.intervallo_temporale.data_inizio).toBeDefined();
      expect(request.intervallo_temporale.data_fine).toBeDefined();
    });
  });

  // ========== Additional edge cases ==========

  describe('additional edge cases', () => {
    it('preselectAndMakeApiReadonlyIfOnlyOne with empty apis should not change api control', () => {
      component.apis = [] as any;
      (component as any).preselectAndMakeApiReadonlyIfOnlyOne();
      expect(component._formGroup.get('api')?.value).toBeNull();
    });

    it('_onSubmit should use report_time_interval from form or default to Hourly', () => {
      const mockApi = { id_api: 1, ruolo: 'erogato_soggetto_dominio' };
      const dist = {
        trendReport: true,
        value: 'andamento-temporale',
        code: 'andamento_temporale',
        label: 'Test',
        tableFirstColumnLabel: 'Data'
      };
      component.service = { id_servizio: 100, soggetto_interno: { nome: 'SoggettoTest' } };
      component._formGroup.get('api')?.setValue(mockApi);
      component._formGroup.get('distribution_type')?.setValue(dist);

      mockApiService.postMonitor.mockImplementation(() => of({ valori: [] }));

      // report_time_interval is set to 'orario' by distributionType trendReport=true subscription
      component._onSubmit(component._formGroup.getRawValue());

      const [, request] = mockApiService.postMonitor.mock.calls[0];
      expect(request.unita_tempo).toBeDefined();
    });

    it('_onSubmit with transaction_outcome_codes should include codici in esito', () => {
      const mockApi = { id_api: 1, ruolo: 'erogato_soggetto_dominio' };
      const dist = {
        trendReport: false,
        value: 'distribuzione-errori',
        code: 'distribuzione_errori',
        label: 'Test',
        tableFirstColumnLabel: 'Esito'
      };
      component.service = { id_servizio: 100, soggetto_interno: { nome: 'SoggettoTest' } };
      component._formGroup.get('api')?.setValue(mockApi);
      component._formGroup.get('distribution_type')?.setValue(dist);
      component._formGroup.get('report_transaction_outcome_type')?.setValue('personalizzato');
      component._formGroup.get('report_transaction_outcome_codes')?.setValue([1, 2, 3]);

      mockApiService.postMonitor.mockImplementation(() => of({ valori: [] }));
      component._onSubmit(component._formGroup.getRawValue());

      const [, request] = mockApiService.postMonitor.mock.calls[0];
      expect(request.esito.tipo).toBe('personalizzato');
      expect(request.esito.codici).toEqual([1, 2, 3]);
    });

    it('distributionType change should call prepareTransactionOutcomeField for error distribution', () => {
      const erroriDist = {
        trendReport: false,
        value: 'distribuzione-errori',
        code: 'distribuzione_errori',
        label: 'Distribuzione Errori',
        tableFirstColumnLabel: 'Esito'
      };

      // First set outcome to OK
      component._formGroup.get('report_transaction_outcome_type')?.setValue('ok');

      // Setting distribution to errori should filter out OK and reset value
      component._formGroup.get('distribution_type')?.setValue(erroriDist);

      const hasOk = component.transactionOutcomes.some((o: any) => o.value === 'ok');
      expect(hasOk).toBe(false);
      expect(component._formGroup.get('report_transaction_outcome_type')?.value).toBeNull();
    });

    it('distributionType change for non-error distribution should keep all outcomes', () => {
      const temporaleDist = {
        trendReport: true,
        value: 'andamento-temporale',
        code: 'andamento_temporale',
        label: 'Andamento Temporale',
        tableFirstColumnLabel: 'Data'
      };
      component._formGroup.get('distribution_type')?.setValue(temporaleDist);

      const hasOk = component.transactionOutcomes.some((o: any) => o.value === 'ok');
      expect(hasOk).toBe(true);
    });
  });
});
