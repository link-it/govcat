import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { EmailVerificationDialogComponent } from './email-verification-dialog.component';

describe('EmailVerificationDialogComponent', () => {
  let component: EmailVerificationDialogComponent;
  const mockModalRef = { hide: vi.fn() } as any;
  const countdown$ = new BehaviorSubject<number>(300);
  const tentativiRimanenti$ = new BehaviorSubject<number | null>(3);
  const mockVerificationService = {
    countdown$: countdown$.asObservable(),
    tentativiRimanenti$: tentativiRimanenti$.asObservable(),
    formatCountdown: vi.fn((s: number) => {
      const m = Math.floor(s / 60).toString().padStart(2, '0');
      const ss = (s % 60).toString().padStart(2, '0');
      return `${m}:${ss}`;
    }),
    resetState: vi.fn(),
    inviaCodice: vi.fn().mockReturnValue(of({})),
    verificaCodice: vi.fn().mockReturnValue(of({ esito: true })),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    countdown$.next(300);
    tentativiRimanenti$.next(3);
    component = new EmailVerificationDialogComponent(
      mockModalRef, new FormBuilder(), mockVerificationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.currentEmail).toBe('');
    expect(component.fieldName).toBe('email');
    expect(component.step).toBe('send');
    expect(component.loading).toBe(false);
  });

  it('should initialize form on ngOnInit', () => {
    component.ngOnInit();
    expect(component.form.contains('newEmail')).toBe(true);
    expect(component.form.contains('codice')).toBe(true);
  });

  it('should make newEmail required for email_aziendale', () => {
    component.fieldName = 'email_aziendale';
    component.ngOnInit();
    component.form.patchValue({ newEmail: '' });
    component.form.get('newEmail')!.markAsTouched();
    expect(component.form.get('newEmail')!.hasError('required')).toBe(true);
  });

  it('should not make newEmail required for email', () => {
    component.fieldName = 'email';
    component.ngOnInit();
    component.form.patchValue({ newEmail: '' });
    component.form.get('newEmail')!.markAsTouched();
    expect(component.form.get('newEmail')!.hasError('required')).toBe(false);
  });

  it('should subscribe to countdown', () => {
    component.ngOnInit();
    expect(component.countdownFormatted).toBe('05:00');
    expect(component.isExpired).toBe(false);
  });

  it('should subscribe to tentativi rimanenti', () => {
    component.ngOnInit();
    expect(component.tentativiRimanenti).toBe(3);
  });

  it('should reset service state on init', () => {
    component.ngOnInit();
    expect(mockVerificationService.resetState).toHaveBeenCalled();
  });

  it('should return canClearEmail true for email field', () => {
    component.fieldName = 'email';
    expect(component.canClearEmail).toBe(true);
  });

  it('should return canClearEmail false for email_aziendale', () => {
    component.fieldName = 'email_aziendale';
    expect(component.canClearEmail).toBe(false);
  });

  it('should clear email and hide modal on onClearEmail', () => {
    component.onClearEmail();
    expect(component.result.clearEmail).toBe(true);
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  it('should cancel and hide modal', () => {
    component.onCancel();
    expect(component.result.verified).toBe(false);
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  it('should send code and go to verify step', () => {
    component.ngOnInit();
    component.form.patchValue({ newEmail: 'new@test.it' });
    component.onSendCode();
    expect(mockVerificationService.inviaCodice).toHaveBeenCalledWith('email', 'new@test.it');
    expect(component.step).toBe('verify');
  });

  it('should call onClearEmail when email empty for personal field', () => {
    component.fieldName = 'email';
    component.ngOnInit();
    component.form.patchValue({ newEmail: '' });
    component.onSendCode();
    expect(component.result.clearEmail).toBe(true);
  });

  it('should return codiceControl and newEmailControl', () => {
    component.ngOnInit();
    expect(component.codiceControl).toBe(component.form.get('codice'));
    expect(component.newEmailControl).toBe(component.form.get('newEmail'));
  });

  it('should clean up on destroy', () => {
    component.ngOnInit();
    expect(() => component.ngOnDestroy()).not.toThrow();
    expect(mockVerificationService.resetState).toHaveBeenCalledTimes(2);
  });
});
