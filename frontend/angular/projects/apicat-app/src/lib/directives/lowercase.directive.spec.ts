import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextLowercaseDirective } from './lowercase.directive';
import { ElementRef, Renderer2 } from '@angular/core';

describe('TextLowercaseDirective', () => {
  let directive: TextLowercaseDirective;
  let inputEl: HTMLInputElement;
  let mockRenderer: any;

  beforeEach(() => {
    inputEl = document.createElement('input');
    mockRenderer = {
      setProperty: vi.fn()
    };
    directive = new TextLowercaseDirective(new ElementRef(inputEl), mockRenderer);
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should initialize preValue as empty string', () => {
    expect(directive.preValue).toBe('');
  });

  it('should convert input to lowercase', () => {
    const event = { target: { value: 'HELLO WORLD' } };
    directive.onInput(event);

    expect(mockRenderer.setProperty).toHaveBeenCalledWith(inputEl, 'value', 'hello world');
  });

  it('should update preValue after conversion', () => {
    const event = { target: { value: 'TEST' } };
    directive.onInput(event);

    expect(directive.preValue).toBe('test');
  });

  it('should not update if value is same as preValue', () => {
    directive.preValue = 'hello';
    const event = { target: { value: 'hello' } };
    directive.onInput(event);

    expect(mockRenderer.setProperty).not.toHaveBeenCalled();
  });

  it('should handle mixed case input', () => {
    const event = { target: { value: 'HeLLo WoRLd' } };
    directive.onInput(event);

    expect(mockRenderer.setProperty).toHaveBeenCalledWith(inputEl, 'value', 'hello world');
  });

  it('should handle empty string when preValue is empty', () => {
    // preValue is '' (falsy), so !preValue is true and the if block executes
    const event = { target: { value: '' } };
    directive.onInput(event);

    expect(mockRenderer.setProperty).toHaveBeenCalledWith(inputEl, 'value', '');
  });
});
