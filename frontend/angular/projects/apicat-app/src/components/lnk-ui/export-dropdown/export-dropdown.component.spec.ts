import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportDropdwnComponent, ActionEnum } from './export-dropdown.component';

describe('ExportDropdwnComponent', () => {
  let component: ExportDropdwnComponent;
  const mockElementRef = {
    nativeElement: { querySelector: vi.fn().mockReturnValue(null) }
  } as any;

  beforeEach(() => {
    component = new ExportDropdwnComponent(mockElementRef);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title', () => {
    expect(component.title).toBe('APP.MENU.Services');
  });

  it('should not be disabled by default', () => {
    expect(component.disabled).toBe(false);
  });

  it('should initMenu with correct structure', () => {
    component.allElements = 5;
    component.countSelected = 2;
    component.initMenu();
    expect(component.menuActions.length).toBe(3);
    expect(component.menuActions[0].type).toBe('label');
    expect(component.menuActions[1].action).toBe(ActionEnum.SEARCH);
    expect(component.menuActions[1].enabled).toBe(true);
    expect(component.menuActions[2].action).toBe(ActionEnum.SELECTION);
    expect(component.menuActions[2].badge).toBe('2');
  });

  it('should disable search action when allElements is 0', () => {
    component.allElements = 0;
    component.countSelected = 0;
    component.initMenu();
    expect(component.menuActions[1].enabled).toBe(false);
  });

  it('should emit action on onAction with string', () => {
    const spy = vi.fn();
    component.action.subscribe(spy);
    component.onAction('search');
    expect(spy).toHaveBeenCalledWith({ action: 'search' });
  });

  it('should emit action on onAction with object', () => {
    const spy = vi.fn();
    component.action.subscribe(spy);
    component.onAction({ action: 'selection' });
    expect(spy).toHaveBeenCalledWith({ action: 'selection' });
  });
});
