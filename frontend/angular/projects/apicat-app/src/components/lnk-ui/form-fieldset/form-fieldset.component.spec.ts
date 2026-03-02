import { describe, it, expect, beforeEach } from 'vitest';
import { LnkFormFieldsetComponent } from './form-fieldset.component';

describe('LnkFormFieldsetComponent', () => {
  let component: LnkFormFieldsetComponent;

  beforeEach(() => {
    component = new LnkFormFieldsetComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.title).toBe('');
    expect(component.subTitle).toBe('');
    expect(component.singleColumn).toBe(false);
    expect(component.isNew).toBe(false);
    expect(component.otherClass).toBe('');
    expect(component.options).toBeNull();
  });

  it('should return col-lg-4 for colClassTitle by default', () => {
    expect(component.colClassTitle).toBe('col-lg-4');
  });

  it('should return col-lg-8 for colClassContent by default', () => {
    expect(component.colClassContent).toBe('col-lg-8');
  });

  it('should return col-lg-12 for colClassTitle when singleColumn', () => {
    component.singleColumn = true;
    expect(component.colClassTitle).toBe('col-lg-12');
  });

  it('should return col-lg-12 for colClassContent when singleColumn', () => {
    component.singleColumn = true;
    expect(component.colClassContent).toBe('col-lg-12');
  });

  it('should use options.Fieldset.colTitle when options provided', () => {
    component.options = { Fieldset: { colTitle: 3, colContent: 9 } };
    expect(component.colClassTitle).toBe('col-lg-3');
  });

  it('should use options.Fieldset.colContent when options provided', () => {
    component.options = { Fieldset: { colTitle: 3, colContent: 9 } };
    expect(component.colClassContent).toBe('col-lg-9');
  });
});
