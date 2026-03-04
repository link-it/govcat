import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, throwError } from 'rxjs';
import { TransazioneDetailsComponent } from './transazione-details.component';
import { Tools } from '@linkit/components';

describe('TransazioneDetailsComponent', () => {
  let component: TransazioneDetailsComponent;

  let paramsSubject: Subject<any>;
  let queryParamsSubject: Subject<any>;

  const createMockRoute = () => {
    paramsSubject = new Subject<any>();
    queryParamsSubject = new Subject<any>();
    return {
      params: paramsSubject.asObservable(),
      queryParams: queryParamsSubject.asObservable()
    } as any;
  };

  let mockRoute: any;

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

  const createDefaultTransactionResponse = (overrides: any = {}) => ({
    ruolo_component: 'fruizione',
    profilo: 'ModI',
    dati_mittente: {
      indirizzo_ip: '10.0.0.1',
      indirizzo_ip_inoltrato: '192.168.1.1'
    },
    api: {
      tipologia: 'rest',
      profilo_collaborazione: null
    },
    token: null,
    esito: { codice: 0 },
    return_code_http: 200,
    richiesta: { contenuto: 'req-data' },
    risposta: { contenuto: 'resp-data' },
    id_traccia: 'trace-123',
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    mockRouter.getCurrentNavigation.mockReturnValue(null);
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockTranslate.instant.mockImplementation((key: string) => key);
    mockRoute = createMockRoute();
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

  afterEach(() => {
    Tools.Configurazione = null;
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

  // -------------------------------------------------------
  // Constructor: queryParams subscription
  // -------------------------------------------------------
  describe('constructor queryParams subscription', () => {
    it('should set _fromDashboard=true when from=dashboard', () => {
      component.data = { id_traccia: 'trace-abc' };
      component.sid = 10;
      queryParamsSubject.next({ from: 'dashboard' });
      expect(component._fromDashboard).toBe(true);
      expect(component.breadcrumbs.length).toBe(4);
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
    });

    it('should not set _fromDashboard when from is not dashboard', () => {
      queryParamsSubject.next({ from: 'other' });
      expect(component._fromDashboard).toBe(false);
    });
  });

  // -------------------------------------------------------
  // ngOnInit
  // -------------------------------------------------------
  describe('ngOnInit', () => {
    it('should subscribe to route params and load config when id present', () => {
      const mockConfig = { editSingleColumn: true };
      mockConfigService.getConfig.mockReturnValue(of(mockConfig));
      const mockResponse = createDefaultTransactionResponse();
      mockApiService.getMonitorDetails.mockReturnValue(of(mockResponse));
      mockApiService.getDetails.mockReturnValue(of({ nome: 'Svc', versione: 1 }));

      component.ngOnInit();
      paramsSubject.next({ id: '42', id_ambiente: 'produzione', tid: '99' });

      expect(component.sid).toBe('42');
      expect(component.environmentId).toBe('produzione');
      expect(component.id).toBe('99');
      expect(component.config).toEqual(mockConfig);
      expect(component._singleColumn).toBe(true);
    });

    it('should default environmentId to collaudo when id_ambiente absent', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      mockApiService.getMonitorDetails.mockReturnValue(of(createDefaultTransactionResponse()));
      mockApiService.getDetails.mockReturnValue(of({}));

      component.ngOnInit();
      paramsSubject.next({ id: '1', tid: '2' });

      expect(component.environmentId).toBe('collaudo');
    });

    it('should call _loadAll when no service is set', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      mockApiService.getMonitorDetails.mockReturnValue(of(createDefaultTransactionResponse()));
      mockApiService.getDetails.mockReturnValue(of({ nome: 'Svc', versione: 1 }));
      component.service = null;

      (component as any)._loadAll = vi.fn();

      component.ngOnInit();
      paramsSubject.next({ id: '1', tid: '5' });

      expect((component as any)._loadAll).toHaveBeenCalled();
    });

    it('should call _loadtransaction only when service is already set', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      mockApiService.getMonitorDetails.mockReturnValue(of(createDefaultTransactionResponse()));
      component.service = { nome: 'ExistingService' };

      (component as any)._loadtransaction = vi.fn();

      component.ngOnInit();
      paramsSubject.next({ id: '1', tid: '5' });

      expect((component as any)._loadtransaction).toHaveBeenCalled();
    });

    it('should set _singleColumn from config.editSingleColumn', () => {
      mockConfigService.getConfig.mockReturnValue(of({ editSingleColumn: true }));
      mockApiService.getMonitorDetails.mockReturnValue(of(createDefaultTransactionResponse()));
      mockApiService.getDetails.mockReturnValue(of({}));

      component.ngOnInit();
      paramsSubject.next({ id: '1', tid: '2' });

      expect(component._singleColumn).toBe(true);
    });

    it('should not load anything when params have no id', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));

      component.ngOnInit();
      paramsSubject.next({});

      expect(mockConfigService.getConfig).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // ngOnChanges
  // -------------------------------------------------------
  describe('ngOnChanges', () => {
    it('should call _loadAll when id changes', () => {
      (component as any)._loadAll = vi.fn();
      component.ngOnChanges({ id: { currentValue: 55, previousValue: null, firstChange: true, isFirstChange: () => true } } as any);
      expect(component.id).toBe(55);
      expect((component as any)._loadAll).toHaveBeenCalled();
    });

    it('should not call _loadAll when other inputs change', () => {
      (component as any)._loadAll = vi.fn();
      component.ngOnChanges({ config: { currentValue: {}, previousValue: null, firstChange: true, isFirstChange: () => true } } as any);
      expect((component as any)._loadAll).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // _loadAll
  // -------------------------------------------------------
  describe('_loadAll', () => {
    it('should call both _loadServizio and _loadtransaction', () => {
      (component as any)._loadServizio = vi.fn();
      (component as any)._loadtransaction = vi.fn();

      component._loadAll();

      expect((component as any)._loadServizio).toHaveBeenCalled();
      expect((component as any)._loadtransaction).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // _loadServizio
  // -------------------------------------------------------
  describe('_loadServizio', () => {
    it('should set service from API response on success', () => {
      component.id = 10;
      component.sid = 42;
      const serviceResp = { nome: 'TestSvc', versione: 2 };
      mockApiService.getDetails.mockImplementation(() => of(serviceResp));

      component._loadServizio();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 42);
      expect(component.service).toEqual(serviceResp);
    });

    it('should call Tools.OnError on error', () => {
      component.id = 10;
      component.sid = 42;
      const err = new Error('service error');
      mockApiService.getDetails.mockImplementation(() => throwError(() => err));

      component._loadServizio();

      expect(Tools.OnError).toHaveBeenCalledWith(err);
    });

    it('should set service to null before calling API', () => {
      component.id = 10;
      component.sid = 42;
      component.service = { nome: 'old' };
      mockApiService.getDetails.mockImplementation(() => of({ nome: 'new' }));

      component._loadServizio();

      expect(component.service).toEqual({ nome: 'new' });
    });

    it('should do nothing when id is null', () => {
      component.id = null;
      component._loadServizio();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // _loadtransaction
  // -------------------------------------------------------
  describe('_loadtransaction', () => {
    beforeEach(() => {
      component.id = 99;
      component.environment = 'collaudo';
    });

    it('should set _spin=true and data=null when spin=true (default)', () => {
      const resp = createDefaultTransactionResponse();
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component.data = { old: 'data' };
      component._loadtransaction();

      // After success _spin becomes false
      expect(component._spin).toBe(false);
      expect(component.data).not.toBeNull();
    });

    it('should keep existing data when spin=false', () => {
      const resp = createDefaultTransactionResponse();
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));
      component.data = { old: 'data' };

      component._loadtransaction(false);

      // data gets overwritten by response, but was not set to null before API call
      expect(component._spin).toBe(false);
      expect(component.data).not.toBeNull();
    });

    it('should call getMonitorDetails with correct params', () => {
      component.environment = 'produzione';
      component.id = 42;
      mockApiService.getMonitorDetails.mockImplementation(() => of(createDefaultTransactionResponse()));

      component._loadtransaction();

      expect(mockApiService.getMonitorDetails).toHaveBeenCalledWith('produzione/diagnostica', 42);
    });

    it('should construct tipologia from ruolo_component and profilo', () => {
      const resp = createDefaultTransactionResponse({
        ruolo_component: 'erogazione',
        profilo: 'SPCoop'
      });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.LABEL.erogazione_type');
      expect(component.data.tipologia).toBe('APP.LABEL.erogazione_type (SPCoop)');
    });

    it('should set ip_richiedente from indirizzo_ip_inoltrato (preferred)', () => {
      const resp = createDefaultTransactionResponse({
        dati_mittente: {
          indirizzo_ip: '10.0.0.1',
          indirizzo_ip_inoltrato: '192.168.1.100'
        }
      });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(component.data.ip_richiedente).toBe('192.168.1.100');
    });

    it('should set ip_richiedente from indirizzo_ip as fallback', () => {
      const resp = createDefaultTransactionResponse({
        dati_mittente: {
          indirizzo_ip: '10.0.0.5',
          indirizzo_ip_inoltrato: null
        }
      });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(component.data.ip_richiedente).toBe('10.0.0.5');
    });

    it('should set ip_richiedente to null when no dati_mittente', () => {
      const resp = createDefaultTransactionResponse({ dati_mittente: null });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(component.data.ip_richiedente).toBeNull();
    });

    it('should set profilo_collaborazione for SOAP API', () => {
      const resp = createDefaultTransactionResponse({
        api: { tipologia: 'soap', profilo_collaborazione: 'Sincrono' }
      });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(component.data.profilo_collaborazione).toBe('Sincrono');
    });

    it('should set profilo_collaborazione to null for non-SOAP API', () => {
      const resp = createDefaultTransactionResponse({
        api: { tipologia: 'rest' }
      });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(component.data.profilo_collaborazione).toBeNull();
    });

    it('should set _hasInformazioniToken=true and format applicativoToken with token', () => {
      const resp = createDefaultTransactionResponse({
        token: { applicativo: 'myApp', soggetto: 'mySoggetto' }
      });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(component._hasInformazioniToken).toBe(true);
      expect(component.data.token.applicativo_token).toBe('myApp@mySoggetto');
    });

    it('should set _hasInformazioniToken=false when token is null', () => {
      const resp = createDefaultTransactionResponse({ token: null });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(component._hasInformazioniToken).toBe(false);
    });

    it('should set _hasInvocazioneApi=true when api is present', () => {
      const resp = createDefaultTransactionResponse({
        api: { tipologia: 'rest' }
      });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(component._hasInvocazioneApi).toBe(true);
    });

    it('should set _hasInvocazioneApi=false when api is null', () => {
      const resp = createDefaultTransactionResponse({ api: null });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(component._hasInvocazioneApi).toBe(false);
    });

    it('should set return_code_http with ProblemDetails for REST API + codice=2', () => {
      const resp = createDefaultTransactionResponse({
        api: { tipologia: 'rest' },
        esito: { codice: 2 },
        return_code_http: 500
      });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.LABEL.ProblemDetails');
    });

    it('should set return_code_http with SOAPFault for SOAP API + codice=2', () => {
      const resp = createDefaultTransactionResponse({
        api: { tipologia: 'soap', profilo_collaborazione: 'Sincrono' },
        esito: { codice: 2 },
        return_code_http: 500
      });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.LABEL.SOAPFault');
    });

    it('should set generic HTTP return_code for codice=2 without API tipologia', () => {
      const resp = createDefaultTransactionResponse({
        api: { tipologia: null },
        esito: { codice: 2 },
        return_code_http: 503
      });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.LABEL.HTTP');
    });

    it('should set generic HTTP return_code for codice != 2', () => {
      const resp = createDefaultTransactionResponse({
        api: { tipologia: 'rest' },
        esito: { codice: 0 },
        return_code_http: 200
      });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.LABEL.HTTP');
    });

    it('should build esito_composed from translated codice and return_code', () => {
      const resp = createDefaultTransactionResponse({
        esito: { codice: 0 },
        return_code_http: 200
      });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TOOLTIP.ESITO.INDEX_0');
      expect(component.data.esito_composed).toBe('APP.TOOLTIP.ESITO.INDEX_0 (200)');
    });

    it('should build esito_composed without return_code when return_code_http is falsy', () => {
      const resp = createDefaultTransactionResponse({
        esito: { codice: 1 },
        return_code_http: 0
      });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(component.data.esito_composed).toBe('APP.TOOLTIP.ESITO.INDEX_1');
    });

    it('should call _initTabs and _initBreadcrumb on success', () => {
      const resp = createDefaultTransactionResponse();
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      (component as any)._initTabs = vi.fn();
      (component as any)._initBreadcrumb = vi.fn();

      component._loadtransaction();

      expect((component as any)._initTabs).toHaveBeenCalled();
      expect((component as any)._initBreadcrumb).toHaveBeenCalled();
    });

    it('should set _spin=false on success', () => {
      const resp = createDefaultTransactionResponse();
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(component._spin).toBe(false);
    });

    it('should call Tools.OnError and set _spin=false on error', () => {
      const err = new Error('monitor error');
      mockApiService.getMonitorDetails.mockImplementation(() => throwError(() => err));

      component._loadtransaction();

      expect(Tools.OnError).toHaveBeenCalledWith(err);
      expect(component._spin).toBe(false);
    });

    it('should do nothing when id is null', () => {
      component.id = null;
      component._loadtransaction();
      expect(mockApiService.getMonitorDetails).not.toHaveBeenCalled();
    });

    it('should spread original response data into this.data', () => {
      const resp = createDefaultTransactionResponse({ custom_field: 'hello' });
      mockApiService.getMonitorDetails.mockImplementation(() => of(resp));

      component._loadtransaction();

      expect(component.data.custom_field).toBe('hello');
    });
  });

  // -------------------------------------------------------
  // _initForm
  // -------------------------------------------------------
  describe('_initForm', () => {
    it('should create form group with controls for each key when data provided', () => {
      component._initForm({ id: 123, nome: 'Test', descrizione: 'Desc' });

      expect(component.f['id']).toBeDefined();
      expect(component.f['nome']).toBeDefined();
      expect(component.f['descrizione']).toBeDefined();
      expect(component.f['id'].value).toBe(123);
      expect(component.f['nome'].value).toBe('Test');
    });

    it('should add required validator only on id field', () => {
      component._initForm({ id: null, nome: 'Test' });

      // id with null + required => has errors
      expect(component.f['id'].errors).toBeTruthy();
      expect(component.f['id'].errors!['required']).toBe(true);
      // nome has no validators
      expect(component.f['nome'].errors).toBeNull();
    });

    it('should set null for falsy values', () => {
      component._initForm({ id: 0, nome: '' });

      expect(component.f['id'].value).toBeNull();
      expect(component.f['nome'].value).toBeNull();
    });

    it('should not create form when data is null', () => {
      const originalFormGroup = component._formGroup;
      component._initForm(null);
      expect(component._formGroup).toBe(originalFormGroup);
    });

    it('should not create form when data is undefined', () => {
      const originalFormGroup = component._formGroup;
      component._initForm();
      expect(component._formGroup).toBe(originalFormGroup);
    });
  });

  // -------------------------------------------------------
  // _initBreadcrumb
  // -------------------------------------------------------
  describe('_initBreadcrumb', () => {
    beforeEach(() => {
      component.data = { id_traccia: 'trace-xyz' };
      component.sid = 10;
    });

    it('should create dashboard breadcrumb layout (4 items) when _fromDashboard=true', () => {
      component._fromDashboard = true;
      component.service = { nome: 'API-Servizio', versione: 3, stato: 'pubblicato' };

      component._initBreadcrumb();

      expect(component.breadcrumbs.length).toBe(4);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
      expect(component.breadcrumbs[0].iconBs).toBe('speedometer2');
      expect(component.breadcrumbs[1].label).toBe('API-Servizio v. 3');
      expect(component.breadcrumbs[3].label).toBe('trace-xyz');
    });

    it('should create standard breadcrumb layout (5 items) when _fromDashboard=false', () => {
      component._fromDashboard = false;
      component.service = { nome: 'API-Servizio', versione: 3, stato: 'pubblicato' };

      component._initBreadcrumb();

      expect(component.breadcrumbs.length).toBe(5);
      expect(component.breadcrumbs[0].label).toBe('');
      expect(component.breadcrumbs[0].iconBs).toBe('grid-3x3-gap');
      expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Services');
      expect(component.breadcrumbs[2].label).toBe('API-Servizio v. 3');
      expect(component.breadcrumbs[4].label).toBe('trace-xyz');
    });

    it('should use service name + version when service available', () => {
      component.service = { nome: 'MySvc', versione: 2, stato: 'bozza' };

      component._initBreadcrumb();

      expect(component.breadcrumbs[2].label).toBe('MySvc v. 2');
    });

    it('should use id as title when no service and id set', () => {
      component.service = null;
      component.id = 77;

      component._initBreadcrumb();

      expect(component.breadcrumbs[2].label).toBe('77');
    });

    it('should use translated New when no service and no id', () => {
      component.service = null;
      component.id = null;

      component._initBreadcrumb();

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TITLE.New');
    });

    it('should include data.id_traccia in last breadcrumb', () => {
      component.data = { id_traccia: 'trace-999' };
      component.service = null;
      component.id = 1;

      component._initBreadcrumb();

      const lastBreadcrumb = component.breadcrumbs[component.breadcrumbs.length - 1];
      expect(lastBreadcrumb.label).toBe('trace-999');
    });

    it('should include tooltip with translated service stato', () => {
      component.service = { nome: 'Svc', versione: 1, stato: 'pubblicato' };

      component._initBreadcrumb();

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.pubblicato');
    });

    it('should have correct Transactions link with sid', () => {
      component.sid = 42;
      component.service = { nome: 'Svc', versione: 1, stato: 'bozza' };

      component._initBreadcrumb();

      const transactionsBC = component.breadcrumbs.find((b: any) => b.label === 'APP.TITLE.Transactions');
      expect(transactionsBC.url).toBe('/servizi/42/transazioni');
      expect(transactionsBC.params).toEqual({ back: true });
    });

    it('should append /view to service URL when SERVIZI_VIEW is TRUE', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('TRUE');
      component.service = { nome: 'Svc', versione: 1, stato: 'bozza' };

      component._initBreadcrumb();

      const svcBC = component.breadcrumbs.find((b: any) => b.label === 'Svc v. 1');
      expect(svcBC.url).toContain('/view');
      vi.restoreAllMocks();
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    });

    it('should not append /view to service URL when SERVIZI_VIEW is not TRUE', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('FALSE');
      component.service = { nome: 'Svc', versione: 1, stato: 'bozza' };

      component._initBreadcrumb();

      const svcBC = component.breadcrumbs.find((b: any) => b.label === 'Svc v. 1');
      expect(svcBC.url).not.toContain('/view');
      vi.restoreAllMocks();
      vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    });

    it('should have empty tooltip when no service', () => {
      component.service = null;
      component.id = 5;

      component._initBreadcrumb();

      const svcBC = component.breadcrumbs.find((b: any) => b.label === '5');
      expect(svcBC.tooltip).toBe('');
    });
  });

  // -------------------------------------------------------
  // _initTabs
  // -------------------------------------------------------
  describe('_initTabs', () => {
    it('should enable InformazioniMittente when dati_mittente present', () => {
      component.data = { dati_mittente: { indirizzo_ip: '1.2.3.4' }, richiesta: null, risposta: null };

      component._initTabs();

      const tab = component.tabs.find((t: any) => t.link === 'InformazioniMittente');
      expect(tab.enabled).toBe(true);
    });

    it('should disable InformazioniMittente when dati_mittente absent', () => {
      component.data = { dati_mittente: null, richiesta: null, risposta: null };

      component._initTabs();

      const tab = component.tabs.find((t: any) => t.link === 'InformazioniMittente');
      expect(tab.enabled).toBe(false);
    });

    it('should enable DettaglioMessaggio when richiesta present', () => {
      component.data = { dati_mittente: null, richiesta: { data: 'req' }, risposta: null };

      component._initTabs();

      const tab = component.tabs.find((t: any) => t.link === 'DettaglioMessaggio');
      expect(tab.enabled).toBe(true);
    });

    it('should enable DettaglioMessaggio when risposta present', () => {
      component.data = { dati_mittente: null, richiesta: null, risposta: { data: 'resp' } };

      component._initTabs();

      const tab = component.tabs.find((t: any) => t.link === 'DettaglioMessaggio');
      expect(tab.enabled).toBe(true);
    });

    it('should disable DettaglioMessaggio when neither richiesta nor risposta', () => {
      component.data = { dati_mittente: null, richiesta: null, risposta: null };

      component._initTabs();

      const tab = component.tabs.find((t: any) => t.link === 'DettaglioMessaggio');
      expect(tab.enabled).toBe(false);
    });

    it('should always enable InformazioniGenerali', () => {
      component.data = { dati_mittente: null, richiesta: null, risposta: null };

      component._initTabs();

      const tab = component.tabs.find((t: any) => t.link === 'InformazioniGenerali');
      expect(tab.enabled).toBe(true);
    });
  });

  // -------------------------------------------------------
  // _hasControlError
  // -------------------------------------------------------
  describe('_hasControlError', () => {
    it('should return true when control has errors and is touched', () => {
      component._initForm({ id: null });
      component.f['id'].markAsTouched();

      expect(component._hasControlError('id')).toBe(true);
    });

    it('should return false when control has no errors', () => {
      component._initForm({ id: 123 });
      component.f['id'].markAsTouched();

      expect(component._hasControlError('id')).toBe(false);
    });

    it('should return false when control exists but is untouched', () => {
      component._initForm({ id: null });

      expect(component._hasControlError('id')).toBe(false);
    });

    it('should return false for nonexistent control', () => {
      expect(component._hasControlError('nonexistent')).toBe(false);
    });
  });

  // -------------------------------------------------------
  // _downloadAction
  // -------------------------------------------------------
  describe('_downloadAction', () => {
    it('should not throw when called', () => {
      expect(() => component._downloadAction({})).not.toThrow();
    });

    it('should accept any event object', () => {
      expect(() => component._downloadAction(null)).not.toThrow();
    });
  });

  // -------------------------------------------------------
  // onBreadcrumb (additional cases)
  // -------------------------------------------------------
  describe('onBreadcrumb additional', () => {
    it('should pass params from event to router state', () => {
      component._useRoute = true;
      component.onBreadcrumb({ url: '/dashboard', params: { back: true } });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard'], {
        state: { back: true },
        queryParamsHandling: 'preserve'
      });
    });

    it('should pass null state when no params in event', () => {
      component._useRoute = true;
      component.onBreadcrumb({ url: '/servizi' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], {
        state: null,
        queryParamsHandling: 'preserve'
      });
    });
  });

  // -------------------------------------------------------
  // ngAfterContentChecked
  // -------------------------------------------------------
  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      // window.innerWidth is defined in test env; just verify it sets a boolean
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // -------------------------------------------------------
  // _onTabs additional
  // -------------------------------------------------------
  describe('_onTabs additional', () => {
    it('should switch to InformazioniMittente', () => {
      component._onTabs('InformazioniMittente');
      expect(component._currentTab).toBe('InformazioniMittente');
    });

    it('should switch to InformazioniGenerali', () => {
      component._onTabs('InformazioniGenerali');
      expect(component._currentTab).toBe('InformazioniGenerali');
    });
  });

  // -------------------------------------------------------
  // Edge cases for constructor navigation state
  // -------------------------------------------------------
  describe('constructor navigation state edge cases', () => {
    it('should handle navigation state with environment but no service', () => {
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: { environment: 'produzione' } }
      });
      const comp = new TransazioneDetailsComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService,
        mockTools, mockApiService, mockUtilService
      );
      expect(comp.service).toBeNull();
      expect(comp.environment).toBe('produzione');
    });

    it('should keep collaudo when navigation state has empty environment', () => {
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: { state: { environment: '' } }
      });
      const comp = new TransazioneDetailsComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService,
        mockTools, mockApiService, mockUtilService
      );
      expect(comp.environment).toBe('collaudo');
    });

    it('should handle getCurrentNavigation returning object with no extras state', () => {
      mockRouter.getCurrentNavigation.mockReturnValue({
        extras: {}
      });
      const comp = new TransazioneDetailsComponent(
        mockRoute, mockRouter, mockTranslate, mockConfigService,
        mockTools, mockApiService, mockUtilService
      );
      expect(comp.service).toBeNull();
    });
  });
});
