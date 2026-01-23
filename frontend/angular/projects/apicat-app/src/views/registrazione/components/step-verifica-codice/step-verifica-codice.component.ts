import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';

import { RegistrazioneService } from '@app/services/registrazione.service';

@Component({
  selector: 'app-step-verifica-codice',
  templateUrl: './step-verifica-codice.component.html',
  standalone: false
})
export class StepVerificaCodiceComponent implements OnInit, OnDestroy {

  @Input() email: string = '';

  @Output() verificaCodice = new EventEmitter<string>();
  @Output() reinviaCodice = new EventEmitter<void>();
  @Output() cambiaEmail = new EventEmitter<void>();

  form!: FormGroup;
  countdown$: Observable<number>;
  countdownFormatted: string = '00:00';
  isExpired: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private registrazioneService: RegistrazioneService
  ) {
    this.countdown$ = this.registrazioneService.countdown$;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      codice: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    // Sottoscrivi al countdown
    const sub = this.countdown$.subscribe(seconds => {
      this.countdownFormatted = this.registrazioneService.formatCountdown(seconds);
      this.isExpired = seconds <= 0;
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onVerifica(): void {
    if (this.form.valid) {
      const codice = this.form.get('codice')?.value?.toUpperCase();
      this.verificaCodice.emit(codice);
    }
  }

  onReinvia(): void {
    this.form.reset();
    this.reinviaCodice.emit();
  }

  onCambiaEmail(): void {
    this.cambiaEmail.emit();
  }

  get codiceControl() {
    return this.form.get('codice');
  }

  // Gestione input: trasforma in uppercase e permette solo alfanumerici
  onCodiceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    input.value = value;
    this.form.get('codice')?.setValue(value, { emitEvent: false });
  }
}
