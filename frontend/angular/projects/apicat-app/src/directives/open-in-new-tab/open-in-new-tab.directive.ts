import { Directive, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  selector: '[appOpenInNewTab]',
  standalone: false
})
export class OpenInNewTabDirective {
  @Input() appOpenInNewTab: any[] = [];
  @Input() queryParams?: any;
  @Input() fragment?: string;
  @Input() openInNewTabAlways = false; // Sempre in nuovo tab
  @Input() preventNormalNavigation = false; // Blocca navigazione normale

  constructor(private router: Router) {}

  @HostListener('click', ['$event'])
  @HostListener('auxclick', ['$event'])
  onClick(event: MouseEvent): void {
    const shouldOpenInNewTab = 
      this.openInNewTabAlways || 
      event.ctrlKey || 
      event.metaKey || 
      event.button === 1;

    if (shouldOpenInNewTab) {
      event.preventDefault();
      event.stopPropagation();
      
      const urlTree = this.router.createUrlTree(
        this.appOpenInNewTab,
        { queryParams: this.queryParams, fragment: this.fragment }
      );
      
      window.open(this.router.serializeUrl(urlTree), '_blank');
    } else if (this.preventNormalNavigation) {
      event.preventDefault();
    }
  }
}
