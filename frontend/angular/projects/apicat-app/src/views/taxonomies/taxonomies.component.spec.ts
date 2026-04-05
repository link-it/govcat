import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { TaxonomiesComponent } from './taxonomies.component';

describe('TaxonomiesComponent', () => {
  let component: TaxonomiesComponent;
  const mockRoute = { params: of({}) } as any;
  const mockRouter = { navigate: vi.fn(), getCurrentNavigation: vi.fn().mockReturnValue(null) } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [], page: {}, _links: {} })),
  } as any;
  const mockUtils = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
  } as any;
  const mockNavigationService = {
    extractEvent: vi.fn().mockReturnValue(null),
    extractData: vi.fn().mockReturnValue({ id: '1' }),
    navigateWithEvent: vi.fn(),
    openInNewTab: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getList.mockReturnValue(of({ content: [], page: {}, _links: {} }));
    mockUtils._queryToHttpParams.mockReturnValue({});
    Tools.ScrollTo = vi.fn() as any;
    Tools.ScrollElement = vi.fn() as any;
    Tools.OnError = vi.fn() as any;
    component = new TaxonomiesComponent(
      mockRoute, mockRouter, mockTranslate, mockConfigService,
      mockTools, mockApiService, mockUtils, mockNavigationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(TaxonomiesComponent.Name).toBe('TaxonomiesComponent');
  });

  it('should have model tassonomie', () => {
    expect(component.model).toBe('tassonomie');
  });

  it('should have breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(2);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Configurations');
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Taxonomies');
  });

  it('should have sortField nome', () => {
    expect(component.sortField).toBe('nome');
  });

  it('should have sortDirection asc', () => {
    expect(component.sortDirection).toBe('asc');
  });

  it('should have sortFields', () => {
    expect(component.sortFields.length).toBe(1);
    expect(component.sortFields[0].field).toBe('nome');
  });

  it('should have searchFields', () => {
    expect(component.searchFields.length).toBe(2);
    expect(component.searchFields[0].field).toBe('q');
    expect(component.searchFields[1].field).toBe('nome');
  });

  it('should have default _spin true', () => {
    expect(component._spin).toBe(true);
  });

  it('should have default _error false', () => {
    expect(component._error).toBe(false);
  });

  it('should have default _message', () => {
    expect(component._message).toBe('APP.MESSAGE.NoResults');
  });

  it('should set error messages', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
  });

  it('should init search form with q and nome', () => {
    expect(component._formGroup.get('q')).toBeTruthy();
    expect(component._formGroup.get('nome')).toBeTruthy();
  });

  it('should load taxonomies from API', () => {
    mockApiService.getList.mockReturnValue(of({
      content: [{ id_tassonomia: 't1', nome: 'Tax1' }],
      page: { totalElements: 1 },
      _links: {}
    }));
    component._loadTaxonomies();
    expect(mockApiService.getList).toHaveBeenCalledWith('tassonomie', expect.anything(), '');
    expect(component.taxonomies.length).toBe(1);
    expect(component.taxonomies[0].id).toBe('t1');
    expect(component._spin).toBe(false);
  });

  it('should clear taxonomies on load without url', () => {
    component.taxonomies = [{ id: 'old' }];
    mockApiService.getList.mockReturnValue(of({
      content: [{ id_tassonomia: 't1', nome: 'Tax1' }],
      page: {},
      _links: {}
    }));
    component._loadTaxonomies();
    expect(component.taxonomies.length).toBe(1);
    expect(component.taxonomies[0].id).toBe('t1');
  });

  it('should navigate to new on _onNew', () => {
    component._onNew();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['tassonomie', 'new']);
  });

  it('should set filter data on _onSearch', () => {
    component._onSearch({ q: 'test' });
    expect(component._filterData).toEqual({ q: 'test' });
  });

  it('should reset form', () => {
    component._filterData = [{ q: 'test' }] as any;
    component._resetForm();
    expect(component._filterData).toEqual([]);
  });

  it('should sort on _onSort', () => {
    component._onSort({ sortField: 'descrizione', sortBy: 'desc' });
    expect(component.sortField).toBe('descrizione');
    expect(component.sortDirection).toBe('desc');
  });

  it('should navigate on breadcrumb', () => {
    component.onBreadcrumb({ url: '/tassonomie' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tassonomie']);
  });

  it('should reset scroll', () => {
    component._resetScroll();
    expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
  });

  it('should subscribe to config in ngOnInit', () => {
    component.ngOnInit();
    expect(mockConfigService.getConfig).toHaveBeenCalledWith('tassonomie');
  });

  it('should refresh by calling _loadTaxonomies', () => {
    const spy = vi.spyOn(component, '_loadTaxonomies');
    component.refresh();
    expect(spy).toHaveBeenCalledWith(component._filterData);
  });

  it('should load more data when _links.next exists', () => {
    component._links = { next: { href: 'http://api/next' } };
    component._preventMultiCall = false;
    const spy = vi.spyOn(component, '_loadTaxonomies');
    component.__loadMoreData();
    expect(spy).toHaveBeenCalledWith(null, 'http://api/next');
  });

  it('should not load more data when _links.next is null', () => {
    component._links = {};
    const spy = vi.spyOn(component, '_loadTaxonomies');
    component.__loadMoreData();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not load more data when _preventMultiCall is true', () => {
    component._links = { next: { href: 'http://api/next' } };
    component._preventMultiCall = true;
    const spy = vi.spyOn(component, '_loadTaxonomies');
    component.__loadMoreData();
    expect(spy).not.toHaveBeenCalled();
  });
});
