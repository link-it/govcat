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
import { OnInit, Directive, Input, ViewContainerRef, TemplateRef, OnChanges } from '@angular/core';

import { AuthenticationService } from '@app/services/authentication.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: false
})
export class HasPermissionDirective implements OnInit, OnChanges {

  @Input() appHasPermission: string = '';
  @Input() action: string = 'view';
  @Input() behaviour: 'hide' | 'show' = 'hide';

  isVisible = false;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private templateRef: TemplateRef<any>,
    private authenticationService: AuthenticationService,
  ) { }

  ngOnInit() {
    // this.applyStrategy();
  }

  ngOnChanges(changes: any) {
    this.applyStrategy();
  }

  private applyStrategy() {
    const hasPermission = this.authenticationService.hasPermission(this.appHasPermission, this.action);
    if (this.behaviour === 'hide') {
      if (hasPermission) {
        if (!this.isVisible) {
          this.isVisible = true;
          this.viewContainerRef.createEmbeddedView(this.templateRef);
        }
      } else {
        this.isVisible = false;
        this.viewContainerRef.clear();
      }
    } else {
      if (hasPermission) {
        this.isVisible = false;
        this.viewContainerRef.clear();
      } else {
        if (!this.isVisible) {
          this.isVisible = true;
          this.viewContainerRef.createEmbeddedView(this.templateRef);
        }
      }
    }
  }
}
