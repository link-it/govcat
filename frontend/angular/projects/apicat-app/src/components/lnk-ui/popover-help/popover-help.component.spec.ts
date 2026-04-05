import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleChange } from '@angular/core';
import { PopoverHelpComponent } from './popover-help.component';

describe('PopoverHelpComponent', () => {
  let component: PopoverHelpComponent;
  const mockSanitizer = { bypassSecurityTrustHtml: (html: string) => html } as any;
  const mockTranslate = {
    currentLang: 'it',
    translations: { it: { APP: { LABEL_HELP: { ctx: { field1: 'Help text' } } } } },
    instant: (key: string, params?: any) => {
      if (key === 'APP.LABEL_HELP.ctx.field1') return 'Help text';
      return key;
    }
  } as any;

  beforeEach(() => {
    component = new PopoverHelpComponent(mockSanitizer, mockTranslate);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default iconHelp', () => {
    expect(component.iconHelp).toBe('bi bi-info-circle');
  });

  it('should detect translation on ngOnChanges', () => {
    component.context = 'ctx';
    component.ngOnChanges({ field: new SimpleChange(undefined, 'field1', true) });
    expect(component.existsValue).toBe(true);
    expect(component.text).toBe('Help text');
  });

  it('should set existsValue false when no translation', () => {
    component.context = 'ctx';
    component.ngOnChanges({ field: new SimpleChange(undefined, 'missing', true) });
    expect(component.existsValue).toBe(false);
  });

  it('should hasTranslation return true for existing key', () => {
    expect(component.hasTranslation('APP.LABEL_HELP.ctx.field1')).toBe(true);
  });

  it('should hasTranslation return false for missing key', () => {
    expect(component.hasTranslation('APP.LABEL_HELP.ctx.missing')).toBe(false);
  });
});
