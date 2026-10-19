import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { EventType, Tools } from '@linkit/components';
import { ServizioCreateWizardComponent } from './servizio-create-wizard.component';

describe('ServizioCreateWizardComponent - configurazione caricata dopo il costruttore', () => {
  let savedConfigurazione: any;
  let listeners: Record<string, any>;
  let mockEvents: any;
  let mockApiService: any;

  const build = () => new ServizioCreateWizardComponent(
    {} as any,
    {} as any,
    { instant: (k: string) => k } as any,
    { getConfiguration: vi.fn().mockReturnValue({ AppConfig: { GOVAPI: { HOST: '' }, Services: {} } }) } as any,
    mockApiService,
    {} as any,
    { _getConfigModule: vi.fn().mockReturnValue({}), isGestore: vi.fn().mockReturnValue(true) } as any,
    {} as any,
    mockEvents
  );

  beforeEach(() => {
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = null as any;
    listeners = {};
    mockEvents = {
      on: vi.fn((name: string, fn: any) => { listeners[name] = fn; }),
      off: vi.fn()
    };
    mockApiService = { getDetails: vi.fn() };
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should read the multi-domain flag again when the profile is updated', () => {
    const component = build();
    expect(component._hasMultiDominio).toBeFalsy();

    Tools.Configurazione = { dominio: { multi_dominio: { email: 'help@ente.it' } } } as any;
    component._formGroup = new FormGroup({ id_dominio: new FormControl(null), referente: new FormControl(null), referente_tecnico: new FormControl(null) });
    listeners[EventType.PROFILE_UPDATE]();

    expect(component._hasMultiDominio).toBeTruthy();
    expect(component._multiDominioEmail).toBe('help@ente.it');
    expect(component._formGroup.get('referente')?.disabled).toBe(true);
    expect(component._formGroup.get('referente_tecnico')?.disabled).toBe(true);
  });

  it('should apply the default domain when the configuration arrives after the form', () => {
    const component = build();
    Tools.Configurazione = { dominio: { dominio_default: 'd1' } } as any;
    mockApiService.getDetails.mockReturnValue(of({ id_dominio: 'd1', skip_collaudo: true, soggetto_referente: { skip_collaudo: true } }));
    component._formGroup = new FormGroup({ id_dominio: new FormControl(null), skip_collaudo: new FormControl({ value: false, disabled: true }) });

    listeners[EventType.PROFILE_UPDATE]();

    expect(component._formGroup.get('id_dominio')?.value).toBe('d1');
    expect(mockApiService.getDetails).toHaveBeenCalledWith('domini', 'd1');
    expect(component._formGroup.get('skip_collaudo')?.enabled).toBe(true);
  });

  it('should ignore the update before the form is initialised and stop listening on destroy', () => {
    const component = build();
    Tools.Configurazione = { dominio: { dominio_default: 'd1' } } as any;
    listeners[EventType.PROFILE_UPDATE]();
    expect(mockApiService.getDetails).not.toHaveBeenCalled();

    component.ngOnDestroy();
    expect(mockEvents.off).toHaveBeenCalledWith(EventType.PROFILE_UPDATE, listeners[EventType.PROFILE_UPDATE]);
  });
});
