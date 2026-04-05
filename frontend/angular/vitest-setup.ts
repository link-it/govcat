// jQuery ($) global mock — must be set BEFORE any imports so it's available
// in all contexts including setTimeout callbacks from coverage-instrumented code.
const jqMockFn = (_selector: any) => ({
  length: 0,
  animate: () => {},
  scrollTop: () => 0,
});
(globalThis as any).$ = jqMockFn;
(globalThis as any).jQuery = jqMockFn;

import '@angular/compiler';

// Provide minimal DOM polyfills for libraries like masonry-layout and
// desandro-matches-selector that check for window/Element at import time.
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis;
}
if (typeof globalThis.Element === 'undefined') {
  (globalThis as any).Element = class Element {
    matches() { return false; }
    closest() { return null; }
    getAttribute() { return null; }
    setAttribute() {}
    removeAttribute() {}
    addEventListener() {}
    removeEventListener() {}
    appendChild() { return this; }
    removeChild() { return this; }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    classList = { add() {}, remove() {}, contains() { return false; }, toggle() {} };
    style = {};
    innerHTML = '';
    textContent = '';
  };
}
if (typeof globalThis.HTMLElement === 'undefined') {
  (globalThis as any).HTMLElement = (globalThis as any).Element;
}
if (typeof globalThis.Node === 'undefined') {
  (globalThis as any).Node = (globalThis as any).Element;
}
if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {
    createElement: () => new (globalThis as any).Element(),
    createDocumentFragment: () => new (globalThis as any).Element(),
    createTextNode: () => new (globalThis as any).Element(),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    body: new (globalThis as any).Element(),
    documentElement: { style: {} },
    head: new (globalThis as any).Element(),
  };
}
if (typeof globalThis.navigator === 'undefined') {
  (globalThis as any).navigator = { userAgent: 'node' };
}
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  (globalThis as any).requestAnimationFrame = (cb: any) => setTimeout(cb, 0);
}
if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  (globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
}
if (typeof globalThis.getComputedStyle === 'undefined') {
  (globalThis as any).getComputedStyle = () => ({});
}
if (typeof globalThis.matchMedia === 'undefined') {
  (globalThis as any).matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (typeof globalThis.MutationObserver === 'undefined') {
  (globalThis as any).MutationObserver = class MutationObserver {
    constructor(_callback: any) {}
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}
if (typeof globalThis.IntersectionObserver === 'undefined') {
  (globalThis as any).IntersectionObserver = class IntersectionObserver {
    constructor(_callback: any, _options?: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jQuery ($) — also register via vi.stubGlobal for Vitest context,
// and replace Tools.ScrollTo/ScrollElement as final safety net.
import { vi } from 'vitest';
vi.stubGlobal('$', jqMockFn);
vi.stubGlobal('jQuery', jqMockFn);
import { Tools } from '@linkit/components';
Tools.ScrollTo = () => {};
Tools.ScrollElement = () => {};
