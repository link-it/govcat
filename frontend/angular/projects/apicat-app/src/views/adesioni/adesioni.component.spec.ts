import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { AdesioniComponent, StatoConfigurazione } from './adesioni.component';
import { Tools } from '@linkit/components';
import { HttpParams } from '@angular/common/http';

// Mock the global saveAs used by file-saver
(globalThis as any).saveAs = vi.fn();

describe('AdesioniComponent', () => {
  let component: AdesioniComponent;

  const mockRoute = { params: of({}), queryParams: of({}), data: of({}) } as any;
  const mockRouter = { navigate: vi.fn(), url: '/adesioni' } as any;
  const mockTranslate = {
    instant: vi.fn((k: string) => k),
    onLangChange: of({}),
  } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { Services: { hideVersions: false } }
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockEventsManager = {
    on: vi.fn(),
    broadcast: vi.fn(),
  } as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} })),
    postElement: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of({ body: new Blob(), headers: { get: () => null } })),
  } as any;
  const mockUtils = {
    _queryToHttpParams: vi.fn().mockReturnValue(new HttpParams()),
    getAnagrafiche: vi.fn().mockReturnValue({}),
    _confirmDialog: vi.fn(),
    GetErrorMsg: vi.fn().mockReturnValue('Error message'),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    isGestore: vi.fn().mockReturnValue(false),
    getRole: vi.fn().mockReturnValue('referente_servizio'),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
  } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockNavigationService = {
    getState: vi.fn().mockReturnValue(null),
    saveState: vi.fn(),
    extractEvent: vi.fn().mockReturnValue(null),
    extractData: vi.fn().mockReturnValue(null),
    shouldOpenInNewTab: vi.fn().mockReturnValue(false),
    openInNewTab: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
    vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});
    vi.spyOn(Tools, 'GetFilenameFromHeader').mockReturnValue('export.csv');
    Tools.Configurazione = {
      adesione: { workflow: { stati: [] }, configurazione_automatica: null },
      servizio: { adesioni_multiple: [] },
    };
    component = new AdesioniComponent(
      mockRoute, mockRouter, mockTranslate,
      mockConfigService, mockEventsManager, mockApiService,
      mockUtils, mockAuthService, mockModalService, mockNavigationService
    );
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(AdesioniComponent.Name).toBe('AdesioniComponent');
  });

  it('should have breadcrumbs', () => {
    expect(component.breadcrumbs).toBeDefined();
    expect(component.breadcrumbs.length).toBeGreaterThanOrEqual(1);
  });

  it('should initialize config from configService', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  // --- StatoConfigurazione enum ---

  it('should define StatoConfigurazione enum values', () => {
    expect(StatoConfigurazione.FALLITA).toBe('fallita');
    expect(StatoConfigurazione.IN_CODA).toBe('in_coda');
    expect(StatoConfigurazione.KO).toBe('ko');
    expect(StatoConfigurazione.OK).toBe('ok');
    expect(StatoConfigurazione.RETRY).toBe('retry');
  });

  // --- _loadAdesioni ---

  it('_loadAdesioni should clear adesioni and set _spin when called without url', () => {
    component.adesioni = [{ id: 1 }] as any;
    component._loadAdesioni();
    expect(component.adesioni).toEqual([]);
  });

  it('_loadAdesioni should populate adesioni from API response', () => {
    const response = {
      content: [
        { id_adesione: 10, nome: 'Adesione 1' },
        { id_adesione: 20, nome: 'Adesione 2' },
      ],
      page: { totalElements: 2, number: 0, size: 25 },
      _links: { next: { href: '/api/next' } }
    };
    mockApiService.getList.mockReturnValue(of(response));

    component._loadAdesioni();

    expect(component.adesioni.length).toBe(2);
    expect(component.adesioni[0].id).toBe(10);
    expect(component.adesioni[0].source.id_adesione).toBe(10);
    expect(component.adesioni[1].id).toBe(20);
    expect(component._links).toEqual({ next: { href: '/api/next' } });
    expect(component._spin).toBe(false);
  });

  it('_loadAdesioni should append results when url is provided (pagination)', () => {
    component.adesioni = [{ id: 1, source: {}, editMode: false, selected: false }] as any;

    const response = {
      content: [{ id_adesione: 2, nome: 'Adesione 2' }],
      page: { totalElements: 2 },
      _links: {}
    };
    mockApiService.getList.mockReturnValue(of(response));

    component._loadAdesioni(null, '/api/next');

    expect(component.adesioni.length).toBe(2);
    expect(component.adesioni[0].id).toBe(1);
    expect(component.adesioni[1].id).toBe(2);
  });

  it('_loadAdesioni should handle API error', () => {
    mockApiService.getList.mockReturnValue(throwError(() => new Error('API Error')));

    component._loadAdesioni();

    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._spin).toBe(false);
    expect(component._preventMultiCall).toBe(false);
  });

  it('_loadAdesioni should use query params when provided', () => {
    const query = { q: 'test', stato: 'bozza' };
    mockUtils._queryToHttpParams.mockReturnValue(new HttpParams().set('q', 'test'));
    mockApiService.getList.mockReturnValue(of({ content: [], page: {}, _links: {} }));

    component._loadAdesioni(query);

    expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith(query);
    expect(mockApiService.getList).toHaveBeenCalled();
  });

  it('_loadAdesioni should add id_servizio param when service is set', () => {
    component.service = { id_servizio: 42 } as any;
    mockApiService.getList.mockReturnValue(of({ content: [], page: {}, _links: {} }));

    component._loadAdesioni();

    const callArgs = mockApiService.getList.mock.calls[0];
    const params: HttpParams = callArgs[1].params;
    expect(params.get('id_servizio')).toBe('42');
  });

  // --- __loadMoreData ---

  it('__loadMoreData should call _loadAdesioni with next href when _links.next exists', () => {
    component._links = { next: { href: '/api/adesioni?offset=25' } };
    component._preventMultiCall = false;
    mockApiService.getList.mockReturnValue(of({ content: [], page: {}, _links: {} }));

    component.__loadMoreData();

    // getList should have been called with the next href url
    expect(mockApiService.getList).toHaveBeenCalledWith('adesioni', expect.anything(), '/api/adesioni?offset=25');
  });

  it('__loadMoreData should not load if _preventMultiCall is true', () => {
    component._links = { next: { href: '/api/adesioni?offset=25' } };
    component._preventMultiCall = true;

    component.__loadMoreData();

    expect(mockApiService.getList).not.toHaveBeenCalled();
  });

  it('__loadMoreData should not load if no next link', () => {
    component._links = {};
    component._preventMultiCall = false;

    component.__loadMoreData();

    expect(mockApiService.getList).not.toHaveBeenCalled();
  });

  // --- refresh ---

  it('refresh should clear filterData and reload adesioni', () => {
    component._filterData = { q: 'test' };
    mockApiService.getList.mockReturnValue(of({ content: [], page: {}, _links: {} }));

    component.refresh();

    expect(component._filterData).toEqual({});
    expect(mockApiService.getList).toHaveBeenCalled();
  });

  // --- _onSearch ---

  it('_onSearch should set filterData and reload adesioni', () => {
    const values = { q: 'search term', stato: 'bozza' };
    mockApiService.getList.mockReturnValue(of({ content: [], page: {}, _links: {} }));

    component._onSearch(values);

    expect(component._filterData).toEqual(values);
    expect(component.elementsSelected).toEqual([]);
    expect(mockApiService.getList).toHaveBeenCalled();
  });

  // --- _onEdit ---

  it('_onEdit should navigate to adesione route when _useRoute is true', () => {
    component._useRoute = true;
    component._useEditWizard = false;
    component._useViewRoute = false;
    mockNavigationService.extractData.mockReturnValue({
      source: { id_adesione: 5, stato: 'bozza' }
    });

    component._onEdit(null, { source: { id_adesione: 5, stato: 'bozza' } });

    expect(mockRouter.navigate).toHaveBeenCalledWith([5], expect.anything());
  });

  it('_onEdit should navigate with view param when _useViewRoute is true', () => {
    component._useRoute = true;
    component._useEditWizard = false;
    component._useViewRoute = true;
    mockNavigationService.extractData.mockReturnValue({
      source: { id_adesione: 7, stato: 'bozza' }
    });

    component._onEdit(null, { source: { id_adesione: 7, stato: 'bozza' } });

    expect(mockRouter.navigate).toHaveBeenCalledWith([7, 'view'], expect.anything());
  });

  it('_onEdit should navigate to edit wizard when _useEditWizard is true and stato is not pubblicato_produzione', () => {
    component._useRoute = true;
    component._useEditWizard = true;
    mockNavigationService.extractData.mockReturnValue({
      source: { id_adesione: 3, stato: 'bozza' }
    });

    component._onEdit(null, { source: { id_adesione: 3, stato: 'bozza' } });

    expect(mockRouter.navigate).toHaveBeenCalledWith([3], expect.anything());
  });

  it('_onEdit should navigate to view when _useEditWizard is true and stato includes pubblicato_produzione', () => {
    component._useRoute = true;
    component._useEditWizard = true;
    mockNavigationService.extractData.mockReturnValue({
      source: { id_adesione: 3, stato: 'pubblicato_produzione' }
    });

    component._onEdit(null, { source: { id_adesione: 3, stato: 'pubblicato_produzione' } });

    expect(mockRouter.navigate).toHaveBeenCalledWith([3, 'view'], expect.anything());
  });

  it('_onEdit should set _isEdit and _editCurrent when _useRoute is false', () => {
    component._useRoute = false;
    const param = { id: 99, source: {} };

    component._onEdit(null, param);

    expect(component._isEdit).toBe(true);
    expect(component._editCurrent).toBe(param);
  });

  // --- _onSubmit ---

  it('_onSubmit should call searchBarForm._onSearch when searchBarForm exists', () => {
    component.searchBarForm = { _onSearch: vi.fn(), _pinLastSearch: vi.fn(), _isPinned: vi.fn() } as any;

    component._onSubmit({});

    expect(component.searchBarForm._onSearch).toHaveBeenCalled();
  });

  it('_onSubmit should not throw when searchBarForm is undefined', () => {
    component.searchBarForm = undefined as any;

    expect(() => component._onSubmit({})).not.toThrow();
  });

  // --- _createWorkflowStati / configStatusList ---

  it('should have configStatusList with 5 statuses', () => {
    expect(component.configStatusList.length).toBe(5);
    expect(component.configStatusList[0].value).toBe(StatoConfigurazione.FALLITA);
    expect(component.configStatusList[4].value).toBe(StatoConfigurazione.RETRY);
  });

  it('should build configStatusEnum from configStatusList', () => {
    expect(component.configStatusEnum[StatoConfigurazione.OK]).toBe('APP.STATUS.ok');
    expect(component.configStatusEnum[StatoConfigurazione.KO]).toBe('APP.STATUS.ko');
    expect(component.configStatusEnum[StatoConfigurazione.FALLITA]).toBe('APP.STATUS.fallita');
  });

  // --- breadcrumb handling ---

  it('should prepend service breadcrumbs when route data contains serviceBreadcrumbs', () => {
    const serviceBreadcrumbs = {
      service: { id_servizio: 1, nome: 'Test Service' },
      breadcrumbs: [
        { label: 'Services', url: '/servizi', type: 'link' },
        { label: 'Test Service', url: '/servizi/1', type: 'link' }
      ]
    };
    const routeWithData = { params: of({}), queryParams: of({}), data: of({ serviceBreadcrumbs }) } as any;

    const comp = new AdesioniComponent(
      routeWithData, mockRouter, mockTranslate,
      mockConfigService, mockEventsManager, mockApiService,
      mockUtils, mockAuthService, mockModalService, mockNavigationService
    );

    expect(comp.breadcrumbs.length).toBe(3);
    expect(comp.breadcrumbs[0].label).toBe('Services');
    expect(comp.breadcrumbs[1].label).toBe('Test Service');
    expect(comp.service).toEqual(serviceBreadcrumbs.service);
  });

  it('onBreadcrumb should navigate to the given url', () => {
    component.onBreadcrumb({ url: '/servizi/1' });

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/1']);
  });

  // --- _setErrorMessages ---

  it('_setErrorMessages(true) should set error state and messages', () => {
    component._setErrorMessages(true);

    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('_setErrorMessages(false) should clear error state and set default messages', () => {
    component._error = true;
    component._setErrorMessages(false);

    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
  });

  // --- selectAll / deselectAll ---

  it('selectAll should select all adesioni and populate elementsSelected', () => {
    component.adesioni = [
      { id: 1, editMode: false, source: {}, selected: false },
      { id: 2, editMode: false, source: {}, selected: false },
      { id: 3, editMode: false, source: {}, selected: false },
    ] as any;

    component.selectAll();

    expect(component.elementsSelected).toEqual([1, 2, 3]);
    expect(component.adesioni.every((a: any) => a.selected)).toBe(true);
  });

  it('deselectAll should deselect all adesioni and clear elementsSelected', () => {
    component.adesioni = [
      { id: 1, editMode: false, source: {}, selected: true },
      { id: 2, editMode: false, source: {}, selected: true },
    ] as any;
    component.elementsSelected = [1, 2];

    component.deselectAll();

    expect(component.elementsSelected).toEqual([]);
    expect(component.adesioni.every((a: any) => !a.selected)).toBe(true);
  });

  it('allSelected getter should return true when all adesioni are selected', () => {
    component.adesioni = [
      { id: 1, selected: true },
      { id: 2, selected: true },
    ] as any;
    component.elementsSelected = [1, 2];

    expect(component.allSelected).toBe(true);
  });

  it('allSelected getter should return false when not all adesioni are selected', () => {
    component.adesioni = [
      { id: 1, selected: true },
      { id: 2, selected: false },
    ] as any;
    component.elementsSelected = [1];

    expect(component.allSelected).toBe(false);
  });

  it('allSelected getter should return false when adesioni is empty', () => {
    component.adesioni = [];
    component.elementsSelected = [];

    expect(component.allSelected).toBe(false);
  });

  // --- onSelect ---

  it('onSelect should add element to selection when not already selected', () => {
    const event = { stopPropagation: vi.fn() };
    const element = { id: 5, selected: false };
    component.elementsSelected = [];

    component.onSelect(event, element);

    expect(element.selected).toBe(true);
    expect(component.elementsSelected).toEqual([5]);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('onSelect should remove element from selection when already selected', () => {
    const event = { stopPropagation: vi.fn() };
    const element = { id: 5, selected: true };
    component.elementsSelected = [5];

    component.onSelect(event, element);

    expect(element.selected).toBe(false);
    expect(component.elementsSelected).toEqual([]);
  });

  // --- onExport ---

  it('onExport with SEARCH should export using filterData', () => {
    component._filterData = { q: 'test' };
    mockApiService.download.mockReturnValue(of({ body: new Blob(), headers: { get: () => null } }));

    component.onExport('search');

    expect(mockUtils._queryToHttpParams).toHaveBeenCalled();
    expect(mockApiService.download).toHaveBeenCalled();
    expect(component._downloading).toBe(false);
  });

  it('onExport with SELECTION should export using elementsSelected', () => {
    component.elementsSelected = [1, 2, 3];
    mockApiService.download.mockReturnValue(of({ body: new Blob(), headers: { get: () => null } }));

    component.onExport('selection');

    const queryArg = mockUtils._queryToHttpParams.mock.calls[0][0];
    expect(queryArg.id_adesione).toEqual([1, 2, 3]);
    expect(mockApiService.download).toHaveBeenCalled();
  });

  it('onExport should add id_servizio when service is set', () => {
    component.service = { id_servizio: 42 } as any;
    component._filterData = {};
    mockApiService.download.mockReturnValue(of({ body: new Blob(), headers: { get: () => null } }));

    component.onExport('search');

    const queryArg = mockUtils._queryToHttpParams.mock.calls[0][0];
    expect(queryArg.id_servizio).toBe(42);
  });

  it('onExport should handle download error', () => {
    mockApiService.download.mockReturnValue(throwError(() => new Error('Download failed')));

    component.onExport('search');

    expect(component._downloading).toBe(false);
  });

  it('onExport should handle timeout error', () => {
    const timeoutErr = new Error('Timeout');
    timeoutErr.name = 'TimeoutError';
    mockApiService.download.mockReturnValue(throwError(() => timeoutErr));

    component.onExport('search');

    expect(component._downloading).toBe(false);
    expect(Tools.showMessage).toHaveBeenCalled();
  });

  // --- onExportAction ---

  it('onExportAction should call onExport for SEARCH action', () => {
    vi.spyOn(component, 'onExport').mockImplementation(() => {});
    component.onExportAction({ action: 'search' });
    expect(component.onExport).toHaveBeenCalledWith('search');
  });

  it('onExportAction should call onExport for SELECTION action', () => {
    vi.spyOn(component, 'onExport').mockImplementation(() => {});
    component.onExportAction({ action: 'selection' });
    expect(component.onExport).toHaveBeenCalledWith('selection');
  });

  it('onExportAction should call deselectAll for DESELECT_ALL action', () => {
    vi.spyOn(component, 'deselectAll').mockImplementation(() => {});
    component.onExportAction({ action: 'deselectAll' });
    expect(component.deselectAll).toHaveBeenCalled();
  });

  // --- resetElements / resetSeleted ---

  it('resetSeleted should clear elementsSelected', () => {
    component.elementsSelected = [1, 2, 3];

    component.resetSeleted();

    expect(component.elementsSelected).toEqual([]);
  });

  // --- _onNew ---

  it('_onNew should navigate to new route when _useRoute is true', () => {
    component._useRoute = true;
    component._useEditWizard = false;

    component._onNew();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['new'], expect.anything());
  });

  it('_onNew should navigate to new/edit when _useEditWizard is true', () => {
    component._useRoute = true;
    component._useEditWizard = true;

    component._onNew();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['new', 'edit'], expect.anything());
  });

  it('_onNew should set _isEdit when _useRoute is false', () => {
    component._useRoute = false;

    component._onNew();

    expect(component._isEdit).toBe(true);
  });

  // --- _onCloseEdit ---

  it('_onCloseEdit should set _isEdit to false', () => {
    component._isEdit = true;

    component._onCloseEdit();

    expect(component._isEdit).toBe(false);
  });

  // --- hasConfigurazioneAutomaticaMapper ---

  it('hasConfigurazioneAutomaticaMapper should return true when configurazione_automatica has items', () => {
    component.generalConfig = { adesione: { configurazione_automatica: [{ stato_iniziale: 'bozza' }] } };

    expect(component.hasConfigurazioneAutomaticaMapper()).toBe(true);
  });

  it('hasConfigurazioneAutomaticaMapper should return falsy when configurazione_automatica is null', () => {
    component.generalConfig = { adesione: { configurazione_automatica: null } };

    expect(component.hasConfigurazioneAutomaticaMapper()).toBeFalsy();
  });

  it('hasConfigurazioneAutomaticaMapper should return false when configurazione_automatica is empty', () => {
    component.generalConfig = { adesione: { configurazione_automatica: [] } };

    expect(component.hasConfigurazioneAutomaticaMapper()).toBeFalsy();
  });

  // --- updateMultiSelectionMapper ---

  it('updateMultiSelectionMapper should set hasMultiSelection true when isGestore and status matches', () => {
    component.generalConfig = {
      adesione: { configurazione_automatica: [{ stato_iniziale: 'bozza' }] }
    };
    mockAuthService.isGestore.mockReturnValue(true);
    component._formGroup.get('stato')?.setValue('bozza');

    component.updateMultiSelectionMapper();

    expect(component.hasMultiSelection).toBe(true);
  });

  it('updateMultiSelectionMapper should set hasMultiSelection false when not isGestore', () => {
    component.generalConfig = {
      adesione: { configurazione_automatica: [{ stato_iniziale: 'bozza' }] }
    };
    mockAuthService.isGestore.mockReturnValue(false);
    component._formGroup.get('stato')?.setValue('bozza');

    component.updateMultiSelectionMapper();

    expect(component.hasMultiSelection).toBe(false);
  });

  it('updateMultiSelectionMapper should set hasMultiSelection false when no configurazione_automatica', () => {
    component.generalConfig = { adesione: { configurazione_automatica: null } };

    component.updateMultiSelectionMapper();

    expect(component.hasMultiSelection).toBe(false);
  });

  // --- _trackBy ---

  it('_trackBy should return item id', () => {
    expect(component._trackBy(0, { id: 42 })).toBe(42);
  });

  // --- _timestampToMoment ---

  it('_timestampToMoment should return Date for valid timestamp', () => {
    const ts = 1700000000000;
    const result = component._timestampToMoment(ts);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).toBe(ts);
  });

  it('_timestampToMoment should return null for falsy value', () => {
    expect(component._timestampToMoment(0)).toBeNull();
  });

  // --- _resetScroll ---

  it('_resetScroll should call Tools.ScrollElement', () => {
    component._resetScroll();
    expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
  });

  // --- _resetForm ---

  it('_resetForm should clear filterData and reset form controls', () => {
    component._filterData = { q: 'test' };
    component._organizzazioneSelected = { id: 1 };
    mockApiService.getList.mockReturnValue(of({ content: [], page: {}, _links: {} }));

    component._resetForm();

    expect(component._filterData).toEqual([]);
    expect(component._organizzazioneSelected).toBeNull();
    expect(component._error).toBe(false);
  });

  // --- isGestore getter ---

  it('isGestore getter should delegate to authenticationService.isGestore', () => {
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component.isGestore).toBe(true);

    mockAuthService.isGestore.mockReturnValue(false);
    expect(component.isGestore).toBe(false);
  });

  // --- onSelectionAction ---

  it('onSelectionAction should call deselectAll for uncheckAll action', () => {
    vi.spyOn(component, 'deselectAll').mockImplementation(() => {});
    component.onSelectionAction({ action: 'uncheckAll' });
    expect(component.deselectAll).toHaveBeenCalled();
  });

  // --- _allElements getter ---

  it('_allElements getter should return totalElements from paging', () => {
    component._paging = { totalElements: 100 } as any;
    expect(component._allElements).toBe(100);
  });

  it('_allElements getter should return 0 when paging has no totalElements', () => {
    component._paging = {} as any;
    expect(component._allElements).toBe(0);
  });

  // --- resetReport ---

  it('resetReport should set bulkResponse to null', () => {
    component.bulkResponse = { some: 'data' };
    component.resetReport();
    expect(component.bulkResponse).toBeNull();
  });

  // --- _onOpenInNewTab ---

  it('_onOpenInNewTab should open in new tab with correct params', () => {
    component._useEditWizard = false;
    component._useViewRoute = false;
    mockNavigationService.extractData.mockReturnValue({ source: { id_adesione: 10, stato: 'bozza' } });

    component._onOpenInNewTab({ source: { id_adesione: 10, stato: 'bozza' } });

    expect(mockNavigationService.openInNewTab).toHaveBeenCalledWith(['/adesioni', 10]);
  });

  it('_onOpenInNewTab should add view param when _useViewRoute is true', () => {
    component._useViewRoute = true;
    component._useEditWizard = false;
    mockNavigationService.extractData.mockReturnValue({ source: { id_adesione: 10, stato: 'bozza' } });

    component._onOpenInNewTab({ source: { id_adesione: 10, stato: 'bozza' } });

    expect(mockNavigationService.openInNewTab).toHaveBeenCalledWith(['/adesioni', 10, 'view']);
  });
});
