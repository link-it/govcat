import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StepCompletatoComponent } from './step-completato.component';

describe('StepCompletatoComponent', () => {
  let component: StepCompletatoComponent;

  beforeEach(() => {
    component = new StepCompletatoComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default nome', () => {
    expect(component.nome).toBe('');
  });

  it('should emit vaiAlCatalogo', () => {
    const spy = vi.spyOn(component.vaiAlCatalogo, 'emit');
    component.onVaiAlCatalogo();
    expect(spy).toHaveBeenCalled();
  });
});
