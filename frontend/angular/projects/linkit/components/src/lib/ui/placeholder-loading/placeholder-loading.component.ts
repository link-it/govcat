import { Component, Input, SimpleChanges } from '@angular/core';

@Component({
    selector: 'ui-placeholder-loading',
    styleUrls: ['./placeholder-loading.component.scss'],
    templateUrl: './placeholder-loading.component.html',
    standalone: false
})
export class PlaceholderLoadingComponent {
  @Input() type: string = 'list'; // list - card
  @Input() count: number = 3;
  @Input() col: number = 4;
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() rounded: boolean = false;

  range_arr: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['count']) {
      this.range_arr = Array.from({length: changes['count'].currentValue}, (_, i) => i + 1);
    }
  }
}
