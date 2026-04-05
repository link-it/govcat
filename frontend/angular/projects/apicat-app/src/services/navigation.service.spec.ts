import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NavigationService } from './navigation.service';

describe('NavigationService', () => {
  let service: NavigationService;
  let router: any;
  let location: any;

  beforeEach(() => {
    router = {
      navigate: vi.fn(),
      createUrlTree: vi.fn().mockReturnValue({}),
      serializeUrl: vi.fn().mockReturnValue('/servizi/1')
    };
    location = {
      prepareExternalUrl: vi.fn().mockReturnValue('/apicat-app/servizi/1')
    };
    service = new NavigationService(router, location);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('shouldOpenInNewTab', () => {
    it('should return false for undefined event', () => {
      expect(service.shouldOpenInNewTab(undefined)).toBe(false);
    });

    it('should return true when ctrlKey is pressed', () => {
      expect(service.shouldOpenInNewTab({ ctrlKey: true, metaKey: false, button: 0 } as MouseEvent)).toBe(true);
    });

    it('should return true when metaKey is pressed', () => {
      expect(service.shouldOpenInNewTab({ ctrlKey: false, metaKey: true, button: 0 } as MouseEvent)).toBe(true);
    });

    it('should return true for middle-click (button === 1)', () => {
      expect(service.shouldOpenInNewTab({ ctrlKey: false, metaKey: false, button: 1 } as MouseEvent)).toBe(true);
    });

    it('should return false for regular click', () => {
      expect(service.shouldOpenInNewTab({ ctrlKey: false, metaKey: false, button: 0 } as MouseEvent)).toBe(false);
    });
  });

  describe('navigateWithEvent', () => {
    it('should use standard navigation for regular click', () => {
      const event = { ctrlKey: false, metaKey: false, button: 0 } as MouseEvent;
      service.navigateWithEvent(event, ['servizi', 1]);
      expect(router.navigate).toHaveBeenCalledWith(['servizi', 1], { queryParams: undefined });
    });

    it('should open in new tab for ctrl+click', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const event = {
        ctrlKey: true, metaKey: false, button: 0,
        preventDefault: vi.fn(), stopPropagation: vi.fn()
      } as unknown as MouseEvent;
      service.navigateWithEvent(event, ['servizi', 1]);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalledWith('/apicat-app/servizi/1', '_blank');
    });

    it('should handle undefined event as regular navigation', () => {
      service.navigateWithEvent(undefined, ['servizi']);
      expect(router.navigate).toHaveBeenCalledWith(['servizi'], { queryParams: undefined });
    });

    it('should pass queryParams', () => {
      service.navigateWithEvent(undefined, ['servizi'], { tab: 'api' });
      expect(router.navigate).toHaveBeenCalledWith(['servizi'], { queryParams: { tab: 'api' } });
    });
  });

  describe('openInNewTab', () => {
    it('should create url tree and open window', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      service.openInNewTab(['servizi', 1]);
      expect(router.createUrlTree).toHaveBeenCalledWith(['servizi', 1], { queryParams: undefined });
      expect(openSpy).toHaveBeenCalledWith('/apicat-app/servizi/1', '_blank');
    });
  });

  describe('extractEvent', () => {
    it('should extract event from payload', () => {
      const event = new MouseEvent('click');
      expect(service.extractEvent({ data: {}, event })).toBe(event);
    });

    it('should return undefined for payload without event', () => {
      expect(service.extractEvent({ data: {} })).toBeUndefined();
    });

    it('should return undefined for null payload', () => {
      expect(service.extractEvent(null)).toBeUndefined();
    });
  });

  describe('extractData', () => {
    it('should extract data from payload', () => {
      const data = { id: 1 };
      expect(service.extractData({ data, event: {} })).toBe(data);
    });

    it('should return payload itself when no data property', () => {
      const payload = { id: 1 };
      expect(service.extractData(payload)).toBe(payload);
    });
  });
});
