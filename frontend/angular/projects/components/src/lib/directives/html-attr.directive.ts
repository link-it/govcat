import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { Input, Output } from '@angular/core';

@Directive({
  selector: '[appHtmlAttr]'
})
export class HtmlAttributesDirective implements OnInit {
  @Input() appHtmlAttr!: { [key: string]: string } | undefined;

  constructor(
    private renderer: Renderer2,
    private el: ElementRef
  ) { }

  ngOnInit() {
    const attribs = this.appHtmlAttr;
    for (const attr in attribs) {
      if (attr === 'style' && typeof (attribs[attr]) === 'object') {
        this.setStyle(attribs[attr]);
      } else if (attr === 'class') {
        this.addClass(attribs[attr]);
      } else {
        this.setAttrib(attr, attribs[attr]);
      }
    }
  }

  private setStyle(styles: any) {
    for (const style in styles) {
      this.renderer.setStyle(this.el.nativeElement, style, styles[style]);
    }
  }

  private addClass(classes: any) {
    const classArray = (Array.isArray(classes) ? classes : classes.split(' '));
    classArray.filter((element: any) => element.length > 0).forEach((element: any) => {
      this.renderer.addClass(this.el.nativeElement, element);
    });
  }

  private setAttrib(key: string, value: string) {
    value !== null ?
      this.renderer.setAttribute(this.el.nativeElement, key, value) :
      this.renderer.removeAttribute(this.el.nativeElement, key);
  }
}
