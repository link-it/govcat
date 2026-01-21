/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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
