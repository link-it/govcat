import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenInNewTabDirective } from './open-in-new-tab.directive';
import { ElementRef, Renderer2 } from '@angular/core';

describe('OpenInNewTabDirective', () => {
  let directive: OpenInNewTabDirective;
  let mockRouter: any;
  let mockLocation: any;
  let element: HTMLDivElement;
  let mockRenderer: any;

  beforeEach(() => {
    element = document.createElement('div');
    mockRouter = {
      createUrlTree: vi.fn().mockReturnValue({}),
      serializeUrl: vi.fn().mockReturnValue('/servizi/1')
    };
    mockLocation = {
      prepareExternalUrl: vi.fn((url: string) => `/apicat-app${url}`)
    };
    mockRenderer = {
      createElement: vi.fn(() => {
        const span = document.createElement('span');
        return span;
      }),
      addClass: vi.fn(),
      setAttribute: vi.fn(),
      listen: vi.fn().mockReturnValue(() => {}),
      appendChild: vi.fn(),
      removeChild: vi.fn()
    };

    directive = new OpenInNewTabDirective(
      mockRouter, mockLocation, new ElementRef(element), mockRenderer
    );
    directive.appOpenInNewTab = ['/servizi', '1'];
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  it('should have default values', () => {
    expect(directive.openInNewTabAlways).toBe(false);
    expect(directive.preventNormalNavigation).toBe(false);
    expect(directive.showIcon).toBe(true);
  });

  it('should create icon on init when showIcon is true', () => {
    directive.ngOnInit();
    expect(mockRenderer.createElement).toHaveBeenCalledWith('span');
    expect(mockRenderer.addClass).toHaveBeenCalledWith(expect.anything(), 'open-new-tab-icon');
    expect(mockRenderer.appendChild).toHaveBeenCalled();
  });

  it('should not create icon when showIcon is false', () => {
    directive.showIcon = false;
    directive.ngOnInit();
    expect(mockRenderer.createElement).not.toHaveBeenCalled();
  });

  it('should cleanup on destroy', () => {
    directive.ngOnInit();
    directive.ngOnDestroy();
    // Should not throw
  });

  it('should open in new tab on ctrl+click', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    directive.ngOnInit();

    const event = new MouseEvent('click', { ctrlKey: true, button: 0 });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });

    directive.onClick(event);

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(
      ['/servizi', '1'],
      { queryParams: undefined, fragment: undefined }
    );
    expect(openSpy).toHaveBeenCalledWith('/apicat-app/servizi/1', '_blank');
    openSpy.mockRestore();
  });

  it('should open in new tab on meta+click (Mac Cmd)', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const event = new MouseEvent('click', { metaKey: true, button: 0 });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });

    directive.onClick(event);
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('should open in new tab on middle mouse button', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const event = new MouseEvent('auxclick', { button: 1 });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });

    directive.onClick(event);
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('should always open in new tab when openInNewTabAlways is true', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    directive.openInNewTabAlways = true;

    const event = new MouseEvent('click', { button: 0 });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });

    directive.onClick(event);
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('should prevent normal navigation when preventNormalNavigation is true', () => {
    directive.preventNormalNavigation = true;

    const preventDefault = vi.fn();
    const event = new MouseEvent('click', { button: 0 });
    Object.defineProperty(event, 'preventDefault', { value: preventDefault });

    directive.onClick(event);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('should not open in new tab on normal click without modifiers', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const event = new MouseEvent('click', { button: 0 });
    directive.onClick(event);

    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('should pass queryParams and fragment to createUrlTree', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    directive.queryParams = { page: 1 };
    directive.fragment = 'details';

    const event = new MouseEvent('click', { ctrlKey: true, button: 0 });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    Object.defineProperty(event, 'stopPropagation', { value: vi.fn() });

    directive.onClick(event);

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(
      ['/servizi', '1'],
      { queryParams: { page: 1 }, fragment: 'details' }
    );
    openSpy.mockRestore();
  });
});
