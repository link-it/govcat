import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LnkDropdwnButtonComponent } from './dropdown-button.component';

describe('LnkDropdwnButtonComponent', () => {
  let component: LnkDropdwnButtonComponent;

  beforeEach(() => {
    component = new LnkDropdwnButtonComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title "menu"', () => {
    expect(component.title).toBe('menu');
  });

  it('should have empty items by default', () => {
    expect(component.items).toEqual([]);
  });

  it('should not have menuEnd by default', () => {
    expect(component.menuEnd).toBe(false);
  });

  it('should emit action when onAction is called', () => {
    const spy = vi.fn();
    component.action.subscribe(spy);
    component.onAction({ action: 'test-action' });
    expect(spy).toHaveBeenCalledWith('test-action');
  });

  it('should accept custom items', () => {
    const items = [{ type: 'menu', title: 'Item 1', action: 'act1', enabled: true }] as any;
    component.items = items;
    expect(component.items).toBe(items);
  });
});
