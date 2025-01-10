import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // tslint:disable-next-line:component-selector
  selector: 'ui-box-spinner',
  template: `
    <div class="d-flex flex-column text-center mt-3">
      <div class="max-w-100 m-auto">
        <div class="mx-auto my-0 p-3 position-relative">
          <div class="spinner-border text-{{ color }}" role="status"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rescue-spinner {
      position: absolute;
      top: calc(50% - 20px);
      left: calc(50% - 20px);
      width: 40px;
      height: 40px;

      .mat-icon {
        vertical-align: inherit;
      }
    }

    .rescue-spinner button {
      display: none;
      color: #212121;
    }

    .rescue-spinner:hover button {
      display: block;
    }
  `]
})
export class BoxSpinnerComponent implements OnInit {
  @Input() color = 'accent';
  @Input() diameter = 36;
  @Input() strokeWidth = 4;

  constructor() { }

  ngOnInit() {
  }
}
