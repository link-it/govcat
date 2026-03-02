// @vitest-environment jsdom
import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { PdndEServiceViewComponent } from './pdnd-eservice-view.component';

describe('PdndEServiceViewComponent', () => {
  let component: PdndEServiceViewComponent;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockPdndService = {
    eservice: vi.fn().mockReturnValue(of({ data: null })),
    eserviceDescriptors: vi.fn().mockReturnValue(of({ data: null })),
    attribute: vi.fn().mockReturnValue(of({ data: { name: 'TestAttr' } })),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTranslate.instant.mockImplementation((k: string) => k);
    mockPdndService.eservice.mockReturnValue(of({ data: null }));
    mockPdndService.eserviceDescriptors.mockReturnValue(of({ data: null }));
    mockPdndService.attribute.mockReturnValue(of({ data: { name: 'TestAttr' } }));
    component = new PdndEServiceViewComponent(mockTranslate, mockPdndService);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have views array', () => {
    expect(component.views.length).toBe(3);
    expect(component.views[0].type).toBe('ui-data-view');
  });

  it('should have attributeViews with 3 entries', () => {
    expect(component.attributeViews.length).toBe(3);
    component.attributeViews.forEach(v => {
      expect(v.type).toBe('list-ui-collapse-row');
    });
  });

  it('should have default data null', () => {
    expect(component.data).toBeNull();
  });

  it('should have default attributeData empty', () => {
    expect(component.attributeData).toEqual([]);
  });

  it('should have hasAnyAttributes false', () => {
    expect(component.hasAnyAttributes).toBe(false);
  });

  it('should have default eServiceId null', () => {
    expect(component.eServiceId).toBeNull();
  });

  it('should have default environmentId null', () => {
    expect(component.environmentId).toBeNull();
  });

  it('should call loadData on ngOnChanges when both ids present', () => {
    const loadingSpy = vi.fn();
    component.loading.subscribe(loadingSpy);

    mockPdndService.eservice.mockReturnValue(of({
      data: {
        id: 'e1', name: 'Service1', version: '1', technology: 'REST', state: 'ACTIVE',
        description: 'desc',
        producer: { id: 'p1', name: 'Producer', externalId: { origin: 'o', id: '1' }, category: 'cat' },
        attributes: { certified: [], declared: [], verified: [] }
      }
    }));
    mockPdndService.eserviceDescriptors.mockReturnValue(of({ data: { descriptors: [] } }));

    component.ngOnChanges({
      eServiceId: new SimpleChange(null, 'e1', true),
      environmentId: new SimpleChange(null, 'collaudo', true),
    });

    expect(mockPdndService.eservice).toHaveBeenCalled();
    expect(mockPdndService.eserviceDescriptors).toHaveBeenCalled();
    expect(loadingSpy).toHaveBeenCalledWith(true);
  });

  it('should not call loadData when eServiceId missing', () => {
    component.ngOnChanges({
      environmentId: new SimpleChange(null, 'collaudo', true),
    });
    expect(mockPdndService.eservice).not.toHaveBeenCalled();
  });

  it('should set data on successful loadData', () => {
    mockPdndService.eservice.mockReturnValue(of({
      data: {
        id: 'e1', name: 'Service1', version: '1', technology: 'REST', state: 'ACTIVE',
        description: 'desc',
        producer: { id: 'p1', name: 'Producer', externalId: { origin: 'o', id: '1' }, category: 'cat' },
        attributes: { certified: [], declared: [], verified: [] }
      }
    }));
    mockPdndService.eserviceDescriptors.mockReturnValue(of({
      data: { descriptors: [] }
    }));

    component.ngOnChanges({
      eServiceId: new SimpleChange(null, 'e1', true),
      environmentId: new SimpleChange(null, 'collaudo', true),
    });

    expect(component.data).toBeTruthy();
    expect(component.data.length).toBe(3);
  });
});
