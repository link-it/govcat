import { Component, Input, Output, EventEmitter } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

import { LnkButtonComponent } from '@app/components/lnk-ui/button/button.component';

@Component({
  selector: 'app-step-completato',
  templateUrl: './step-completato.component.html',
  standalone: true,
  imports: [TranslateModule, LnkButtonComponent]
})
export class StepCompletatoComponent {

  @Input() nome: string = '';

  @Output() vaiAlCatalogo = new EventEmitter<void>();

  onVaiAlCatalogo(): void {
    this.vaiAlCatalogo.emit();
  }
}
