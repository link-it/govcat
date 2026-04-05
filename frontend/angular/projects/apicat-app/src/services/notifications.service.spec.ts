import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsService } from './notifications.service';
import { of } from 'rxjs';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let apiService: any;
  let utilService: any;
  let configService: any;

  beforeEach(() => {
    apiService = {
      getDetails: vi.fn().mockReturnValue(of({ count: 5 }))
    };
    utilService = {
      _queryToHttpParams: vi.fn().mockReturnValue({})
    };
    configService = {
      getConfiguration: vi.fn().mockReturnValue({
        AppConfig: { DEFAULT_NOTIFICATIONS_TIMER: 60000 }
      })
    };
    service = new NotificationsService(apiService, utilService, configService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return 0 for initial count', () => {
    expect(service.getCurrentCount()).toBe(0);
  });

  it('should return notifications observable', () => {
    const obs = service.getNotificationsCount();
    expect(obs).toBeDefined();
  });

  it('should stop polling on destroy', () => {
    expect(() => service.ngOnDestroy()).not.toThrow();
  });
});
