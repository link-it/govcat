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
import { Component, HostBinding, HostListener } from '@angular/core';

import { ConfigService } from '@linkit/components';

@Component({
  selector: 'app-simple-layout',
  template: `
    <main id="main-content" tabindex="-1">
        <router-outlet></router-outlet>
    </main>
  `,
  standalone: false
})
export class SimpleLayoutComponent {
  @HostBinding('class.full-content') get fullContentClass(): boolean {
    return this.fullContent;
  }
  @HostBinding('class.page-full-scroll') get pageFullScrollClass(): boolean {
    return (this.fullScroll || !this.desktop) && !this.contentScroll;
  }
  @HostBinding('class.page-content-scroll') get pageContentScrollClass(): boolean {
    return (!this.fullScroll && this.desktop) || this.contentScroll;
  }

  fullContent: boolean = false;
  fullScroll: boolean = true;
  contentScroll: boolean = false;

  desktop: boolean = false;
  tablet: boolean = false;
  mobile: boolean = false;

  config: any = null;

  constructor(
    private configService: ConfigService
  ) {
    this.config = this.configService.getConfiguration();

    this._onResize();
  }

  @HostListener('window:resize')
  _onResize() {
    this.desktop = (window.innerWidth >= 1200);
    this.tablet = (window.innerWidth < 1200 && window.innerWidth >= 768);
    this.mobile = (window.innerWidth < 768);
  }
}
