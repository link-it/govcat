import { ChangeDetectionStrategy, Component, Input, SimpleChanges } from '@angular/core';

import _ from 'lodash';

@Component({
  selector: 'ui-placeholder-loading',
  styleUrls: ['./placeholder-loading.component.scss'],
  templateUrl: './placeholder-loading.component.html',
})
export class PlaceholderLoadingComponent {
  @Input() type: string = 'list'; // list - card
  @Input() count: number = 3;
  @Input() col: number = 4;
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() rounded: boolean = false;
  
  range_arr: number[] = [];

  constructor(
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.count) {
      this.range_arr = _.range(1, changes.count.currentValue + 1);
    }
  }
}
