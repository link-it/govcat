import { Component, HostBinding, HostListener } from '@angular/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';

@Component({
  selector: 'app-simple-layout',
  template: '<router-outlet></router-outlet>',
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
