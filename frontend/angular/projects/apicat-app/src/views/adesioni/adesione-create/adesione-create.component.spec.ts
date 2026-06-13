import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { AdesioneCreateComponent } from './adesione-create.component';

/**
 * Test del componente di creazione adesione (FASE 0 wizard-like).
 * Il componente serve il solo flusso "new" (rotta `new/edit`); qui
 * verifichiamo istanziazione, chip riepilogo servizio, costruzione del
 * payload `POST /adesioni`, submit (busy + saveElement) e chiusura.
 */
describe('AdesioneCreateComponent', () => {
  let component: AdesioneCreateComponent;

  const mockRoute = {
    params: of({ id: 'new' }),
    queryParams: of({}),
    data: of({}),
    parent: { params: of({}) },
  } as any;
  const mockRouter = { navigate: vi.fn(), navigateByUrl: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { Services: { hideVersions: false }, GOVAPI: { HOST: 'http://localhost' } }
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = { on: vi.fn(), broadcast: vi.fn() } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({ id_adesione: 'AD1', servizio: { nome: 's' }, soggetto: { nome: 'sog', organizzazione: { id_organizzazione: 'o', nome: 'o' } } })),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
  } as any;
  const mockAuthService = {
    getUser: vi.fn().mockReturnValue({ id_utente: 'U1', ruolo: 'referente_servizio' }),
    getCurrentSession: vi.fn().mockReturnValue(null),
    getCurrentOrganization: vi.fn().mockReturnValue(null),
  } as any;
  const mockLocation = { back: vi.fn() } as any;

  const newComponent = () => new AdesioneCreateComponent(
    mockRoute, mockRouter, mockTranslate,
    mockConfigService, mockTools, mockEventsManager,
    mockApiService, mockUtils, mockAuthService, mockLocation
  );

  beforeEach(() => {
    vi.clearAllMocks();
    Tools.OnError = vi.fn();
    Tools.showMessage = vi.fn();
    Tools.Configurazione = null;
    component = newComponent();
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(AdesioneCreateComponent.Name).toBe('AdesioneCreateComponent');
  });

  it('should have model set to adesioni', () => {
    expect(component.model).toBe('adesioni');
  });

  it('should expose 4 static fasi-bar steps with "creazione" current', () => {
    expect(component._fasiBarSteps).toHaveLength(4);
    expect(component._fasiBarSteps[0].code).toBe('creazione');
    expect(component._fasiCurrent).toBe('creazione');
  });

  describe('_servizioChips', () => {
    it('should be empty when no service is selected', () => {
      component._servizio = null;
      expect(component._servizioChips).toEqual([]);
    });

    it('should build chips for dominio, stato (ok) and visibilita', () => {
      component._servizio = {
        nome: 'Srv', versione: '1',
        dominio: { nome: 'Welfare' },
        stato: 'pubblicato_produzione',
        visibilita: 'pubblico',
      };
      const chips = component._servizioChips;
      expect(chips.map(c => c.label)).toContain('Welfare');
      const stato = chips.find(c => c.icon === 'bi-broadcast');
      expect(stato?.variant).toBe('lnk-pill-ok');
      const vis = chips.find(c => c.icon === 'bi-globe');
      expect(vis?.variant).toBe('lnk-pill-muted');
    });

    it('should mark non-public visibility as warn with lock icon', () => {
      component._servizio = { dominio: { nome: 'D' }, visibilita: 'riservato' };
      const vis = component._servizioChips.find(c => c.icon === 'bi-lock');
      expect(vis?.variant).toBe('lnk-pill-warn');
    });
  });

  describe('_prepareBodySaveAdesione', () => {
    it('should add current user as referente when self-referente is on', () => {
      component._isSelfReferente = true;
      const body = component._prepareBodySaveAdesione({
        id_soggetto: 'S1', id_servizio: 'SRV1', id_logico: null, referente_tecnico: 'RT1',
      });
      expect(body.id_servizio).toBe('SRV1');
      expect(body.referenti).toContainEqual({ id_utente: 'U1', tipo: 'referente' });
      expect(body.referenti).toContainEqual({ id_utente: 'RT1', tipo: 'referente_tecnico' });
      expect(body.id_logico).toBeUndefined(); // null rimosso
    });

    it('should use selected referente when self-referente is off', () => {
      component._isSelfReferente = false;
      const body = component._prepareBodySaveAdesione({
        id_soggetto: 'S1', id_servizio: 'SRV1', referente: 'R9',
      });
      expect(body.referenti).toContainEqual({ id_utente: 'R9', tipo: 'referente' });
      expect(body.referenti).not.toContainEqual({ id_utente: 'U1', tipo: 'referente' });
    });
  });

  describe('__onSave', () => {
    it('should set busy, POST adesioni and navigate to the created id', () => {
      component._isSelfReferente = true;
      component.__onSave({ id_soggetto: 'S1', id_servizio: 'SRV1' });
      expect(mockApiService.saveElement).toHaveBeenCalledWith('adesioni', expect.objectContaining({ id_servizio: 'SRV1' }));
      expect(mockRouter.navigate).toHaveBeenCalled();
      expect(component._spin).toBe(false); // observable sincrono -> torna false a fine
    });

    it('should surface the error and clear busy on failure', () => {
      mockApiService.saveElement.mockReturnValueOnce({
        subscribe: ({ error }: any) => error({ error: 'boom' }),
      });
      component.__onSave({ id_soggetto: 'S1', id_servizio: 'SRV1' });
      expect(component._error).toBe(true);
      expect(component._spin).toBe(false);
    });
  });

  it('_onSubmit should save only when editing and form valid', () => {
    const saveSpy = vi.spyOn(component, '__onSave');
    component._isEdit = false;
    component._onSubmit({});
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('onCloseCreate should go back in history', () => {
    component.onCloseCreate();
    expect(mockLocation.back).toHaveBeenCalled();
  });
});
