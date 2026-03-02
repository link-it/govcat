import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LnkFormSelectComponent } from './form-field-select.component';

describe('LnkFormSelectComponent', () => {
  let component: LnkFormSelectComponent;

  beforeEach(() => {
    component = new LnkFormSelectComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.items).toEqual([]);
    expect(component.bindLabel).toBe('label');
    expect(component.bindValue).toBe('value');
    expect(component.placeholder).toBe('Select...');
    expect(component.searchable).toBe(false);
    expect(component.clearable).toBe(false);
    expect(component.multiple).toBe(false);
    expect(component.useOptional).toBe(false);
    expect(component.disabled).toBe(false);
  });

  it('should implement writeValue', () => {
    component.writeValue('test');
    expect(component.value).toBe('test');
  });

  it('should implement registerOnChange', () => {
    const fn = vi.fn();
    component.registerOnChange(fn);
    component.onChange('val');
    expect(fn).toHaveBeenCalledWith('val');
  });

  it('should implement registerOnTouched', () => {
    const fn = vi.fn();
    component.registerOnTouched(fn);
    component.onTouched();
    expect(fn).toHaveBeenCalled();
  });

  it('should call onChange with item value on onItemSelect', () => {
    const fn = vi.fn();
    component.registerOnChange(fn);
    component.onItemSelect({ value: 'selected', label: 'Label' });
    expect(fn).toHaveBeenCalledWith('selected');
  });

  it('should call onChange with undefined when onItemSelect receives null', () => {
    const fn = vi.fn();
    component.registerOnChange(fn);
    component.onItemSelect(null);
    expect(fn).toHaveBeenCalledWith(undefined);
  });

  it('should emit changeEvent on onItemSelect', () => {
    const spy = vi.spyOn(component.changeEvent, 'emit');
    const item = { value: 'v1', label: 'L1' };
    component.onItemSelect(item);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should implement setDisabledState without error', () => {
    expect(() => component.setDisabledState(true)).not.toThrow();
  });
});
