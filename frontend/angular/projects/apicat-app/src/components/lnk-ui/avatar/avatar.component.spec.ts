import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { LnkAvatarComponent } from './avatar.component';

describe('LnkAvatarComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [LnkAvatarComponent] });
  });

  const crea = (inputs: Record<string, any>) => {
    const fixture = TestBed.createComponent(LnkAvatarComponent);
    Object.entries(inputs).forEach(([k, v]) => fixture.componentRef.setInput(k, v));
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.lnk-avatar') as HTMLElement;
  };

  it('should expose the avatar as an image named after the user', () => {
    const el = crea({ name: 'Mario Rossi' });
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Mario Rossi');
    expect(el.getAttribute('aria-hidden')).toBeNull();
    expect(el.textContent?.trim()).toBe('MR');
  });

  it('should hide a decorative avatar from assistive technologies', () => {
    const el = crea({ name: 'Mario Rossi', decorative: true });
    expect(el.getAttribute('role')).toBeNull();
    expect(el.getAttribute('aria-label')).toBeNull();
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
});
