/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';

import { BsModalRef } from 'ngx-bootstrap/modal';

import { ProfileEmailVerificationService } from '@app/services/profile-email-verification.service';

export interface EmailVerificationDialogResult {
  verified: boolean;
  verifiedEmail?: string;
  fieldName?: 'email' | 'email_aziendale';
  clearEmail?: boolean; // true se l'utente vuole rimuovere l'email (solo per campo 'email')
}

@Component({
  selector: 'app-email-verification-dialog',
  templateUrl: './email-verification-dialog.component.html',
  styleUrls: ['./email-verification-dialog.component.scss'],
  standalone: false
})
export class EmailVerificationDialogComponent implements OnInit, OnDestroy {

  // Input data (set by BsModalService.show initialState)
  currentEmail: string = '';
  fieldName: 'email' | 'email_aziendale' = 'email';
  fieldLabel: string = '';

  // State
  step: 'send' | 'verify' = 'send';
  form!: FormGroup;
  loading: boolean = false;
  error: string = '';

  // Countdown
  countdown$: Observable<number>;
  countdownFormatted: string = '00:00';
  isExpired: boolean = false;

  // Tentativi rimanenti
  tentativiRimanenti$: Observable<number | null>;
  tentativiRimanenti: number | null = null;

  // Result
  result: EmailVerificationDialogResult = { verified: false };

  private subscriptions: Subscription[] = [];

  constructor(
    public bsModalRef: BsModalRef,
    private fb: FormBuilder,
    private verificationService: ProfileEmailVerificationService
  ) {
    this.countdown$ = this.verificationService.countdown$;
    this.tentativiRimanenti$ = this.verificationService.tentativiRimanenti$;
  }

  ngOnInit(): void {
    // Per 'email' (personale) il campo non è obbligatorio (può essere rimosso)
    // Per 'email_aziendale' il campo è obbligatorio
    const emailValidators = this.fieldName === 'email_aziendale'
      ? [Validators.required, Validators.email]
      : [Validators.email]; // Solo validazione formato, non required

    this.form = this.fb.group({
      newEmail: ['', emailValidators],
      codice: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    // Sottoscrivi al countdown
    const countdownSub = this.countdown$.subscribe(seconds => {
      this.countdownFormatted = this.verificationService.formatCountdown(seconds);
      this.isExpired = seconds <= 0;
    });
    this.subscriptions.push(countdownSub);

    // Sottoscrivi ai tentativi rimanenti
    const tentativiSub = this.tentativiRimanenti$.subscribe(tentativi => {
      this.tentativiRimanenti = tentativi;
    });
    this.subscriptions.push(tentativiSub);

    // Reset dello stato del servizio
    this.verificationService.resetState();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.verificationService.resetState();
  }

  onSendCode(): void {
    const newEmailValue = this.form.get('newEmail')?.value?.trim() || '';

    // Se email vuota e campo è 'email' (personale), rimuovi senza verifica
    if (!newEmailValue && this.fieldName === 'email') {
      this.onClearEmail();
      return;
    }

    // Altrimenti richiedi verifica OTP
    if (!newEmailValue || this.form.get('newEmail')?.invalid) return;

    this.loading = true;
    this.error = '';

    this.verificationService.inviaCodice(this.fieldName, newEmailValue).subscribe({
      next: (response) => {
        this.loading = false;
        this.step = 'verify';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message;
      }
    });
  }

  /**
   * Rimuove l'email personale senza verifica OTP
   * (solo per campo 'email', non per 'email_aziendale')
   */
  onClearEmail(): void {
    this.result = { verified: false, clearEmail: true, fieldName: this.fieldName };
    this.bsModalRef.hide();
  }

  onVerify(): void {
    if (this.form.get('codice')?.invalid) return;

    const codice = this.form.get('codice')?.value?.toUpperCase();
    const newEmailValue = this.form.get('newEmail')?.value;
    this.loading = true;
    this.error = '';

    this.verificationService.verificaCodice(codice).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.esito) {
          this.result = { verified: true, verifiedEmail: newEmailValue, fieldName: this.fieldName };
          this.bsModalRef.hide();
        } else {
          this.error = response.messaggio || 'APP.PROFILE.EMAIL_VERIFICATION.ERROR.InvalidCode';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message;
      }
    });
  }

  onResend(): void {
    this.form.reset();
    this.error = '';
    this.onSendCode();
  }

  onCancel(): void {
    this.result = { verified: false };
    this.bsModalRef.hide();
  }

  get codiceControl() {
    return this.form.get('codice');
  }

  get newEmailControl() {
    return this.form.get('newEmail');
  }

  // L'email personale può essere rimossa (campo non obbligatorio)
  get canClearEmail(): boolean {
    return this.fieldName === 'email';
  }

  // Verifica se il campo newEmail è vuoto
  get isNewEmailEmpty(): boolean {
    const value = this.form.get('newEmail')?.value?.trim() || '';
    return value === '';
  }

  // Gestione input: trasforma in uppercase e permette solo alfanumerici
  onCodiceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    input.value = value;
    this.form.get('codice')?.setValue(value, { emitEvent: false });
  }
}
