import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { AdesioneComunicazioniComponent } from './adesione-comunicazioni.component';
import { Tools } from '@linkit/components';

// Mock global saveAs
(globalThis as any).saveAs = vi.fn();

describe('AdesioneComunicazioniComponent', () => {
  let component: AdesioneComunicazioniComponent;

  const mockRoute = {
    params: of({ id: 'ade-1' }),
    queryParams: of({}),
    parent: { params: of({ id: 'ade-1' }) },
    data: of({})
  } as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockRenderer = { addClass: vi.fn(), removeClass: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { Layout: { enableOpenInNewTab: false } }
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 } })),
    getDetails: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    postElementRelated: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of({ body: new Blob() })),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    getUser: vi.fn().mockReturnValue({ id_utente: 'u1' }),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    vi.spyOn(Tools, 'SortBy').mockReturnValue(() => 0);
    component = new AdesioneComunicazioniComponent(
      mockRoute, mockRouter, mockRenderer, mockTranslate,
      mockConfigService, mockTools, mockApiService, mockAuthService
    );
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(AdesioneComunicazioniComponent.Name).toBe('AdesioneComunicazioniComponent');
  });

  // --- Initial state ---

  it('should have model set to adesioni', () => {
    expect(component.model).toBe('adesioni');
  });

  it('should have default breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Subscriptions');
    expect(component.breadcrumbs[2].label).toBe('APP.TITLE.ServiceCommunications');
  });

  it('should have targetOptionsAdesione with 7 options (including GESTORE and COORDINATORE)', () => {
    expect(component.targetOptionsAdesione.length).toBe(7);
    expect(component.targetOptionsAdesione[0].value).toBe('GESTORE');
    expect(component.targetOptionsAdesione[1].value).toBe('COORDINATORE');
    expect(component.targetOptionsAdesione[2].value).toBe('REFERENTI_DOMINIO_SERVIZIO');
    expect(component.targetOptionsAdesione[6].value).toBe('RICHIEDENTE_ADESIONE');
  });

  // --- _setErrorCommunications ---

  it('_setErrorCommunications(true) should set error state and messages', () => {
    component._setErrorCommunications(true);

    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('_setErrorCommunications(false) should clear error state and set default messages', () => {
    component._error = true;
    component._setErrorCommunications(false);

    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
  });

  // --- _loadAdesione ---

  it('_loadAdesione should load adesione details and init breadcrumb', () => {
    component.id = 10;
    const mockAdesione = {
      id_adesione: 10, nome: 'Test',
      soggetto: { organizzazione: { nome: 'Org' } },
      servizio: { nome: 'Srv', versione: '1' }
    };
    mockApiService.getDetails.mockReturnValue(of(mockAdesione));

    component._loadAdesione();

    expect(component.adesione).toEqual(mockAdesione);
    expect(component.breadcrumbs[1].label).toContain('Org');
  });

  it('_loadAdesione should not call API when id is 0', () => {
    component.id = 0;

    component._loadAdesione();

    expect(mockApiService.getDetails).not.toHaveBeenCalled();
  });

  it('_loadAdesione should call Tools.OnError on error', () => {
    component.id = 10;
    mockApiService.getDetails.mockReturnValue(throwError(() => new Error('Load error')));

    component._loadAdesione();

    expect(Tools.OnError).toHaveBeenCalled();
  });

  // --- _loadAdesioneComunicazioni ---

  it('_loadAdesioneComunicazioni should load communications', () => {
    component.id = 10;
    const response = {
      content: [
        { uuid: 'msg-1', data: '2026-01-15T10:00:00Z', autore: { nome: 'Mario', cognome: 'Rossi' }, testo: 'Hello' },
      ],
      page: { totalElements: 1 },
      _links: {}
    };
    mockApiService.getDetails.mockReturnValue(of(response));

    component._loadAdesioneComunicazioni();

    expect(component.adesioneCommunications.length).toBe(1);
    expect(component.adesioneCommunications[0].id).toBe('msg-1');
    expect(component.adesioneCommunications[0].mittente).toContain('Mario');
    expect(component._spin).toBe(false);
  });

  it('_loadAdesioneComunicazioni should clear list when no url is provided', () => {
    component.id = 10;
    component.adesioneCommunications = [{ id: 'old' }] as any;
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

    component._loadAdesioneComunicazioni();

    expect(component.adesioneCommunications).toEqual([]);
  });

  it('_loadAdesioneComunicazioni should handle string autore', () => {
    component.id = 10;
    const response = {
      content: [
        { uuid: 'msg-1', data: '2026-01-15T10:00:00Z', autore: 'Sistema', testo: 'System message' },
      ],
      page: {},
      _links: {}
    };
    mockApiService.getDetails.mockReturnValue(of(response));

    component._loadAdesioneComunicazioni();

    expect(component.adesioneCommunications[0].mittente).toBe('Sistema');
  });

  it('_loadAdesioneComunicazioni should handle null autore', () => {
    component.id = 10;
    const response = {
      content: [
        { uuid: 'msg-1', data: '2026-01-15T10:00:00Z', autore: null, testo: 'Anon message' },
      ],
      page: {},
      _links: {}
    };
    mockApiService.getDetails.mockReturnValue(of(response));

    component._loadAdesioneComunicazioni();

    expect(component.adesioneCommunications[0].mittente).toBe('Anonimo');
  });

  it('_loadAdesioneComunicazioni should set error on API failure', () => {
    component.id = 10;
    mockApiService.getDetails.mockReturnValue(throwError(() => new Error('Com error')));

    component._loadAdesioneComunicazioni();

    expect(component._error).toBe(true);
    expect(component._spin).toBe(false);
  });

  it('_loadAdesioneComunicazioni should not call API when id is 0', () => {
    component.id = 0;

    component._loadAdesioneComunicazioni();

    expect(mockApiService.getDetails).not.toHaveBeenCalled();
  });

  // --- __loadMoreData ---

  it('__loadMoreData should call _loadAdesioneComunicazioni when _links.next exists', () => {
    component._links = { next: { href: '/api/next' } };
    component._preventMultiCall = false;
    component.id = 10;
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

    component.__loadMoreData();

    // getDetails should have been called (via _loadAdesioneComunicazioni)
    expect(mockApiService.getDetails).toHaveBeenCalledWith('adesioni', 10, 'comunicazioni');
  });

  it('__loadMoreData should not load when _preventMultiCall is true', () => {
    component._links = { next: { href: '/api/next' } };
    component._preventMultiCall = true;

    component.__loadMoreData();

    expect(mockApiService.getDetails).not.toHaveBeenCalled();
  });

  it('__loadMoreData should not load when no next link', () => {
    component._links = {};

    component.__loadMoreData();

    expect(mockApiService.getDetails).not.toHaveBeenCalled();
  });

  // --- _onSubmitMessage (send message) ---

  it('_onSubmitMessage should post message and reload communications', () => {
    component.id = 10;
    component.adesione = { nome: 'Test Adesione' };
    mockApiService.postElementRelated.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

    component._onSubmitMessage({
      form: { messaggio: 'Test message', target: ['REFERENTI_SERVIZIO'], includi_tecnici: false, allegati: null }
    });

    expect(mockApiService.postElementRelated).toHaveBeenCalledWith('adesioni', 10, 'messaggi', expect.objectContaining({
      testo: 'Test message',
      target: ['REFERENTI_SERVIZIO'],
      includi_tecnici: false,
    }));
    expect(component._spinSend).toBe(false);
  });

  it('_onSubmitMessage should set target to null when empty', () => {
    component.id = 10;
    component.adesione = { nome: 'Test' };
    mockApiService.postElementRelated.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

    component._onSubmitMessage({
      form: { messaggio: 'Hello', target: [], includi_tecnici: false, allegati: null }
    });

    const postedMessage = mockApiService.postElementRelated.mock.calls[0][3];
    expect(postedMessage.target).toBeNull();
  });

  it('_onSubmitMessage should map allegati correctly', () => {
    component.id = 10;
    component.adesione = { nome: 'Test' };
    mockApiService.postElementRelated.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

    component._onSubmitMessage({
      form: {
        messaggio: 'With attachment',
        target: null,
        includi_tecnici: false,
        allegati: [{ file: 'doc.pdf', type: 'application/pdf', data: 'base64data' }]
      }
    });

    const postedMessage = mockApiService.postElementRelated.mock.calls[0][3];
    expect(postedMessage.allegati).toEqual([{
      filename: 'doc.pdf',
      estensione: 'application/pdf',
      content: 'base64data'
    }]);
  });

  it('_onSubmitMessage should handle post error', () => {
    component.id = 10;
    component.adesione = { nome: 'Test' };
    mockApiService.postElementRelated.mockReturnValue(throwError(() => new Error('Post error')));

    component._onSubmitMessage({
      form: { messaggio: 'Fail message', target: null, includi_tecnici: false, allegati: null }
    });

    expect(component._spinSend).toBe(false);
    expect(Tools.OnError).toHaveBeenCalled();
  });

  // --- _onSearch ---

  it('_onSearch should set filterData and reload communications', () => {
    component.id = 10;
    const values = { q: 'search' };
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

    component._onSearch(values);

    expect(component._filterData).toEqual(values);
    expect(mockApiService.getDetails).toHaveBeenCalled();
  });

  // --- _resetForm ---

  it('_resetForm should clear filterData and reload communications', () => {
    component.id = 10;
    component._filterData = [{ q: 'test' }] as any;
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));

    component._resetForm();

    expect(component._filterData).toEqual([]);
  });

  // --- onBreadcrumb ---

  it('onBreadcrumb should navigate to the given url', () => {
    component.onBreadcrumb({ url: '/adesioni' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/adesioni']);
  });

  // --- _resetScroll ---

  it('_resetScroll should call Tools.ScrollElement', () => {
    component._resetScroll();
    expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
  });

  // --- _onCloseEdit ---

  it('_onCloseEdit should set _isEdit to false', () => {
    component._isEdit = true;
    component._onCloseEdit({});
    expect(component._isEdit).toBe(false);
  });

  // --- _onEdit ---

  it('_onEdit should set _editCurrent and _isEdit when _useDialog is false', () => {
    component._useDialog = false;
    const param = { id: 99 };

    component._onEdit(null, param);

    expect(component._editCurrent).toBe(param);
    expect(component._isEdit).toBe(true);
  });

  // --- _isMime ---

  it('_isMime should return true when message autore matches current user', () => {
    mockAuthService.getUser.mockReturnValue({ id_utente: 'u1' });
    const message = { autore: { id_utente: 'u1' } };
    expect(component._isMime(message)).toBe(true);
  });

  it('_isMime should return false when message autore does not match current user', () => {
    mockAuthService.getUser.mockReturnValue({ id_utente: 'u1' });
    const message = { autore: { id_utente: 'u2' } };
    expect(component._isMime(message)).toBe(false);
  });

  // --- _toggleSender ---

  it('_toggleSender should toggle showSender', () => {
    component.showSender = true;
    component._toggleSender();
    expect(component.showSender).toBe(false);

    component._toggleSender();
    expect(component.showSender).toBe(true);
  });

  // --- _onCloseNotificationBar ---

  it('_onCloseNotificationBar should navigate to comunicazioni route', () => {
    component.id = 42;
    component._onCloseNotificationBar({});
    expect(mockRouter.navigate).toHaveBeenCalledWith(['adesioni', 42, 'comunicazioni']);
  });

  // --- _timestampToMoment ---

  it('_timestampToMoment should return Date for valid value', () => {
    const ts = 1700000000000;
    const result = component._timestampToMoment(ts);
    expect(result).toBeInstanceOf(Date);
  });

  it('_timestampToMoment should return null for 0', () => {
    expect(component._timestampToMoment(0)).toBeNull();
  });

  // --- _onSubmit ---

  it('_onSubmit should call searchBarForm._onSearch when available', () => {
    component.searchBarForm = { _onSearch: vi.fn() } as any;
    component._onSubmit({});
    expect(component.searchBarForm._onSearch).toHaveBeenCalled();
  });

  it('_onSubmit should not throw when searchBarForm is undefined', () => {
    component.searchBarForm = undefined as any;
    expect(() => component._onSubmit({})).not.toThrow();
  });

  // --- __onDownload ---

  it('__onDownload should call apiService.download with correct path', () => {
    component.id = 10;
    const message = { uuid: 'msg-uuid' };
    const attachment = { uuid: 'att-uuid', filename: 'doc.pdf' };
    mockApiService.download.mockReturnValue(of({ body: new Blob() }));

    component.__onDownload(message, attachment);

    expect(mockApiService.download).toHaveBeenCalledWith('adesioni', 10, 'messaggi/msg-uuid/allegati/att-uuid/download');
  });

  it('__onDownload should set _error on failure', () => {
    component.id = 10;
    mockApiService.download.mockReturnValue(throwError(() => new Error('Download error')));

    component.__onDownload({ uuid: 'msg-1' }, { uuid: 'att-1', filename: 'f.txt' });

    expect(component._error).toBe(true);
    expect(Tools.OnError).toHaveBeenCalled();
  });

  // --- _initBreadcrumb ---

  it('_initBreadcrumb should set breadcrumbs with adesione info', () => {
    component.adesione = {
      id_adesione: 10,
      soggetto: { organizzazione: { nome: 'Org Test' } },
      servizio: { nome: 'Srv Test', versione: '2' }
    };
    component.id = 10;

    component._initBreadcrumb();

    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[1].label).toContain('Org Test');
    expect(component.breadcrumbs[1].label).toContain('Srv Test');
    expect(component.breadcrumbs[1].label).toContain('v. 2');
  });

  it('_initBreadcrumb should use id when adesione is null', () => {
    component.adesione = null;
    component.id = 55;

    component._initBreadcrumb();

    expect(component.breadcrumbs[1].label).toBe('55');
  });

  it('_initBreadcrumb should prepend service breadcrumbs when set', () => {
    component.adesione = {
      id_adesione: 10,
      soggetto: { organizzazione: { nome: 'Org' } },
      servizio: { nome: 'Srv', versione: '1' }
    };
    component._serviceBreadcrumbs = {
      service: { id_servizio: 'srv1' },
      breadcrumbs: [{ label: 'Services', url: '/servizi', type: 'link' }]
    } as any;

    component._initBreadcrumb();

    expect(component.breadcrumbs.length).toBe(4);
    expect(component.breadcrumbs[0].label).toBe('Services');
  });

  // --- mapGDateMessageVisible ---

  it('mapGDateMessageVisible should return boolean', () => {
    const result = component.mapGDateMessageVisible(
      { format: () => '01012025' },
      { format: () => '02012025' }
    );
    expect(typeof result).toBe('boolean');
  });
});
