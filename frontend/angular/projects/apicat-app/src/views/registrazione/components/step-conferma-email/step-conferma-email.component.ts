import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-step-conferma-email',
  templateUrl: './step-conferma-email.component.html',
  standalone: false
})
export class StepConfermaEmailComponent {

  @Input() nome: string = '';
  @Input() cognome: string = '';
  @Input() codiceFiscale: string = '';
  @Input() emailJwt: string = '';

  @Output() conferma = new EventEmitter<void>();
  @Output() modifica = new EventEmitter<void>();

  onConferma(): void {
    this.conferma.emit();
  }

  onModifica(): void {
    this.modifica.emit();
  }
}
