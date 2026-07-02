import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { LnkButtonComponent } from '@app/components/lnk-ui/button/button.component';
import { ItemOrganizzazione } from '@app/model/itemOrganizzazione';

@Component({
  selector: 'app-step-completato',
  templateUrl: './step-completato.component.html',
  standalone: true,
  imports: [CommonModule, TranslateModule, LnkButtonComponent]
})
export class StepCompletatoComponent {

  @Input() nome: string = '';
  /**
   * Issue 229 — se l'utente ha richiesto l'associazione a
   * un'organizzazione durante il wizard, mostriamo un banner
   * "in attesa di approvazione" prima del messaggio standard.
   */
  @Input() organizzazioneRichiesta: ItemOrganizzazione | null = null;

  @Output() vaiAlCatalogo = new EventEmitter<void>();

  onVaiAlCatalogo(): void {
    this.vaiAlCatalogo.emit();
  }
}
