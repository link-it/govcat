import { describe, it, expect, beforeEach } from 'vitest';
import { UppercaseDirective } from './uppercase.directive';
import { ElementRef } from '@angular/core';

describe('UppercaseDirective', () => {
  let directive: UppercaseDirective;
  let inputEl: HTMLInputElement;

  beforeEach(() => {
    inputEl = document.createElement('input');
    directive = new UppercaseDirective(new ElementRef(inputEl));
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  it('should uppercase input value on input event', () => {
    inputEl.value = 'hello world';
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: inputEl });
    directive.onInputChange(event);
    expect(inputEl.value).toBe('HELLO WORLD');
  });

  it('should not uppercase when disabled', () => {
    directive.isEnabled = false;
    inputEl.value = 'hello';
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: inputEl });
    directive.onInputChange(event);
    expect(inputEl.value).toBe('hello');
  });

  it('should handle empty string', () => {
    inputEl.value = '';
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: inputEl });
    directive.onInputChange(event);
    expect(inputEl.value).toBe('');
  });

  it('should be enabled by default', () => {
    expect(directive.isEnabled).toBe(true);
  });
});
