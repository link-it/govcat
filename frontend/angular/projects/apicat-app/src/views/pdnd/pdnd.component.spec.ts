// @vitest-environment jsdom
import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { PdndComponent } from './pdnd.component';
import { PdndBaseUri, PdndEventType } from './pdnd.service';

describe('PdndComponent', () => {
  let component: PdndComponent;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockPdndService = {
    keys: vi.fn().mockReturnValue(of({})),
    client: vi.fn().mockReturnValue(of({ data: null })),
    organization: vi.fn().mockReturnValue(of({ data: null })),
    attribute: vi.fn().mockReturnValue(of({ data: null })),
    eservice: vi.fn().mockReturnValue(of({ data: null })),
    eserviceDescriptors: vi.fn().mockReturnValue(of({ data: null })),
    eserviceDescriptor: vi.fn().mockReturnValue(of({ data: null })),
    agreement: vi.fn().mockReturnValue(of({ data: null })),
    agreementAttributes: vi.fn().mockReturnValue(of({ data: null })),
    agreementPurposes: vi.fn().mockReturnValue(of({ data: null })),
    purpose: vi.fn().mockReturnValue(of({ data: null })),
    purposeAgreement: vi.fn().mockReturnValue(of({ data: null })),
    serviceList: vi.fn().mockReturnValue(of({ data: null })),
    events: vi.fn().mockReturnValue(of({ data: null })),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTranslate.instant.mockImplementation((k: string) => k);
    mockPdndService.keys.mockReturnValue(of({}));
    mockPdndService.client.mockReturnValue(of({ data: null }));
    mockPdndService.organization.mockReturnValue(of({ data: null }));
    mockPdndService.attribute.mockReturnValue(of({ data: null }));
    mockPdndService.eservice.mockReturnValue(of({ data: null }));
    mockPdndService.eserviceDescriptors.mockReturnValue(of({ data: null }));
    mockPdndService.eserviceDescriptor.mockReturnValue(of({ data: null }));
    mockPdndService.agreement.mockReturnValue(of({ data: null }));
    mockPdndService.agreementAttributes.mockReturnValue(of({ data: null }));
    mockPdndService.agreementPurposes.mockReturnValue(of({ data: null }));
    mockPdndService.purpose.mockReturnValue(of({ data: null }));
    mockPdndService.purposeAgreement.mockReturnValue(of({ data: null }));
    mockPdndService.serviceList.mockReturnValue(of({ data: null }));
    mockPdndService.events.mockReturnValue(of({ data: null }));
    component = new PdndComponent(mockRouter, mockTranslate, mockPdndService);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have model pdnd', () => {
    expect(component.model).toBe('pdnd');
  });

  it('should have default environmentId collaudo', () => {
    expect(component.environmentId).toBe('collaudo');
  });

  it('should have _showFilter true', () => {
    expect(component._showFilter).toBe(true);
  });

  it('should have _spin false', () => {
    expect(component._spin).toBe(false);
  });

  it('should have default messages', () => {
    expect(component._message).toBe('APP.MESSAGE.SelectRequest');
    expect(component._messageHelp).toBe('APP.MESSAGE.SelectRequestHelp');
    expect(component._error).toBe(false);
  });

  it('should have breadcrumbs with 2 items', () => {
    expect(component.breadcrumbs.length).toBe(2);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Configurations');
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Pdnd');
  });

  it('should have _formGroup with expected controls', () => {
    expect(component._formGroup.get('pdndType')).toBeTruthy();
    expect(component._formGroup.get('kid')).toBeTruthy();
    expect(component._formGroup.get('clientId')).toBeTruthy();
    expect(component._formGroup.get('organizationId')).toBeTruthy();
    expect(component._formGroup.get('attributeId')).toBeTruthy();
    expect(component._formGroup.get('eserviceId')).toBeTruthy();
    expect(component._formGroup.get('agreementId')).toBeTruthy();
    expect(component._formGroup.get('purposeId')).toBeTruthy();
    expect(component._formGroup.get('eventType')).toBeTruthy();
    expect(component._formGroup.get('lastEventId')).toBeTruthy();
    expect(component._formGroup.get('limit')).toBeTruthy();
  });

  it('should have all controls disabled initially', () => {
    expect(component._kid.disabled).toBe(true);
    expect(component._clientId.disabled).toBe(true);
    expect(component._organizationId.disabled).toBe(true);
    expect(component._attributeId.disabled).toBe(true);
    expect(component._eserviceId.disabled).toBe(true);
    expect(component._agreementId.disabled).toBe(true);
    expect(component._purposeId.disabled).toBe(true);
    expect(component._eventType.disabled).toBe(true);
    expect(component._lastEventId.disabled).toBe(true);
    expect(component._limit.disabled).toBe(true);
  });

  it('should set error messages', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('should reset error messages', () => {
    component._setErrorMessages(true);
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.SelectRequest');
    expect(component._messageHelp).toBe('APP.MESSAGE.SelectRequestHelp');
  });

  it('should show collaudo', () => {
    component.environmentId = 'produzione';
    component._showCollaudo();
    expect(component.environmentId).toBe('collaudo');
    expect(component._spin).toBe(false);
    expect(component.jwk).toBeNull();
  });

  it('should show produzione', () => {
    component._showProduzione();
    expect(component.environmentId).toBe('produzione');
    expect(component._spin).toBe(false);
    expect(component.jwk).toBeNull();
  });

  it('should check _isCollaudo', () => {
    expect(component._isCollaudo()).toBe(true);
    component.environmentId = 'produzione';
    expect(component._isCollaudo()).toBe(false);
  });

  it('should toggle filter', () => {
    expect(component._showFilter).toBe(true);
    component._toggleFilter();
    expect(component._showFilter).toBe(false);
    component._toggleFilter();
    expect(component._showFilter).toBe(true);
  });

  it('should reset data', () => {
    component._spin = true;
    component.jwk = { key: 'value' };
    component._error = true;
    component._resetData();
    expect(component._spin).toBe(false);
    expect(component.jwk).toBeNull();
    expect(component._error).toBe(false);
  });

  it('should navigate on breadcrumb', () => {
    component.onBreadcrumb({ url: '/pdnd' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/pdnd']);
  });

  it('should not submit when form is invalid', () => {
    component._onSubmit({ pdndType: { uri: PdndBaseUri.KEYS, controls: [] } } as any);
    expect(component._spin).toBe(false);
  });

  it('should have pdndTypes array', () => {
    expect(component.pdndTypes.length).toBeGreaterThan(0);
    expect(component.pdndTypes[0].uri).toBe(PdndBaseUri.KEYS);
  });

  it('should have eventTypes array', () => {
    expect(component.eventTypes.length).toBe(3);
    expect(component.eventTypes[0].value).toBe(PdndEventType.ANY);
  });

  it('should have jwk null by default', () => {
    expect(component.jwk).toBeNull();
  });
});
