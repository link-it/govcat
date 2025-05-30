import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { Tools } from '../services';

@Component({
    selector: 'app-spinner',
    templateUrl: './spinner.component.html',
    styleUrls: ['./spinner.component.scss'],
    standalone: false
})
export class SpinnerComponent {
  _rescueCall() {
    if (Tools.EmergencyCall && Tools.EmergencyCall.length !== 0) {
      Tools.EmergencyCall.forEach((ec: Subscription) => ec.unsubscribe());
      Tools.EmergencyCall = [];
    }
    Tools.WaitForResponse(false, true);
  }
}
