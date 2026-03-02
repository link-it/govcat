import { describe, it, expect, beforeEach } from 'vitest';
import { SafeHtmlPipe } from './safe-html.pipe';

describe('SafeHtmlPipe', () => {
  let pipe: SafeHtmlPipe;
  let mockSanitizer: any;

  beforeEach(() => {
    mockSanitizer = {
      bypassSecurityTrustHtml: (value: string) => ({ changingThisBreaksApplicationSecurity: value })
    };
    pipe = new SafeHtmlPipe(mockSanitizer);
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should call bypassSecurityTrustHtml with the value', () => {
    const result: any = pipe.transform('<b>bold</b>');
    expect(result.changingThisBreaksApplicationSecurity).toBe('<b>bold</b>');
  });

  it('should handle empty string', () => {
    const result: any = pipe.transform('');
    expect(result.changingThisBreaksApplicationSecurity).toBe('');
  });

  it('should handle HTML with script tags', () => {
    const html = '<script>alert("xss")</script>';
    const result: any = pipe.transform(html);
    expect(result.changingThisBreaksApplicationSecurity).toBe(html);
  });
});
