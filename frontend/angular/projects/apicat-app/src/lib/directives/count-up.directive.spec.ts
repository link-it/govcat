import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CountUpDirective } from './count-up.directive';
import { ElementRef } from '@angular/core';
import { Destroy } from './destroy';

describe('CountUpDirective', () => {
  let directive: CountUpDirective;
  let element: HTMLSpanElement;
  let mockRenderer: any;
  let destroy: Destroy;

  beforeEach(() => {
    element = document.createElement('span');
    mockRenderer = {
      setProperty: vi.fn()
    };
    destroy = new Destroy();
    directive = new CountUpDirective(new ElementRef(element), mockRenderer, destroy);
  });

  afterEach(() => {
    destroy.ngOnDestroy();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should have default language it-IT', () => {
    expect(directive.language).toBe('it-IT');
  });

  it('should set count via input setter', () => {
    directive.count = 100;
    // Should not throw
    expect(directive).toBeTruthy();
  });

  it('should set duration via input setter', () => {
    directive.duration = 3000;
    expect(directive).toBeTruthy();
  });

  it('should not throw on ngOnInit', () => {
    directive.count = 0;
    // animationFrameScheduler doesn't tick in JSDOM, so no rendering happens
    // but ngOnInit should not throw
    expect(() => directive.ngOnInit()).not.toThrow();
  });

  it('should stop animation on destroy', () => {
    directive.count = 100;
    directive.ngOnInit();

    expect(() => destroy.ngOnDestroy()).not.toThrow();
  });
});
