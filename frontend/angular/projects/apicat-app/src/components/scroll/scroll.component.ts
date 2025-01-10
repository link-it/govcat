import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-scroll',
  templateUrl: './scroll.component.html',
  styleUrls: ['./scroll.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrollComponent {

  @Output() scrollToTop = new EventEmitter<void>();

  constructor() { }

  onScrollToTop(): void {
    this.scrollToTop.emit();
  }

}
