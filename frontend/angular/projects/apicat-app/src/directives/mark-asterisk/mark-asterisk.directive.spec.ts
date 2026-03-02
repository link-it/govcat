import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarkAsteriskDirective } from './mark-asterisk.directive';
import { ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

describe('MarkAsteriskDirective', () => {
  let directive: MarkAsteriskDirective;
  let nativeElement: HTMLSpanElement;

  beforeEach(() => {
    nativeElement = document.createElement('span');
    directive = new MarkAsteriskDirective(new ElementRef(nativeElement));
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  it('should show asterisk for required fields', () => {
    directive.formGroup = new FormGroup({
      nome: new FormControl('', Validators.required)
    });
    directive.controlName = 'nome';

    directive.ngOnInit();

    expect(nativeElement.innerHTML).toBe('*');
  });

  it('should show empty string for non-required fields', () => {
    directive.formGroup = new FormGroup({
      desc: new FormControl('')
    });
    directive.controlName = 'desc';

    directive.ngOnInit();

    expect(nativeElement.innerHTML).toBe('');
  });

  it('should show (optional) for non-required when useOptional=true', () => {
    directive.formGroup = new FormGroup({
      desc: new FormControl('')
    });
    directive.controlName = 'desc';
    directive.useOptional = true;

    directive.ngOnInit();

    expect(nativeElement.innerHTML).toBe('(optional)');
  });

  it('should show empty for required when useOptional=true', () => {
    directive.formGroup = new FormGroup({
      nome: new FormControl('', Validators.required)
    });
    directive.controlName = 'nome';
    directive.useOptional = true;

    directive.ngOnInit();

    expect(nativeElement.innerHTML).toBe('');
  });

  it('should update when validators change dynamically', () => {
    const ctrl = new FormControl('');
    directive.formGroup = new FormGroup({ campo: ctrl });
    directive.controlName = 'campo';

    directive.ngOnInit();
    expect(nativeElement.innerHTML).toBe('');

    ctrl.setValidators(Validators.required);
    ctrl.updateValueAndValidity();

    expect(nativeElement.innerHTML).toBe('*');
  });

  it('should handle missing control name gracefully', () => {
    directive.formGroup = new FormGroup({ nome: new FormControl('') });
    directive.controlName = 'nonExistent';

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    directive.ngOnInit();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should cleanup subscriptions on destroy', () => {
    directive.formGroup = new FormGroup({
      nome: new FormControl('', Validators.required)
    });
    directive.controlName = 'nome';
    directive.ngOnInit();

    expect(() => directive.ngOnDestroy()).not.toThrow();
  });
});
