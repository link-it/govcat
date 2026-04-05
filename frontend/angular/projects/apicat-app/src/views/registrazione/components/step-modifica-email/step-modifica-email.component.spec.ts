import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { StepModificaEmailComponent } from './step-modifica-email.component';

describe('StepModificaEmailComponent', () => {
  let component: StepModificaEmailComponent;

  beforeEach(() => {
    component = new StepModificaEmailComponent(new FormBuilder());
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default emailCorrente', () => {
    expect(component.emailCorrente).toBe('');
  });

  it('should initialize form on ngOnInit', () => {
    component.ngOnInit();
    expect(component.form.contains('email')).toBe(true);
    expect(component.form.contains('confermaEmail')).toBe(true);
  });

  it('should return emailControl', () => {
    component.ngOnInit();
    expect(component.emailControl).toBe(component.form.get('email'));
  });

  it('should return confermaEmailControl', () => {
    component.ngOnInit();
    expect(component.confermaEmailControl).toBe(component.form.get('confermaEmail'));
  });

  it('should validate email match', () => {
    component.ngOnInit();
    component.form.patchValue({ email: 'a@b.it', confermaEmail: 'c@d.it' });
    expect(component.form.hasError('emailMismatch')).toBe(true);
  });

  it('should pass validation when emails match', () => {
    component.ngOnInit();
    component.form.patchValue({ email: 'a@b.it', confermaEmail: 'a@b.it' });
    expect(component.form.hasError('emailMismatch')).toBe(false);
  });

  it('should emit inviaEmail when form valid', () => {
    component.ngOnInit();
    const spy = vi.spyOn(component.inviaEmail, 'emit');
    component.form.patchValue({ email: 'test@test.it', confermaEmail: 'test@test.it' });
    component.onInvia();
    expect(spy).toHaveBeenCalledWith('test@test.it');
  });

  it('should not emit inviaEmail when form invalid', () => {
    component.ngOnInit();
    const spy = vi.spyOn(component.inviaEmail, 'emit');
    component.form.patchValue({ email: '', confermaEmail: '' });
    component.onInvia();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit annulla', () => {
    const spy = vi.spyOn(component.annulla, 'emit');
    component.onAnnulla();
    expect(spy).toHaveBeenCalled();
  });
});
