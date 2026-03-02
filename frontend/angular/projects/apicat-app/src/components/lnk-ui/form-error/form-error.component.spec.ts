import { describe, it, expect, beforeEach } from 'vitest';
import { LnkFormErrorComponent } from './form-error.component';

describe('LnkFormErrorComponent', () => {
  let component: LnkFormErrorComponent;

  beforeEach(() => {
    component = new LnkFormErrorComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty message by default', () => {
    expect(component.message).toBe('');
  });

  it('should accept custom message', () => {
    component.message = 'Error occurred';
    expect(component.message).toBe('Error occurred');
  });
});
