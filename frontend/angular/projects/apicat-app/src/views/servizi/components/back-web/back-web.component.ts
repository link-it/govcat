import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-web',
  templateUrl: './back-web.component.html',
  styleUrls: ['./back-web.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class BackWebComponent {

  @Input() service_id: string | null = null;

  constructor(private router: Router) { }

  backPresentationView() {
    const url = `/servizi/${this.service_id}/view`;
    this.router.navigate([url]);
  }
}
