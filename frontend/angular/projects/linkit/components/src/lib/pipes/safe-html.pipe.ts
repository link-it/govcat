import { DomSanitizer } from '@angular/platform-browser';
import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ 
  name: 'safeHtml',
  standalone: false
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitized: DomSanitizer) { }
  transform(value: string) {
    return this.sanitized.bypassSecurityTrustHtml(value);
  }
}
