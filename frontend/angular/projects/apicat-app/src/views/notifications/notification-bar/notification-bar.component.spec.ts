import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { NotificationBarComponent } from './notification-bar.component';

describe('NotificationBarComponent', () => {
  let component: NotificationBarComponent;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockRoute = {
    queryParams: of({}),
  } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { Layout: { dashboard: {} } }
    }),
  } as any;
  const mockAuthService = {
    isGestore: vi.fn().mockReturnValue(false),
  } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({ stato: 'Letta', id_notifica: '1' })),
    putElement: vi.fn().mockReturnValue(of({})),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new NotificationBarComponent(
      mockRouter, mockRoute, mockConfigService, mockAuthService, mockApiService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.notification).toBeNull();
    expect(component.notificationId).toBeNull();
    expect(component.type).toBe('');
    expect(component.top).toBe(0);
  });

  it('should emit close event', () => {
    const spy = vi.spyOn(component.close, 'emit');
    component.onClose();
    expect(spy).toHaveBeenCalledWith({ close: true });
  });

  it('should check if unread via _notification', () => {
    component._notification = { stato: 'nuova' };
    expect(component._isUnread()).toBe(true);
    component._notification = { stato: 'letta' };
    expect(component._isUnread()).toBe(false);
  });

  it('should navigate to notifications on back', () => {
    component._fromDashboard = false;
    component.onBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/notifications']);
  });

  it('should navigate to dashboard on back when fromDashboard', () => {
    component._fromDashboard = true;
    component.onBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should set fromDashboard on ngOnInit from queryParams', () => {
    const routeWithDashboard = { queryParams: of({ from: 'dashboard' }) } as any;
    const comp = new NotificationBarComponent(
      mockRouter, routeWithDashboard, mockConfigService, mockAuthService, mockApiService
    );
    comp.ngOnInit();
    expect(comp._fromDashboard).toBe(true);
  });
});
