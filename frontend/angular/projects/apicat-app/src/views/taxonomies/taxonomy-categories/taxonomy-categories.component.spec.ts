import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { TaxonomyCategoriesComponent } from './taxonomy-categories.component';

describe('TaxonomyCategoriesComponent', () => {
  let component: TaxonomyCategoriesComponent;
  const mockRoute = { params: of({ id: '1' }) } as any;
  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null),
  } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: { GOVAPI: { HOST: 'http://api' } } }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = {} as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({ content: [], page: {}, _links: {} })),
    postElementRelated: vi.fn().mockReturnValue(of({})),
    putElementRelated: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _confirmDelection: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: { GOVAPI: { HOST: 'http://api' } } });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));
    mockApiService.postElementRelated.mockReturnValue(of({}));
    mockApiService.putElementRelated.mockReturnValue(of({}));
    mockApiService.deleteElement.mockReturnValue(of({}));
    mockRouter.getCurrentNavigation.mockReturnValue(null);
    mockTranslate.instant.mockImplementation((k: string) => k);
    Tools.ScrollTo = vi.fn() as any;
    Tools.ScrollElement = vi.fn() as any;
    Tools.OnError = vi.fn() as any;
    Tools.showMessage = vi.fn() as any;
    component = new TaxonomyCategoriesComponent(
      mockRoute, mockRouter, mockModalService, mockTranslate,
      mockConfigService, mockTools, mockEventsManager,
      mockApiService, mockUtils
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(TaxonomyCategoriesComponent.Name).toBe('TaxonomyCategoriesComponent');
  });

  it('should have model categorie', () => {
    expect(component.model).toBe('categorie');
  });

  it('should set apiUrl from config', () => {
    expect(component.apiUrl).toBe('http://api');
  });

  it('should have default _isNew false', () => {
    expect(component._isNew).toBe(false);
  });

  it('should have default _isEdit false', () => {
    expect(component._isEdit).toBe(false);
  });

  it('should have default _spin true', () => {
    expect(component._spin).toBe(true);
  });

  it('should have default _error false', () => {
    expect(component._error).toBe(false);
  });

  it('should have default categories empty', () => {
    expect(component.categories).toEqual([]);
  });

  it('should have default listMode false', () => {
    expect(component.listMode).toBe(false);
  });

  it('should have _useRoute false', () => {
    expect(component._useRoute).toBe(false);
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

  it('should init breadcrumb', () => {
    component.taxonomy = { nome: 'Tax1' };
    component.id = 1;
    component._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(4);
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Taxonomies');
    expect(component.breadcrumbs[2].label).toBe('Tax1');
    expect(component.breadcrumbs[3].label).toBe('APP.TAXONOMIES.TITLE.Categories');
  });

  it('should load taxonomy categories', () => {
    mockApiService.getDetails.mockReturnValue(of({
      content: [{ id_categoria: 'c1', nome: 'Cat1', descrizione: 'Desc', figli: null, tassonomia: { id_tassonomia: '1' } }],
      page: { totalElements: 1 },
      _links: {}
    }));
    component.id = 1;
    component._loadTaxonomyCategories();
    expect(mockApiService.getDetails).toHaveBeenCalledWith('tassonomie', 1, 'categorie');
    expect(component.categories.length).toBe(1);
    expect(component.categories[0].id).toBe('c1');
    expect(component._spin).toBe(false);
  });

  it('should load taxonomy', () => {
    mockApiService.getDetails.mockReturnValue(of({ id_tassonomia: '1', nome: 'Tax1' }));
    component.id = 1;
    component._loadTaxonomy();
    expect(mockApiService.getDetails).toHaveBeenCalledWith('tassonomie', 1);
    expect(component.taxonomy).toEqual({ id_tassonomia: '1', nome: 'Tax1' });
  });

  it('should init edit form for new', () => {
    component._initEditForm();
    expect(component._isEdit).toBe(true);
    expect(component._editFormGroup.get('nome')).toBeTruthy();
    expect(component._editFormGroup.get('nome')!.value).toBeNull();
    expect(component._editFormGroup.get('descrizione')).toBeTruthy();
    expect(component._editFormGroup.get('descrizione')!.value).toBeNull();
  });

  it('should init edit form with data', () => {
    component._initEditForm({ nome: 'Cat1', descrizione: 'Desc' });
    expect(component._editFormGroup.get('nome')!.value).toBe('Cat1');
    expect(component._editFormGroup.get('descrizione')!.value).toBe('Desc');
  });

  it('should close edit', () => {
    component._isEdit = true;
    component._isNew = true;
    component._editCurrent = { id: '1' };
    component._currentCategory = { id: '1' };
    component._onCloseEdit(null);
    expect(component._isEdit).toBe(false);
    expect(component._isNew).toBe(false);
    expect(component._editCurrent).toBeNull();
    expect(component._currentCategory).toBeNull();
  });

  it('should handle onAction add', () => {
    const item = { id_categoria: 'c1' };
    component.onAction({ action: 'add', item });
    expect(component._currentCategory).toBe(item);
  });

  it('should handle onAction edit', () => {
    const item = { id_categoria: 'c1' };
    component.onAction({ action: 'edit', item });
    expect(component._currentCategory).toBeNull();
  });

  it('should handle onAction remove', () => {
    const item = { id_categoria: 'c1' };
    component.onAction({ action: 'remove', item });
    expect(component._currentCategory).toBe(item);
    expect(mockUtils._confirmDelection).toHaveBeenCalled();
  });

  it('should reset error', () => {
    component._error = true;
    component._errorMsg = 'err';
    component.__resetError();
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
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

  it('should navigate on breadcrumb', () => {
    component.onBreadcrumb({ url: '/tassonomie' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tassonomie']);
  });

  it('should reset scroll', () => {
    component._resetScroll();
    expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
  });

  it('should check _hasControlError', () => {
    component._initEditForm({ nome: 'Test' });
    expect(component._hasControlError('nome')).toBeFalsy();
  });

  it('should prepare body categoria with parent', () => {
    component._currentCategory = { id_categoria: 'parent1' };
    component._editCurrent = null;
    const body = component._prepareBodyCategoria({ nome: 'NewCat', descrizione: 'Desc' });
    expect(body.categoria_padre).toBe('parent1');
    expect(body.nome).toBe('NewCat');
    expect(body.label).toBe('NewCat');
    expect(body.descrizione).toBe('Desc');
  });

  it('should prepare body categoria with path_categoria', () => {
    component._currentCategory = { id_categoria: 'parent1' };
    component._editCurrent = { path_categoria: [{ id_categoria: 'p1' }, { id_categoria: 'p2' }] };
    const body = component._prepareBodyCategoria({ nome: 'Cat', descrizione: '' });
    expect(body.categoria_padre).toBe('p2');
  });

  it('should load more data when _links.next exists', () => {
    component._links = { next: { href: 'http://api/next' } };
    component._preventMultiCall = false;
    const spy = vi.spyOn(component, '_loadTaxonomyCategories');
    component.__loadMoreData();
    expect(spy).toHaveBeenCalledWith(null, 'http://api/next');
  });

  it('should not load more data when _links.next is null', () => {
    component._links = {};
    const spy = vi.spyOn(component, '_loadTaxonomyCategories');
    component.__loadMoreData();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should get f from _editFormGroup controls', () => {
    component._initEditForm({ nome: 'Test' });
    expect(component.f['nome']).toBeTruthy();
    expect(component.f['nome'].value).toBe('Test');
  });
});
