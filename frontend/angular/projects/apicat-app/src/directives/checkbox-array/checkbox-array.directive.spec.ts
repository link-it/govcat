import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckboxArrayKey, CheckboxArrayValueAccessor } from './checkbox-array.directive';
import { ElementRef, Renderer2 } from '@angular/core';

describe('CheckboxArrayKey', () => {
  let directive: CheckboxArrayKey;
  let mockRenderer: any;
  let inputEl: HTMLInputElement;

  beforeEach(() => {
    inputEl = document.createElement('input');
    inputEl.type = 'checkbox';
    mockRenderer = {
      setProperty: vi.fn()
    };
    directive = new CheckboxArrayKey(mockRenderer, new ElementRef(inputEl));
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  it('should write value and set checked property', () => {
    directive.writeValue(true);
    expect(directive.state).toBe(true);
    expect(mockRenderer.setProperty).toHaveBeenCalledWith(inputEl, 'checked', true);
  });

  it('should update state on change and notify parent', () => {
    const mockParent = { onChange: vi.fn() };
    directive.parent = mockParent as any;

    directive.onChange(true);
    expect(directive.state).toBe(true);
    expect(mockParent.onChange).toHaveBeenCalled();
  });

  it('should handle onChange without parent', () => {
    directive.onChange(true);
    expect(directive.state).toBe(true);
  });

  it('should call parent onTouched', () => {
    const mockParent = { onTouched: vi.fn() };
    directive.parent = mockParent as any;

    directive.onTouched();
    expect(mockParent.onTouched).toHaveBeenCalled();
  });

  it('should set disabled state', () => {
    directive.setDisabledState(true);
    expect(mockRenderer.setProperty).toHaveBeenCalledWith(inputEl, 'disabled', true);
  });

  it('should initialize state to false', () => {
    expect(directive.state).toBe(false);
  });
});

describe('CheckboxArrayValueAccessor', () => {
  let accessor: CheckboxArrayValueAccessor;

  beforeEach(() => {
    accessor = new CheckboxArrayValueAccessor();
  });

  it('should be created', () => {
    expect(accessor).toBeTruthy();
  });

  it('should register onChange callback', () => {
    const fn = vi.fn();
    accessor.registerOnChange(fn);
    // Calling onChange should trigger the registered function
    accessor.onChange();
    expect(fn).toHaveBeenCalled();
  });

  it('should register onTouched callback', () => {
    const fn = vi.fn();
    accessor.registerOnTouched(fn);
    accessor.onTouched();
    expect(fn).toHaveBeenCalled();
  });

  it('should accept array in writeValue', () => {
    accessor.writeValue(['a', 'b']);
    // Should not throw
  });

  it('should ignore non-array in writeValue', () => {
    accessor.writeValue('not an array');
    accessor.writeValue(null);
    accessor.writeValue(undefined);
    // Should not throw
  });

  it('should set disabled state on all checkboxes', () => {
    const mockCheckbox1 = { setDisabledState: vi.fn() };
    const mockCheckbox2 = { setDisabledState: vi.fn() };
    (accessor as any).checkboxes = {
      forEach: (fn: (chk: any) => void) => [mockCheckbox1, mockCheckbox2].forEach(fn)
    };

    accessor.setDisabledState(true);
    expect(mockCheckbox1.setDisabledState).toHaveBeenCalledWith(true);
    expect(mockCheckbox2.setDisabledState).toHaveBeenCalledWith(true);
  });

  it('should cleanup on destroy', () => {
    expect(() => accessor.ngOnDestroy()).not.toThrow();
  });

  it('should emit selected keys on onChange', () => {
    const fn = vi.fn();
    accessor.registerOnChange(fn);

    const chk1 = { state: true, key: 'a' };
    const chk2 = { state: false, key: 'b' };
    const chk3 = { state: true, key: 'c' };
    (accessor as any).checkboxes = {
      filter: (pred: (chk: any) => boolean) => [chk1, chk2, chk3].filter(pred),
      forEach: (fn: (chk: any) => void) => [chk1, chk2, chk3].forEach(fn)
    };

    accessor.onChange();
    expect(fn).toHaveBeenCalledWith(['a', 'c']);
  });
});
