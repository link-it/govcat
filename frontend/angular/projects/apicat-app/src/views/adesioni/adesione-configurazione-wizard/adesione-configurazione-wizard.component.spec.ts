import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, EMPTY } from 'rxjs';
import { AdesioneConfigurazioneWizardComponent, AccordionType } from './adesione-configurazione-wizard.component';
import { Tools } from '@linkit/components';
import { AmbienteEnum } from '@app/model/ambienteEnum';
import { RightsEnum } from '@app/model/grant';
import { ClassiEnum } from '@app/provider/check.provider';

// Mock saveAs which is declared as a global in the component
(globalThis as any).saveAs = vi.fn();

describe('AdesioneConfigurazioneWizardComponent', () => {
  let component: AdesioneConfigurazioneWizardComponent;

  const mockRoute = { params: of({ id: '1' }), data: of({}) } as any;
  const mockRouter = { navigate: vi.fn(), getCurrentNavigation: vi.fn().mockReturnValue(null) } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockEventsManager = {
    on: vi.fn(),
    broadcast: vi.fn(),
  } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElementRelated: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of({ body: new Blob() })),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({ proprieta_custom: [] }),
    getUser: vi.fn().mockReturnValue({ ruolo: 'referente_servizio' }),
    canEdit: vi.fn().mockReturnValue(true),
    canJoin: vi.fn().mockReturnValue(true),
    isGestore: vi.fn().mockReturnValue(false),
    canChangeStatus: vi.fn().mockReturnValue(false),
    _getClassesNotModifiable: vi.fn().mockReturnValue([]),
    _isDatoSempreModificabile: vi.fn().mockReturnValue(false),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    getAnagrafiche: vi.fn().mockReturnValue({}),
    _confirmDialog: vi.fn(),
    __confirmCambioStatoServizio: vi.fn(),
    _removeEmpty: vi.fn((obj: any) => obj),
    scrollTo: vi.fn(),
  } as any;
  const mockCkeckProvider = {
    check: vi.fn().mockReturnValue(of({ esito: 'ok', errori: [] })),
    getObjectByDato: vi.fn().mockReturnValue(undefined),
    isSottotipoGroupCompleted: vi.fn().mockReturnValue(true),
    isSottotipoCompleted: vi.fn().mockReturnValue(true),
  } as any;

  let savedConfigurazione: any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = null;
    component = new AdesioneConfigurazioneWizardComponent(
      mockRoute, mockRouter, mockTranslate, mockModalService,
      mockConfigService, mockEventsManager, mockApiService,
      mockAuthService, mockUtils, mockCkeckProvider
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(AdesioneConfigurazioneWizardComponent.Name).toBe('AdesioneConfigurazioneWizardComponent');
  });

  it('should have model set to adesioni', () => {
    expect(component.model).toBe('adesioni');
  });

  // -------- Constructor / default values --------

  it('should initialize default property values', () => {
    expect(component.title).toBe('');
    expect(component.id).toBe(0);
    expect(component.isBozza).toBe(false);
    expect(component.adesione).toBeNull();
    expect(component.id_servizio).toBeNull();
    expect(component.servizio).toBeNull();
    expect(component.isEdit).toBe(false);
    expect(component.spin).toBe(true);
    expect(component.changingStatus).toBe(false);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._errors).toEqual([]);
    expect(component.isDominioEsterno).toBe(false);
    expect(component.idDominioEsterno).toBeNull();
    expect(component.idSoggettoDominioEsterno).toBeNull();
    expect(component.singleColumn).toBe(true);
    expect(component.showGroupLabel).toBe(false);
    expect(component.downloading).toBe(false);
    expect(component.returnWeb).toBe(false);
    expect(component.saveSkipCollaudo).toBe(false);
    expect(component.dataStructureResults).toEqual({ esito: 'ok' });
    expect(component.loadingCheckDati).toBe(false);
  });

  it('should subscribe to route.data in constructor', () => {
    const breadcrumbsData = {
      serviceBreadcrumbs: {
        service: { id_servizio: 100 },
        breadcrumbs: [{ label: 'Test', url: '/test', type: 'link' }]
      }
    };
    const routeWithData = { params: of({}), data: of(breadcrumbsData) } as any;
    const comp = new AdesioneConfigurazioneWizardComponent(
      routeWithData, mockRouter, mockTranslate, mockModalService,
      mockConfigService, mockEventsManager, mockApiService,
      mockAuthService, mockUtils, mockCkeckProvider
    );
    expect(comp.serviceBreadcrumbs).toEqual(breadcrumbsData.serviceBreadcrumbs);
  });

  it('should call configService.getConfiguration and getConfig in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(mockConfigService.getConfig).toHaveBeenCalledWith('adesioni');
  });

  // -------- AccordionType enum --------

  it('should define AccordionType enum values', () => {
    expect(AccordionType.GENERAL_INFO).toBe('accordion-general-info');
    expect(AccordionType.ACCORDION_REFERENTI).toBe('accordion-referenti');
    expect(AccordionType.ACCORDION_COLLAUDO).toBe('accordion-collaudo');
    expect(AccordionType.ACCORDION_PRODUZIONE).toBe('accordion-produzione');
  });

  it('should map accordionTypeList to ClassiEnum values', () => {
    expect(component.accordionTypeList[AccordionType.GENERAL_INFO]).toBe(ClassiEnum.GENERALE);
    expect(component.accordionTypeList[AccordionType.ACCORDION_REFERENTI]).toBe(ClassiEnum.REFERENTI);
    expect(component.accordionTypeList[AccordionType.ACCORDION_COLLAUDO]).toBe(ClassiEnum.COLLAUDO);
    expect(component.accordionTypeList[AccordionType.ACCORDION_PRODUZIONE]).toBe(ClassiEnum.PRODUZIONE);
  });

  // -------- _geServicetTitle --------

  it('_geServicetTitle should return service name and version when adesione is set', () => {
    component.adesione = { servizio: { nome: 'MyAPI', versione: '2.0' } };
    expect(component._geServicetTitle()).toBe('MyAPI v. 2.0');
  });

  it('_geServicetTitle should return id as string when adesione is null but id is set', () => {
    component.adesione = null;
    component.id = 42;
    expect(component._geServicetTitle()).toBe('42');
  });

  it('_geServicetTitle should return <no-title> when adesione is null and id is 0', () => {
    component.adesione = null;
    component.id = 0;
    expect(component._geServicetTitle()).toBe('<no-title>');
  });

  // -------- _initBreadcrumb --------

  it('_initBreadcrumb should build breadcrumbs with config.useEditWizard', () => {
    component.adesione = {
      id_adesione: 'A1',
      id_logico: null,
      soggetto: { organizzazione: { nome: 'OrgTest' } },
      servizio: { nome: 'SvcTest', versione: '1.0', dominio: { id_dominio: 1 } },
      stato: 'bozza'
    };
    component.config = { useEditWizard: true };
    component.serviceBreadcrumbs = null;
    component._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(2);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Subscriptions');
    expect(component.breadcrumbs[1].label).toBe('OrgTest - SvcTest v. 1.0');
  });

  it('_initBreadcrumb should build 3-item breadcrumbs when useEditWizard is false', () => {
    component.adesione = {
      id_adesione: 'A2',
      id_logico: null,
      soggetto: { organizzazione: { nome: 'OrgX' } },
      servizio: { nome: 'SvcX', versione: '3.0', dominio: { id_dominio: 2 } },
      stato: 'bozza'
    };
    component.config = { useEditWizard: false };
    component.serviceBreadcrumbs = null;
    component._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[2].label).toBe('APP.TITLE.SubscriptionConfiguration');
  });

  it('_initBreadcrumb should use id_logico in title when present', () => {
    component.adesione = {
      id_adesione: 'A3',
      id_logico: 'LOG-123',
      soggetto: { organizzazione: { nome: 'OrgY' } },
      servizio: { nome: 'SvcY', versione: '1.0', dominio: { id_dominio: 3 } },
      stato: 'bozza'
    };
    component.config = { useEditWizard: true };
    component.serviceBreadcrumbs = null;
    component._initBreadcrumb();
    expect(component.breadcrumbs[1].label).toBe('LOG-123 (OrgY)');
  });

  it('_initBreadcrumb should prepend serviceBreadcrumbs when present', () => {
    component.adesione = {
      id_adesione: 'A4',
      id_logico: null,
      soggetto: { organizzazione: { nome: 'OrgZ' } },
      servizio: { nome: 'SvcZ', versione: '1.0', dominio: { id_dominio: 4 }, id_servizio: 100 },
      stato: 'bozza'
    };
    component.config = { useEditWizard: true };
    component.serviceBreadcrumbs = {
      service: { id_servizio: 100 },
      breadcrumbs: [{ label: 'Servizi', url: '/servizi', type: 'link' }]
    } as any;
    component._initBreadcrumb();
    expect(component.breadcrumbs[0].label).toBe('Servizi');
    expect(component.breadcrumbs[1].url).toContain('/servizi/100/adesioni');
  });

  // -------- onBreadcrumb --------

  it('onBreadcrumb should navigate to provided url', () => {
    component.onBreadcrumb({ url: '/adesioni/42/view' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/adesioni/42/view']);
  });

  // -------- backAdesione --------

  it('backAdesione should navigate to view of current adesione', () => {
    component.id = 99;
    component.backAdesione();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/adesioni/99/view']);
  });

  // -------- resetError --------

  it('resetError should clear error state', () => {
    component._error = true;
    component._errorMsg = 'Some error';
    component._errors = [{ msg: 'err1' }];
    component.resetError();
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._errors).toEqual([]);
  });

  // -------- isModifiableMapper --------

  it('isModifiableMapper should return true for collaudo with scrittura grant and isEdit', () => {
    component.grant = {
      ruoli: [],
      collaudo: RightsEnum.Scrittura,
      produzione: RightsEnum.Lettura,
    } as any;
    component.isEdit = true;
    expect(component.isModifiableMapper('', AmbienteEnum.Collaudo)).toBe(true);
  });

  it('isModifiableMapper should return false for collaudo with lettura grant', () => {
    component.grant = {
      ruoli: [],
      collaudo: RightsEnum.Lettura,
      produzione: RightsEnum.Lettura,
    } as any;
    component.isEdit = true;
    expect(component.isModifiableMapper('', AmbienteEnum.Collaudo)).toBe(false);
  });

  it('isModifiableMapper should return true for produzione with scrittura grant and isEdit', () => {
    component.grant = {
      ruoli: [],
      collaudo: RightsEnum.Lettura,
      produzione: RightsEnum.Scrittura,
    } as any;
    component.isEdit = true;
    expect(component.isModifiableMapper('', AmbienteEnum.Produzione)).toBe(true);
  });

  it('isModifiableMapper should return false when grant is null', () => {
    component.grant = null;
    expect(component.isModifiableMapper('', AmbienteEnum.Collaudo)).toBe(false);
  });

  it('isModifiableMapper should return false when isEdit is false even with scrittura', () => {
    component.grant = {
      ruoli: [],
      collaudo: RightsEnum.Scrittura,
      produzione: RightsEnum.Scrittura,
    } as any;
    component.isEdit = false;
    expect(component.isModifiableMapper('', AmbienteEnum.Collaudo)).toBe(false);
  });

  // -------- isGestoredMapper --------

  it('isGestoredMapper should delegate to authenticationService.isGestore', () => {
    component.grant = { ruoli: ['gestore'] } as any;
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component.isGestoredMapper('')).toBe(true);
    expect(mockAuthService.isGestore).toHaveBeenCalled();
  });

  it('isGestoredMapper should use empty array when grant is null', () => {
    component.grant = null;
    mockAuthService.isGestore.mockReturnValue(false);
    expect(component.isGestoredMapper('')).toBe(false);
  });

  // -------- canEditMapper --------

  it('canEditMapper should delegate to authenticationService.canEdit', () => {
    component.adesione = { stato: 'bozza' };
    component.grant = { ruoli: ['referente'] } as any;
    mockAuthService.canEdit.mockReturnValue(true);
    expect(component.canEditMapper()).toBe(true);
    expect(mockAuthService.canEdit).toHaveBeenCalledWith('adesione', 'adesione', 'bozza', ['referente']);
  });

  // -------- _isInCollaudoPhase --------

  it('_isInCollaudoPhase should return true for bozza state without skip_collaudo', () => {
    component.adesione = { stato: 'bozza', skip_collaudo: false };
    expect(component._isInCollaudoPhase()).toBe(true);
  });

  it('_isInCollaudoPhase should return true for richiesto_collaudo state', () => {
    component.adesione = { stato: 'richiesto_collaudo', skip_collaudo: false };
    expect(component._isInCollaudoPhase()).toBe(true);
  });

  it('_isInCollaudoPhase should return false when skip_collaudo is true', () => {
    component.adesione = { stato: 'bozza', skip_collaudo: true };
    expect(component._isInCollaudoPhase()).toBe(false);
  });

  it('_isInCollaudoPhase should return false for pubblicato_produzione state', () => {
    component.adesione = { stato: 'pubblicato_produzione', skip_collaudo: false };
    expect(component._isInCollaudoPhase()).toBe(false);
  });

  // -------- isStatusPubblicatoCollaudodMapper --------

  it('isStatusPubblicatoCollaudodMapper should return true for pubblicato_produzione', () => {
    expect(component.isStatusPubblicatoCollaudodMapper(false, 'pubblicato_produzione')).toBe(true);
  });

  it('isStatusPubblicatoCollaudodMapper should return false for other states', () => {
    expect(component.isStatusPubblicatoCollaudodMapper(false, 'bozza')).toBe(false);
  });

  // -------- isCompletedMapper --------

  it('isCompletedMapper should return true when esito is ok', () => {
    component.dataStructureResults = { esito: 'ok' };
    expect(component.isCompletedMapper(false, 'generale')).toBe(true);
  });

  it('isCompletedMapper should return true when getObjectByDato returns undefined', () => {
    component.dataStructureResults = { esito: 'ko', errori: [] };
    mockCkeckProvider.getObjectByDato.mockReturnValue(undefined);
    expect(component.isCompletedMapper(false, 'generale')).toBe(true);
  });

  it('isCompletedMapper should return false when errore found for dato', () => {
    component.dataStructureResults = { esito: 'ko', errori: [{ dato: 'generale' }] };
    mockCkeckProvider.getObjectByDato.mockReturnValue({ dato: 'generale' });
    expect(component.isCompletedMapper(false, 'generale')).toBe(false);
  });

  // -------- showSkipCollaudo --------

  it('showSkipCollaudo should return true when isBozza and service skip_collaudo', () => {
    component.isBozza = true;
    component.adesione = { servizio: { skip_collaudo: true } };
    expect(component.showSkipCollaudo).toBe(true);
  });

  it('showSkipCollaudo should return false when not bozza', () => {
    component.isBozza = false;
    component.adesione = { servizio: { skip_collaudo: true } };
    expect(component.showSkipCollaudo).toBe(false);
  });

  it('showSkipCollaudo should return false when service does not allow skip', () => {
    component.isBozza = true;
    component.adesione = { servizio: { skip_collaudo: false } };
    expect(component.showSkipCollaudo).toBe(false);
  });

  // -------- _otherActions --------

  it('should initialize _otherActions with download_scheda and divider', () => {
    expect(component._otherActions.length).toBe(2);
    expect(component._otherActions[0].action).toBe('download_scheda');
    expect(component._otherActions[1].type).toBe('divider');
  });

  // -------- _updateOtherActions --------

  it('_updateOtherActions should enable actions when canJoin returns true', () => {
    component.adesione = { stato: 'bozza' };
    mockAuthService.canJoin.mockReturnValue(true);
    component._updateOtherActions();
    expect(component._otherActions[0].enabled).toBe(true);
    expect(component._otherActions[1].enabled).toBe(true);
  });

  it('_updateOtherActions should disable actions when canJoin returns false', () => {
    component.adesione = { stato: 'bozza' };
    mockAuthService.canJoin.mockReturnValue(false);
    component._updateOtherActions();
    expect(component._otherActions[0].enabled).toBe(false);
    expect(component._otherActions[1].enabled).toBe(false);
  });

  // -------- onActionMonitor --------

  it('onActionMonitor should navigate to view on backview action', () => {
    component.onActionMonitor({ action: 'backview' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['view'], { relativeTo: mockRoute });
  });

  it('onActionMonitor should navigate to comunicazioni on comunicazioni action', () => {
    component.onActionMonitor({ action: 'comunicazioni' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['comunicazioni'], { relativeTo: mockRoute });
  });

  it('onActionMonitor should call _downloadSchedaAdesione on download_scheda action', () => {
    component.id = 10;
    component.onActionMonitor({ action: 'download_scheda' });
    expect(mockApiService.download).toHaveBeenCalledWith('adesioni', 10, 'export');
  });

  // -------- _downloadSchedaAdesione --------

  it('_downloadSchedaAdesione should set downloading flag during request', () => {
    component.id = 5;
    mockApiService.download.mockReturnValue(of({ body: new Blob(['pdf']) }));
    component._downloadSchedaAdesione();
    expect(component.downloading).toBe(false); // completed
  });

  it('_downloadSchedaAdesione should do nothing when id is 0', () => {
    component.id = 0;
    component._downloadSchedaAdesione();
    expect(mockApiService.download).not.toHaveBeenCalled();
  });

  it('_downloadSchedaAdesione should set error on failure', () => {
    component.id = 5;
    mockApiService.download.mockReturnValue(throwError(() => ({ error: 'fail' })));
    component._downloadSchedaAdesione();
    expect(component._error).toBe(true);
    expect(component.downloading).toBe(false);
  });

  // -------- hasActions --------

  it('hasActions should return true when isGestore', () => {
    component.grant = { ruoli: ['gestore'] } as any;
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component.hasActions()).toBe(true);
  });

  it('hasActions should check canChangeStatus when not gestore', () => {
    component.grant = { ruoli: ['referente'] } as any;
    component.adesione = { stato: 'bozza' };
    mockAuthService.isGestore.mockReturnValue(false);
    mockAuthService.canChangeStatus.mockReturnValue(true);
    expect(component.hasActions()).toBe(true);
  });

  it('hasActions should return false when adesione is null and not gestore', () => {
    component.grant = { ruoli: ['referente'] } as any;
    component.adesione = null;
    mockAuthService.isGestore.mockReturnValue(false);
    expect(component.hasActions()).toBe(false);
  });

  // -------- _hasCambioStato --------

  it('_hasCambioStato should return true when isGestore', () => {
    component.grant = { ruoli: ['gestore'] } as any;
    component.adesione = { stato: 'bozza' };
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component._hasCambioStato()).toBe(true);
  });

  it('_hasCambioStato should check canChangeStatus for stato_successivo when not gestore', () => {
    component.grant = { ruoli: ['referente'] } as any;
    component.adesione = { stato: 'bozza' };
    mockAuthService.isGestore.mockReturnValue(false);
    mockAuthService.canChangeStatus.mockReturnValue(true);
    expect(component._hasCambioStato()).toBe(true);
    expect(mockAuthService.canChangeStatus).toHaveBeenCalledWith('adesione', 'bozza', 'stato_successivo', ['referente']);
  });

  // -------- canAddMapper --------

  it('canAddMapper should return true when no classes are not modifiable and hasActions', () => {
    mockAuthService._getClassesNotModifiable.mockReturnValue([]);
    component.adesione = { stato: 'bozza' };
    component.grant = { ruoli: ['gestore'] } as any;
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component.canAddMapper()).toBe(true);
  });

  it('canAddMapper should return false when referente is not modifiable', () => {
    mockAuthService._getClassesNotModifiable.mockReturnValue(['referente']);
    component.adesione = { stato: 'bozza' };
    component.grant = null;
    mockAuthService.isGestore.mockReturnValue(false);
    mockAuthService.canChangeStatus.mockReturnValue(false);
    expect(component.canAddMapper()).toBe(false);
  });

  // -------- getStateWorkflow --------

  it('getStateWorkflow should return archiviato state object when stato is archiviato', () => {
    component.adesione = { stato: 'archiviato' };
    const result = component.getStateWorkflow();
    expect(result).toEqual({
      stato_attuale: 'archiviato',
      stato_successivo: null,
      stati_ulteriori: []
    });
  });

  it('getStateWorkflow should find matching cambi_stato entry', () => {
    component.adesione = { stato: 'pubblicato_collaudo', skip_collaudo: false };
    Tools.Configurazione = {
      adesione: {
        workflow: {
          cambi_stato: [
            { stato_attuale: 'pubblicato_collaudo', stato_successivo: { nome: 'richiesto_produzione' } }
          ]
        }
      }
    } as any;
    const result = component.getStateWorkflow();
    expect(result).toEqual({
      stato_attuale: 'pubblicato_collaudo',
      stato_successivo: { nome: 'richiesto_produzione' }
    });
  });

  it('getStateWorkflow should return null when workflow is null', () => {
    component.adesione = { stato: 'bozza', skip_collaudo: false };
    Tools.Configurazione = null;
    const result = component.getStateWorkflow();
    expect(result).toBeNull();
  });

  it('getStateWorkflow should return stati_ulteriori[0] for bozza with skip_collaudo', () => {
    component.adesione = { stato: 'bozza', skip_collaudo: true };
    const skipState = { stato_attuale: 'bozza', stato_successivo: { nome: 'richiesto_produzione_senza_collaudo' } };
    Tools.Configurazione = {
      adesione: {
        workflow: {
          cambi_stato: [
            { stato_attuale: 'bozza', stato_successivo: { nome: 'richiesto_collaudo' }, stati_ulteriori: [skipState] }
          ]
        }
      }
    } as any;
    const result = component.getStateWorkflow();
    expect(result).toEqual(skipState);
  });

  // -------- getNextStateWorkflowName --------

  it('getNextStateWorkflowName should return stato_successivo.nome from current state', () => {
    component.adesione = { stato: 'pubblicato_collaudo', skip_collaudo: false };
    Tools.Configurazione = {
      adesione: {
        workflow: {
          cambi_stato: [
            { stato_attuale: 'pubblicato_collaudo', stato_successivo: { nome: 'richiesto_produzione' } },
            { stato_attuale: 'richiesto_produzione', stato_successivo: { nome: 'autorizzato_produzione' } }
          ]
        }
      }
    } as any;
    expect(component.getNextStateWorkflowName()).toBe('richiesto_produzione');
  });

  it('getNextStateWorkflowName should return nessun_cambio_stato when no workflow', () => {
    component.adesione = { stato: 'bozza', skip_collaudo: false };
    Tools.Configurazione = null;
    expect(component.getNextStateWorkflowName()).toBe('nessun_cambio_stato');
  });

  // -------- getStatusCompleteMapper --------

  it('getStatusCompleteMapper should return 2 for collaudo when skip_collaudo is true', () => {
    component.adesione = { stato: 'bozza', skip_collaudo: true };
    expect(component.getStatusCompleteMapper(false, AmbienteEnum.Collaudo)).toBe(2);
  });

  it('getStatusCompleteMapper should return 2 for produzione in collaudo phase', () => {
    component.adesione = { stato: 'bozza', skip_collaudo: false };
    expect(component.getStatusCompleteMapper(false, AmbienteEnum.Produzione)).toBe(2);
  });

  // -------- onWorkflowAction --------

  it('onWorkflowAction should reset errors and call __confirmCambioStatoServizio', () => {
    component._error = true;
    component._errorMsg = 'old error';
    component._errors = [{ msg: 'x' }];
    component.adesione = { stato: 'bozza', skip_collaudo: false };
    Tools.Configurazione = null;
    const event = { action: 'change', status: {} };
    component.onWorkflowAction(event);
    expect(component._error).toBe(false);
    expect(mockUtils.__confirmCambioStatoServizio).toHaveBeenCalledWith(event, component.adesione, expect.any(Function));
  });

  // -------- toggleSkipCollaudo --------

  it('toggleSkipCollaudo should call putElement and toggle skip_collaudo on success', () => {
    component.id = 5;
    component.adesione = {
      id_adesione: 'A1',
      id_logico: 'L1',
      soggetto: { id_soggetto: 'S1' },
      servizio: { id_servizio: 'SV1' },
      skip_collaudo: false,
      stato: 'archiviato'
    };
    mockApiService.putElement.mockReturnValue(of({}));
    component.toggleSkipCollaudo();
    expect(mockApiService.putElement).toHaveBeenCalledWith('adesioni', 5, expect.objectContaining({
      identificativo: expect.objectContaining({ skip_collaudo: true })
    }));
    expect(component.adesione.skip_collaudo).toBe(true);
    expect(component.saveSkipCollaudo).toBe(false);
  });

  it('toggleSkipCollaudo should reset saveSkipCollaudo on error', () => {
    component.id = 5;
    component.adesione = {
      id_adesione: 'A1',
      id_logico: null,
      soggetto: { id_soggetto: 'S1' },
      servizio: { id_servizio: 'SV1' },
      skip_collaudo: false,
      stato: 'bozza'
    };
    mockApiService.putElement.mockReturnValue(throwError(() => 'err'));
    component.toggleSkipCollaudo();
    expect(component.saveSkipCollaudo).toBe(false);
  });

  // -------- confirmDeleteReferente --------

  it('confirmDeleteReferente should call utils._confirmDialog', () => {
    component.confirmDeleteReferente({ source: { utente: { id_utente: 'U1' }, tipo: 'referente' } });
    expect(mockUtils._confirmDialog).toHaveBeenCalledWith(
      'APP.MESSAGE.AreYouSure',
      expect.any(Object),
      expect.any(Function),
      expect.objectContaining({ confirmColor: 'danger' })
    );
  });

  // -------- openAccordion --------

  it('openAccordion should call utils.scrollTo with the given id', () => {
    component.openAccordion('accordion-general-info', true);
    expect(mockUtils.scrollTo).toHaveBeenCalledWith('accordion-general-info');
  });

  // -------- isSottotipoGroupCompletedMapper --------

  it('isSottotipoGroupCompletedMapper should delegate to ckeckProvider', () => {
    mockCkeckProvider.isSottotipoGroupCompleted.mockReturnValue(false);
    const result = component.isSottotipoGroupCompletedMapper(false, 'collaudo', 'client');
    expect(result).toBe(false);
    expect(mockCkeckProvider.isSottotipoGroupCompleted).toHaveBeenCalledWith(
      component.dataStructureResults, 'collaudo', 'client'
    );
  });

  // -------- isSottotipoCompletedMapper --------

  it('isSottotipoCompletedMapper should delegate to ckeckProvider when _hasCambioStato is true', () => {
    component.grant = { ruoli: ['gestore'] } as any;
    component.adesione = { stato: 'bozza' };
    mockAuthService.isGestore.mockReturnValue(true);
    mockCkeckProvider.isSottotipoCompleted.mockReturnValue(false);
    const result = component.isSottotipoCompletedMapper(false, 'collaudo', 'client', 'C1');
    expect(result).toBe(false);
  });

  it('isSottotipoCompletedMapper should return true when _hasCambioStato is false', () => {
    component.grant = { ruoli: ['referente'] } as any;
    component.adesione = { stato: 'bozza' };
    mockAuthService.isGestore.mockReturnValue(false);
    mockAuthService.canChangeStatus.mockReturnValue(false);
    const result = component.isSottotipoCompletedMapper(false, 'collaudo', 'client', 'C1');
    expect(result).toBe(true);
  });

  // -------- getStatusSottotipoCompleteMapper --------

  it('getStatusSottotipoCompleteMapper should return 2 for collaudo with skip_collaudo', () => {
    component.adesione = { stato: 'bozza', skip_collaudo: true };
    expect(component.getStatusSottotipoCompleteMapper(false, AmbienteEnum.Collaudo, 'client', 'C1')).toBe(2);
  });

  it('getStatusSottotipoCompleteMapper should return 2 for produzione in collaudo phase', () => {
    component.adesione = { stato: 'bozza', skip_collaudo: false };
    expect(component.getStatusSottotipoCompleteMapper(false, AmbienteEnum.Produzione, 'client', 'C1')).toBe(2);
  });
});
