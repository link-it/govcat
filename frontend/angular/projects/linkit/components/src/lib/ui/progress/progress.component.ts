import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-progress',
    templateUrl: './progress.component.html',
    standalone: false
})
export class ProgressComponent {
  @Input() progress = 0;
}
