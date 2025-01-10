import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // tslint:disable-next-line:component-selector
  selector: 'ui-box-message',
  styleUrls: ['./box-message.component.scss'],
  templateUrl: './box-message.component.html',
})
export class BoxMessageComponent {
  @Input() icon = 'warning';
  @Input() image = '';
  @Input() message = 'Nessun elemento';
  @Input() subMessage = '';

  sizePx = '24px';
  /** The size in pixel for font, height and width */
  @Input() set size(v: number) {
    if (v) {
      this.sizePx = v + 'px';
    }
  }
}
