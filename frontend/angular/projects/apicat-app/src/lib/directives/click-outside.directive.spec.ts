import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClickOutsideDirective } from './click-outside.directive';
import { ElementRef } from '@angular/core';

describe('ClickOutsideDirective', () => {
  let directive: ClickOutsideDirective;
  let hostElement: HTMLDivElement;

  beforeEach(() => {
    hostElement = document.createElement('div');
    directive = new ClickOutsideDirective(new ElementRef(hostElement));
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should emit clickOutside when clicking outside', () => {
    const spy = vi.fn();
    directive.clickOutside.subscribe(spy);

    const outsideElement = document.createElement('span');
    const event = new MouseEvent('click');

    directive.onClick(event, outsideElement);

    expect(spy).toHaveBeenCalledWith(event);
  });

  it('should not emit when clicking inside', () => {
    const spy = vi.fn();
    directive.clickOutside.subscribe(spy);

    const childElement = document.createElement('span');
    hostElement.appendChild(childElement);

    const event = new MouseEvent('click');
    directive.onClick(event, childElement);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should not emit when clicking on the host element itself', () => {
    const spy = vi.fn();
    directive.clickOutside.subscribe(spy);

    const event = new MouseEvent('click');
    directive.onClick(event, hostElement);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should not emit when targetElement is null', () => {
    const spy = vi.fn();
    directive.clickOutside.subscribe(spy);

    const event = new MouseEvent('click');
    directive.onClick(event, null);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should handle deeply nested child elements', () => {
    const spy = vi.fn();
    directive.clickOutside.subscribe(spy);

    const child = document.createElement('div');
    const grandchild = document.createElement('span');
    hostElement.appendChild(child);
    child.appendChild(grandchild);

    const event = new MouseEvent('click');
    directive.onClick(event, grandchild);

    expect(spy).not.toHaveBeenCalled();
  });
});
