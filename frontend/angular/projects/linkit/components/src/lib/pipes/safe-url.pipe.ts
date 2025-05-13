import { DomSanitizer } from '@angular/platform-browser';
import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ 
  name: 'safeUrl', 
  standalone: false
})

export class SafeUrlPipe implements PipeTransform {
  constructor(private sanitized: DomSanitizer) { }
  transform(value: string) {
    return this.sanitized.bypassSecurityTrustResourceUrl(value);
  }
}

