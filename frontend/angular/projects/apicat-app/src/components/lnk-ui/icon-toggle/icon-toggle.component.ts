import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'lnk-icon-toggle',
  templateUrl: './icon-toggle.component.html',
  styleUrls: ['./icon-toggle.component.scss']
})
export class LnkIconToggleComponent implements OnInit, OnChanges {

  @Input() value: number = 2; // 0 = unchecked, 1 = checked, 2 = Indeterminate
  @Input() iconChecked: string = 'bi bi-check-circle text-success';
  @Input() iconUnchecked: string = 'bi bi-x-circle text-danger';
  @Input() iconIndeterminate: string = 'bi bi-dash-circle text-black-50';
  @Input() tooltipChecked: string = 'APP.TOOLTIP.Completed';
  @Input() tooltipUnchecked: string = 'APP.TOOLTIP.ToBeComplete';
  @Input() tooltipIndeterminate: string = 'APP.TOOLTIP.Indeterminate';
  @Input() loading: boolean = false;
  @Input() hide: boolean = false;

  iconClass: string = '';
  tooltip: string = '';

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value) {
      switch (changes.value.currentValue) {
        case 0:
          this.iconClass = this.iconUnchecked;
          this.tooltip = this.tooltipUnchecked;
          break;
        case 1:
          this.iconClass = this.iconChecked;
          this.tooltip = this.tooltipChecked;
          break;
        default:
          this.iconClass = this.iconIndeterminate;
          this.tooltip = this.tooltipIndeterminate;
          break;
      }
    }
  }

}
