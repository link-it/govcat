import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormControl, FormGroup } from '@angular/forms';
import { SimpleChange } from '@angular/core';
import { LnkFormFieldComponent } from './form-field.component';

describe('LnkFormFieldComponent', () => {
  let component: LnkFormFieldComponent;
  let formGroup: FormGroup;

  beforeEach(() => {
    formGroup = new FormGroup({
      testField: new FormControl('initial'),
    });
    component = new LnkFormFieldComponent();
    component.formGroup = formGroup;
    component.name = 'testField';
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.id).toBe('');
    expect(component.type).toBe('text');
    expect(component.label).toBe('');
    expect(component.isEdit).toBe(false);
    expect(component.clearable).toBe(true);
    expect(component.autocomplete).toBe('off');
    expect(component.rows).toBe(3);
    expect(component.disabled).toBe(false);
    expect(component.inline).toBe(false);
    expect(component.singleColumn).toBe(false);
    expect(component.plainText).toBe(true);
    expect(component.uppercase).toBe(false);
    expect(component.showHelp).toBe(true);
    expect(component.showHelpOnlyEdit).toBe(true);
    expect(component.helpPlacement).toBe('left');
  });

  it('should set id from name on ngOnInit when id is empty', () => {
    component.id = '';
    component.name = 'testField';
    component.ngOnInit();
    expect(component.id).toBe('testField');
  });

  it('should keep explicit id on ngOnInit', () => {
    component.id = 'customId';
    component.ngOnInit();
    expect(component.id).toBe('customId');
  });

  it('should return formControl from formGroup', () => {
    expect(component.formControl).toBe(formGroup.get('testField'));
  });

  it('should return false for hasError when control is untouched', () => {
    expect(component.hasError()).toBeFalsy();
  });

  it('should disable control on init when disabled is true', () => {
    component.disabled = true;
    component.ngOnInit();
    expect(formGroup.get('testField')!.disabled).toBe(true);
  });

  it('should enable control on init when disabled is false', () => {
    formGroup.get('testField')!.disable();
    component.disabled = false;
    component.ngOnInit();
    expect(formGroup.get('testField')!.enabled).toBe(true);
  });

  it('should reflect disabled status on ngOnChanges', () => {
    component.disabled = true;
    component.ngOnChanges({
      disabled: new SimpleChange(false, true, false),
    });
    expect(formGroup.get('testField')!.disabled).toBe(true);
  });

  it('should emit changeEvent on onChange', () => {
    const spy = vi.spyOn(component.changeEvent, 'emit');
    component.onChange({ target: { value: 'new' } });
    expect(spy).toHaveBeenCalledWith({ target: { value: 'new' } });
  });

  it('should return col-lg-4 for colClassLabel by default', () => {
    expect(component.colClassLabel).toBe('col-lg-4');
  });

  it('should return col-lg-8 for colClassValue by default', () => {
    expect(component.colClassValue).toBe('col-lg-8');
  });

  it('should return col-lg-12 for colClassLabel when singleColumn', () => {
    component.singleColumn = true;
    expect(component.colClassLabel).toBe('col-lg-12');
  });

  it('should use options.Formfield.colLabel when options provided', () => {
    component.options = { Formfield: { colLabel: 3, colValue: 9 } };
    expect(component.colClassLabel).toBe('col-lg-3');
    expect(component.colClassValue).toBe('col-lg-9');
  });

  it('should return true from hasHelpMapper when showHelp and isEdit', () => {
    component.showHelp = true;
    component.showHelpOnlyEdit = true;
    expect(component.hasHelpMapper(true, 'key')).toBe(true);
  });

  it('should return false from hasHelpMapper when showHelp and showHelpOnlyEdit but not isEdit', () => {
    component.showHelp = true;
    component.showHelpOnlyEdit = true;
    expect(component.hasHelpMapper(false, 'key')).toBe(false);
  });

  it('should return true from hasHelpMapper when showHelp and not showHelpOnlyEdit', () => {
    component.showHelp = true;
    component.showHelpOnlyEdit = false;
    expect(component.hasHelpMapper(false, 'key')).toBe(true);
  });

  it('should return false from hasHelpMapper when showHelp is false', () => {
    component.showHelp = false;
    expect(component.hasHelpMapper(true, 'key')).toBe(false);
  });
});
