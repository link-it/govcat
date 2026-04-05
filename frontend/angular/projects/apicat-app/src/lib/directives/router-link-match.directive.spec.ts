import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RouterLinkMatchDirective } from './router-link-match.directive';
import { ElementRef } from '@angular/core';
import { Subject } from 'rxjs';

describe('RouterLinkMatchDirective', () => {
  let directive: RouterLinkMatchDirective;
  let element: HTMLDivElement;
  let mockRenderer: any;
  let mockRouter: any;
  let routerEvents$: Subject<any>;

  beforeEach(() => {
    element = document.createElement('div');
    routerEvents$ = new Subject();
    mockRouter = {
      events: routerEvents$.asObservable(),
      navigated: true,
      url: '/servizi/list'
    };
    mockRenderer = {
      addClass: vi.fn(),
      removeClass: vi.fn()
    };
    directive = new RouterLinkMatchDirective(mockRouter, mockRenderer, new ElementRef(element));
  });

  afterEach(() => {
    directive.ngOnDestroy();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should accept match expression object', () => {
    expect(() => {
      directive.routerLinkMatch = { 'active': '/servizi' };
    }).not.toThrow();
  });

  it('should throw for non-object match expression', () => {
    expect(() => {
      directive.routerLinkMatch = 'invalid' as any;
    }).toThrow(TypeError);
  });

  it('should cleanup subscriptions on destroy', () => {
    expect(() => directive.ngOnDestroy()).not.toThrow();
  });
});
