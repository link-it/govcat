import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-step-completato',
  templateUrl: './step-completato.component.html',
  standalone: false
})
export class StepCompletatoComponent {

  @Input() nome: string = '';

  @Output() vaiAlCatalogo = new EventEmitter<void>();

  onVaiAlCatalogo(): void {
    this.vaiAlCatalogo.emit();
  }
}
