import { describe, it, expect, beforeEach } from 'vitest';
import { LnkCollapsibleTextComponent } from './collapsible-text.component';

describe('LnkCollapsibleTextComponent', () => {
  let component: LnkCollapsibleTextComponent;
  let detectChanges: number;

  beforeEach(() => {
    detectChanges = 0;
    const cdr: any = { detectChanges: () => detectChanges++ };
    component = new LnkCollapsibleTextComponent(cdr, {} as any);
  });

  const setContentHeight = (h: number) => {
    component.content = { nativeElement: { scrollHeight: h } } as any;
  };

  it('should not collapse content within the limit plus tolerance', () => {
    setContentHeight(component.maxHeight + LnkCollapsibleTextComponent.TOLLERANZA);
    component._measure();
    expect(component._overflow).toBe(false);
    expect(detectChanges).toBe(0);
  });

  it('should collapse content beyond the limit and react to changes', () => {
    setContentHeight(500);
    component._measure();
    expect(component._overflow).toBe(true);
    setContentHeight(40);
    component._measure();
    expect(component._overflow).toBe(false);
    expect(detectChanges).toBe(2);
  });

  it('should honour a custom max height', () => {
    component.maxHeight = 40;
    setContentHeight(80);
    component._measure();
    expect(component._overflow).toBe(true);
  });

  it('should toggle the expanded state', () => {
    expect(component._expanded).toBe(false);
    component._toggle();
    expect(component._expanded).toBe(true);
    component._toggle();
    expect(component._expanded).toBe(false);
  });
});
