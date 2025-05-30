import { Directive, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

@Directive({
    selector: '[setBackgroundImage]',
    standalone: false
})
export class SetBackgroundImageDirective implements OnInit, OnChanges {

  @Input() imageUrl!: string | SafeUrl;
  @Input() position: string = 'contain';

  constructor(private elementRef:ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.renderer.setStyle(this.elementRef.nativeElement, 'backgroundImage', `url(${this.imageUrl})`);
    this.renderer.setStyle(this.elementRef.nativeElement, 'background-size', this.position);
    this.renderer.setStyle(this.elementRef.nativeElement, 'background-position', 'center');
    this.renderer.setStyle(this.elementRef.nativeElement, 'background-repeat', 'no-repeat');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']?.currentValue && !changes['imageUrl']?.firstChange) {
      this.imageUrl = changes['imageUrl'].currentValue['changingThisBreaksApplicationSecurity'] || changes['imageUrl'].currentValue;
      this.renderer.setStyle(this.elementRef.nativeElement, 'backgroundImage', `url(${this.imageUrl})`);
    }
  }
}
