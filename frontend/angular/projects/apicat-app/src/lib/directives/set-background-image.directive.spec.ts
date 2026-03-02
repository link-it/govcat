import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SetBackgroundImageDirective } from './set-background-image.directive';
import { ElementRef, SimpleChange } from '@angular/core';

describe('SetBackgroundImageDirective', () => {
  let directive: SetBackgroundImageDirective;
  let element: HTMLDivElement;
  let mockRenderer: any;

  beforeEach(() => {
    element = document.createElement('div');
    mockRenderer = {
      setStyle: vi.fn()
    };
    directive = new SetBackgroundImageDirective(new ElementRef(element), mockRenderer);
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should have default position as contain', () => {
    expect(directive.position).toBe('contain');
  });

  it('should set background styles on init', () => {
    directive.imageUrl = 'https://example.com/image.png';
    directive.ngOnInit();

    expect(mockRenderer.setStyle).toHaveBeenCalledWith(element, 'backgroundImage', 'url(https://example.com/image.png)');
    expect(mockRenderer.setStyle).toHaveBeenCalledWith(element, 'background-size', 'contain');
    expect(mockRenderer.setStyle).toHaveBeenCalledWith(element, 'background-position', 'center');
    expect(mockRenderer.setStyle).toHaveBeenCalledWith(element, 'background-repeat', 'no-repeat');
  });

  it('should use custom position', () => {
    directive.imageUrl = 'img.png';
    directive.position = 'cover';
    directive.ngOnInit();

    expect(mockRenderer.setStyle).toHaveBeenCalledWith(element, 'background-size', 'cover');
  });

  it('should update background on ngOnChanges (non-first change)', () => {
    directive.imageUrl = 'old.png';
    directive.ngOnInit();
    mockRenderer.setStyle.mockClear();

    directive.ngOnChanges({
      imageUrl: new SimpleChange('old.png', 'new.png', false)
    });

    expect(mockRenderer.setStyle).toHaveBeenCalledWith(element, 'backgroundImage', 'url(new.png)');
  });

  it('should not update on first change', () => {
    directive.ngOnChanges({
      imageUrl: new SimpleChange(undefined, 'new.png', true)
    });

    expect(mockRenderer.setStyle).not.toHaveBeenCalled();
  });

  it('should handle SafeUrl values in ngOnChanges', () => {
    directive.imageUrl = 'old.png';
    directive.ngOnInit();
    mockRenderer.setStyle.mockClear();

    const safeUrl = { changingThisBreaksApplicationSecurity: 'blob:http://localhost/abc' } as any;
    directive.ngOnChanges({
      imageUrl: new SimpleChange('old.png', safeUrl, false)
    });

    expect(directive.imageUrl).toBe('blob:http://localhost/abc');
  });

  it('should ignore changes for other inputs', () => {
    directive.ngOnChanges({
      position: new SimpleChange('contain', 'cover', false)
    });

    expect(mockRenderer.setStyle).not.toHaveBeenCalled();
  });
});
