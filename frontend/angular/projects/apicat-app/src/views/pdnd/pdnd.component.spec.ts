// @vitest-environment jsdom
import '@angular/compiler';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
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
    vi.useFakeTimers();
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

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper to make the form valid by setting _pdndType and enabling/setting required controls
  function makeFormValid(uri: PdndBaseUri, overrides: Record<string, any> = {}) {
    const pdndType = component.pdndTypes.find(t => t.uri === uri)!;
    component._pdndType.setValue(pdndType);
    // Enable the controls that this pdndType needs
    pdndType.controls.forEach(c => c.enable());

    switch (uri) {
      case PdndBaseUri.KEYS:
        component._kid.setValue(overrides['kid'] || 'test-kid');
        break;
      case PdndBaseUri.CLIENTS:
        component._clientId.setValue(overrides['clientId'] || '00000000-0000-0000-0000-000000000001');
        break;
      case PdndBaseUri.ORGANIZATIONS:
        component._organizationId.setValue(overrides['organizationId'] || '00000000-0000-0000-0000-000000000002');
        break;
      case PdndBaseUri.ATTRIBUTES:
        component._attributeId.setValue(overrides['attributeId'] || '00000000-0000-0000-0000-000000000003');
        break;
      case PdndBaseUri.ESERVICES:
        component._eserviceId.setValue(overrides['eserviceId'] || '00000000-0000-0000-0000-000000000004');
        break;
      case PdndBaseUri.AGREEMENTS:
        component._agreementId.setValue(overrides['agreementId'] || '00000000-0000-0000-0000-000000000005');
        break;
      case PdndBaseUri.PURPOSES:
        component._purposeId.setValue(overrides['purposeId'] || '00000000-0000-0000-0000-000000000006');
        break;
      case PdndBaseUri.SERVICE_LIST:
        component._organizationOrigin.setValue(overrides['organizationOrigin'] || 'IPA');
        component._organizationExternalId.setValue(overrides['organizationExternalId'] || 'ext123');
        component._attributeOrigin.setValue(overrides['attributeOrigin'] || 'IPA');
        component._attributeCode.setValue(overrides['attributeCode'] || 'code123');
        break;
      case PdndBaseUri.EVENTS:
        component._eventType.setValue(overrides['eventType'] || PdndEventType.ANY);
        component._lastEventId.setValue(overrides['lastEventId'] || 1);
        component._limit.setValue(overrides['limit'] || 100);
        break;
    }
  }

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

  // --- _initForm / valueChanges tests ---

  describe('_initForm valueChanges', () => {
    it('should enable controls for selected pdndType when value changes', () => {
      const keysType = component.pdndTypes.find(t => t.uri === PdndBaseUri.KEYS)!;
      component._pdndType.setValue(keysType);
      expect(component._kid.enabled).toBe(true);
      // other controls should remain disabled
      expect(component._clientId.disabled).toBe(true);
    });

    it('should clear results and disable all controls before enabling the new ones', () => {
      // First set KEYS
      const keysType = component.pdndTypes.find(t => t.uri === PdndBaseUri.KEYS)!;
      component._pdndType.setValue(keysType);
      component.jwk = { some: 'data' };
      // Now switch to CLIENTS
      const clientType = component.pdndTypes.find(t => t.uri === PdndBaseUri.CLIENTS)!;
      component._pdndType.setValue(clientType);
      expect(component.jwk).toBeNull();
      expect(component._kid.disabled).toBe(true);
      expect(component._clientId.enabled).toBe(true);
    });

    it('should enable multiple controls for SERVICE_LIST type', () => {
      const serviceListType = component.pdndTypes.find(t => t.uri === PdndBaseUri.SERVICE_LIST)!;
      component._pdndType.setValue(serviceListType);
      expect(component._organizationOrigin.enabled).toBe(true);
      expect(component._organizationExternalId.enabled).toBe(true);
      expect(component._attributeOrigin.enabled).toBe(true);
      expect(component._attributeCode.enabled).toBe(true);
    });

    it('should enable event controls for EVENTS type', () => {
      const eventsType = component.pdndTypes.find(t => t.uri === PdndBaseUri.EVENTS)!;
      component._pdndType.setValue(eventsType);
      expect(component._eventType.enabled).toBe(true);
      expect(component._lastEventId.enabled).toBe(true);
      expect(component._limit.enabled).toBe(true);
    });

    it('should mark form pristine and untouched on type change', () => {
      component._formGroup.markAsDirty();
      component._formGroup.markAsTouched();
      const keysType = component.pdndTypes.find(t => t.uri === PdndBaseUri.KEYS)!;
      component._pdndType.setValue(keysType);
      expect(component._formGroup.pristine).toBe(true);
      expect(component._formGroup.untouched).toBe(true);
    });
  });

  // --- download ---

  describe('download', () => {
    it('should create a download link with kid name', () => {
      const createObjectURLSpy = vi.fn().mockReturnValue('blob:url');
      const revokeObjectURLSpy = vi.fn();
      (globalThis as any).URL.createObjectURL = createObjectURLSpy;
      (globalThis as any).URL.revokeObjectURL = revokeObjectURLSpy;
      const mockLink = { setAttribute: vi.fn(), click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      component.download({ kid: 'my-kid', kty: 'RSA' });

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'my-kid.jwk');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:url');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should use default filename when kid is not present', () => {
      const createObjectURLSpy = vi.fn().mockReturnValue('blob:url');
      (globalThis as any).URL.createObjectURL = createObjectURLSpy;
      const mockLink = { setAttribute: vi.fn(), click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      component.download({ kty: 'RSA' });

      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'chiave.jwk');
    });
  });

  // --- onItemClick ---

  describe('onItemClick', () => {
    it('should do nothing if item has no _id', () => {
      const item = { id: '', name: '' };
      const collection = [item];
      component.onItemClick(item, collection, 0);
      expect(mockPdndService.attribute).not.toHaveBeenCalled();
    });

    it('should do nothing if item already has id set', () => {
      const item = { _id: 'attr-id', id: 'already-set' };
      const collection = [item];
      component.onItemClick(item, collection, 0);
      expect(mockPdndService.attribute).not.toHaveBeenCalled();
    });

    it('should fetch attribute and update collection item when _id is set but id is empty', () => {
      const attributeData = { name: 'Attribute Name', kind: 'CERTIFIED' };
      mockPdndService.attribute.mockReturnValue(of({ data: attributeData }));

      const item = { _id: 'attr-uuid', id: '', name: '<span>placeholder</span>', validity: 'VALID', type: 'CERTIFIED' };
      const collection = [item];
      component.onItemClick(item, collection, 0);

      expect(mockPdndService.attribute).toHaveBeenCalledWith('collaudo', 'attr-uuid');
      expect(collection[0].id).toBe('attr-uuid');
      expect(collection[0].name).toBe('Attribute Name');
    });

    it('should not update collection when attribute response has no data', () => {
      mockPdndService.attribute.mockReturnValue(of({ data: null }));

      const item = { _id: 'attr-uuid', id: '', name: 'old-name' };
      const collection = [item];
      component.onItemClick(item, collection, 0);

      expect(mockPdndService.attribute).toHaveBeenCalled();
      // collection should not be modified
      expect(collection[0]).toBe(item);
    });
  });

  // --- _onSubmit: KEYS ---

  describe('_onSubmit KEYS', () => {
    it('should call pdndService.keys and set jwk on success', () => {
      const keysResult = { kid: 'my-kid', kty: 'RSA' };
      mockPdndService.keys.mockReturnValue(of(keysResult));
      makeFormValid(PdndBaseUri.KEYS);

      component._onSubmit(component._formGroup.value);

      expect(mockPdndService.keys).toHaveBeenCalledWith('collaudo', 'test-kid');
      expect(component.jwk).toEqual(keysResult);
      expect(component._spin).toBe(false);
    });

    it('should break without calling service when kid is empty', () => {
      makeFormValid(PdndBaseUri.KEYS);
      // Override form value to simulate missing kid
      const formValue = { ...component._formGroup.value, kid: null };
      component._onSubmit(formValue);
      expect(mockPdndService.keys).not.toHaveBeenCalled();
    });

    it('should handle error from keys service', () => {
      mockPdndService.keys.mockReturnValue(throwError(() => ({ error: { message: 'Key not found' } })));
      makeFormValid(PdndBaseUri.KEYS);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Key not found');
    });

    it('should use error.message when error.error.message is not available', () => {
      mockPdndService.keys.mockReturnValue(throwError(() => ({ message: 'Network error' })));
      makeFormValid(PdndBaseUri.KEYS);

      component._onSubmit(component._formGroup.value);

      expect(component._errorMsg).toBe('Network error');
    });
  });

  // --- _onSubmit: CLIENTS ---

  describe('_onSubmit CLIENTS', () => {
    it('should call pdndService.client and organization, setting jwk with merged data', () => {
      const clientData = { id: 'client-1', consumerId: 'consumer-1' };
      const orgData = { id: 'org-1', name: 'Org Name', externalId: { origin: 'IPA', id: '123' }, category: 'PA' };
      mockPdndService.client.mockReturnValue(of({ data: clientData }));
      mockPdndService.organization.mockReturnValue(of({ data: orgData }));
      makeFormValid(PdndBaseUri.CLIENTS);

      component._onSubmit(component._formGroup.value);

      expect(mockPdndService.client).toHaveBeenCalledWith('collaudo', '00000000-0000-0000-0000-000000000001');
      expect(mockPdndService.organization).toHaveBeenCalledWith('collaudo', 'consumer-1');
      expect(component.jwk).toEqual([{
        client_id: 'client-1',
        consumer_id: 'consumer-1',
        name: 'Org Name',
        origin_external: 'IPA 123',
        category: 'PA'
      }]);
      expect(component._spin).toBe(false);
    });

    it('should set jwk with error when client response has no data', () => {
      const errorMsg = { status: 404, message: 'Not found' };
      mockPdndService.client.mockReturnValue(of({ data: null, error: errorMsg }));
      makeFormValid(PdndBaseUri.CLIENTS);

      component._onSubmit(component._formGroup.value);

      expect(component.jwk).toEqual([errorMsg]);
      expect(component._spin).toBe(false);
    });

    it('should set jwk with error when organization response has no data', () => {
      const clientData = { id: 'client-1', consumerId: 'consumer-1' };
      const orgError = { status: 404, message: 'Org not found' };
      mockPdndService.client.mockReturnValue(of({ data: clientData }));
      mockPdndService.organization.mockReturnValue(of({ data: null, error: orgError }));
      makeFormValid(PdndBaseUri.CLIENTS);

      component._onSubmit(component._formGroup.value);

      expect(component.jwk).toEqual([orgError]);
    });

    it('should break without calling service when clientId is empty', () => {
      makeFormValid(PdndBaseUri.CLIENTS);
      const formValue = { ...component._formGroup.value, clientId: null };
      component._onSubmit(formValue);
      expect(mockPdndService.client).not.toHaveBeenCalled();
    });

    it('should handle error from client service', () => {
      mockPdndService.client.mockReturnValue(throwError(() => ({ error: { message: 'Client error' } })));
      makeFormValid(PdndBaseUri.CLIENTS);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Client error');
    });

    it('should handle error from organization service (nested call)', () => {
      const clientData = { id: 'client-1', consumerId: 'consumer-1' };
      mockPdndService.client.mockReturnValue(of({ data: clientData }));
      mockPdndService.organization.mockReturnValue(throwError(() => ({ error: { message: 'Org HTTP error' } })));
      makeFormValid(PdndBaseUri.CLIENTS);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Org HTTP error');
    });
  });

  // --- _onSubmit: ORGANIZATIONS ---

  describe('_onSubmit ORGANIZATIONS', () => {
    it('should call pdndService.organization and set jwk with mapped data', () => {
      const orgData = { id: 'org-1', name: 'Test Org', externalId: { origin: 'IPA', id: '456' }, category: 'PA' };
      mockPdndService.organization.mockReturnValue(of({ data: orgData }));
      makeFormValid(PdndBaseUri.ORGANIZATIONS);

      component._onSubmit(component._formGroup.value);

      expect(mockPdndService.organization).toHaveBeenCalledWith('collaudo', '00000000-0000-0000-0000-000000000002');
      expect(component.jwk).toEqual([{
        name: 'Test Org',
        consumer_id: 'org-1',
        origin_external: 'IPA 456',
        category: 'PA'
      }]);
      expect(component._spin).toBe(false);
    });

    it('should set jwk with error when organization response has no data', () => {
      const orgError = { status: 404 };
      mockPdndService.organization.mockReturnValue(of({ data: null, error: orgError }));
      makeFormValid(PdndBaseUri.ORGANIZATIONS);

      component._onSubmit(component._formGroup.value);

      expect(component.jwk).toEqual([orgError]);
      expect(component._spin).toBe(false);
    });

    it('should break without calling service when organizationId is empty', () => {
      makeFormValid(PdndBaseUri.ORGANIZATIONS);
      const formValue = { ...component._formGroup.value, organizationId: null };
      component._onSubmit(formValue);
      expect(mockPdndService.organization).not.toHaveBeenCalled();
    });

    it('should handle error from organization service', () => {
      mockPdndService.organization.mockReturnValue(throwError(() => ({ message: 'Org error' })));
      makeFormValid(PdndBaseUri.ORGANIZATIONS);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Org error');
    });
  });

  // --- _onSubmit: ATTRIBUTES ---

  describe('_onSubmit ATTRIBUTES', () => {
    it('should call pdndService.attribute and set jwk with mapped data', () => {
      const attrData = { id: 'attr-1', name: 'Attr Name', kind: 'CERTIFIED' };
      mockPdndService.attribute.mockReturnValue(of({ data: attrData }));
      makeFormValid(PdndBaseUri.ATTRIBUTES);

      component._onSubmit(component._formGroup.value);

      expect(mockPdndService.attribute).toHaveBeenCalledWith('collaudo', '00000000-0000-0000-0000-000000000003');
      expect(component.jwk).toEqual([{
        name: 'Attr Name',
        type: 'APP.LABEL.PDND.AttributeType.CERTIFIED'
      }]);
      expect(component._spin).toBe(false);
    });

    it('should set jwk with error when attribute response has no data', () => {
      const attrError = { status: 404 };
      mockPdndService.attribute.mockReturnValue(of({ data: null, error: attrError }));
      makeFormValid(PdndBaseUri.ATTRIBUTES);

      component._onSubmit(component._formGroup.value);

      expect(component.jwk).toEqual([attrError]);
      expect(component._spin).toBe(false);
    });

    it('should break without calling service when attributeId is empty', () => {
      makeFormValid(PdndBaseUri.ATTRIBUTES);
      const formValue = { ...component._formGroup.value, attributeId: null };
      component._onSubmit(formValue);
      expect(mockPdndService.attribute).not.toHaveBeenCalled();
    });

    it('should handle error from attribute service', () => {
      mockPdndService.attribute.mockReturnValue(throwError(() => ({ error: { message: 'Attr error' } })));
      makeFormValid(PdndBaseUri.ATTRIBUTES);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component._error).toBe(true);
    });
  });

  // --- _onSubmit: ESERVICES ---

  describe('_onSubmit ESERVICES', () => {
    it('should set jwk with eserviceId after setTimeout', () => {
      makeFormValid(PdndBaseUri.ESERVICES);

      component._onSubmit(component._formGroup.value);

      expect(component.jwk).toBeNull();
      vi.advanceTimersByTime(1);
      expect(component.jwk).toEqual(['00000000-0000-0000-0000-000000000004']);
    });

    it('should break without setting jwk when eserviceId is empty', () => {
      makeFormValid(PdndBaseUri.ESERVICES);
      const formValue = { ...component._formGroup.value, eserviceId: null };
      component._onSubmit(formValue);
      vi.advanceTimersByTime(1);
      expect(component.jwk).toBeNull();
    });
  });

  // --- _onSubmit: AGREEMENTS ---

  describe('_onSubmit AGREEMENTS', () => {
    const agreementData = {
      id: 'agr-1', eserviceId: 'es-1', descriptorId: 'desc-1',
      producerId: 'prod-1', consumerId: 'cons-1', state: 'ACTIVE'
    };
    const eserviceData = {
      id: 'es-1', name: 'E-Service', version: '1', description: 'desc',
      technology: 'REST', state: 'ACTIVE', serverUrls: ['http://server']
    };
    const descriptorData = {
      id: 'desc-1', version: '1', state: 'PUBLISHED', audience: ['http://aud'],
      serverUrls: ['http://srv'], voucherLifespan: 3600, dailyCallsPerConsumer: 100,
      dailyCallsTotal: 1000, interface: { id: 'if-1', name: 'interface.yaml', contentType: 'yaml' },
      docs: [{ id: 'doc-1', name: 'doc.pdf', contentType: 'application/pdf' }]
    };
    const producerData = { id: 'prod-1', name: 'Producer', externalId: { origin: 'IPA', id: 'p1' }, category: 'PA' };
    const consumerData = { id: 'cons-1', name: 'Consumer', externalId: { origin: 'IPA', id: 'c1' }, category: 'PA' };
    const attributesData = {
      certified: [{ id: 'cert-1', validity: 'VALID' }],
      declared: [{ id: 'decl-1', validity: 'INVALID' }],
      verified: [{ id: 'ver-1', validity: 'VALID' }]
    };
    const purposesData = {
      purposes: [{ id: 'pur-1', state: 'ACTIVE', throughput: 50 }]
    };

    it('should handle full agreement response with all data present', () => {
      mockPdndService.agreement.mockReturnValue(of({ data: agreementData }));
      mockPdndService.agreementAttributes.mockReturnValue(of({ data: attributesData }));
      mockPdndService.agreementPurposes.mockReturnValue(of({ data: purposesData }));
      mockPdndService.organization.mockImplementation((_env: string, id: string) => {
        if (id === 'prod-1') return of({ data: producerData });
        if (id === 'cons-1') return of({ data: consumerData });
        return of({ data: null });
      });
      mockPdndService.eservice.mockReturnValue(of({ data: eserviceData }));
      mockPdndService.eserviceDescriptor.mockReturnValue(of({ data: descriptorData }));
      makeFormValid(PdndBaseUri.AGREEMENTS);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component.jwk).toBeTruthy();
      expect(component.jwk.length).toBe(7);
      // agreement map
      expect(component.jwk[0]).toEqual({ state: 'ACTIVE' });
      // eService map
      expect(component.jwk[1].id).toBe('es-1');
      expect(component.jwk[1].name).toBe('E-Service v. 1');
      expect(component.jwk[1].technology).toBe('REST');
      // descriptors map
      expect(component.jwk[2]).toBeTruthy();
      expect(component.jwk[2][0].data.id).toBe('desc-1');
      expect(component.jwk[2][0].list).toBeTruthy();
      // producer map
      expect(component.jwk[3].name).toBe('Producer');
      expect(component.jwk[3].origin_external).toBe('IPA p1');
      // consumer map
      expect(component.jwk[4].name).toBe('Consumer');
      expect(component.jwk[4].origin_external).toBe('IPA c1');
      // attributes
      expect(component.jwk[5].length).toBe(3);
      // purposes
      expect(component.jwk[6].length).toBe(1);
      expect(component.jwk[6][0].id).toBe('pur-1');
    });

    it('should handle agreement response with all null data', () => {
      const agrError = { status: 500, message: 'error' };
      const attrError = { status: 500 };
      const purError = { status: 500 };
      mockPdndService.agreement.mockReturnValue(of({ data: null, error: agrError }));
      mockPdndService.agreementAttributes.mockReturnValue(of({ data: null, error: attrError }));
      mockPdndService.agreementPurposes.mockReturnValue(of({ data: null, error: purError }));
      // When agreement has no data, the code uses of(...) for org/eservice/descriptor
      makeFormValid(PdndBaseUri.AGREEMENTS);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component.jwk).toBeTruthy();
      expect(component.jwk.length).toBe(7);
      // all should be error objects
      expect(component.jwk[0]).toEqual(agrError);
      expect(component.jwk[5]).toEqual(attrError);
      expect(component.jwk[6]).toEqual(purError);
    });

    it('should handle agreement data present but inner calls return no data', () => {
      mockPdndService.agreement.mockReturnValue(of({ data: agreementData }));
      mockPdndService.agreementAttributes.mockReturnValue(of({ data: null, error: 'attr-err' }));
      mockPdndService.agreementPurposes.mockReturnValue(of({ data: null, error: 'pur-err' }));
      mockPdndService.organization.mockReturnValue(of({ data: null, error: 'org-err' }));
      mockPdndService.eservice.mockReturnValue(of({ data: null, error: 'es-err' }));
      mockPdndService.eserviceDescriptor.mockReturnValue(of({ data: null, error: 'desc-err' }));
      makeFormValid(PdndBaseUri.AGREEMENTS);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component.jwk[0]).toEqual({ state: 'ACTIVE' });
      expect(component.jwk[1]).toBe('es-err');
      expect(component.jwk[2]).toBe('desc-err');
      expect(component.jwk[5]).toBe('attr-err');
      expect(component.jwk[6]).toBe('pur-err');
    });

    it('should break without calling services when agreementId is empty', () => {
      makeFormValid(PdndBaseUri.AGREEMENTS);
      const formValue = { ...component._formGroup.value, agreementId: null };
      component._onSubmit(formValue);
      expect(mockPdndService.agreement).not.toHaveBeenCalled();
    });

    it('should handle error from agreement forkJoin', () => {
      mockPdndService.agreement.mockReturnValue(throwError(() => ({ error: { message: 'forkJoin error' } })));
      mockPdndService.agreementAttributes.mockReturnValue(of({ data: null }));
      mockPdndService.agreementPurposes.mockReturnValue(of({ data: null }));
      makeFormValid(PdndBaseUri.AGREEMENTS);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('forkJoin error');
    });
  });

  // --- _onSubmit: PURPOSES ---

  describe('_onSubmit PURPOSES', () => {
    const purposeData = { id: 'pur-1', throughput: 100, state: 'ACTIVE' };
    const purposeAgreementData = {
      id: 'agr-1', eserviceId: 'es-1', descriptorId: 'desc-1',
      producerId: 'prod-1', consumerId: 'cons-1', state: 'ACTIVE'
    };
    const eserviceData = {
      id: 'es-1', name: 'SvcName', version: '2', description: 'svc desc',
      technology: 'SOAP', state: 'PUBLISHED', serverUrls: ['http://srv']
    };
    const descriptorData = {
      id: 'desc-1', version: '2', state: 'PUBLISHED', audience: ['http://aud'],
      serverUrls: ['http://srv'], voucherLifespan: 7200, dailyCallsPerConsumer: 200,
      dailyCallsTotal: 2000, interface: { id: 'if-1', name: 'wsdl.xml', contentType: 'xml' },
      docs: [{ id: 'doc-1', name: 'readme.pdf', contentType: 'application/pdf' }]
    };
    const producerData = { id: 'prod-1', name: 'ProdOrg', externalId: { origin: 'IPA', id: 'p2' }, category: 'PA' };
    const consumerData = { id: 'cons-1', name: 'ConsOrg', externalId: { origin: 'IPA', id: 'c2' }, category: 'PA' };

    it('should handle full purpose response with all data present', () => {
      mockPdndService.purpose.mockReturnValue(of({ data: purposeData }));
      mockPdndService.purposeAgreement.mockReturnValue(of({ data: purposeAgreementData }));
      mockPdndService.eservice.mockReturnValue(of({ data: eserviceData }));
      mockPdndService.eserviceDescriptor.mockReturnValue(of({ data: descriptorData }));
      mockPdndService.organization.mockImplementation((_env: string, id: string) => {
        if (id === 'prod-1') return of({ data: producerData });
        if (id === 'cons-1') return of({ data: consumerData });
        return of({ data: null });
      });
      makeFormValid(PdndBaseUri.PURPOSES);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component.jwk).toBeTruthy();
      expect(component.jwk.length).toBe(6);
      // purpose map
      expect(component.jwk[0]).toEqual(purposeData);
      // purposeAgreement map
      expect(component.jwk[1]).toEqual({ state: 'ACTIVE' });
      // eService map
      expect(component.jwk[2].id).toBe('es-1');
      expect(component.jwk[2].name).toBe('SvcName v. 2');
      expect(component.jwk[2].technology).toBe('SOAP');
      // descriptor map
      expect(component.jwk[3][0].data.id).toBe('desc-1');
      expect(component.jwk[3][0].data.voucher_lifespan).toBe(7200);
      expect(component.jwk[3][0].list).toBeTruthy();
      // producer map
      expect(component.jwk[4].name).toBe('ProdOrg');
      expect(component.jwk[4].origin_external).toBe('IPA p2');
      // consumer map
      expect(component.jwk[5].name).toBe('ConsOrg');
    });

    it('should handle purpose response with all null data', () => {
      const purErr = { status: 404 };
      const purAgrErr = { status: 404 };
      mockPdndService.purpose.mockReturnValue(of({ data: null, error: purErr }));
      mockPdndService.purposeAgreement.mockReturnValue(of({ data: null, error: purAgrErr }));
      makeFormValid(PdndBaseUri.PURPOSES);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component.jwk).toBeTruthy();
      expect(component.jwk.length).toBe(6);
      expect(component.jwk[0]).toEqual(purErr);
      expect(component.jwk[1]).toEqual(purAgrErr);
    });

    it('should handle purpose present but purposeAgreement null, inner calls fallback to of()', () => {
      mockPdndService.purpose.mockReturnValue(of({ data: purposeData }));
      const purAgrErr = { status: 500 };
      mockPdndService.purposeAgreement.mockReturnValue(of({ data: null, error: purAgrErr }));
      makeFormValid(PdndBaseUri.PURPOSES);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component.jwk[0]).toEqual(purposeData);
      expect(component.jwk[1]).toEqual(purAgrErr);
      // inner calls used of() with error fallback
      expect(component.jwk[2]).toEqual(purAgrErr);
      expect(component.jwk[3]).toEqual(purAgrErr);
      expect(component.jwk[4]).toEqual(purAgrErr);
      expect(component.jwk[5]).toEqual(purAgrErr);
    });

    it('should handle inner calls returning null data', () => {
      mockPdndService.purpose.mockReturnValue(of({ data: purposeData }));
      mockPdndService.purposeAgreement.mockReturnValue(of({ data: purposeAgreementData }));
      mockPdndService.eservice.mockReturnValue(of({ data: null, error: 'es-err' }));
      mockPdndService.eserviceDescriptor.mockReturnValue(of({ data: null, error: 'desc-err' }));
      mockPdndService.organization.mockReturnValue(of({ data: null, error: 'org-err' }));
      makeFormValid(PdndBaseUri.PURPOSES);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component.jwk[0]).toEqual(purposeData);
      expect(component.jwk[1]).toEqual({ state: 'ACTIVE' });
      expect(component.jwk[2]).toBe('es-err');
      expect(component.jwk[3]).toBe('desc-err');
    });

    it('should break without calling service when purposeId is empty', () => {
      makeFormValid(PdndBaseUri.PURPOSES);
      const formValue = { ...component._formGroup.value, purposeId: null };
      component._onSubmit(formValue);
      expect(mockPdndService.purpose).not.toHaveBeenCalled();
    });

    it('should handle error from purpose forkJoin', () => {
      mockPdndService.purpose.mockReturnValue(throwError(() => ({ message: 'Purpose error' })));
      mockPdndService.purposeAgreement.mockReturnValue(of({ data: null }));
      makeFormValid(PdndBaseUri.PURPOSES);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Purpose error');
    });
  });

  // --- _onSubmit: SERVICE_LIST ---

  describe('_onSubmit SERVICE_LIST', () => {
    it('should call pdndService.serviceList and set jwk with mapped services', () => {
      const servicesData = {
        eservices: [
          { id: 'es-1', name: 'Svc1', version: '1', description: 'desc1', technology: 'REST', state: 'ACTIVE', serverUrls: [] },
          { id: 'es-2', name: 'Svc2', version: '2', description: 'desc2', technology: 'SOAP', state: 'INACTIVE', serverUrls: [] }
        ]
      };
      mockPdndService.serviceList.mockReturnValue(of({ data: servicesData }));
      makeFormValid(PdndBaseUri.SERVICE_LIST);

      component._onSubmit(component._formGroup.value);

      expect(mockPdndService.serviceList).toHaveBeenCalledWith('collaudo', 'IPA', 'ext123', 'IPA', 'code123');
      expect(component._spin).toBe(false);
      expect(component.jwk).toBeTruthy();
      expect(component.jwk[0].length).toBe(2);
      expect(component.jwk[0][0].data.id).toBe('es-1');
      expect(component.jwk[0][0].data.name).toBe('Svc1 v. 1');
      expect(component.jwk[0][0].list).toEqual([]);
      expect(component.jwk[0][1].data.id).toBe('es-2');
    });

    it('should set jwk with error when serviceList response has no data', () => {
      const slError = { status: 404 };
      mockPdndService.serviceList.mockReturnValue(of({ data: null, error: slError }));
      makeFormValid(PdndBaseUri.SERVICE_LIST);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component.jwk).toEqual([slError]);
    });

    it('should break without calling service when required fields are empty', () => {
      makeFormValid(PdndBaseUri.SERVICE_LIST);
      const formValue = { ...component._formGroup.value, organizationOrigin: null };
      component._onSubmit(formValue);
      expect(mockPdndService.serviceList).not.toHaveBeenCalled();
    });

    it('should break when organizationExternalId is empty', () => {
      makeFormValid(PdndBaseUri.SERVICE_LIST);
      const formValue = { ...component._formGroup.value, organizationExternalId: null };
      component._onSubmit(formValue);
      expect(mockPdndService.serviceList).not.toHaveBeenCalled();
    });

    it('should break when attributeOrigin is empty', () => {
      makeFormValid(PdndBaseUri.SERVICE_LIST);
      const formValue = { ...component._formGroup.value, attributeOrigin: null };
      component._onSubmit(formValue);
      expect(mockPdndService.serviceList).not.toHaveBeenCalled();
    });

    it('should break when attributeCode is empty', () => {
      makeFormValid(PdndBaseUri.SERVICE_LIST);
      const formValue = { ...component._formGroup.value, attributeCode: null };
      component._onSubmit(formValue);
      expect(mockPdndService.serviceList).not.toHaveBeenCalled();
    });

    it('should handle error from serviceList service', () => {
      mockPdndService.serviceList.mockReturnValue(throwError(() => ({ error: { message: 'SL error' } })));
      makeFormValid(PdndBaseUri.SERVICE_LIST);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('SL error');
    });
  });

  // --- _onSubmit: EVENTS ---

  describe('_onSubmit EVENTS', () => {
    it('should call pdndService.events and set jwk with sorted events', () => {
      const eventsData = {
        events: [
          { eventId: 1, eventType: 'ADDED', objectType: 'ESERVICE', objectId: { kid: 'k1' } },
          { eventId: 3, eventType: 'UPDATED', objectType: 'ESERVICE', objectId: { kid: 'k2' } },
          { eventId: 2, eventType: 'REMOVED', objectType: 'KEY', objectId: { kid: 'k3' } }
        ]
      };
      mockPdndService.events.mockReturnValue(of({ data: eventsData }));
      makeFormValid(PdndBaseUri.EVENTS);

      component._onSubmit(component._formGroup.value);

      expect(mockPdndService.events).toHaveBeenCalledWith(PdndEventType.ANY, 'collaudo', 1, 100);
      expect(component._spin).toBe(false);
      expect(component.jwk).toBeTruthy();
      // Events should be sorted descending
      expect(component.jwk[0][0].eventId).toBe(3);
      expect(component.jwk[0][1].eventId).toBe(2);
      expect(component.jwk[0][2].eventId).toBe(1);
    });

    it('should set jwk with error when events response has no data', () => {
      const evError = { status: 500 };
      mockPdndService.events.mockReturnValue(of({ data: null, error: evError }));
      makeFormValid(PdndBaseUri.EVENTS);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component.jwk).toEqual([evError]);
    });

    it('should break without calling service when eventType is empty', () => {
      makeFormValid(PdndBaseUri.EVENTS);
      const formValue = { ...component._formGroup.value, eventType: null };
      component._onSubmit(formValue);
      expect(mockPdndService.events).not.toHaveBeenCalled();
    });

    it('should break without calling service when lastEventId is empty', () => {
      makeFormValid(PdndBaseUri.EVENTS);
      const formValue = { ...component._formGroup.value, lastEventId: null };
      component._onSubmit(formValue);
      expect(mockPdndService.events).not.toHaveBeenCalled();
    });

    it('should break without calling service when limit is empty', () => {
      makeFormValid(PdndBaseUri.EVENTS);
      const formValue = { ...component._formGroup.value, limit: null };
      component._onSubmit(formValue);
      expect(mockPdndService.events).not.toHaveBeenCalled();
    });

    it('should handle error from events service', () => {
      mockPdndService.events.mockReturnValue(throwError(() => ({ error: { message: 'Events error' } })));
      makeFormValid(PdndBaseUri.EVENTS);

      component._onSubmit(component._formGroup.value);

      expect(component._spin).toBe(false);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Events error');
    });
  });

  // --- _onSubmit common behavior ---

  describe('_onSubmit common behavior', () => {
    it('should markAllAsTouched and set spin/clear error on valid submit', () => {
      mockPdndService.keys.mockReturnValue(of({ kid: 'k' }));
      makeFormValid(PdndBaseUri.KEYS);

      // Pre-set error state to verify it gets cleared
      component._error = true;
      component._errorMsg = 'old error';

      component._onSubmit(component._formGroup.value);

      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });

    it('should clear previous results before submit', () => {
      mockPdndService.keys.mockReturnValue(of({ kid: 'k' }));
      makeFormValid(PdndBaseUri.KEYS);
      component.jwk = { old: 'data' };

      component._onSubmit(component._formGroup.value);

      expect(component.jwk).toEqual({ kid: 'k' });
    });
  });

  // --- pdndTypes configuration check ---

  describe('pdndTypes configuration', () => {
    it('should have correct number of pdndTypes', () => {
      expect(component.pdndTypes.length).toBe(9);
    });

    it('should have correct URIs for all types', () => {
      const uris = component.pdndTypes.map(t => t.uri);
      expect(uris).toEqual([
        PdndBaseUri.KEYS,
        PdndBaseUri.CLIENTS,
        PdndBaseUri.ORGANIZATIONS,
        PdndBaseUri.ATTRIBUTES,
        PdndBaseUri.ESERVICES,
        PdndBaseUri.AGREEMENTS,
        PdndBaseUri.PURPOSES,
        PdndBaseUri.SERVICE_LIST,
        PdndBaseUri.EVENTS
      ]);
    });

    it('should have view defined for all types except KEYS', () => {
      expect(component.pdndTypes[0].view).toBeUndefined(); // KEYS has no view
      for (let i = 1; i < component.pdndTypes.length; i++) {
        expect(component.pdndTypes[i].view).toBeTruthy();
      }
    });

    it('AGREEMENTS type should have 7 views', () => {
      const agreementsType = component.pdndTypes.find(t => t.uri === PdndBaseUri.AGREEMENTS)!;
      expect(agreementsType.view!.length).toBe(7);
    });

    it('PURPOSES type should have 6 views', () => {
      const purposesType = component.pdndTypes.find(t => t.uri === PdndBaseUri.PURPOSES)!;
      expect(purposesType.view!.length).toBe(6);
    });
  });
});
