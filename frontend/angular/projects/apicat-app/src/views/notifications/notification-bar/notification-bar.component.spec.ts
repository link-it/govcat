import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { NotificationBarComponent } from './notification-bar.component';
import { NotificationState } from '../notifications';

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
    getDetails: vi.fn().mockReturnValue(of({ stato: 'letta', id_notifica: '1' })),
    putElement: vi.fn().mockReturnValue(of({ stato: 'letta', id_notifica: '1' })),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { Layout: { dashboard: {} } }
    });
    mockAuthService.isGestore.mockReturnValue(false);
    mockApiService.getDetails.mockReturnValue(of({ stato: 'letta', id_notifica: '1' }));
    mockApiService.putElement.mockReturnValue(of({ stato: 'letta', id_notifica: '1' }));
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
    expect(component._notification).toBeNull();
    expect(component._fromDashboard).toBe(false);
    expect(component.NotificationState).toBe(NotificationState);
  });

  describe('ngOnInit', () => {
    it('should set _fromDashboard to true when queryParams has from=dashboard', () => {
      const routeWithDashboard = { queryParams: of({ from: 'dashboard' }) } as any;
      const comp = new NotificationBarComponent(
        mockRouter, routeWithDashboard, mockConfigService, mockAuthService, mockApiService
      );
      comp.ngOnInit();
      expect(comp._fromDashboard).toBe(true);
    });

    it('should not set _fromDashboard when queryParams has different from value', () => {
      const routeWithOther = { queryParams: of({ from: 'other' }) } as any;
      const comp = new NotificationBarComponent(
        mockRouter, routeWithOther, mockConfigService, mockAuthService, mockApiService
      );
      comp.ngOnInit();
      expect(comp._fromDashboard).toBe(false);
    });

    it('should not set _fromDashboard when no from query param', () => {
      component.ngOnInit();
      expect(component._fromDashboard).toBe(false);
    });

    it('should set _fromDashboard when isGestore and dashboard enabled with hideNotificationMenu', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Layout: { dashboard: { enabled: true, hideNotificationMenu: true } } }
      });
      component.ngOnInit();
      expect(component._fromDashboard).toBe(true);
    });

    it('should not set _fromDashboard when isGestore but dashboard not enabled', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Layout: { dashboard: { enabled: false, hideNotificationMenu: true } } }
      });
      component.ngOnInit();
      expect(component._fromDashboard).toBe(false);
    });

    it('should not set _fromDashboard when isGestore but hideNotificationMenu is false', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Layout: { dashboard: { enabled: true, hideNotificationMenu: false } } }
      });
      component.ngOnInit();
      expect(component._fromDashboard).toBe(false);
    });

    it('should not set _fromDashboard when not isGestore even with dashboard config', () => {
      mockAuthService.isGestore.mockReturnValue(false);
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Layout: { dashboard: { enabled: true, hideNotificationMenu: true } } }
      });
      component.ngOnInit();
      expect(component._fromDashboard).toBe(false);
    });

    it('should handle null appConfig gracefully', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      mockConfigService.getConfiguration.mockReturnValue(null);
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should handle missing dashboard config gracefully', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Layout: {} }
      });
      expect(() => component.ngOnInit()).not.toThrow();
      expect(component._fromDashboard).toBe(false);
    });
  });

  describe('ngOnChanges', () => {
    it('should load data when notificationId changes with a value', () => {
      const loadSpy = vi.spyOn(component, 'loadData').mockImplementation(() => {});
      const changes = {
        notificationId: { currentValue: 'n123', previousValue: null, firstChange: true, isFirstChange: () => true },
        notification: { currentValue: null, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any;
      component.ngOnChanges(changes);
      expect(component.notificationId).toBe('n123');
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should set _notification when notification changes and auto-mark as Letta', () => {
      const markSpy = vi.spyOn(component, 'markNotification').mockImplementation(() => {});
      const newNotification = { id_notifica: 'n1', stato: NotificationState.Nuova };
      const changes = {
        notificationId: { currentValue: null, previousValue: null, firstChange: true, isFirstChange: () => true },
        notification: { currentValue: newNotification, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any;
      component.ngOnChanges(changes);
      expect(component._notification).toEqual(newNotification);
      expect(component.notification).toEqual(newNotification);
      expect(markSpy).toHaveBeenCalledWith(NotificationState.Letta);
    });

    it('should not mark as Letta when notification stato is not Nuova', () => {
      const markSpy = vi.spyOn(component, 'markNotification').mockImplementation(() => {});
      const newNotification = { id_notifica: 'n1', stato: NotificationState.Letta };
      const changes = {
        notificationId: { currentValue: null, previousValue: null, firstChange: true, isFirstChange: () => true },
        notification: { currentValue: newNotification, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any;
      component.ngOnChanges(changes);
      expect(component._notification).toEqual(newNotification);
      expect(markSpy).not.toHaveBeenCalled();
    });

    it('should handle both notificationId and notification changing at once', () => {
      const loadSpy = vi.spyOn(component, 'loadData').mockImplementation(() => {});
      const markSpy = vi.spyOn(component, 'markNotification').mockImplementation(() => {});
      const newNotification = { id_notifica: 'n1', stato: NotificationState.Nuova };
      const changes = {
        notificationId: { currentValue: 'n123', previousValue: null, firstChange: true, isFirstChange: () => true },
        notification: { currentValue: newNotification, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any;
      component.ngOnChanges(changes);
      expect(loadSpy).toHaveBeenCalled();
      expect(markSpy).toHaveBeenCalledWith(NotificationState.Letta);
    });
  });

  describe('loadData', () => {
    it('should reset _notification and call getDetails', () => {
      component._notification = { some: 'data' };
      component.notificationId = 'n1';
      mockApiService.getDetails.mockReturnValue(of({ stato: NotificationState.Letta, id_notifica: 'n1' }));

      component.loadData();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('notifiche', 'n1');
      expect(component._notification).toEqual({ stato: NotificationState.Letta, id_notifica: 'n1' });
    });

    it('should mark as Letta when loaded notification has stato Nuova', () => {
      const markSpy = vi.spyOn(component, 'markNotification').mockImplementation(() => {});
      component.notificationId = 'n1';
      mockApiService.getDetails.mockReturnValue(of({ stato: NotificationState.Nuova, id_notifica: 'n1' }));

      component.loadData();

      expect(component._notification).toEqual({ stato: NotificationState.Nuova, id_notifica: 'n1' });
      expect(markSpy).toHaveBeenCalledWith(NotificationState.Letta);
    });

    it('should not mark as Letta when loaded notification has stato Letta', () => {
      const markSpy = vi.spyOn(component, 'markNotification').mockImplementation(() => {});
      component.notificationId = 'n1';
      mockApiService.getDetails.mockReturnValue(of({ stato: NotificationState.Letta, id_notifica: 'n1' }));

      component.loadData();

      expect(markSpy).not.toHaveBeenCalled();
    });

    it('should handle error from getDetails', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component.notificationId = 'n1';
      mockApiService.getDetails.mockReturnValue({
        subscribe: (handlers: any) => { handlers.error(new Error('API error')); }
      });

      expect(() => component.loadData()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('erroe', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('markNotification', () => {
    it('should call putElement with correct parameters', () => {
      component._notification = { id_notifica: 'n1' };
      mockApiService.putElement.mockReturnValue(of({ id_notifica: 'n1', stato: NotificationState.Letta }));

      component.markNotification(NotificationState.Letta);

      expect(mockApiService.putElement).toHaveBeenCalledWith('notifiche', 'n1', { stato: NotificationState.Letta });
      expect(component._notification).toEqual({ id_notifica: 'n1', stato: NotificationState.Letta });
    });

    it('should call onBack when back=true', () => {
      const backSpy = vi.spyOn(component, 'onBack').mockImplementation(() => {});
      component._notification = { id_notifica: 'n1' };
      mockApiService.putElement.mockReturnValue(of({ id_notifica: 'n1', stato: NotificationState.Archiviata }));

      component.markNotification(NotificationState.Archiviata, true);

      expect(backSpy).toHaveBeenCalled();
    });

    it('should not call onBack when back=false', () => {
      const backSpy = vi.spyOn(component, 'onBack').mockImplementation(() => {});
      component._notification = { id_notifica: 'n1' };
      mockApiService.putElement.mockReturnValue(of({ id_notifica: 'n1', stato: NotificationState.Letta }));

      component.markNotification(NotificationState.Letta, false);

      expect(backSpy).not.toHaveBeenCalled();
    });

    it('should handle error from putElement', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component._notification = { id_notifica: 'n1' };
      mockApiService.putElement.mockReturnValue({
        subscribe: (handlers: any) => { handlers.error(new Error('Put error')); }
      });

      expect(() => component.markNotification(NotificationState.Letta)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('markNotification errore', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should mark as Archiviata', () => {
      component._notification = { id_notifica: 'n1' };
      mockApiService.putElement.mockReturnValue(of({ id_notifica: 'n1', stato: NotificationState.Archiviata }));

      component.markNotification(NotificationState.Archiviata);

      expect(component._notification.stato).toBe(NotificationState.Archiviata);
    });
  });

  describe('_isUnread', () => {
    it('should return true when stato is Nuova', () => {
      component._notification = { stato: NotificationState.Nuova };
      expect(component._isUnread()).toBe(true);
    });

    it('should return false when stato is Letta', () => {
      component._notification = { stato: NotificationState.Letta };
      expect(component._isUnread()).toBe(false);
    });

    it('should return false when stato is Archiviata', () => {
      component._notification = { stato: NotificationState.Archiviata };
      expect(component._isUnread()).toBe(false);
    });

    it('should return false when _notification is null', () => {
      component._notification = null;
      expect(component._isUnread()).toBe(false);
    });

    it('should return false when _notification is undefined', () => {
      component._notification = undefined;
      expect(component._isUnread()).toBe(false);
    });
  });

  describe('onBack', () => {
    it('should navigate to /notifications when _fromDashboard is false', () => {
      component._fromDashboard = false;
      component.onBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/notifications']);
    });

    it('should navigate to /dashboard when _fromDashboard is true', () => {
      component._fromDashboard = true;
      component.onBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      const spy = vi.spyOn(component.close, 'emit');
      component.onClose();
      expect(spy).toHaveBeenCalledWith({ close: true });
    });
  });
});
