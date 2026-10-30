import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Clipboard } from '@angular/cdk/clipboard';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { WsdlComponent } from './wsdl.component';

describe('WsdlComponent', () => {
  let component: WsdlComponent;
  let savedConfigurazione: any;
  const mockApiService = { saveElement: vi.fn() };
  const mockClipboard = { copy: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = {
      servizio: { api: { url_invocazione: {
        etichetta_default: 'Rete interna',
        produzione: [{ identificativo: 'gw_esterno', etichetta: 'Rete internet' }]
      } } }
    } as any;
    TestBed.configureTestingModule({
      providers: [
        { provide: OpenAPIService, useValue: mockApiService },
        { provide: Clipboard, useValue: mockClipboard }
      ]
    });
    component = TestBed.runInInjectionContext(() => new WsdlComponent());
    component.environment = 'produzione';
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
    vi.useRealTimers();
  });

  const portType = {
    port_type: 'Servizio',
    url_invocazione: 'https://int/ws',
    url_invocazione_aggiuntive: [{ identificativo: 'gw_esterno', etichetta: 'Rete internet', url_invocazione: 'https://ext/ws' }]
  };

  it('should list the first URL and the additional ones', () => {
    component.api = { configurazione_produzione: {} };
    expect(component._urlRighe(portType)).toEqual([
      { etichetta: null, etichettaKey: 'APP.WSDL.LABEL.UrlInvocazione', url: 'https://int/ws' },
      { etichetta: 'Rete internet', etichettaKey: 'APP.WSDL.LABEL.UrlInvocazione', url: 'https://ext/ws' }
    ]);
  });

  it('should label the first URL from the API selection when available', () => {
    component.api = { configurazione_produzione: { url_invocazione: ['default', 'gw_esterno'] } };
    expect(component._urlRighe(portType)[0]).toEqual({ etichetta: 'Rete interna', etichettaKey: 'APP.LABEL.UrlPredefinita', url: 'https://int/ws' });
  });

  it('should return no rows without a main URL', () => {
    expect(component._urlRighe({ url_invocazione_aggiuntive: portType.url_invocazione_aggiuntive })).toEqual([]);
  });

  it('should add the URL rows to each port type of the response', () => {
    mockApiService.saveElement.mockReturnValue(of([portType]));
    component.api = { id_api: 'a1', configurazione_produzione: { protocollo: 'soap', specifica: { uuid: 'u1' } } };
    component._initWsdl();
    expect(component._risorse[0]._urlRighe.length).toBe(2);
  });

  it('should copy a URL and reset the feedback', () => {
    vi.useFakeTimers();
    component.copyUrl('https://ext/ws', '0-1');
    expect(mockClipboard.copy).toHaveBeenCalledWith('https://ext/ws');
    expect(component._urlCopiata).toBe('0-1');
    vi.advanceTimersByTime(3000);
    expect(component._urlCopiata).toBeNull();
  });
});
