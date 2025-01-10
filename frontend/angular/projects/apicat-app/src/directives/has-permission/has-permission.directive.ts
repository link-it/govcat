import { OnInit, Directive, Input, ViewContainerRef, TemplateRef, OnChanges } from '@angular/core';

import { AuthenticationService } from '@app/services/authentication.service';

@Directive({
  selector: '[appHasPermission]'
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
