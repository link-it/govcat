import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { Tools } from '@linkit/components';
import { UtentiComponent } from './utenti.component';
import { Ruolo, Stato } from './utente-details/utente';
import { Page } from '../../models/page';

describe('UtentiComponent', () => {
  let component: UtentiComponent;
  let savedConfigurazione: any;
  const mockRoute = { snapshot: { data: {} } } as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = { on: vi.fn() } as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
  } as any;
  const mockUtils = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    _removeEmpty: vi.fn((v: any) => v),
    GetErrorMsg: vi.fn().mockReturnValue('error'),
  } as any;
  const mockNavigationService = {
    extractEvent: vi.fn((e: any) => e),
    extractData: vi.fn((p: any) => p),
    navigateWithEvent: vi.fn(),
    openInNewTab: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    Tools.ScrollTo = vi.fn();
    Tools.ScrollElement = vi.fn();
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
    component = new UtentiComponent(
      mockRoute, mockRouter, mockTranslate,
      mockConfigService, mockTools, mockEventsManager,
      mockApiService, mockUtils, mockNavigationService
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(UtentiComponent.Name).toBe('UtentiComponent');
  });

  it('should have model set to utenti', () => {
    expect(component.model).toBe('utenti');
  });

  it('should have default values', () => {
    expect(component._spin).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._error).toBe(false);
    expect(component._filterData).toEqual([]);
    expect(component._preventMultiCall).toBe(false);
    expect(component._hasFilter).toBe(true);
    expect(component.showHistory).toBe(false);
    expect(component.showSearch).toBe(true);
    expect(component.showSorting).toBe(true);
    expect(component.useCondition).toBe(false);
    expect(component.minLengthTerm).toBe(1);
    expect(component._useNewSearchUI).toBe(true);
  });

  it('should have correct sort defaults', () => {
    expect(component.sortField).toBe('cognome');
    expect(component.sortDirection).toBe('asc');
    expect(component.sortFields).toEqual([
      { field: 'cognome', label: 'APP.LABEL.cognome', icon: '' }
    ]);
  });

  it('should have breadcrumbs with 2 entries', () => {
    expect(component.breadcrumbs.length).toBe(2);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Configurations');
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Users');
  });

  it('should have searchFields with 8 entries', () => {
    expect(component.searchFields.length).toBe(8);
    const fieldNames = component.searchFields.map((f: any) => f.field);
    expect(fieldNames).toContain('q');
    expect(fieldNames).toContain('email');
    expect(fieldNames).toContain('ruolo');
    expect(fieldNames).toContain('stato');
    expect(fieldNames).toContain('principal');
    expect(fieldNames).toContain('id_organizzazione');
    expect(fieldNames).toContain('classe_utente');
    expect(fieldNames).toContain('referente_tecnico');
  });

  it('should have yesNoList', () => {
    expect(component.yesNoList.length).toBe(2);
    expect(component.yesNoList[0].value).toBe(true);
    expect(component.yesNoList[1].value).toBe(false);
  });

  it('should build _enabledEnum from yesNoList', () => {
    expect(component._enabledEnum[true as any]).toBe('APP.BOOLEAN.Yes');
    expect(component._enabledEnum[false as any]).toBe('APP.BOOLEAN.No');
  });

  it('should build _roleEnum from Ruolo enum', () => {
    for (const val of Object.values(Ruolo)) {
      expect(component._roleEnum[val]).toBe(`APP.USERS.ROLES.${val}`);
    }
  });

  it('should build _statoEnum from Stato enum', () => {
    for (const val of Object.values(Stato)) {
      expect(component._statoEnum[val]).toBe(`APP.USERS.STATUS.${val}`);
    }
  });

  it('should call getConfiguration in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should init search form in constructor', () => {
    expect(component._formGroup).toBeTruthy();
    expect(component._formGroup.get('q')).toBeTruthy();
    expect(component._formGroup.get('email')).toBeTruthy();
    expect(component._formGroup.get('ruolo')).toBeTruthy();
    expect(component._formGroup.get('stato')).toBeTruthy();
    expect(component._formGroup.get('principal')).toBeTruthy();
    expect(component._formGroup.get('id_organizzazione')).toBeTruthy();
    expect(component._formGroup.get('classe_utente')).toBeTruthy();
    expect(component._formGroup.get('referente_tecnico')).toBeTruthy();
  });

  // --- _setErrorMessages ---

  describe('_setErrorMessages', () => {
    it('should set error messages when error is true', () => {
      component._setErrorMessages(true);
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
    });

    it('should set no-results messages when error is false', () => {
      component._setErrorMessages(false);
      expect(component._error).toBe(false);
      expect(component._message).toBe('APP.MESSAGE.NoResults');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    });
  });

  // --- _initSearchForm ---

  describe('_initSearchForm', () => {
    it('should create form with all expected controls', () => {
      (component as any)._initSearchForm();
      const controls = ['q', 'email', 'ruolo', 'stato', 'principal', 'id_organizzazione', 'classe_utente', 'referente_tecnico'];
      for (const ctrl of controls) {
        expect(component._formGroup.get(ctrl)).toBeTruthy();
      }
    });
  });

  // --- ngOnInit ---

  describe('ngOnInit', () => {
    it('should populate _statoArr and _ruoloArr', () => {
      component.ngOnInit();
      expect(component._statoArr).toEqual(Object.values(Stato));
      expect(component._ruoloArr).toEqual(Object.values(Ruolo));
    });

    it('should call getConfig with model name', () => {
      component.ngOnInit();
      expect(mockConfigService.getConfig).toHaveBeenCalledWith('utenti');
    });

    it('should set utentiConfig from getConfig', () => {
      const config = { someKey: 'someValue' };
      mockConfigService.getConfig.mockReturnValue(of(config));
      component.ngOnInit();
      expect(component.utentiConfig).toEqual(config);
    });

    it('should init organizzazioni and classi utente selects', () => {
      const initOrgSpy = vi.spyOn(component as any, '_initOrganizzazioniSelect');
      const initClassiSpy = vi.spyOn(component as any, '_initClassiUtenteSelect');
      component.ngOnInit();
      expect(initOrgSpy).toHaveBeenCalledWith([]);
      expect(initClassiSpy).toHaveBeenCalledWith([]);
    });
  });

  // --- ngAfterViewInit ---

  describe('ngAfterViewInit', () => {
    it('should call refresh via setTimeout when searchBarForm is not set', () => {
      vi.useFakeTimers();
      const spy = vi.spyOn(component, 'refresh').mockImplementation(() => {});
      component.searchBarForm = undefined as any;

      (component as any).ngAfterViewInit();

      expect(spy).not.toHaveBeenCalled();
      vi.advanceTimersByTime(100);
      expect(spy).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should call refresh via setTimeout when searchBarForm._isPinned returns false', () => {
      vi.useFakeTimers();
      const spy = vi.spyOn(component, 'refresh').mockImplementation(() => {});
      component.searchBarForm = { _isPinned: vi.fn().mockReturnValue(false) } as any;

      (component as any).ngAfterViewInit();

      vi.advanceTimersByTime(100);
      expect(spy).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should not call refresh when searchBarForm._isPinned returns true', () => {
      vi.useFakeTimers();
      const spy = vi.spyOn(component, 'refresh').mockImplementation(() => {});
      component.searchBarForm = { _isPinned: vi.fn().mockReturnValue(true) } as any;

      (component as any).ngAfterViewInit();

      vi.advanceTimersByTime(200);
      expect(spy).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // --- ngOnDestroy ---

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  // --- ngAfterContentChecked ---

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // --- _onResize ---

  describe('_onResize', () => {
    it('should update desktop property', () => {
      component._onResize();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  // --- refresh ---

  describe('refresh', () => {
    it('should call _loadUtenti with current filterData', () => {
      const spy = vi.spyOn(component as any, '_loadUtenti');
      component._filterData = [{ field: 'q', value: 'test' }];
      component.refresh();
      expect(spy).toHaveBeenCalledWith([{ field: 'q', value: 'test' }]);
    });
  });

  // --- _loadUtenti ---

  describe('_loadUtenti', () => {
    it('should load utenti and map content on success', () => {
      const response = {
        content: [
          { id_utente: 'u1', nome: 'Mario', cognome: 'Rossi' },
          { id_utente: 'u2', nome: 'Luigi', cognome: 'Verdi' }
        ],
        page: { totalElements: 2, totalPages: 1 },
        _links: { next: { href: '/utenti?page=2' } }
      };
      mockApiService.getList.mockReturnValue(of(response));

      component._loadUtenti({ q: 'test' });

      expect(component._spin).toBe(false);
      expect(component.utenti.length).toBe(2);
      expect(component.utenti[0].id).toBe('u1');
      expect(component.utenti[0].source.nome).toBe('Mario');
      expect(component.utenti[1].id).toBe('u2');
      expect(component._links).toEqual({ next: { href: '/utenti?page=2' } });
      expect(component._preventMultiCall).toBe(false);
      expect(Tools.ScrollTo).toHaveBeenCalledWith(0);
    });

    it('should reset utenti and _links when no url provided', () => {
      mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
      component.utenti = [{ id: 'old' }];
      component._links = { next: { href: 'old' } };
      component._loadUtenti({ q: 'test' });
      expect(component.utenti).toEqual([]);
    });

    it('should append to utenti when url is provided', () => {
      const response = {
        content: [{ id_utente: 'u3', nome: 'New' }],
        page: {},
        _links: null
      };
      mockApiService.getList.mockReturnValue(of(response));
      component.utenti = [{ id: 'u1', editMode: false, enableCollapse: false, source: {} }];

      component._loadUtenti(null, '/utenti?page=2');

      expect(component.utenti.length).toBe(2);
      expect(component.utenti[0].id).toBe('u1');
      expect(component.utenti[1].id).toBe('u3');
    });

    it('should set error on API failure', () => {
      const error = { status: 500 };
      mockApiService.getList.mockReturnValue(throwError(() => error));

      component._loadUtenti({ q: 'test' });

      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._preventMultiCall).toBe(false);
      expect(component._spin).toBe(false);
      expect(Tools.OnError).toHaveBeenCalledWith(error);
    });

    it('should set _spin to true at start', () => {
      // Use a never-completing observable to check spin is set before response
      let spinDuringCall = false;
      mockApiService.getList.mockImplementation(() => {
        spinDuringCall = component._spin;
        return of({ content: [], page: {} });
      });
      component._loadUtenti();
      expect(spinDuringCall).toBe(true);
    });

    it('should call _setErrorMessages(false) at start', () => {
      const spy = vi.spyOn(component, '_setErrorMessages');
      mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
      component._loadUtenti();
      expect(spy).toHaveBeenCalledWith(false);
    });

    it('should build sort params from sortField and sortDirection', () => {
      mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
      component.sortField = 'nome';
      component.sortDirection = 'desc';
      component._loadUtenti({ q: 'test' });
      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'nome,desc', q: 'test' })
      );
    });

    it('should handle response with null page and _links gracefully', () => {
      mockApiService.getList.mockReturnValue(of({ content: [], page: null, _links: null }));
      expect(() => component._loadUtenti()).not.toThrow();
    });
  });

  // --- _trackBy ---

  describe('_trackBy', () => {
    it('should return item id', () => {
      expect(component._trackBy(0, { id: 'abc' })).toBe('abc');
      expect(component._trackBy(1, { id: 123 })).toBe(123);
    });
  });

  // --- __loadMoreData ---

  describe('__loadMoreData', () => {
    it('should load more data when _links.next exists and not preventMultiCall', () => {
      const spy = vi.spyOn(component as any, '_loadUtenti').mockImplementation(() => {});
      component._links = { next: { href: '/utenti?page=2' } };
      component._preventMultiCall = false;

      component.__loadMoreData();

      expect(component._preventMultiCall).toBe(true);
      expect(spy).toHaveBeenCalledWith(null, '/utenti?page=2');
    });

    it('should not load when _preventMultiCall is true', () => {
      const spy = vi.spyOn(component as any, '_loadUtenti').mockImplementation(() => {});
      component._links = { next: { href: '/utenti?page=2' } };
      component._preventMultiCall = true;

      component.__loadMoreData();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not load when _links is null', () => {
      const spy = vi.spyOn(component as any, '_loadUtenti').mockImplementation(() => {});
      component._links = null;
      component._preventMultiCall = false;

      component.__loadMoreData();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not load when _links.next is null', () => {
      const spy = vi.spyOn(component as any, '_loadUtenti').mockImplementation(() => {});
      component._links = { next: null };
      component._preventMultiCall = false;

      component.__loadMoreData();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // --- _onEdit ---

  describe('_onEdit', () => {
    it('should extract event and data, then navigate', () => {
      const event = { ctrlKey: false };
      const param = { id: 'u1' };
      mockNavigationService.extractEvent.mockReturnValue(event);
      mockNavigationService.extractData.mockReturnValue(param);
      component.searchBarForm = { _pinLastSearch: vi.fn() } as any;

      component._onEdit(event, param);

      expect(component.searchBarForm._pinLastSearch).toHaveBeenCalled();
      expect(mockNavigationService.extractEvent).toHaveBeenCalledWith(event);
      expect(mockNavigationService.extractData).toHaveBeenCalledWith(param);
      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(event, ['utenti', 'u1']);
    });

    it('should use param directly when extractData returns falsy', () => {
      const event = {};
      const param = { id: 'u2' };
      mockNavigationService.extractEvent.mockReturnValue(event);
      mockNavigationService.extractData.mockReturnValue(null);
      component.searchBarForm = { _pinLastSearch: vi.fn() } as any;

      component._onEdit(event, param);

      expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(event, ['utenti', 'u2']);
    });

    it('should not call _pinLastSearch when searchBarForm is not set', () => {
      const event = {};
      const param = { id: 'u1' };
      mockNavigationService.extractEvent.mockReturnValue(event);
      mockNavigationService.extractData.mockReturnValue(param);
      component.searchBarForm = undefined as any;

      // Should not throw
      expect(() => component._onEdit(event, param)).not.toThrow();
    });
  });

  // --- _onOpenInNewTab ---

  describe('_onOpenInNewTab', () => {
    it('should extract data and open in new tab', () => {
      const event = { id: 'u5' };
      mockNavigationService.extractData.mockReturnValue({ id: 'u5' });

      component._onOpenInNewTab(event);

      expect(mockNavigationService.extractData).toHaveBeenCalledWith(event);
      expect(mockNavigationService.openInNewTab).toHaveBeenCalledWith(['utenti', 'u5']);
    });
  });

  // --- _onNew ---

  describe('_onNew', () => {
    it('should navigate to new', () => {
      component._onNew();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['utenti', 'new']);
    });
  });

  // --- _onCloseEdit ---

  describe('_onCloseEdit', () => {
    it('should set _isEdit to false', () => {
      component._isEdit = true;
      component._onCloseEdit();
      expect(component._isEdit).toBe(false);
    });
  });

  // --- _onSubmit ---

  describe('_onSubmit', () => {
    it('should call searchBarForm._onSearch when searchBarForm exists', () => {
      component.searchBarForm = { _onSearch: vi.fn() } as any;
      component._onSubmit({ q: 'test' });
      expect(component.searchBarForm._onSearch).toHaveBeenCalled();
    });

    it('should not throw when searchBarForm is not set', () => {
      component.searchBarForm = undefined as any;
      expect(() => component._onSubmit({ q: 'test' })).not.toThrow();
    });
  });

  // --- _onSearch ---

  describe('_onSearch', () => {
    it('should update filterData and load utenti', () => {
      const spy = vi.spyOn(component as any, '_loadUtenti');
      const values = { q: 'test', email: 'test@test.com' };
      mockUtils._removeEmpty.mockReturnValue({ q: 'test', email: 'test@test.com' });

      component._onSearch(values);

      expect(mockUtils._removeEmpty).toHaveBeenCalledWith(values);
      expect(component._filterData).toEqual({ q: 'test', email: 'test@test.com' });
      expect(spy).toHaveBeenCalledWith({ q: 'test', email: 'test@test.com' });
    });
  });

  // --- _resetForm ---

  describe('_resetForm', () => {
    it('should reset filterData and reload', () => {
      const spy = vi.spyOn(component as any, '_loadUtenti');
      component._filterData = [{ field: 'q', value: 'test' }];
      component._resetForm();
      expect(component._filterData).toEqual([]);
      expect(spy).toHaveBeenCalledWith([]);
    });
  });

  // --- _onSort ---

  describe('_onSort', () => {
    it('should update sort fields and reload', () => {
      const spy = vi.spyOn(component as any, '_loadUtenti');
      const event = { sortField: 'nome', sortBy: 'desc' };
      component._onSort(event);
      expect(component.sortField).toBe('nome');
      expect(component.sortDirection).toBe('desc');
      expect(spy).toHaveBeenCalledWith(event);
    });
  });

  // --- onBreadcrumb ---

  describe('onBreadcrumb', () => {
    it('should navigate to event url', () => {
      component.onBreadcrumb({ url: '/test' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/test']);
    });
  });

  // --- _resetScroll ---

  describe('_resetScroll', () => {
    it('should call Tools.ScrollElement', () => {
      component._resetScroll();
      expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
    });
  });

  // --- _sortToHttpParams ---

  describe('_sortToHttpParams', () => {
    it('should return HttpParams with sort parameter', () => {
      const result = component._sortToHttpParams({ sortField: 'nome', sortBy: 'asc' });
      expect(result.get('sort')).toBe('nome,asc');
    });
  });

  // --- getData ---

  describe('getData', () => {
    it('should call apiService.getList and map content', () => {
      const response = { content: [{ id: 1, nome: 'Org1' }] };
      mockApiService.getList.mockReturnValue(of(response));

      let result: any;
      component.getData('organizzazioni', 'term').subscribe((r: any) => { result = r; });
      expect(result).toEqual([{ id: 1, nome: 'Org1' }]);
      expect(mockApiService.getList).toHaveBeenCalledWith('organizzazioni', { params: { q: 'term' } });
    });

    it('should handle object term parameter', () => {
      const response = { content: [{ id: 1 }] };
      mockApiService.getList.mockReturnValue(of(response));

      let result: any;
      component.getData('organizzazioni', { key: 'value' }).subscribe((r: any) => { result = r; });
      expect(result).toEqual([{ id: 1 }]);
      expect(mockApiService.getList).toHaveBeenCalledWith('organizzazioni', { params: { key: 'value' } });
    });

    it('should handle null term parameter', () => {
      const response = { content: [{ id: 1 }] };
      mockApiService.getList.mockReturnValue(of(response));

      let result: any;
      component.getData('organizzazioni', null).subscribe((r: any) => { result = r; });
      expect(result).toEqual([{ id: 1 }]);
      expect(mockApiService.getList).toHaveBeenCalledWith('organizzazioni', { params: {} });
    });

    it('should use response directly when no content property', () => {
      const response = [{ id: 1, nome: 'Item' }];
      mockApiService.getList.mockReturnValue(of(response));

      let result: any;
      component.getData('classi-utente').subscribe((r: any) => { result = r; });
      expect(result).toEqual([{ id: 1, nome: 'Item' }]);
    });

    it('should handle Error property in response', () => {
      // When response.Error exists, throwError is called but not returned (bug in source),
      // so it effectively returns undefined from map
      const response = { Error: 'Something went wrong' };
      mockApiService.getList.mockReturnValue(of(response));

      let result: any;
      component.getData('organizzazioni').subscribe((r: any) => { result = r; });
      // throwError() is called but not returned, so result is undefined
      expect(result).toBeUndefined();
    });
  });

  // --- getOrganizzazioni ---

  describe('getOrganizzazioni', () => {
    it('should call apiService.getList with q param and map content', () => {
      const response = { content: [{ id: 1, nome: 'Org' }] };
      mockApiService.getList.mockReturnValue(of(response));

      let result: any;
      component.getOrganizzazioni('test').subscribe((r: any) => { result = r; });
      expect(result).toEqual([{ id: 1, nome: 'Org' }]);
      expect(mockApiService.getList).toHaveBeenCalledWith('organizzazioni', { params: { q: 'test' } });
    });

    it('should handle null term', () => {
      const response = { content: [{ id: 1 }] };
      mockApiService.getList.mockReturnValue(of(response));

      let result: any;
      component.getOrganizzazioni(null).subscribe((r: any) => { result = r; });
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should handle Error property in response', () => {
      const response = { Error: 'fail' };
      mockApiService.getList.mockReturnValue(of(response));

      let result: any;
      component.getOrganizzazioni('test').subscribe((r: any) => { result = r; });
      expect(result).toBeUndefined();
    });
  });

  // --- _initOrganizzazioniSelect ---

  describe('_initOrganizzazioniSelect', () => {
    it('should set organizzazioni$ observable', () => {
      component._initOrganizzazioniSelect([]);
      expect(component.organizzazioni$).toBeDefined();
    });

    it('should accept default values', () => {
      const defaults = [{ id: 1, nome: 'Default' }];
      component._initOrganizzazioniSelect(defaults);
      expect(component.organizzazioni$).toBeDefined();
    });
  });

  // --- _initClassiUtenteSelect ---

  describe('_initClassiUtenteSelect', () => {
    it('should set classiUtente$ observable', () => {
      component._initClassiUtenteSelect([]);
      expect(component.classiUtente$).toBeDefined();
    });

    it('should accept default values', () => {
      const defaults = [{ id: 1, nome: 'Classe' }];
      component._initClassiUtenteSelect(defaults);
      expect(component.classiUtente$).toBeDefined();
    });
  });

  // --- onChangeSearchDropdwon ---

  describe('onChangeSearchDropdwon', () => {
    it('should set _searchOrganizzazioneSelected and call setNotCloseForm after timeout', () => {
      vi.useFakeTimers();
      component.searchBarForm = { setNotCloseForm: vi.fn() } as any;
      const event = { id: 1, nome: 'Org' };

      component.onChangeSearchDropdwon(event);

      expect(component._searchOrganizzazioneSelected).toEqual(event);
      // setNotCloseForm called after 200ms timeout
      expect(component.searchBarForm.setNotCloseForm).not.toHaveBeenCalled();
      vi.advanceTimersByTime(200);
      expect(component.searchBarForm.setNotCloseForm).toHaveBeenCalledWith(false);
      vi.useRealTimers();
    });
  });

  // --- onSelectedSearchDropdwon ---

  describe('onSelectedSearchDropdwon', () => {
    it('should call setNotCloseForm(true) and stopPropagation', () => {
      component.searchBarForm = { setNotCloseForm: vi.fn() } as any;
      const event = { stopPropagation: vi.fn() } as any;

      component.onSelectedSearchDropdwon(event);

      expect(component.searchBarForm.setNotCloseForm).toHaveBeenCalledWith(true);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  // --- message defaults ---

  describe('message defaults', () => {
    it('should have correct default messages', () => {
      expect(component._message).toBe('APP.MESSAGE.NoResults');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
      expect(component._messageUnimplemented).toBe('APP.MESSAGE.Unimplemented');
    });
  });
});
