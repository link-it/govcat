import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextUppercaseDirective } from './uppercase.directive';
import { ElementRef, Renderer2 } from '@angular/core';

describe('TextUppercaseDirective', () => {
  let directive: TextUppercaseDirective;
  let inputEl: HTMLInputElement;
  let mockRenderer: any;

  beforeEach(() => {
    inputEl = document.createElement('input');
    mockRenderer = {
      setProperty: vi.fn()
    };
    directive = new TextUppercaseDirective(new ElementRef(inputEl), mockRenderer);
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should initialize preValue as empty string', () => {
    expect(directive.preValue).toBe('');
  });

  it('should convert input to uppercase', () => {
    const event = { target: { value: 'hello world' } };
    directive.onInput(event);

    expect(mockRenderer.setProperty).toHaveBeenCalledWith(inputEl, 'value', 'HELLO WORLD');
  });

  it('should update preValue after conversion', () => {
    const event = { target: { value: 'test' } };
    directive.onInput(event);

    expect(directive.preValue).toBe('TEST');
  });

  it('should not update if value is same as preValue', () => {
    directive.preValue = 'HELLO';
    const event = { target: { value: 'HELLO' } };
    directive.onInput(event);

    expect(mockRenderer.setProperty).not.toHaveBeenCalled();
  });

  it('should handle mixed case input', () => {
    const event = { target: { value: 'HeLLo WoRLd' } };
    directive.onInput(event);

    expect(mockRenderer.setProperty).toHaveBeenCalledWith(inputEl, 'value', 'HELLO WORLD');
  });

  it('should handle empty string when preValue is empty', () => {
    // preValue is '' (falsy), so !preValue is true and the if block executes
    const event = { target: { value: '' } };
    directive.onInput(event);

    expect(mockRenderer.setProperty).toHaveBeenCalledWith(inputEl, 'value', '');
  });
});
