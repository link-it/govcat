import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModifierKeyService } from './modifier-key.service';

describe('ModifierKeyService', () => {
  let service: ModifierKeyService;
  const BODY_CLASS = 'modifier-key-pressed';

  beforeEach(() => {
    document.body.classList.remove(BODY_CLASS);
    // Construct with browser platform ID
    service = new ModifierKeyService('browser');
  });

  afterEach(() => {
    service.ngOnDestroy();
    document.body.classList.remove(BODY_CLASS);
  });

  it('should start listening on construction in browser', () => {
    // Service already starts listening in constructor
    document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true }));
    expect(document.body.classList.contains(BODY_CLASS)).toBe(true);
  });

  it('should add class on ctrl keydown', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true }));
    expect(document.body.classList.contains(BODY_CLASS)).toBe(true);
  });

  it('should add class on meta keydown', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { metaKey: true }));
    expect(document.body.classList.contains(BODY_CLASS)).toBe(true);
  });

  it('should remove class on keyup without modifiers', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true }));
    expect(document.body.classList.contains(BODY_CLASS)).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keyup', { ctrlKey: false, metaKey: false }));
    expect(document.body.classList.contains(BODY_CLASS)).toBe(false);
  });

  it('should remove class on window blur', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true }));
    expect(document.body.classList.contains(BODY_CLASS)).toBe(true);
    window.dispatchEvent(new Event('blur'));
    expect(document.body.classList.contains(BODY_CLASS)).toBe(false);
  });

  it('should not add class for regular keys', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: false, metaKey: false }));
    expect(document.body.classList.contains(BODY_CLASS)).toBe(false);
  });

  it('should stop listening on destroy', () => {
    service.ngOnDestroy();
    document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true }));
    expect(document.body.classList.contains(BODY_CLASS)).toBe(false);
  });

  it('should not start listening twice', () => {
    service.startListening(); // Already listening from constructor
    // Should not throw or cause issues
    document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true }));
    expect(document.body.classList.contains(BODY_CLASS)).toBe(true);
  });
});
