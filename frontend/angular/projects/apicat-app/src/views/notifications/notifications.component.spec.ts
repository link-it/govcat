import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { NotificationsComponent } from './notifications.component';

describe('NotificationsComponent', () => {
  let component: NotificationsComponent;
  const mockRoute = { snapshot: { queryParams: {} } } as any;
  const mockRouter = { navigate: vi.fn(), events: of() } as any;
  const mockLocation = {} as any;
  const mockTranslate = { instant: vi.fn((k: string) => k), onLangChange: of({}) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { Layout: { enablePollingNotifications: false } }
    }),
    getConfig: vi.fn().mockReturnValue(of({ columns: 4 })),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = {} as any;
  const mockLocalStorage = { getItem: vi.fn(), setItem: vi.fn() } as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
  } as any;
  const mockUtilService = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
  } as any;
  const mockAuthService = {
    isGestore: vi.fn().mockReturnValue(false),
  } as any;
  const mockNotificationsService = {
    startCounters: vi.fn(),
    getNotificationsCount: vi.fn().mockReturnValue(of({ nuove: 0, lette: 0, archiviate: 0 })),
  } as any;
  const mockNavigationService = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { Layout: { enablePollingNotifications: false } }
    });
    mockConfigService.getConfig.mockReturnValue(of({ columns: 4 }));
    mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
    mockUtilService._queryToHttpParams.mockReturnValue({});
    mockAuthService.isGestore.mockReturnValue(false);
    mockNotificationsService.getNotificationsCount.mockReturnValue(of({ nuove: 0, lette: 0, archiviate: 0 }));
    Tools.ScrollTo = vi.fn();
    Tools.ScrollElement = vi.fn();
    component = new NotificationsComponent(
      mockRoute, mockRouter, mockLocation, mockTranslate,
      mockConfigService, mockTools, mockEventsManager,
      mockLocalStorage, mockApiService, mockUtilService,
      mockAuthService, mockNotificationsService, mockNavigationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component._spin).toBe(true);
    expect(component.showSearch).toBe(true);
    expect(component.showSorting).toBe(true);
  });

  it('should have breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBeGreaterThan(0);
  });

  it('should set error messages', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
  });

  it('should navigate on breadcrumb', () => {
    component.onBreadcrumb({ url: '/test' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/test']);
  });

  it('should reset scroll', () => {
    component._resetScroll();
    expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
  });

  it('should check isGestore', () => {
    expect(component._isGestore()).toBe(false);
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component._isGestore()).toBe(true);
  });

  it('should reset form and reload', () => {
    component._filterData = [{ field: 'test', value: 'val' }];
    component._resetForm();
    expect(component._filterData).toEqual([]);
  });

  it('should set current tab', () => {
    component.currentTab = 'Nuova';
    component._setCurrentTab('Letta');
    expect(component.currentTab).toBe('Letta');
  });
});
