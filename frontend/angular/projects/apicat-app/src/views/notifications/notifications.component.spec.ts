import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject, EMPTY } from 'rxjs';
import { NavigationEnd } from '@angular/router';
import { Tools } from '@linkit/components';
import { NotificationsComponent } from './notifications.component';
import { NotificationState, NotificationType } from './notifications';

describe('NotificationsComponent', () => {
  let component: NotificationsComponent;
  let savedConfigurazione: any;

  const routerEventsSubject = new Subject<any>();

  const mockRoute = { snapshot: { queryParams: {} } } as any;
  const mockRouter = { navigate: vi.fn(), events: routerEventsSubject.asObservable(), navigateByUrl: vi.fn() } as any;
  const mockLocation = { prepareExternalUrl: vi.fn((url: string) => `/apicat-app${url}`) } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k), onLangChange: of({}) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { Layout: { enablePollingNotifications: false, fullScroll: false } }
    }),
    getConfig: vi.fn().mockReturnValue(of({ columns: 4 })),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = {} as any;
  const mockLocalStorage = { getItem: vi.fn(), setItem: vi.fn() } as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    putElement: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockUtilService = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
  } as any;
  const mockAuthService = {
    isGestore: vi.fn().mockReturnValue(false),
  } as any;
  const mockNotificationsService = {
    startCounters: vi.fn(),
    getNotificationsCount: vi.fn().mockReturnValue(of({ count: 0 })),
    getCurrentCount: vi.fn().mockReturnValue(0),
  } as any;
  const mockNavigationService = {
    extractEvent: vi.fn().mockReturnValue(undefined),
    extractData: vi.fn((p: any) => p),
    shouldOpenInNewTab: vi.fn().mockReturnValue(false),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { Layout: { enablePollingNotifications: false, fullScroll: false } }
    });
    mockConfigService.getConfig.mockReturnValue(of({ columns: 4 }));
    mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
    mockApiService.putElement.mockReturnValue(of({}));
    mockUtilService._queryToHttpParams.mockReturnValue({});
    mockAuthService.isGestore.mockReturnValue(false);
    mockNotificationsService.getNotificationsCount.mockReturnValue(of({ count: 0 }));
    mockNotificationsService.getCurrentCount.mockReturnValue(0);
    mockNavigationService.extractEvent.mockReturnValue(undefined);
    mockNavigationService.extractData.mockImplementation((p: any) => p);
    mockNavigationService.shouldOpenInNewTab.mockReturnValue(false);
    Tools.ScrollTo = vi.fn() as any;
    Tools.ScrollElement = vi.fn() as any;
    component = new NotificationsComponent(
      mockRouter, mockLocation, mockTranslate,
      mockConfigService, mockTools,
      mockApiService, mockUtilService,
      mockAuthService, mockNotificationsService, mockNavigationService
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component._spin).toBe(true);
    expect(component.showSearch).toBe(true);
    expect(component.showSorting).toBe(true);
    expect(component.fullScroll).toBe(false);
    expect(component._isEdit).toBe(false);
    expect(component._hasFilter).toBe(true);
    expect(component._preventMultiCall).toBe(false);
    expect(component._error).toBe(false);
    expect(component.showHistory).toBe(false);
    expect(component._col).toBe(4);
    expect(component._showBulkSelection).toBe(false);
    expect(component._showTooltip).toBe(false);
    expect(component._enablePollingNotifications).toBe(false);
    expect(component._lastCount).toBe(0);
    expect(component._needRefresh).toBe(false);
    expect(component._firstCount).toBe(true);
    expect(component._timeRefresh).toBeNull();
    expect(component.currentTab).toBe(NotificationState.Tutte);
  });

  it('should have breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBeGreaterThan(0);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Notifications');
  });

  it('should initialize searchFields and sortFields', () => {
    expect(component.searchFields.length).toBe(5);
    expect(component.sortFields.length).toBe(0);
  });

  it('should have notificationTypes and notificationStates', () => {
    expect(component.notificationTypes.length).toBe(2);
    expect(component.notificationStates.length).toBe(3);
    expect(component.notificationTypes[0].value).toBe(NotificationType.Comunicazione);
    expect(component.notificationTypes[1].value).toBe(NotificationType.CambioStato);
    expect(component.notificationStates[0].value).toBe(NotificationState.Nuova);
    expect(component.notificationStates[1].value).toBe(NotificationState.Letta);
    expect(component.notificationStates[2].value).toBe(NotificationState.Archiviata);
  });

  describe('constructor', () => {
    it('should read enablePollingNotifications from config', () => {
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Layout: { enablePollingNotifications: true, fullScroll: true } }
      });
      const comp = new NotificationsComponent(
        mockRouter, mockLocation, mockTranslate,
        mockConfigService, mockTools,
        mockApiService, mockUtilService,
        mockAuthService, mockNotificationsService, mockNavigationService
      );
      expect(comp._enablePollingNotifications).toBe(true);
      expect(comp.fullScroll).toBe(true);
    });

    it('should handle NavigationEnd events with query params', () => {
      const refreshSpy = vi.spyOn(component, 'refresh').mockImplementation(() => {});
      routerEventsSubject.next(new NavigationEnd(1, '/notifications?refresh=123', '/notifications?refresh=123'));
      expect(refreshSpy).toHaveBeenCalled();
      expect(component._timeRefresh).toBe('123');
    });

    it('should not refresh if timeRefresh is same', () => {
      const refreshSpy = vi.spyOn(component, 'refresh').mockImplementation(() => {});
      component._timeRefresh = '123';
      routerEventsSubject.next(new NavigationEnd(1, '/notifications?refresh=123', '/notifications?refresh=123'));
      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it('should refresh if timeRefresh changes', () => {
      const refreshSpy = vi.spyOn(component, 'refresh').mockImplementation(() => {});
      component._timeRefresh = '100';
      routerEventsSubject.next(new NavigationEnd(1, '/notifications?refresh=200', '/notifications?refresh=200'));
      expect(refreshSpy).toHaveBeenCalled();
      expect(component._timeRefresh).toBe('200');
    });

    it('should ignore non-NavigationEnd events', () => {
      const refreshSpy = vi.spyOn(component, 'refresh').mockImplementation(() => {});
      routerEventsSubject.next({ type: 'other' });
      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it('should ignore NavigationEnd events without matching query params', () => {
      const refreshSpy = vi.spyOn(component, 'refresh').mockImplementation(() => {});
      routerEventsSubject.next(new NavigationEnd(1, '/notifications', '/notifications'));
      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });

  describe('_onResize', () => {
    it('should set desktop to true when window width >= 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
      component._onResize();
      expect(component.desktop).toBe(true);
    });

    it('should set desktop to false when window width < 992', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
      component._onResize();
      expect(component.desktop).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to configService.getConfig and set notificationsConfig', () => {
      component.ngOnInit();
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('notifiche');
      expect(component.notificationsConfig).toEqual({ columns: 4 });
    });

    it('should get current count from notificationsService', () => {
      mockNotificationsService.getCurrentCount.mockReturnValue(5);
      component.ngOnInit();
      expect(component._lastCount).toBe(5);
    });

    it('should call _startCounters', () => {
      const spy = vi.spyOn(component, '_startCounters').mockImplementation(() => {});
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should call clearSearch when searchBarForm is not pinned', () => {
      vi.useFakeTimers();
      component.searchBarForm = { _isPinned: vi.fn().mockReturnValue(false), _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _onSearch: vi.fn() } as any;
      const clearSpy = vi.spyOn(component, 'clearSearch').mockImplementation(() => {});
      component.ngAfterViewInit();
      vi.advanceTimersByTime(200);
      expect(clearSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should not call clearSearch when searchBarForm is pinned', () => {
      vi.useFakeTimers();
      component.searchBarForm = { _isPinned: vi.fn().mockReturnValue(true), _clearSearch: vi.fn(), _pinLastSearch: vi.fn(), _onSearch: vi.fn() } as any;
      const clearSpy = vi.spyOn(component, 'clearSearch').mockImplementation(() => {});
      component.ngAfterViewInit();
      vi.advanceTimersByTime(200);
      expect(clearSpy).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should handle missing searchBarForm gracefully', () => {
      vi.useFakeTimers();
      (component as any).searchBarForm = null;
      const clearSpy = vi.spyOn(component, 'clearSearch').mockImplementation(() => {});
      component.ngAfterViewInit();
      vi.advanceTimersByTime(200);
      expect(clearSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
      component.ngAfterContentChecked();
      expect(component.desktop).toBe(true);

      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });
      component.ngAfterContentChecked();
      expect(component.desktop).toBe(false);
    });
  });

  describe('_startCounters', () => {
    it('should not subscribe when polling is disabled', () => {
      component._enablePollingNotifications = false;
      component._startCounters();
      // no error, _firstCount remains true
      expect(component._firstCount).toBe(true);
    });

    it('should subscribe and skip first count', () => {
      const countSubject = new Subject<any>();
      mockNotificationsService.getNotificationsCount.mockReturnValue(countSubject.asObservable());
      component._enablePollingNotifications = true;
      component.notificationsCount$ = countSubject.asObservable();
      component._firstCount = true;
      component._lastCount = 0;
      component._startCounters();

      // First emission - should only set _firstCount to false
      countSubject.next({ count: 5 });
      expect(component._firstCount).toBe(false);
      expect(component._needRefresh).toBe(false);

      // Second emission with different count - should trigger needRefresh
      countSubject.next({ count: 10 });
      expect(component._needRefresh).toBe(true);
      expect(component._lastCount).toBe(10);
    });

    it('should not set needRefresh if count is same', () => {
      const countSubject = new Subject<any>();
      component._enablePollingNotifications = true;
      component.notificationsCount$ = countSubject.asObservable();
      component._firstCount = true;
      component._lastCount = 5;
      component._startCounters();

      countSubject.next({ count: 5 });
      expect(component._firstCount).toBe(false);

      countSubject.next({ count: 5 });
      expect(component._needRefresh).toBe(false);
    });
  });

  describe('clearSearch', () => {
    it('should clear searchBarForm, filterData, and load notifications', () => {
      component.searchBarForm = { _clearSearch: vi.fn(), _isPinned: vi.fn(), _pinLastSearch: vi.fn(), _onSearch: vi.fn() } as any;
      const loadSpy = vi.spyOn(component as any, '_loadNotifications').mockImplementation(() => {});
      component._filterData = [{ field: 'q', value: 'test' }];
      component.clearSearch();
      expect(component.searchBarForm._clearSearch).toHaveBeenCalledWith(null);
      expect(component._filterData).toEqual([]);
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should set _needRefresh to false and reload with filterData', () => {
      const loadSpy = vi.spyOn(component as any, '_loadNotifications').mockImplementation(() => {});
      component._needRefresh = true;
      component._filterData = [{ field: 'q', value: 'test' }];
      component.refresh();
      expect(component._needRefresh).toBe(false);
      expect(loadSpy).toHaveBeenCalledWith(component._filterData);
    });
  });

  describe('_setErrorMessages', () => {
    it('should set error messages when error is true', () => {
      component._setErrorMessages(true);
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
    });

    it('should set default messages when error is false', () => {
      component._setErrorMessages(false);
      expect(component._error).toBe(false);
      expect(component._message).toBe('APP.MESSAGE.NoResults');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    });
  });

  describe('_initSearchForm', () => {
    it('should create a form group with q control', () => {
      component._initSearchForm();
      expect(component._formGroup).toBeTruthy();
      expect(component._formGroup.get('q')).toBeTruthy();
    });
  });

  describe('_loadNotifications', () => {
    it('should clear elements and links when url is empty', () => {
      component.elements = [{ id: 1 }];
      component._links = { next: {} };
      component._loadNotifications();
      expect(component.elements).toEqual([]);
    });

    it('should add stato_notifica for Tutte tab', () => {
      component.currentTab = NotificationState.Tutte;
      component._loadNotifications({ q: 'test' });
      const callArgs = mockUtilService._queryToHttpParams.mock.calls[0][0];
      expect(callArgs.stato_notifica).toBe(`${NotificationState.Nuova},${NotificationState.Letta}`);
      expect(callArgs.q).toBe('test');
    });

    it('should add stato_notifica for specific tab', () => {
      component.currentTab = NotificationState.Archiviata;
      component._loadNotifications({ q: 'test' });
      const callArgs = mockUtilService._queryToHttpParams.mock.calls[0][0];
      expect(callArgs.stato_notifica).toBe(NotificationState.Archiviata);
    });

    it('should set _spin to true before call and false after', () => {
      component._loadNotifications();
      // After sync subscription callback, _spin should be false
      expect(component._spin).toBe(false);
    });

    it('should handle response with content containing servizio notifications', () => {
      const response = {
        page: { totalElements: 1 },
        _links: { next: { href: '/next' } },
        content: [{
          id_notifica: 'n1',
          mittente: { nome: 'Mario', cognome: 'Rossi', email_aziendale: 'mario@test.it', email: 'mario2@test.it' },
          stato: NotificationState.Nuova,
          tipo: { tipo: NotificationType.Comunicazione, testo: 'Test message' },
          entita: {
            id_entita: 'e1',
            servizio: { id_servizio: 's1', nome: 'Servizio1', versione: 1 },
            adesione: null
          }
        }]
      };
      mockApiService.getList.mockReturnValue(of(response));
      component._loadNotifications();

      expect(component.elements.length).toBe(1);
      expect(component.elements[0].id).toBe('n1');
      expect(component.elements[0].user_name).toBe('Mario Rossi');
      expect(component.elements[0].user_gravatar).toBe('mario@test.it');
      expect(component.elements[0].unread).toBe(true);
      expect(component.elements[0].descrizione).toBe('Test message');
      expect(component._page.totalElements).toBe(1);
      expect(component._links).toEqual({ next: { href: '/next' } });
      expect(component._allElements).toBe(1);
    });

    it('should handle response with content containing adesione notifications', () => {
      const response = {
        page: { totalElements: 1 },
        content: [{
          id_notifica: 'n2',
          mittente: { nome: 'Luigi', cognome: 'Verdi', email: 'luigi@test.it' },
          stato: NotificationState.Letta,
          tipo: { tipo: NotificationType.CambioStato, stato: 'Approvata' },
          entita: {
            id_entita: 'e2',
            servizio: null,
            adesione: { id_adesione: 'a1', servizio: { nome: 'ServizioA', versione: 2 }, soggetto: { nome: 'Soggetto1' } }
          }
        }]
      };
      mockApiService.getList.mockReturnValue(of(response));
      component._loadNotifications();

      expect(component.elements.length).toBe(1);
      expect(component.elements[0].user_name).toBe('Luigi Verdi');
      expect(component.elements[0].user_gravatar).toBe('luigi@test.it');
      expect(component.elements[0].unread).toBe(false);
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.Approvata');
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TITLE.Adesione');
    });

    it('should append elements when url is provided (pagination)', () => {
      component.elements = [{ id: 'existing' }];
      const response = {
        page: { totalElements: 2 },
        content: [{
          id_notifica: 'n3',
          mittente: { nome: 'A', cognome: 'B', email: 'ab@test.it' },
          stato: NotificationState.Letta,
          tipo: { tipo: NotificationType.Comunicazione, testo: 'More' },
          entita: { id_entita: 'e3', servizio: { id_servizio: 's2', nome: 'Serv2', versione: 1 }, adesione: null }
        }]
      };
      mockApiService.getList.mockReturnValue(of(response));
      component._loadNotifications(null, '/next-page');

      expect(component.elements.length).toBe(2);
      expect(component.elements[0].id).toBe('existing');
      expect(component.elements[1].id).toBe('n3');
    });

    it('should handle null response gracefully', () => {
      mockApiService.getList.mockReturnValue(of(null));
      component._loadNotifications();
      expect(component._spin).toBe(false);
      expect(component._preventMultiCall).toBe(false);
    });

    it('should handle error response', () => {
      mockApiService.getList.mockReturnValue({
        subscribe: (handlers: any) => { handlers.error(new Error('API error')); }
      });
      component._loadNotifications();
      expect(component._error).toBe(true);
      expect(component._spin).toBe(false);
      expect(component._preventMultiCall).toBe(false);
    });

    it('should use index as id when id_notifica is missing', () => {
      const response = {
        page: {},
        content: [{
          mittente: { nome: 'A', cognome: 'B', email: 'ab@test.it' },
          stato: NotificationState.Letta,
          tipo: { tipo: NotificationType.Comunicazione, testo: 'msg' },
          entita: { id_entita: 'e1', servizio: { id_servizio: 's1', nome: 'S1', versione: 1 }, adesione: null }
        }]
      };
      mockApiService.getList.mockReturnValue(of(response));
      component._loadNotifications();
      expect(component.elements[0].id).toBe(0);
    });

    it('should handle empty query as null', () => {
      component.currentTab = NotificationState.Nuova;
      component._loadNotifications(null);
      // query becomes { stato_notifica: 'nuova' }
      expect(mockUtilService._queryToHttpParams).toHaveBeenCalled();
    });
  });

  describe('__loadMoreData', () => {
    it('should load more data when _links.next exists and not preventMultiCall', () => {
      const loadSpy = vi.spyOn(component as any, '_loadNotifications').mockImplementation(() => {});
      component._links = { next: { href: '/api/next' } };
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect(component._preventMultiCall).toBe(true);
      expect(loadSpy).toHaveBeenCalledWith(null, '/api/next');
    });

    it('should not load when _preventMultiCall is true', () => {
      const loadSpy = vi.spyOn(component as any, '_loadNotifications').mockImplementation(() => {});
      component._links = { next: { href: '/api/next' } };
      component._preventMultiCall = true;
      component.__loadMoreData();
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('should not load when _links is null', () => {
      const loadSpy = vi.spyOn(component as any, '_loadNotifications').mockImplementation(() => {});
      component._links = null;
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('should not load when _links.next is undefined', () => {
      const loadSpy = vi.spyOn(component as any, '_loadNotifications').mockImplementation(() => {});
      component._links = {};
      component._preventMultiCall = false;
      component.__loadMoreData();
      expect(loadSpy).not.toHaveBeenCalled();
    });
  });

  describe('_onEdit', () => {
    const makeNotificationData = (withServizio: boolean, tipo: string = NotificationType.Comunicazione) => ({
      id_notifica: 'n1',
      entita: {
        id_entita: 'e1',
        servizio: withServizio ? { id_servizio: 's1' } : null,
        adesione: withServizio ? null : { id_adesione: 'a1' }
      },
      tipo: { tipo }
    });

    beforeEach(() => {
      component.searchBarForm = { _pinLastSearch: vi.fn(), _clearSearch: vi.fn(), _isPinned: vi.fn(), _onSearch: vi.fn() } as any;
    });

    it('should pin last search and navigate to servizio URL', () => {
      const data = makeNotificationData(true, NotificationType.Comunicazione);
      mockNavigationService.extractData.mockReturnValue(data);
      mockNavigationService.shouldOpenInNewTab.mockReturnValue(false);

      component._onEdit({}, data);

      expect(component.searchBarForm._pinLastSearch).toHaveBeenCalled();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(
        expect.stringContaining('/servizi/s1/comunicazioni?')
      );
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(
        expect.stringContaining('notificationId=n1&messageid=e1')
      );
    });

    it('should navigate to adesione URL for adesione notification', () => {
      const data = makeNotificationData(false, NotificationType.CambioStato);
      mockNavigationService.extractData.mockReturnValue(data);
      mockNavigationService.shouldOpenInNewTab.mockReturnValue(false);

      component._onEdit({}, data);

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(
        expect.stringContaining('/adesioni/a1?')
      );
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(
        expect.stringContaining('notificationId=n1&messageid=e1')
      );
    });

    it('should open in new tab when shouldOpenInNewTab returns true', () => {
      const data = makeNotificationData(true, NotificationType.Comunicazione);
      const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
      mockNavigationService.extractEvent.mockReturnValue(mockEvent);
      mockNavigationService.extractData.mockReturnValue(data);
      mockNavigationService.shouldOpenInNewTab.mockReturnValue(true);
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      component._onEdit({ event: mockEvent }, data);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockLocation.prepareExternalUrl).toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('/apicat-app'), '_blank');
      openSpy.mockRestore();
    });

    it('should handle missing searchBarForm gracefully', () => {
      (component as any).searchBarForm = null;
      const data = makeNotificationData(true);
      mockNavigationService.extractData.mockReturnValue(data);
      mockNavigationService.shouldOpenInNewTab.mockReturnValue(false);

      expect(() => component._onEdit({}, data)).not.toThrow();
    });

    it('should use comunicazioni URL for comunicazione type, ? for other', () => {
      const dataCambioStato = makeNotificationData(true, NotificationType.CambioStato);
      mockNavigationService.extractData.mockReturnValue(dataCambioStato);
      mockNavigationService.shouldOpenInNewTab.mockReturnValue(false);

      component._onEdit({}, dataCambioStato);

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(
        expect.stringMatching(/\/servizi\/s1\?notificationId=n1/)
      );
    });
  });

  describe('_onOpenInNewTab', () => {
    it('should open servizio notification in new tab', () => {
      const data = {
        id_notifica: 'n1',
        entita: {
          id_entita: 'e1',
          servizio: { id_servizio: 's1' },
          adesione: null
        },
        tipo: { tipo: NotificationType.Comunicazione }
      };
      mockNavigationService.extractData.mockReturnValue(data);
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      component._onOpenInNewTab({ data });

      expect(mockLocation.prepareExternalUrl).toHaveBeenCalledWith(
        expect.stringContaining('/servizi/s1/comunicazioni?notificationId=n1&messageid=e1')
      );
      expect(openSpy).toHaveBeenCalledWith(expect.any(String), '_blank');
      openSpy.mockRestore();
    });

    it('should open adesione notification in new tab', () => {
      const data = {
        id_notifica: 'n2',
        entita: {
          id_entita: 'e2',
          servizio: null,
          adesione: { id_adesione: 'a1' }
        },
        tipo: { tipo: NotificationType.CambioStato }
      };
      mockNavigationService.extractData.mockReturnValue(data);
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      component._onOpenInNewTab({ data });

      expect(mockLocation.prepareExternalUrl).toHaveBeenCalledWith(
        expect.stringContaining('/adesioni/a1?notificationId=n2&messageid=e2')
      );
      expect(openSpy).toHaveBeenCalledWith(expect.any(String), '_blank');
      openSpy.mockRestore();
    });
  });

  describe('markNotification', () => {
    it('should call putElement and refresh when refresh=true', () => {
      const refreshSpy = vi.spyOn(component, 'refresh').mockImplementation(() => {});
      mockApiService.putElement.mockReturnValue(of({ id_notifica: 'n1', stato: NotificationState.Letta }));

      component.markNotification({ id_notifica: 'n1' }, NotificationState.Letta, true);

      expect(mockApiService.putElement).toHaveBeenCalledWith('notifiche', 'n1', { stato: NotificationState.Letta });
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('should call putElement and refresh when currentTab is Archiviata', () => {
      const refreshSpy = vi.spyOn(component, 'refresh').mockImplementation(() => {});
      component.currentTab = NotificationState.Archiviata;
      mockApiService.putElement.mockReturnValue(of({ id_notifica: 'n1', stato: NotificationState.Archiviata }));

      component.markNotification({ id_notifica: 'n1' }, NotificationState.Archiviata);

      expect(refreshSpy).toHaveBeenCalled();
    });

    it('should update element in-place when not refreshing', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component.currentTab = NotificationState.Tutte;
      component.elements = [
        { id_notifica: 'n1', unread: true, other: 'data' },
        { id_notifica: 'n2', unread: true, other: 'data2' }
      ];
      mockApiService.putElement.mockReturnValue(of({ id_notifica: 'n1', stato: NotificationState.Letta }));

      component.markNotification({ id_notifica: 'n1' }, NotificationState.Letta);

      expect(component.elements[0].unread).toBe(false);
      expect(component.elements[1].unread).toBe(true);
      consoleSpy.mockRestore();
    });

    it('should mark as unread when response stato is Nuova', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component.currentTab = NotificationState.Tutte;
      component.elements = [{ id_notifica: 'n1', unread: false }];
      mockApiService.putElement.mockReturnValue(of({ id_notifica: 'n1', stato: NotificationState.Nuova }));

      component.markNotification({ id_notifica: 'n1' }, NotificationState.Nuova);

      expect(component.elements[0].unread).toBe(true);
      consoleSpy.mockRestore();
    });

    it('should handle element not found in list', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component.currentTab = NotificationState.Tutte;
      component.elements = [{ id_notifica: 'n2', unread: true }];
      mockApiService.putElement.mockReturnValue(of({ id_notifica: 'n999', stato: NotificationState.Letta }));

      expect(() => component.markNotification({ id_notifica: 'n1' }, NotificationState.Letta)).not.toThrow();
      consoleSpy.mockRestore();
    });

    it('should handle error from putElement', () => {
      mockApiService.putElement.mockReturnValue({
        subscribe: (handlers: any) => { handlers.error(new Error('Put error')); }
      });
      expect(() => component.markNotification({ id_notifica: 'n1' }, NotificationState.Letta)).not.toThrow();
    });
  });

  describe('_onSubmit', () => {
    it('should call searchBarForm._onSearch when searchBarForm exists', () => {
      component.searchBarForm = { _onSearch: vi.fn(), _clearSearch: vi.fn(), _isPinned: vi.fn(), _pinLastSearch: vi.fn() } as any;
      component._onSubmit({});
      expect(component.searchBarForm._onSearch).toHaveBeenCalled();
    });

    it('should not throw when searchBarForm is missing', () => {
      (component as any).searchBarForm = null;
      expect(() => component._onSubmit({})).not.toThrow();
    });
  });

  describe('_onSearch', () => {
    it('should set filterData and load notifications', () => {
      const loadSpy = vi.spyOn(component as any, '_loadNotifications').mockImplementation(() => {});
      const values = [{ field: 'q', value: 'test' }];
      component._onSearch(values);
      expect(component._filterData).toBe(values);
      expect(loadSpy).toHaveBeenCalledWith(values);
    });
  });

  describe('_resetForm', () => {
    it('should reset filterData and reload', () => {
      const loadSpy = vi.spyOn(component as any, '_loadNotifications').mockImplementation(() => {});
      component._filterData = [{ field: 'test', value: 'val' }];
      component._resetForm();
      expect(component._filterData).toEqual([]);
      expect(loadSpy).toHaveBeenCalledWith([]);
    });
  });

  describe('_onSort', () => {
    it('should log the event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component._onSort({ field: 'nome', direction: 'asc' });
      expect(consoleSpy).toHaveBeenCalledWith({ field: 'nome', direction: 'asc' });
      consoleSpy.mockRestore();
    });
  });

  describe('_setCurrentTab', () => {
    it('should set currentTab and call _onSearch', () => {
      const searchSpy = vi.spyOn(component, '_onSearch').mockImplementation(() => {});
      component._filterData = [{ field: 'q', value: 'x' }];
      component._setCurrentTab(NotificationState.Archiviata);
      expect(component.currentTab).toBe(NotificationState.Archiviata);
      expect(searchSpy).toHaveBeenCalledWith(component._filterData);
    });
  });

  describe('onBreadcrumb', () => {
    it('should navigate to the event url', () => {
      component.onBreadcrumb({ url: '/test' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/test']);
    });
  });

  describe('_resetScroll', () => {
    it('should call Tools.ScrollElement', () => {
      component._resetScroll();
      expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
    });
  });

  describe('_toggleCols', () => {
    it('should toggle from 4 to 6', () => {
      component._col = 4;
      component._toggleCols();
      expect(component._col).toBe(6);
    });

    it('should toggle from 6 to 4', () => {
      component._col = 6;
      component._toggleCols();
      expect(component._col).toBe(4);
    });
  });

  describe('_isGestore', () => {
    it('should return false when authService returns false', () => {
      mockAuthService.isGestore.mockReturnValue(false);
      expect(component._isGestore()).toBe(false);
    });

    it('should return true when authService returns true', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      expect(component._isGestore()).toBe(true);
    });
  });

  describe('_isGestoreMapper', () => {
    it('should call authenticationService.isGestore with empty array', () => {
      mockAuthService.isGestore.mockReturnValue(false);
      const result = component._isGestoreMapper();
      expect(mockAuthService.isGestore).toHaveBeenCalledWith([]);
      expect(result).toBe(false);
    });

    it('should return true when authService.isGestore returns true', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      expect(component._isGestoreMapper()).toBe(true);
    });
  });
});
