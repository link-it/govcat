import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrimOnBlurDirective } from './trim-on-blur.directive';
import { ElementRef } from '@angular/core';

describe('TrimOnBlurDirective', () => {
  let directive: TrimOnBlurDirective;
  let inputEl: HTMLInputElement;
  let mockNgControl: any;

  beforeEach(() => {
    inputEl = document.createElement('input');
    mockNgControl = {
      control: {
        setValue: vi.fn()
      }
    };
    directive = new TrimOnBlurDirective(new ElementRef(inputEl), mockNgControl);
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  it('should trim leading/trailing whitespace on blur', () => {
    inputEl.value = '  hello world  ';
    directive.onBlur(new FocusEvent('blur'));
    expect(inputEl.value).toBe('hello world');
    expect(mockNgControl.control.setValue).toHaveBeenCalledWith('hello world', { emitEvent: true });
  });

  it('should convert empty string to null', () => {
    inputEl.value = '   ';
    directive.onBlur(new FocusEvent('blur'));
    expect(inputEl.value).toBe('');
    expect(mockNgControl.control.setValue).toHaveBeenCalledWith(null, { emitEvent: true });
  });

  it('should not change already trimmed value', () => {
    inputEl.value = 'clean';
    directive.onBlur(new FocusEvent('blur'));
    expect(mockNgControl.control.setValue).not.toHaveBeenCalled();
  });

  it('should do nothing when disabled', () => {
    directive.isEnabled = false;
    inputEl.value = '  spaces  ';
    directive.onBlur(new FocusEvent('blur'));
    expect(inputEl.value).toBe('  spaces  ');
    expect(mockNgControl.control.setValue).not.toHaveBeenCalled();
  });

  it('should work without NgControl', () => {
    const dirNoControl = new TrimOnBlurDirective(new ElementRef(inputEl), null as any);
    inputEl.value = '  hello  ';
    dirNoControl.onBlur(new FocusEvent('blur'));
    expect(inputEl.value).toBe('hello');
  });

  it('should be enabled by default', () => {
    expect(directive.isEnabled).toBe(true);
  });
});
