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

  it('should map the selected organization option to fruizione and its validators', () => {
    const component = build();
    component._formGroup = new FormGroup({
      fruizione: new FormControl(false),
      id_organizzazione_interna: new FormControl('org'),
      id_soggetto_erogatore: new FormControl('sog')
    });
    expect(component._opzioneIntermediazione().help).toBe('fruizione_interna');

    component._formGroup.get('fruizione')?.setValue(true);
    component._onChangeFruizione(true);
    expect(component._isFruizione).toBe(true);
    expect(component._opzioneIntermediazione().help).toBe('fruizione_esterna');
    expect(component._formGroup.get('id_organizzazione_interna')?.hasError('required')).toBe(false);

    component._onChangeFruizione(false);
    expect(component._formGroup.get('id_organizzazione_interna')?.value).toBeNull();
    expect(component._formGroup.get('id_soggetto_erogatore')?.valid).toBe(true);
  });

  it('should page the domains and load the next page on scroll to end', () => {
    vi.useFakeTimers();
    mockApiService.getList = vi.fn((_m: string, opts: any) => of({
      content: [{ id_dominio: `d${opts.params.page}` }], page: { totalPages: 2 }
    }));
    const component = build();
    component._initDominiSelect([]);
    let _items: any[] = [];
    component.dominiTypeahead.items$.subscribe((items: any[]) => _items = items);
    vi.advanceTimersByTime(300);
    expect(mockApiService.getList).toHaveBeenCalledWith('domini', { params: { page: 0, deprecato: false } });
    component.dominiTypeahead.loadMore();
    expect(_items.map((d: any) => d.id_dominio)).toEqual(['d0', 'd1']);
    component.dominiTypeahead.input$.next('regione');
    vi.advanceTimersByTime(300);
    expect(mockApiService.getList).toHaveBeenLastCalledWith('domini', { params: { page: 0, q: 'regione', deprecato: false } });
    vi.useRealTimers();
  });

  it('should remove the deprecated filter when deprecated domains are included, keeping the selected one', () => {
    vi.useFakeTimers();
    mockApiService.getList = vi.fn().mockReturnValue(of({ content: [{ id_dominio: 'd0' }], page: { totalPages: 1 } }));
    const component = build();
    component.selectedDominio = { id_dominio: 'scelto' };
    component._onIncludiDominiDeprecati(true);
    let _items: any[] = [];
    component.dominiTypeahead.items$.subscribe((items: any[]) => _items = items);
    vi.advanceTimersByTime(300);
    expect(mockApiService.getList).toHaveBeenLastCalledWith('domini', { params: { page: 0 } });
    expect(_items.map((d: any) => d.id_dominio)).toEqual(['scelto', 'd0']);

    component._onIncludiDominiDeprecati(false);
    component.dominiTypeahead.items$.subscribe();
    vi.advanceTimersByTime(300);
    expect(mockApiService.getList).toHaveBeenLastCalledWith('domini', { params: { page: 0, deprecato: false } });
    vi.useRealTimers();
  });

  it('should use the logged user as contact of the service while the self flag is checked', () => {
    const component = build();
    const auth = (component as any).authenticationService;
    auth.getUser = vi.fn().mockReturnValue({ id_utente: 'me' });
    auth._getWorkflowCambiStato = vi.fn().mockReturnValue({ dati_obbligatori: ['referenti'] });
    component._formGroup = new FormGroup({ referente: new FormControl(null) });

    expect(component._isSelfReferente).toBe(true);
    const body = component._prepareBodySaveServizio({ id_dominio: 'd1', referente: null, referente_tecnico: 't1' });
    expect(body.referenti).toEqual([
      { id_utente: 'me', tipo: 'referente' },
      { id_utente: 't1', tipo: 'referente_tecnico' }
    ]);
  });

  it('should require the selected contact only when the self flag is unchecked', () => {
    const component = build();
    const auth = (component as any).authenticationService;
    auth.getUser = vi.fn().mockReturnValue({ id_utente: 'me' });
    auth._getWorkflowCambiStato = vi.fn().mockReturnValue({ dati_obbligatori: ['referenti'] });
    component._formGroup = new FormGroup({ referente: new FormControl(null) });

    component._onChangeSelfReferente(false);
    expect(component._formGroup.get('referente')?.hasError('required')).toBe(true);
    component._formGroup.get('referente')?.setValue('u2');
    expect(component._prepareBodySaveServizio({ id_dominio: 'd1', referente: 'u2' }).referenti).toEqual([{ id_utente: 'u2', tipo: 'referente' }]);

    component._onChangeSelfReferente(true);
    expect(component._formGroup.get('referente')?.value).toBeNull();
    expect(component._formGroup.get('referente')?.valid).toBe(true);
  });
});
