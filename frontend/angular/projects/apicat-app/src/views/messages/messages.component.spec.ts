import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { MessagesComponent } from './messages.component';

describe('MessagesComponent', () => {
  let component: MessagesComponent;
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
    Tools.ScrollTo = vi.fn();
    Tools.ScrollElement = vi.fn();
    component = new MessagesComponent(
      mockRoute, mockRouter, mockTranslate,
      mockConfigService, mockTools, mockEventsManager,
      mockApiService, mockUtils
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(MessagesComponent.Name).toBe('MessagesComponent');
  });

  it('should have model set to messages', () => {
    expect(component.model).toBe('messages');
  });

  it('should have default values', () => {
    expect(component._spin).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._error).toBe(false);
    expect(component._filterData).toEqual([]);
    expect(component._useRoute).toBe(true);
  });

  it('should have showHistory set to true', () => {
    expect(component.showHistory).toBe(true);
  });

  it('should have correct sort defaults', () => {
    expect(component.sortField).toBe('date');
    expect(component.sortDirection).toBe('asc');
  });

  it('should have breadcrumbs with 1 entry', () => {
    expect(component.breadcrumbs.length).toBe(1);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Messages');
  });

  it('should have searchFields with creationDateFrom, creationDateTo, taxcode, organization.legal_name, service.service_name', () => {
    expect(component.searchFields.length).toBe(5);
    const fieldNames = component.searchFields.map((f: any) => f.field);
    expect(fieldNames).toContain('creationDateFrom');
    expect(fieldNames).toContain('creationDateTo');
    expect(fieldNames).toContain('taxcode');
    expect(fieldNames).toContain('organization.legal_name');
    expect(fieldNames).toContain('service.service_name');
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
    expect(component._formGroup.get('creationDateFrom')).toBeTruthy();
    expect(component._formGroup.get('creationDateTo')).toBeTruthy();
    expect(component._formGroup.get('taxcode')).toBeTruthy();
    // Dotted keys must be accessed via controls map (get() treats dots as path separators)
    expect(component._formGroup.controls['organization.legal_name']).toBeTruthy();
    expect(component._formGroup.controls['service.service_name']).toBeTruthy();
  });

  it('should reset filter data on _resetForm', () => {
    component._filterData = [{ field: 'taxcode', value: 'test' }];
    component._resetForm();
    expect(component._filterData).toEqual([]);
  });

  it('should call getConfiguration in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
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
    const values = [{ field: 'taxcode', value: 'ABC123' }];
    component._onSearch(values);
    expect(component._filterData).toEqual(values);
  });

  it('should track by id', () => {
    expect(component._trackBy(0, { id: 'abc' })).toBe('abc');
  });
});
