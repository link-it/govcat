import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarkAsteriskDirective } from './mark-asterisk.directive';
import { ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

describe('MarkAsteriskDirective', () => {
  let directive: MarkAsteriskDirective;
  let element: HTMLSpanElement;

  beforeEach(() => {
    element = document.createElement('span');
    directive = new MarkAsteriskDirective(new ElementRef(element));
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should show asterisk for required control', () => {
    directive.formGroup = new FormGroup({
      name: new FormControl('', Validators.required)
    });
    directive.controlName = 'name';

    directive.ngOnInit();

    expect(element.innerHTML).toBe('*');
  });

  it('should show empty for non-required control', () => {
    directive.formGroup = new FormGroup({
      name: new FormControl('')
    });
    directive.controlName = 'name';

    directive.ngOnInit();

    expect(element.innerHTML).toBe('');
  });

  it('should update when validator is added dynamically', () => {
    const control = new FormControl('');
    directive.formGroup = new FormGroup({ name: control });
    directive.controlName = 'name';

    directive.ngOnInit();
    expect(element.innerHTML).toBe('');

    control.setValidators(Validators.required);
    control.updateValueAndValidity();

    expect(element.innerHTML).toBe('*');
  });

  it('should update when validator is removed dynamically', () => {
    const control = new FormControl('', Validators.required);
    directive.formGroup = new FormGroup({ name: control });
    directive.controlName = 'name';

    directive.ngOnInit();
    expect(element.innerHTML).toBe('*');

    control.clearValidators();
    control.updateValueAndValidity();

    expect(element.innerHTML).toBe('');
  });

  it('should warn when control does not exist', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    directive.formGroup = new FormGroup({});
    directive.controlName = 'nonexistent';

    directive.ngOnInit();

    expect(warnSpy).toHaveBeenCalledWith(
      'FormControl with name nonexistent does not exist in FormGroup'
    );
    warnSpy.mockRestore();
  });

  it('should not throw on ngOnDestroy', () => {
    directive.formGroup = new FormGroup({
      name: new FormControl('', Validators.required)
    });
    directive.controlName = 'name';
    directive.ngOnInit();

    expect(() => directive.ngOnDestroy()).not.toThrow();
  });

  it('should update on value changes', () => {
    const control = new FormControl('', Validators.required);
    directive.formGroup = new FormGroup({ name: control });
    directive.controlName = 'name';

    directive.ngOnInit();
    expect(element.innerHTML).toBe('*');

    control.setValue('new value');
    expect(element.innerHTML).toBe('*');
  });
});
