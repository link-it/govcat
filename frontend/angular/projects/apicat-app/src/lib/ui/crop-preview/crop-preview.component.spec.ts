import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CropPreviewComponent, areaRitaglio } from './crop-preview.component';

describe('areaRitaglio', () => {
  it('should crop top and bottom of an image taller than the ratio', () => {
    const area = areaRitaglio(400, 400, 16 / 9)!;
    expect(area.left).toBe(0);
    expect(area.width).toBe(100);
    expect(area.height).toBeCloseTo(56.25, 2);
    expect(area.top).toBeCloseTo(21.875, 2);
  });

  it('should crop left and right of an image wider than the ratio', () => {
    const area = areaRitaglio(2000, 500, 16 / 9)!;
    expect(area.top).toBe(0);
    expect(area.height).toBe(100);
    expect(area.width).toBeCloseTo(44.44, 2);
    expect(area.left).toBeCloseTo(27.78, 2);
  });

  it('should not crop an image that already has the ratio, or without data', () => {
    expect(areaRitaglio(1280, 720, 16 / 9)).toBeNull();
    expect(areaRitaglio(0, 720, 16 / 9)).toBeNull();
    expect(areaRitaglio(400, 400, null)).toBeNull();
  });
});

describe('CropPreviewComponent', () => {
  let fixture: ComponentFixture<CropPreviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CropPreviewComponent] });
    fixture = TestBed.createComponent(CropPreviewComponent);
    fixture.componentRef.setInput('src', 'logo.png');
    fixture.componentRef.setInput('ratio', 16 / 9);
    fixture.detectChanges();
  });

  const _carica = (w: number, h: number) => {
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    Object.defineProperty(img, 'naturalWidth', { value: w, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: h, configurable: true });
    img.dispatchEvent(new Event('load'));
    fixture.detectChanges();
  };

  it('should show the whole image with the visible area over it', () => {
    _carica(400, 400);
    const area: HTMLElement = fixture.nativeElement.querySelector('.crop-area');
    expect(area).toBeTruthy();
    expect(area.style.height).toBe('56.25%');
    expect(area.getAttribute('aria-hidden')).toBe('true');
  });

  it('should hide the area when asked or when nothing is cropped', () => {
    _carica(1280, 720);
    expect(fixture.nativeElement.querySelector('.crop-area')).toBeNull();
    _carica(400, 400);
    fixture.componentRef.setInput('showCrop', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.crop-area')).toBeNull();
  });
});
