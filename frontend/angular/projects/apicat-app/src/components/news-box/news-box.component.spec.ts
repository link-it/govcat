import { describe, it, expect, beforeEach } from 'vitest';
import { NewsBoxComponent } from './news-box.component';

describe('NewsBoxComponent', () => {
  let component: NewsBoxComponent;

  beforeEach(() => {
    component = new NewsBoxComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title', () => {
    expect(component.title).toBe('Title');
  });

  it('should have default content', () => {
    expect(component.content).toContain('Lorem ipsum');
  });

  it('should have default link', () => {
    expect(component.link).toBe('https://www.link.it');
  });

  it('should have default button text', () => {
    expect(component.buttonText).toBe('Go');
  });

  it('should not show close button by default', () => {
    expect(component.showClose).toBe(false);
  });

  it('should show bottom link by default', () => {
    expect(component.showBottonLink).toBe(true);
  });

  it('should accept custom inputs', () => {
    component.title = 'Custom Title';
    component.content = 'Custom Content';
    component.link = 'https://example.com';
    expect(component.title).toBe('Custom Title');
    expect(component.content).toBe('Custom Content');
    expect(component.link).toBe('https://example.com');
  });
});
