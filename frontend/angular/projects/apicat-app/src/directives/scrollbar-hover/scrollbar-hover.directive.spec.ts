import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScrollbarHoverDirective } from './scrollbar-hover.directive';
import { ElementRef } from '@angular/core';

describe('ScrollbarHoverDirective', () => {
  let directive: ScrollbarHoverDirective;
  let element: HTMLDivElement;
  let mockConfig: any;

  beforeEach(() => {
    element = document.createElement('div');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createDirective(hideOnIdle: boolean, scrollbarHover: boolean = true) {
    mockConfig = {
      getAppConfig: vi.fn().mockReturnValue({
        Scrollbar: { hideOnIdle }
      })
    };
    directive = new ScrollbarHoverDirective(new ElementRef(element), mockConfig);
    directive.scrollbarHover = scrollbarHover;
    return directive;
  }

  it('should be created', () => {
    createDirective(false);
    expect(directive).toBeTruthy();
  });

  it('should add scrollbar-hide-on-idle class on init when enabled', () => {
    createDirective(true);
    directive.ngOnInit();
    expect(element.classList.contains('scrollbar-hide-on-idle')).toBe(true);
  });

  it('should not add class when hideOnIdle is false', () => {
    createDirective(false);
    directive.ngOnInit();
    expect(element.classList.contains('scrollbar-hide-on-idle')).toBe(false);
  });

  it('should not add class when scrollbarHover input is false', () => {
    createDirective(true, false);
    directive.ngOnInit();
    expect(element.classList.contains('scrollbar-hide-on-idle')).toBe(false);
  });

  it('should add scrollbar-visible on mouseenter', () => {
    createDirective(true);
    directive.onMouseEnter();
    expect(element.classList.contains('scrollbar-visible')).toBe(true);
  });

  it('should remove scrollbar-visible on mouseleave after delay', () => {
    createDirective(true);
    directive.onMouseEnter();
    expect(element.classList.contains('scrollbar-visible')).toBe(true);

    directive.onMouseLeave();
    expect(element.classList.contains('scrollbar-visible')).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(element.classList.contains('scrollbar-visible')).toBe(false);
  });

  it('should cancel hide timeout on re-enter', () => {
    createDirective(true);
    directive.onMouseEnter();
    directive.onMouseLeave();
    directive.onMouseEnter();

    vi.advanceTimersByTime(1000);
    expect(element.classList.contains('scrollbar-visible')).toBe(true);
  });

  it('should add visible class on scroll and remove after delay', () => {
    createDirective(true);
    directive.onScroll();
    expect(element.classList.contains('scrollbar-visible')).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(element.classList.contains('scrollbar-visible')).toBe(false);
  });

  it('should reset scroll timeout on repeated scroll', () => {
    createDirective(true);
    directive.onScroll();
    vi.advanceTimersByTime(500);
    directive.onScroll();
    vi.advanceTimersByTime(500);
    expect(element.classList.contains('scrollbar-visible')).toBe(true);

    vi.advanceTimersByTime(500);
    expect(element.classList.contains('scrollbar-visible')).toBe(false);
  });

  it('should do nothing on mouseenter when disabled', () => {
    createDirective(false);
    directive.onMouseEnter();
    expect(element.classList.contains('scrollbar-visible')).toBe(false);
  });

  it('should do nothing on mouseleave when disabled', () => {
    createDirective(false);
    directive.onMouseLeave();
    expect(element.classList.contains('scrollbar-visible')).toBe(false);
  });

  it('should do nothing on scroll when disabled', () => {
    createDirective(false);
    directive.onScroll();
    expect(element.classList.contains('scrollbar-visible')).toBe(false);
  });

  it('should clear timeout on destroy', () => {
    createDirective(true);
    directive.onMouseLeave();
    directive.ngOnDestroy();
    // No assertion needed - just verifying it doesn't throw
  });

  it('should handle null config gracefully', () => {
    mockConfig = { getAppConfig: vi.fn().mockReturnValue(null) };
    directive = new ScrollbarHoverDirective(new ElementRef(element), mockConfig);
    expect(directive).toBeTruthy();
  });
});
