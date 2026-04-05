import { describe, it, expect, beforeEach } from 'vitest';
import { LnkFieldPlaintextComponent } from './field-plaintext.component';

describe('LnkFieldPlaintextComponent', () => {
  let component: LnkFieldPlaintextComponent;

  beforeEach(() => {
    component = new LnkFieldPlaintextComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty label by default', () => {
    expect(component.label).toBe('');
  });

  it('should have default labelColumn 4', () => {
    expect(component.labelColumn).toBe(4);
  });

  it('should have default valueColumn 8', () => {
    expect(component.valueColumn).toBe(8);
  });

  it('should accept custom values', () => {
    component.label = 'Nome';
    component.value = 'Test Value';
    component.inline = true;
    component.labelAlignRight = true;
    expect(component.label).toBe('Nome');
    expect(component.value).toBe('Test Value');
    expect(component.inline).toBe(true);
    expect(component.labelAlignRight).toBe(true);
  });
});
