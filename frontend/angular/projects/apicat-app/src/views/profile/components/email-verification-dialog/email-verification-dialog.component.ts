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
  newEmail: string = '';

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
    this.form = this.fb.group({
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
    this.loading = true;
    this.error = '';

    this.verificationService.inviaCodice(this.newEmail).subscribe({
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

  onVerify(): void {
    if (this.form.invalid) return;

    const codice = this.form.get('codice')?.value?.toUpperCase();
    this.loading = true;
    this.error = '';

    this.verificationService.verificaCodice(codice).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.esito) {
          this.result = { verified: true, verifiedEmail: this.newEmail };
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

  // Gestione input: trasforma in uppercase e permette solo alfanumerici
  onCodiceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    input.value = value;
    this.form.get('codice')?.setValue(value, { emitEvent: false });
  }
}
