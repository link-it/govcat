import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScrollComponent } from './scroll.component';

describe('ScrollComponent', () => {
  let component: ScrollComponent;

  beforeEach(() => {
    component = new ScrollComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have scrollToTop output', () => {
    expect(component.scrollToTop).toBeDefined();
  });

  it('should emit scrollToTop event', () => {
    const spy = vi.fn();
    component.scrollToTop.subscribe(spy);
    component.onScrollToTop();
    expect(spy).toHaveBeenCalled();
  });
});
