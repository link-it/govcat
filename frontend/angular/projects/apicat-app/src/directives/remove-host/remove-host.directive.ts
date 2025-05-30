import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[remove-host]',
  standalone: false

})
export class RemoveHostDirective implements OnInit {
  constructor(private elementRef: ElementRef) {
  }

  ngOnInit() {
		var nativeElement: HTMLElement = this.elementRef.nativeElement,
			parentElement: HTMLElement = nativeElement.parentElement as HTMLElement;
		// move all children out of the element
		while (nativeElement.firstChild) {
			parentElement.insertBefore(nativeElement.firstChild, nativeElement);
		}
		// remove the empty element
		parentElement.removeChild(nativeElement);
  }
}
