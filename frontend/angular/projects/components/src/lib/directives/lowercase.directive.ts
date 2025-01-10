import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTextLowercase]'
})
export class TextLowercaseDirective {
  preValue: string = "";

  constructor(private elmRef: ElementRef, private renderer: Renderer2) { }

  @HostListener('input', ['$event']) onInput(event: any) {
    const text_lower = event.target.value.toLowerCase();
    if (!this.preValue || (this.preValue && text_lower && this.preValue !== text_lower)) {
      this.preValue = text_lower;
      this.renderer.setProperty(this.elmRef.nativeElement, 'value', text_lower);
      const htmlEvent = new Event('input', {
        "bubbles": false, "cancelable": true
      });
      document.dispatchEvent(htmlEvent);
    }
  };
}
