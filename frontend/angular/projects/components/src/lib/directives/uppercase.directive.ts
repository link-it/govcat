import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTextUppercase]'
})
export class TextUppercaseDirective {
  preValue: string = "";

  constructor(private elmRef: ElementRef, private renderer: Renderer2) { }

  @HostListener('input', ['$event']) onInput(event: any) {
    const text_upper = event.target.value.toUpperCase();
    if (!this.preValue || (this.preValue && text_upper && this.preValue !== text_upper)) {
      this.preValue = text_upper;
      this.renderer.setProperty(this.elmRef.nativeElement, 'value', text_upper);
      const htmlEvent = new Event('input', {
        "bubbles": false, "cancelable": true
      });
      document.dispatchEvent(htmlEvent);
    }
  };
}
