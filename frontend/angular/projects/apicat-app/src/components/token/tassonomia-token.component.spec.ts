import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TassonomiaTokenComponent } from './tassonomia-token.component';

describe('TassonomiaTokenComponent', () => {
  let component: TassonomiaTokenComponent;

  beforeEach(() => {
    component = new TassonomiaTokenComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have null data by default', () => {
    expect(component.data).toBeNull();
  });

  it('should emit delete event with data', () => {
    const spy = vi.fn();
    component.delete.subscribe(spy);
    const event = new MouseEvent('click');
    const data = { id: 1, nome: 'Test' };

    component.deleteData(event, data);
    expect(spy).toHaveBeenCalledWith({ event, data });
  });
});
