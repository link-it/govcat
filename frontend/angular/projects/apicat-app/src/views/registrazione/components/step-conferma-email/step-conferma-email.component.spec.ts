import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StepConfermaEmailComponent } from './step-conferma-email.component';

describe('StepConfermaEmailComponent', () => {
  let component: StepConfermaEmailComponent;

  beforeEach(() => {
    component = new StepConfermaEmailComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.nome).toBe('');
    expect(component.cognome).toBe('');
    expect(component.codiceFiscale).toBe('');
    expect(component.emailJwt).toBe('');
  });

  it('should return isEmailMissing true when email empty', () => {
    component.emailJwt = '';
    expect(component.isEmailMissing).toBe(true);
  });

  it('should return isEmailMissing true when email is spaces', () => {
    component.emailJwt = '   ';
    expect(component.isEmailMissing).toBe(true);
  });

  it('should return isEmailMissing false when email present', () => {
    component.emailJwt = 'test@test.it';
    expect(component.isEmailMissing).toBe(false);
  });

  it('should emit conferma when email present', () => {
    const spy = vi.spyOn(component.conferma, 'emit');
    component.emailJwt = 'test@test.it';
    component.onConferma();
    expect(spy).toHaveBeenCalled();
  });

  it('should not emit conferma when email missing', () => {
    const spy = vi.spyOn(component.conferma, 'emit');
    component.emailJwt = '';
    component.onConferma();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit modifica', () => {
    const spy = vi.spyOn(component.modifica, 'emit');
    component.onModifica();
    expect(spy).toHaveBeenCalled();
  });
});
