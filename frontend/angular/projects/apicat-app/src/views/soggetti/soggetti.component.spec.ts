import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { SoggettiComponent } from './soggetti.component';

describe('SoggettiComponent', () => {
  let component: SoggettiComponent;
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
  } as any;
  const mockNavigationService = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
    Tools.ScrollTo = vi.fn();
    Tools.ScrollElement = vi.fn();
    component = new SoggettiComponent(
      mockRouter, mockConfigService, mockTools,
      mockApiService, mockUtils, mockNavigationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(SoggettiComponent.Name).toBe('SoggettiComponent');
  });

  it('should have model set to soggetti', () => {
    expect(component.model).toBe('soggetti');
  });

  it('should have default values', () => {
    expect(component._spin).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._error).toBe(false);
    expect(component._filterData).toEqual([]);
  });

  it('should have breadcrumbs with 2 entries', () => {
    expect(component.breadcrumbs.length).toBe(2);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Configurations');
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Subjects');
  });

  it('should have correct sort defaults', () => {
    expect(component.sortField).toBe('nome');
    expect(component.sortDirection).toBe('asc');
  });

  it('should have searchFields with q, id_organizzazione, referente, aderente', () => {
    expect(component.searchFields.length).toBe(4);
    const fieldNames = component.searchFields.map((f: any) => f.field);
    expect(fieldNames).toContain('q');
    expect(fieldNames).toContain('id_organizzazione');
    expect(fieldNames).toContain('referente');
    expect(fieldNames).toContain('aderente');
  });

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

  it('should init search form with correct controls', () => {
    expect(component._formGroup).toBeTruthy();
    expect(component._formGroup.get('q')).toBeTruthy();
    expect(component._formGroup.get('id_organizzazione')).toBeTruthy();
    expect(component._formGroup.get('referente')).toBeTruthy();
    expect(component._formGroup.get('aderente')).toBeTruthy();
  });

  it('should reset filter data on _resetForm', () => {
    component._filterData = [{ field: 'q', value: 'test' }];
    component._resetForm();
    expect(component._filterData).toEqual([]);
  });

  it('should call getConfiguration in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should have _useRoute set to true', () => {
    expect(component._useRoute).toBe(true);
  });

  it('should navigate on breadcrumb', () => {
    component.onBreadcrumb({ url: '/test' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/test']);
  });

  it('should reset scroll', () => {
    component._resetScroll();
    expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
  });

  it('should close edit state', () => {
    component._isEdit = true;
    component._onCloseEdit();
    expect(component._isEdit).toBe(false);
  });

  it('should update filterData on _onSearch', () => {
    const values = [{ field: 'q', value: 'test' }];
    component._onSearch(values);
    expect(component._filterData).toEqual(values);
  });

  it('should update sort on _onSort', () => {
    component._onSort({ sortField: 'id', sortBy: 'desc' });
    expect(component.sortField).toBe('id');
    expect(component.sortDirection).toBe('desc');
  });

  it('should track by id', () => {
    expect(component._trackBy(0, { id: 'abc' })).toBe('abc');
  });
});
