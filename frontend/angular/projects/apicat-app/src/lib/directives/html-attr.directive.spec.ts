import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HtmlAttributesDirective } from './html-attr.directive';
import { ElementRef } from '@angular/core';

describe('HtmlAttributesDirective', () => {
  let directive: HtmlAttributesDirective;
  let element: HTMLDivElement;
  let mockRenderer: any;

  beforeEach(() => {
    element = document.createElement('div');
    mockRenderer = {
      setStyle: vi.fn(),
      addClass: vi.fn(),
      setAttribute: vi.fn(),
      removeAttribute: vi.fn()
    };
    directive = new HtmlAttributesDirective(mockRenderer, new ElementRef(element));
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should set attributes on init', () => {
    directive.appHtmlAttr = { 'data-id': '123', 'role': 'button' };
    directive.ngOnInit();

    expect(mockRenderer.setAttribute).toHaveBeenCalledWith(element, 'data-id', '123');
    expect(mockRenderer.setAttribute).toHaveBeenCalledWith(element, 'role', 'button');
  });

  it('should add classes from string', () => {
    directive.appHtmlAttr = { 'class': 'foo bar baz' };
    directive.ngOnInit();

    expect(mockRenderer.addClass).toHaveBeenCalledWith(element, 'foo');
    expect(mockRenderer.addClass).toHaveBeenCalledWith(element, 'bar');
    expect(mockRenderer.addClass).toHaveBeenCalledWith(element, 'baz');
  });

  it('should add classes from array', () => {
    directive.appHtmlAttr = { 'class': ['foo', 'bar'] as any };
    directive.ngOnInit();

    expect(mockRenderer.addClass).toHaveBeenCalledWith(element, 'foo');
    expect(mockRenderer.addClass).toHaveBeenCalledWith(element, 'bar');
  });

  it('should set styles from object', () => {
    directive.appHtmlAttr = { 'style': { color: 'red', fontSize: '14px' } as any };
    directive.ngOnInit();

    expect(mockRenderer.setStyle).toHaveBeenCalledWith(element, 'color', 'red');
    expect(mockRenderer.setStyle).toHaveBeenCalledWith(element, 'fontSize', '14px');
  });

  it('should remove attribute when value is null', () => {
    directive.appHtmlAttr = { 'data-old': null as any };
    directive.ngOnInit();

    expect(mockRenderer.removeAttribute).toHaveBeenCalledWith(element, 'data-old');
  });

  it('should handle undefined appHtmlAttr', () => {
    directive.appHtmlAttr = undefined;
    expect(() => directive.ngOnInit()).not.toThrow();
  });

  it('should filter empty class strings', () => {
    directive.appHtmlAttr = { 'class': 'foo  bar' };
    directive.ngOnInit();

    expect(mockRenderer.addClass).toHaveBeenCalledWith(element, 'foo');
    expect(mockRenderer.addClass).toHaveBeenCalledWith(element, 'bar');
    expect(mockRenderer.addClass).toHaveBeenCalledTimes(2);
  });
});
