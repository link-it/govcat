import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ScrollableRegionFocusableDirective } from './scrollable-region-focusable.directive';

@Component({
  standalone: true,
  imports: [ScrollableRegionFocusableDirective],
  template: `
    <section class="container-scroller">
      @if (conPulsante()) {
        <button type="button">Azione</button>
      } @else {
        <p>Solo testo</p>
        <button type="button" hidden>Comando mostrato al passaggio del mouse</button>
      }
    </section>
  `
})
class HostComponent {
  conPulsante = signal(false);
}

describe('ScrollableRegionFocusableDirective', () => {
  beforeAll(() => {
    // jsdom non calcola il layout: la regione risulta sempre scorrevole
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => 500 });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 100 });
    (globalThis as any).ResizeObserver ??= class { observe() {} disconnect() {} };
    // jsdom non calcola il layout: un elemento e' visibile se non ha l'attributo hidden
    Object.defineProperty(HTMLElement.prototype, 'getClientRects', {
      configurable: true,
      value(this: HTMLElement) { return this.hasAttribute('hidden') ? [] : [{}]; }
    });
  });

  afterAll(() => {
    delete (HTMLElement.prototype as any).scrollHeight;
    delete (HTMLElement.prototype as any).clientHeight;
    delete (HTMLElement.prototype as any).getClientRects;
  });

  const crea = (conPulsante: boolean) => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.conPulsante.set(conPulsante);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('section') as HTMLElement;
  };

  it('should make the scrollable region focusable when it has no visible focusable content', () => {
    expect(crea(false).getAttribute('tabindex')).toBe('0');
  });

  it('should not add a tab stop when the region already contains focusable elements', () => {
    expect(crea(true).hasAttribute('tabindex')).toBe(false);
  });
});
