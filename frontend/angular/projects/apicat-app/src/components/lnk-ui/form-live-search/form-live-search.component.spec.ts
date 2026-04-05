import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimpleChange } from '@angular/core';
import { of } from 'rxjs';
import { LnkFormLiveSearchComponent } from './form-live-search.component';

describe('LnkFormLiveSearchComponent', () => {
  let component: LnkFormLiveSearchComponent;

  beforeEach(() => {
    component = new LnkFormLiveSearchComponent();
    component.searchService = vi.fn().mockReturnValue(of([]));
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.id).toBe('');
    expect(component.bindLabel).toBe('label');
    expect(component.bindValue).toBe('value');
    expect(component.placeholder).toBe('Select...');
    expect(component.searchable).toBe(false);
    expect(component.clearable).toBe(false);
    expect(component.multiple).toBe(false);
    expect(component.isEdit).toBe(false);
    expect(component.inline).toBe(false);
    expect(component.singleColumn).toBe(false);
    expect(component.plainText).toBe(true);
    expect(component.showHelp).toBe(true);
    expect(component.showHelpOnlyEdit).toBe(true);
    expect(component.helpPlacement).toBe('left');
    expect(component.appendTo).toBe('body');
  });

  it('should implement writeValue', () => {
    component.writeValue('abc');
    expect(component.value).toBe('abc');
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

  it('should set disabled via setDisabledState', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });

  it('should set value from initValue on ngOnInit', () => {
    component.initValue = { value: 'init-val', label: 'Init' };
    component.ngOnInit();
    expect(component.value).toBe('init-val');
  });

  it('should not set value when initValue is null on ngOnInit', () => {
    component.initValue = null;
    component.ngOnInit();
    expect(component.value).toBeUndefined();
  });

  it('should update value on ngOnChanges when initValue changes', () => {
    component.ngOnChanges({
      initValue: new SimpleChange(null, { value: 'changed', label: 'Changed' }, false),
    });
    expect(component.value).toBe('changed');
  });

  it('should call onChange and emit changeEvent on onItemSelect', () => {
    const changeFn = vi.fn();
    component.registerOnChange(changeFn);
    const spy = vi.spyOn(component.changeEvent, 'emit');
    const item = { value: 'sel', label: 'Sel' };
    component.onItemSelect(item);
    expect(changeFn).toHaveBeenCalledWith('sel');
    expect(spy).toHaveBeenCalledWith(item);
  });

  it('should call onChange with undefined when onItemSelect receives null', () => {
    const changeFn = vi.fn();
    component.registerOnChange(changeFn);
    component.onItemSelect(null);
    expect(changeFn).toHaveBeenCalledWith(undefined);
  });

  it('should not scroll when hasMoreItems is false', () => {
    component.ngOnInit();
    component.hasMoreItems = false;
    component.searchable = true;
    component.onScrollToEnd();
    // no error thrown
  });

  it('should not scroll when searchable is false', () => {
    component.ngOnInit();
    component.hasMoreItems = true;
    component.searchable = false;
    component.onScrollToEnd();
    // no error thrown
  });

  it('should return col-lg-4 for colClassLabel by default', () => {
    expect(component.colClassLabel).toBe('col-lg-4');
  });

  it('should return col-lg-8 for colClassValue by default', () => {
    expect(component.colClassValue).toBe('col-lg-8');
  });

  it('should return col-lg-12 when singleColumn', () => {
    component.singleColumn = true;
    expect(component.colClassLabel).toBe('col-lg-12');
    expect(component.colClassValue).toBe('col-lg-12');
  });

  it('should use options.Formfield when provided', () => {
    component.options = { Formfield: { colLabel: 5, colValue: 7 } };
    expect(component.colClassLabel).toBe('col-lg-5');
    expect(component.colClassValue).toBe('col-lg-7');
  });

  it('should return true from hasHelpMapper when showHelp and isEdit', () => {
    component.showHelp = true;
    component.showHelpOnlyEdit = true;
    expect(component.hasHelpMapper(true, 'key')).toBe(true);
  });

  it('should return false from hasHelpMapper when showHelp is false', () => {
    component.showHelp = false;
    expect(component.hasHelpMapper(true, 'key')).toBe(false);
  });
});
