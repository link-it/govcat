import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleChange } from '@angular/core';
import { LnkIconToggleComponent } from './icon-toggle.component';

describe('LnkIconToggleComponent', () => {
  let component: LnkIconToggleComponent;

  beforeEach(() => {
    component = new LnkIconToggleComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default value 2 (indeterminate)', () => {
    expect(component.value).toBe(2);
  });

  it('should set checked icon when value is 1', () => {
    component.ngOnChanges({ value: new SimpleChange(undefined, 1, true) });
    expect(component.iconClass).toBe(component.iconChecked);
    expect(component.tooltip).toBe(component.tooltipChecked);
  });

  it('should set unchecked icon when value is 0', () => {
    component.ngOnChanges({ value: new SimpleChange(undefined, 0, true) });
    expect(component.iconClass).toBe(component.iconUnchecked);
    expect(component.tooltip).toBe(component.tooltipUnchecked);
  });

  it('should set indeterminate icon for default value', () => {
    component.ngOnChanges({ value: new SimpleChange(undefined, 2, true) });
    expect(component.iconClass).toBe(component.iconIndeterminate);
    expect(component.tooltip).toBe(component.tooltipIndeterminate);
  });
});
