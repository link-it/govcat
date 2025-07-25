import { Component, Input } from '@angular/core';
import { Subscription } from 'rxjs';

import { Tools } from '../../services';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'ui-box-spinner',
    template: `
    <div class="d-flex flex-column text-center">
      <div class="max-w-100 m-auto">
        <div class="mx-auto my-0 p-3 position-relative">
          <div class="spinner-border text-{{ color }}" [style.width.px]="diameter" [style.height.px]="diameter" [style.border-width.px]="strokeWidth" role="status"></div>
          <!-- <span class="rescue-spinner">
            <button type="button" (click)="_rescueCall()">
              <span classs="material-icons">close</span>
            </button>
          </span> -->
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
  `],
  standalone: false
})
export class BoxSpinnerComponent {
  @Input() color = 'accent';
  @Input() diameter = 36;
  @Input() strokeWidth = 4;

  _rescueCall() {
    if (Tools.EmergencyCall && Tools.EmergencyCall.length !== 0) {
      Tools.EmergencyCall.forEach((ec: Subscription) => ec.unsubscribe());
      Tools.EmergencyCall = [];
    }
    Tools.WaitForResponse(false, true);
  }
}
