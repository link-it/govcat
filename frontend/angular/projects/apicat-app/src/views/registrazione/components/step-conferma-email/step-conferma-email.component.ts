import { Component, Input, Output, EventEmitter } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

import { LnkButtonComponent } from '@app/components/lnk-ui/button/button.component';

@Component({
  selector: 'app-step-conferma-email',
  templateUrl: './step-conferma-email.component.html',
  standalone: true,
  imports: [TranslateModule, LnkButtonComponent]
})
export class StepConfermaEmailComponent {

  @Input() nome: string = '';
  @Input() cognome: string = '';
  @Input() codiceFiscale: string = '';
  @Input() emailJwt: string = '';

  @Output() conferma = new EventEmitter<void>();
  @Output() modifica = new EventEmitter<void>();

  /**
   * Verifica se l'email JWT è vuota o assente.
   * In caso di autenticazione ARPA, l'email potrebbe non essere fornita.
   */
  get isEmailMissing(): boolean {
    return !this.emailJwt || this.emailJwt.trim() === '';
  }

  onConferma(): void {
    if (!this.isEmailMissing) {
      this.conferma.emit();
    }
  }

  onModifica(): void {
    this.modifica.emit();
  }
}
