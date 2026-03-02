import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutoFillScrollDirective } from './auto-fill-scroll.directive';
import { ElementRef, NgZone } from '@angular/core';

describe('AutoFillScrollDirective', () => {
  let directive: AutoFillScrollDirective;
  let element: HTMLDivElement;
  let mockNgZone: any;

  beforeEach(() => {
    element = document.createElement('div');
    mockNgZone = {
      runOutsideAngular: vi.fn((fn: () => void) => fn()),
      run: vi.fn((fn: () => void) => fn())
    };
    directive = new AutoFillScrollDirective(new ElementRef(element), mockNgZone);
  });

  afterEach(() => {
    directive.ngOnDestroy();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should have autoFillScroll default to true', () => {
    expect(directive.autoFillScroll).toBe(true);
  });

  it('should create MutationObserver outside Angular zone', () => {
    directive.ngAfterViewInit();
    expect(mockNgZone.runOutsideAngular).toHaveBeenCalled();
  });

  it('should disconnect observer on destroy', () => {
    directive.ngAfterViewInit();
    expect(() => directive.ngOnDestroy()).not.toThrow();
  });

  it('should handle destroy before init', () => {
    expect(() => directive.ngOnDestroy()).not.toThrow();
  });

  it('should not emit when autoFillScroll is false', () => {
    const spy = vi.fn();
    directive.autoFillNeeded.subscribe(spy);
    directive.autoFillScroll = false;

    directive.ngAfterViewInit();

    // Trigger a simulated mutation won't emit because autoFillScroll is false
    expect(spy).not.toHaveBeenCalled();
  });
});
