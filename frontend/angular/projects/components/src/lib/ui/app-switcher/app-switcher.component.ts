import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-app-switcher-message',
  styleUrls: ['./app-switcher.component.scss'],
  templateUrl: './app-switcher.component.html',
})
export class AppSwitcherComponent {
  @Input() applications = [];
  @Input() others = [];

  constructor() {
  }
}
