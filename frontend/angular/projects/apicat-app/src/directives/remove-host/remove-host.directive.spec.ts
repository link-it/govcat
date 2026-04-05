import { describe, it, expect, beforeEach } from 'vitest';
import { RemoveHostDirective } from './remove-host.directive';
import { ElementRef } from '@angular/core';

describe('RemoveHostDirective', () => {
  it('should be created', () => {
    const el = document.createElement('div');
    const parent = document.createElement('div');
    parent.appendChild(el);

    const directive = new RemoveHostDirective(new ElementRef(el));
    expect(directive).toBeTruthy();
  });

  it('should move children out of host element and remove host', () => {
    const parent = document.createElement('div');
    const host = document.createElement('div');
    const child1 = document.createElement('span');
    child1.textContent = 'Child 1';
    const child2 = document.createElement('span');
    child2.textContent = 'Child 2';

    host.appendChild(child1);
    host.appendChild(child2);
    parent.appendChild(host);

    const directive = new RemoveHostDirective(new ElementRef(host));
    directive.ngOnInit();

    expect(parent.contains(host)).toBe(false);
    expect(parent.contains(child1)).toBe(true);
    expect(parent.contains(child2)).toBe(true);
    expect(parent.children.length).toBe(2);
  });

  it('should handle host with no children', () => {
    const parent = document.createElement('div');
    const host = document.createElement('div');
    parent.appendChild(host);

    const directive = new RemoveHostDirective(new ElementRef(host));
    directive.ngOnInit();

    expect(parent.contains(host)).toBe(false);
    expect(parent.children.length).toBe(0);
  });

  it('should preserve order of children', () => {
    const parent = document.createElement('div');
    const host = document.createElement('div');
    const a = document.createElement('span');
    a.id = 'a';
    const b = document.createElement('span');
    b.id = 'b';
    const c = document.createElement('span');
    c.id = 'c';

    host.appendChild(a);
    host.appendChild(b);
    host.appendChild(c);
    parent.appendChild(host);

    const directive = new RemoveHostDirective(new ElementRef(host));
    directive.ngOnInit();

    expect(parent.children[0].id).toBe('a');
    expect(parent.children[1].id).toBe('b');
    expect(parent.children[2].id).toBe('c');
  });
});
