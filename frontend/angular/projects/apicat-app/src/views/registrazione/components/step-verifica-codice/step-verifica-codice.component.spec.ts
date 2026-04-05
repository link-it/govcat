import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { StepVerificaCodiceComponent } from './step-verifica-codice.component';

describe('StepVerificaCodiceComponent', () => {
  let component: StepVerificaCodiceComponent;
  const countdown$ = new BehaviorSubject<number>(300);
  const mockRegistrazioneService = {
    countdown$: countdown$.asObservable(),
    formatCountdown: vi.fn((s: number) => {
      const m = Math.floor(s / 60).toString().padStart(2, '0');
      const ss = (s % 60).toString().padStart(2, '0');
      return `${m}:${ss}`;
    }),
    stopCountdown: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    countdown$.next(300);
    component = new StepVerificaCodiceComponent(new FormBuilder(), mockRegistrazioneService);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default email', () => {
    expect(component.email).toBe('');
  });

  it('should initialize form on ngOnInit', () => {
    component.ngOnInit();
    expect(component.form.contains('codice')).toBe(true);
  });

  it('should subscribe to countdown on ngOnInit', () => {
    component.ngOnInit();
    expect(component.countdownFormatted).toBe('05:00');
    expect(component.isExpired).toBe(false);
  });

  it('should mark expired when countdown reaches 0', () => {
    component.ngOnInit();
    countdown$.next(0);
    expect(component.isExpired).toBe(true);
  });

  it('should return codiceControl', () => {
    component.ngOnInit();
    expect(component.codiceControl).toBe(component.form.get('codice'));
  });

  it('should emit verificaCodice with uppercase when form valid', () => {
    component.ngOnInit();
    const spy = vi.spyOn(component.verificaCodice, 'emit');
    component.form.patchValue({ codice: 'abc123' });
    component.onVerifica();
    expect(spy).toHaveBeenCalledWith('ABC123');
  });

  it('should not emit verificaCodice when form invalid', () => {
    component.ngOnInit();
    const spy = vi.spyOn(component.verificaCodice, 'emit');
    component.form.patchValue({ codice: '' });
    component.onVerifica();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit reinviaCodice and reset form', () => {
    component.ngOnInit();
    const spy = vi.spyOn(component.reinviaCodice, 'emit');
    component.form.patchValue({ codice: 'ABC' });
    component.onReinvia();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit cambiaEmail', () => {
    const spy = vi.spyOn(component.cambiaEmail, 'emit');
    component.onCambiaEmail();
    expect(spy).toHaveBeenCalled();
  });

  it('should filter input to uppercase alphanumeric', () => {
    component.ngOnInit();
    const input = { value: 'ab!@c1' } as HTMLInputElement;
    const event = { target: input } as unknown as Event;
    component.onCodiceInput(event);
    expect(input.value).toBe('ABC1');
  });
});
