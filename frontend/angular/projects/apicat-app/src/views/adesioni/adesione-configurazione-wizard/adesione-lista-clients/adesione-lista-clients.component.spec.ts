import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, EMPTY } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AdesioneListaClientsComponent } from './adesione-lista-clients.component';
import { StatoConfigurazioneEnum, TipoClientEnum, SelectedClientEnum } from '../../adesione-configurazioni/adesione-configurazioni.component';
import { AmbienteEnum } from '@app/model/ambienteEnum';
import { RightsEnum } from '@app/model/grant';
import { PeriodEnum } from '../../adesione-configurazioni/datispecifici';
import { Tools } from '@linkit/components';

// Mock global saveAs used by the component
(globalThis as any).saveAs = vi.fn();

describe('AdesioneListaClientsComponent', () => {
  let component: AdesioneListaClientsComponent;
  let savedConfigurazione: any;

  const mockModalService = { show: vi.fn(), hide: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: { number: 0, totalPages: 1 } })),
    putElement: vi.fn().mockReturnValue(of({})),
    putElementRelated: vi.fn().mockReturnValue(of({})),
    saveElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    download: vi.fn().mockReturnValue(of({ body: new Blob() })),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    isGestore: vi.fn().mockReturnValue(false),
    canChangeStatus: vi.fn().mockReturnValue(false),
    _getConfigModule: vi.fn().mockReturnValue({
      api: {
        auth_type: [
          { type: 'https', indirizzi_ip: true, rate_limiting: false, finalita: false },
          { type: 'pdnd', indirizzi_ip: false, rate_limiting: true, finalita: true },
          { type: 'https_sign', indirizzi_ip: false, rate_limiting: false, finalita: false },
          { type: 'https_pdnd', indirizzi_ip: true, rate_limiting: true, finalita: false },
          { type: 'https_pdnd_sign', indirizzi_ip: false, rate_limiting: false, finalita: false },
          { type: 'http_basic', indirizzi_ip: false, rate_limiting: false, finalita: false },
          { type: 'no_dati', indirizzi_ip: false, rate_limiting: false, finalita: false },
          { type: 'indirizzo_ip', indirizzi_ip: true, rate_limiting: false, finalita: false },
          { type: 'oauth_authorization_code', indirizzi_ip: false, rate_limiting: false, finalita: false },
          { type: 'oauth_client_credentials', indirizzi_ip: false, rate_limiting: false, finalita: false },
          { type: 'sign', indirizzi_ip: false, rate_limiting: false, finalita: false },
          { type: 'sign_pdnd', indirizzi_ip: false, rate_limiting: false, finalita: false },
        ],
        profili: []
      }
    }),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    getCertificatoByAuthType: vi.fn().mockReturnValue(null),
    getTipiCertificatoAttivi: vi.fn().mockReturnValue([]),
    _confirmDialog: vi.fn(),
    _removeEmpty: vi.fn((obj: any) => obj),
    _showMandatoryFields: vi.fn(),
  } as any;
  const mockEventsManager = {
    on: vi.fn(),
    broadcast: vi.fn(),
  } as any;
  const mockCkeckProvider = {
    check: vi.fn().mockReturnValue(of({ esito: 'ok', errori: [] })),
    isSottotipoGroupCompleted: vi.fn().mockReturnValue(true),
    isSottotipoCompleted: vi.fn().mockReturnValue(true),
  } as any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    component = new AdesioneListaClientsComponent(
      mockModalService, mockTranslate, mockApiService,
      mockAuthService, mockUtils, mockEventsManager, mockCkeckProvider
    );
    // Null out the form group so _postProcessClients guard fails unless explicitly set up in tests
    (component as any)._editFormGroupClients = null as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    Tools.Configurazione = savedConfigurazione;
  });

  // ---------------------------------------------------------------------------
  // Constructor and default values
  // ---------------------------------------------------------------------------
  describe('constructor and default values', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should have default input values', () => {
      expect(component.id).toBe(0);
      expect(component.adesione).toBeNull();
      expect(component.config).toBeNull();
      expect(component.grant).toBeNull();
      expect(component.environment).toBe('');
      expect(component.singleColumn).toBe(false);
      expect(component.isEdit).toBe(false);
      expect(component.otherClass).toBe('');
    });

    it('should have dataCheck default value', () => {
      expect(component.dataCheck).toEqual({ esito: 'ok', errori: [] });
    });

    it('should have nextState as null', () => {
      expect(component.nextState).toBeNull();
    });

    it('should default model to "adesioni"', () => {
      expect(component.model).toBe('adesioni');
    });

    it('should default completed to true', () => {
      expect(component.completed).toBe(true);
    });

    it('should default spin to false', () => {
      expect(component.spin).toBe(false);
    });

    it('should default adesioneClients to null', () => {
      expect(component.adesioneClients).toBeNull();
    });

    it('should default isEditClient to false', () => {
      expect(component.isEditClient).toBe(false);
    });

    it('should default _saving to false', () => {
      expect(component._saving).toBe(false);
    });

    it('should default _error to false', () => {
      expect(component._error).toBe(false);
    });

    it('should default _downloading to false', () => {
      expect(component._downloading).toBe(false);
    });

    it('should have ratePeriods defined with correct values', () => {
      expect(component.ratePeriods).toHaveLength(3);
      expect(component.ratePeriods[0].value).toBe(PeriodEnum.Giorno);
      expect(component.ratePeriods[1].value).toBe(PeriodEnum.Ora);
      expect(component.ratePeriods[2].value).toBe(PeriodEnum.Minuti);
    });

    // Fase 4.4 (Issue #237): rimossi i test sulle 16 flag orfane
    // (`_is{AuthType}` e `_isFornito*/Richiesto_*`). Non esistono piu'
    // come proprieta' pubbliche; il mode e lo scenario sono derivati da
    // `FormConfig` e dal FormControl `tipo_certificato[_firma]`.

    it('should have default message keys', () => {
      expect(component._message).toBe('APP.MESSAGE.ChooseEnvironment');
      expect(component._messageHelp).toBe('APP.MESSAGE.ChooseEnvironmentHelp');
    });
  });

  // ---------------------------------------------------------------------------
  // ngOnChanges
  // ---------------------------------------------------------------------------
  describe('ngOnChanges', () => {
    it('should update dataCheck and updateMapper when dataCheck changes', () => {
      const newDataCheck = { esito: 'ko', errori: [{ dato: 'test' }] };
      component.ngOnChanges({
        dataCheck: { currentValue: newDataCheck, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);
      expect(component.dataCheck).toBe(newDataCheck);
      expect(component.updateMapper).not.toBe('');
    });

    it('should not update when other changes come in', () => {
      const originalMapper = component.updateMapper;
      component.ngOnChanges({
        environment: { currentValue: 'collaudo', previousValue: '', firstChange: true, isFirstChange: () => true }
      } as any);
      expect(component.updateMapper).toBe(originalMapper);
    });
  });

  // ---------------------------------------------------------------------------
  // initTipiCertificato
  // ---------------------------------------------------------------------------
  describe('initTipiCertificato', () => {
    it('should clear _tipiCertificato on init', () => {
      component._tipiCertificato = [{ nome: 'x', valore: 'x' }];
      component.initTipiCertificato('');
      expect(component._tipiCertificato).toEqual([]);
    });

    it('should populate _tipiCertificato when certificato is found', () => {
      const mockCert = { csr_modulo: true };
      mockUtils.getCertificatoByAuthType.mockReturnValue(mockCert);
      mockUtils.getTipiCertificatoAttivi.mockReturnValue(['fornito', 'richiesto_cn']);

      component.initTipiCertificato('https');

      expect(component._tipiCertificato).toEqual([
        { nome: 'fornito', valore: 'fornito' },
        { nome: 'richiesto_cn', valore: 'richiesto_cn' },
      ]);
    });

    // Fase 4.4 (Issue #237): rimossi i test su `_isRichiesto_csr` come
    // side-effect di `initTipiCertificato`: la flag non esiste piu' come
    // proprieta' pubblica. Il supporto `csr_modulo` del backend e' ora
    // implicitamente riflesso in `_tipiCertificato`.

    it('should leave _tipiCertificato empty when no certificato found', () => {
      mockUtils.getCertificatoByAuthType.mockReturnValue(null);
      component.initTipiCertificato('unknown_type');
      expect(component._tipiCertificato).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // _setErrorMessages
  // ---------------------------------------------------------------------------
  describe('_setErrorMessages', () => {
    it('should set error messages when error is true', () => {
      component._setErrorMessages(true);
      expect(component._error).toBe(true);
      expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
      expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
    });

    it('should set no-results messages when error is false', () => {
      component._setErrorMessages(false);
      expect(component._error).toBe(false);
      expect(component._message).toBe('APP.MESSAGE.NoResults');
      expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
    });
  });

  // ---------------------------------------------------------------------------
  // _resetError
  // ---------------------------------------------------------------------------
  describe('_resetError', () => {
    it('should clear error state', () => {
      component._error = true;
      component._errorMsg = 'some error';
      component._resetError();
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // closeModal
  // ---------------------------------------------------------------------------
  describe('closeModal', () => {
    it('should clear clients riuso, hide modal, and reset edit flag', () => {
      component._arr_clients_riuso = [{ nome: 'test' }];
      component.isEditClient = true;
      component._modalEditRef = { hide: vi.fn() } as any;
      component.closeModal();
      expect(component._arr_clients_riuso).toEqual([]);
      expect(component._modalEditRef.hide).toHaveBeenCalled();
      expect(component.isEditClient).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _checkAndSetAuthTypeCase (Fase 4.4 Issue #237: setta solo i
  // `_show_erogazione_*` flag, lo switch sulle 12 `_is{AuthType}` e'
  // stato rimosso insieme alle flag.)
  // ---------------------------------------------------------------------------
  describe('_checkAndSetAuthTypeCase', () => {
    it('should set _show_erogazione_ip_fruizione from config', () => {
      mockAuthService._getConfigModule.mockReturnValue({
        api: { auth_type: [{ type: 'https_pdnd', indirizzi_ip: true }] }
      });
      component._checkAndSetAuthTypeCase('https_pdnd');
      expect(component._show_erogazione_ip_fruizione).toBe(true);
    });

    it('should set _show_erogazione_rate_limiting and finalita from config', () => {
      mockAuthService._getConfigModule.mockReturnValue({
        api: { auth_type: [{ type: 'pdnd', rate_limiting: true, finalita: true }] }
      });
      component._checkAndSetAuthTypeCase('pdnd');
      expect(component._show_erogazione_rate_limiting).toBe(true);
      expect(component._show_erogazione_finalita).toBe(true);
    });

    it('should leave show flags false for unknown auth type', () => {
      mockAuthService._getConfigModule.mockReturnValue({ api: { auth_type: [] } });
      component._checkAndSetAuthTypeCase('unknown');
      expect(component._show_erogazione_ip_fruizione).toBe(false);
      expect(component._show_erogazione_rate_limiting).toBe(false);
      expect(component._show_erogazione_finalita).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Fase 4.4 (Issue #237): rimossi i describe block `_resetAllAuthType`
  // e `_checkTipoCertificato`. I relativi metodi sono stati eliminati
  // dal componente perche' operavano solo sulle 16 flag orfane.

  // ---------------------------------------------------------------------------
  // _resetCertificates / _resetCertificatesFirma / _resetCertificatesAll
  // ---------------------------------------------------------------------------
  describe('certificate reset methods', () => {
    it('should reset all certificates with _resetCertificates', () => {
      component._certificato_csr = { uuid: '1' };
      component._certificato_fornito = { uuid: '2' };
      component._modulo_richiesta_csr = { uuid: '3' };
      component._certificato_cn = { uuid: '4' };
      component._resetCertificates();
      expect(component._certificato_csr).toBeNull();
      expect(component._certificato_fornito).toBeNull();
      expect(component._modulo_richiesta_csr).toBeNull();
      expect(component._certificato_cn).toBeNull();
    });

    it('should reset all firma certificates with _resetCertificatesFirma', () => {
      component._certificato_csr_firma = { uuid: '1' };
      component._certificato_fornito_firma = { uuid: '2' };
      component._modulo_richiesta_csr_firma = { uuid: '3' };
      component._modulo_richiesta_csr_firma_ceritifato = { uuid: '4' };
      component._certificato_cn_firma = { uuid: '5' };
      component._resetCertificatesFirma();
      expect(component._certificato_csr_firma).toBeNull();
      expect(component._certificato_fornito_firma).toBeNull();
      expect(component._modulo_richiesta_csr_firma).toBeNull();
      expect(component._modulo_richiesta_csr_firma_ceritifato).toBeNull();
      expect(component._certificato_cn_firma).toBeNull();
    });

    it('should reset both certificates with _resetCertificatesAll', () => {
      component._certificato_csr = { uuid: '1' };
      component._certificato_csr_firma = { uuid: '2' };
      component._resetCertificatesAll();
      expect(component._certificato_csr).toBeNull();
      expect(component._certificato_csr_firma).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // _resetDescrittori / _resetDescrittoriFirma / _resetDescrittoriAll
  // ---------------------------------------------------------------------------
  describe('descriptor reset methods', () => {
    it('should reset descriptor controls with _resetDescrittori', () => {
      component._descrittoreCtrl.setValue('test');
      component._descrittoreCtrl_csr.setValue('test');
      component._descrittoreCtrl_csr_modulo.setValue('test');
      component._resetDescrittori();
      expect(component._descrittoreCtrl.value).toBe('');
      expect(component._descrittoreCtrl_csr.value).toBe('');
      expect(component._descrittoreCtrl_csr_modulo.value).toBe('');
    });

    it('should reset firma descriptor controls with _resetDescrittoriFirma', () => {
      component._descrittoreCtrl_firma.setValue('test');
      component._descrittoreCtrl_csr_firma.setValue('test');
      component._descrittoreCtrl_csr_modulo_firma.setValue('test');
      component._resetDescrittoriFirma();
      expect(component._descrittoreCtrl_firma.value).toBe('');
      expect(component._descrittoreCtrl_csr_firma.value).toBe('');
      expect(component._descrittoreCtrl_csr_modulo_firma.value).toBe('');
    });

    it('should reset all descriptors with _resetDescrittoriAll', () => {
      component._descrittoreCtrl.setValue('a');
      component._descrittoreCtrl_firma.setValue('b');
      component._resetDescrittoriAll();
      expect(component._descrittoreCtrl.value).toBe('');
      expect(component._descrittoreCtrl_firma.value).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // _disableAllFields
  // ---------------------------------------------------------------------------
  describe('_disableAllFields', () => {
    it('should disable all controls in the given object', () => {
      const controls = {
        nome: new FormControl('test'),
        email: new FormControl('a@b.com'),
      };
      component._disableAllFields(controls);
      expect(controls.nome.disabled).toBe(true);
      expect(controls.email.disabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // f (getter)
  // ---------------------------------------------------------------------------
  describe('f getter', () => {
    it('should return controls of _editFormGroupClients', () => {
      component._editFormGroupClients = new FormGroup({
        nome: new FormControl('test'),
      });
      expect(component.f['nome']).toBeDefined();
      expect(component.f['nome'].value).toBe('test');
    });
  });

  // ---------------------------------------------------------------------------
  // _hasControlError
  // ---------------------------------------------------------------------------
  describe('_hasControlError', () => {
    it('should return true when control has errors and is touched', () => {
      component._editFormGroupClients = new FormGroup({
        nome: new FormControl('', Validators.required),
      });
      component._editFormGroupClients.controls['nome'].markAsTouched();
      expect(component._hasControlError('nome')).toBe(true);
    });

    it('should return false when control has no errors', () => {
      component._editFormGroupClients = new FormGroup({
        nome: new FormControl('filled', Validators.required),
      });
      component._editFormGroupClients.controls['nome'].markAsTouched();
      expect(component._hasControlError('nome')).toBe(false);
    });

    it('should return false when control is not touched', () => {
      component._editFormGroupClients = new FormGroup({
        nome: new FormControl('', Validators.required),
      });
      expect(component._hasControlError('nome')).toBe(false);
    });

    it('should return false when control does not exist', () => {
      component._editFormGroupClients = new FormGroup({});
      expect(component._hasControlError('nonExistent')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // isStatusPubblicatoCollaudodMapper
  // ---------------------------------------------------------------------------
  describe('isStatusPubblicatoCollaudodMapper', () => {
    it('should return true for pubblicato_produzione', () => {
      expect(component.isStatusPubblicatoCollaudodMapper('', 'pubblicato_produzione')).toBe(true);
    });

    it('should return false for any other status', () => {
      expect(component.isStatusPubblicatoCollaudodMapper('', 'bozza')).toBe(false);
      expect(component.isStatusPubblicatoCollaudodMapper('', 'richiesto_collaudo')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _isInCollaudoPhase
  // ---------------------------------------------------------------------------
  describe('_isInCollaudoPhase', () => {
    it('should return true when adesione is in a collaudo state and skip_collaudo is false', () => {
      component.adesione = { stato: 'bozza', skip_collaudo: false };
      expect(component._isInCollaudoPhase()).toBe(true);
    });

    it('should return true for richiesto_collaudo state', () => {
      component.adesione = { stato: 'richiesto_collaudo', skip_collaudo: false };
      expect(component._isInCollaudoPhase()).toBe(true);
    });

    it('should return true for autorizzato_collaudo state', () => {
      component.adesione = { stato: 'autorizzato_collaudo', skip_collaudo: false };
      expect(component._isInCollaudoPhase()).toBe(true);
    });

    it('should return true for in_configurazione_collaudo state', () => {
      component.adesione = { stato: 'in_configurazione_collaudo', skip_collaudo: false };
      expect(component._isInCollaudoPhase()).toBe(true);
    });

    it('should return false when skip_collaudo is true', () => {
      component.adesione = { stato: 'bozza', skip_collaudo: true };
      expect(component._isInCollaudoPhase()).toBe(false);
    });

    it('should return false for non-collaudo state', () => {
      component.adesione = { stato: 'pubblicato_produzione', skip_collaudo: false };
      expect(component._isInCollaudoPhase()).toBe(false);
    });

    it('should return false when adesione is null', () => {
      component.adesione = null;
      expect(component._isInCollaudoPhase()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // getSottotipoGroupCompletedMapper
  // ---------------------------------------------------------------------------
  describe('getSottotipoGroupCompletedMapper', () => {
    it('should return 2 (grey) when skip_collaudo and environment is Collaudo', () => {
      component.environment = AmbienteEnum.Collaudo;
      component.adesione = { skip_collaudo: true };
      expect(component.getSottotipoGroupCompletedMapper('', 'client')).toBe(2);
    });

    it('should return 2 when environment is Produzione and in collaudo phase', () => {
      component.environment = AmbienteEnum.Produzione;
      component.adesione = { stato: 'bozza', skip_collaudo: false };
      expect(component.getSottotipoGroupCompletedMapper('', 'client')).toBe(2);
    });

    it('should return 1 when group is completed and data is not non_applicabile', () => {
      component.environment = AmbienteEnum.Collaudo;
      component.adesione = { stato: 'pubblicato_produzione', skip_collaudo: false };
      component.nextState = { dati_non_applicabili: [] };
      mockCkeckProvider.isSottotipoGroupCompleted.mockReturnValue(true);
      expect(component.getSottotipoGroupCompletedMapper('', 'client')).toBe(1);
    });

    it('should return 2 when group completed but data is non_applicabile', () => {
      component.environment = AmbienteEnum.Collaudo;
      component.adesione = { stato: 'pubblicato_produzione', skip_collaudo: false };
      component.nextState = { dati_non_applicabili: ['collaudo'] };
      mockCkeckProvider.isSottotipoGroupCompleted.mockReturnValue(true);
      expect(component.getSottotipoGroupCompletedMapper('', 'client')).toBe(2);
    });

    it('should return 0 when group not completed and has cambio stato', () => {
      component.environment = AmbienteEnum.Collaudo;
      component.adesione = { stato: 'pubblicato_produzione', skip_collaudo: false };
      mockCkeckProvider.isSottotipoGroupCompleted.mockReturnValue(false);
      mockAuthService.isGestore.mockReturnValue(true);
      expect(component.getSottotipoGroupCompletedMapper('', 'client')).toBe(0);
    });

    it('should return 1 when group not completed and no cambio stato', () => {
      component.environment = AmbienteEnum.Collaudo;
      component.adesione = { stato: 'pubblicato_produzione', skip_collaudo: false };
      component.grant = { ruoli: ['referente'], collaudo: 'lettura', produzione: 'lettura', identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura' };
      mockCkeckProvider.isSottotipoGroupCompleted.mockReturnValue(false);
      mockAuthService.isGestore.mockReturnValue(false);
      mockAuthService.canChangeStatus.mockReturnValue(false);
      expect(component.getSottotipoGroupCompletedMapper('', 'client')).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // isSottotipoGroupCompletedMapper / isSottotipoCompletedMapper
  // ---------------------------------------------------------------------------
  describe('isSottotipoGroupCompletedMapper', () => {
    it('should delegate to ckeckProvider.isSottotipoGroupCompleted', () => {
      component.dataCheck = { esito: 'ok', errori: [] };
      component.environment = 'collaudo';
      mockCkeckProvider.isSottotipoGroupCompleted.mockReturnValue(true);
      expect(component.isSottotipoGroupCompletedMapper('', 'client')).toBe(true);
      expect(mockCkeckProvider.isSottotipoGroupCompleted).toHaveBeenCalledWith(
        component.dataCheck, 'collaudo', 'client'
      );
    });
  });

  describe('isSottotipoCompletedMapper', () => {
    it('should delegate to ckeckProvider when has cambio stato', () => {
      component.adesione = { stato: 'bozza' };
      mockAuthService.isGestore.mockReturnValue(true);
      mockCkeckProvider.isSottotipoCompleted.mockReturnValue(false);
      expect(component.isSottotipoCompletedMapper('', 'client', 'prof1')).toBe(false);
    });

    it('should return true when no cambio stato', () => {
      component.adesione = { stato: 'bozza' };
      component.grant = { ruoli: ['referente'], collaudo: 'lettura', produzione: 'lettura', identificativo: 'lettura', generico: 'lettura', specifica: 'lettura', referenti: 'lettura' };
      mockAuthService.isGestore.mockReturnValue(false);
      mockAuthService.canChangeStatus.mockReturnValue(false);
      expect(component.isSottotipoCompletedMapper('', 'client', 'prof1')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // _isGestoreMapper
  // ---------------------------------------------------------------------------
  describe('_isGestoreMapper', () => {
    it('should return true when user is gestore', () => {
      component.grant = { ruoli: ['gestore'] } as any;
      mockAuthService.isGestore.mockReturnValue(true);
      expect(component._isGestoreMapper()).toBe(true);
    });

    it('should return false when user is not gestore', () => {
      component.grant = { ruoli: ['referente'] } as any;
      mockAuthService.isGestore.mockReturnValue(false);
      expect(component._isGestoreMapper()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _isConfiguratoMapper
  // ---------------------------------------------------------------------------
  describe('_isConfiguratoMapper', () => {
    it('should return true when client stato is CONFIGURATO and no nome_proposto', () => {
      const item = { source: { stato: StatoConfigurazioneEnum.CONFIGURATO, nome_proposto: null } };
      expect(component._isConfiguratoMapper(item)).toBe(true);
    });

    it('should return false when nome_proposto is present', () => {
      const item = { source: { stato: StatoConfigurazioneEnum.CONFIGURATO, nome_proposto: 'proposed' } };
      expect(component._isConfiguratoMapper(item)).toBe(false);
    });

    it('should return false when client stato is NONCONFIGURATO', () => {
      const item = { source: { stato: StatoConfigurazioneEnum.NONCONFIGURATO } };
      expect(component._isConfiguratoMapper(item)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _isModifiableMapper
  // ---------------------------------------------------------------------------
  describe('_isModifiableMapper', () => {
    it('should return true when environment is Collaudo and grant.collaudo is Scrittura', () => {
      component.environment = AmbienteEnum.Collaudo;
      component.grant = {
        ruoli: ['referente'],
        collaudo: RightsEnum.Scrittura,
        produzione: RightsEnum.Lettura,
        identificativo: RightsEnum.Lettura,
        generico: RightsEnum.Lettura,
        specifica: RightsEnum.Lettura,
        referenti: RightsEnum.Lettura
      };
      expect(component._isModifiableMapper()).toBe(true);
    });

    it('should return true when environment is Produzione and grant.produzione is Scrittura', () => {
      component.environment = AmbienteEnum.Produzione;
      component.grant = {
        ruoli: ['referente'],
        collaudo: RightsEnum.Lettura,
        produzione: RightsEnum.Scrittura,
        identificativo: RightsEnum.Lettura,
        generico: RightsEnum.Lettura,
        specifica: RightsEnum.Lettura,
        referenti: RightsEnum.Lettura
      };
      expect(component._isModifiableMapper()).toBe(true);
    });

    it('should return false when grant is null', () => {
      component.grant = null;
      expect(component._isModifiableMapper()).toBe(false);
    });

    it('should return false when environment is Collaudo but grant is Lettura', () => {
      component.environment = AmbienteEnum.Collaudo;
      component.grant = {
        ruoli: ['referente'],
        collaudo: RightsEnum.Lettura,
        produzione: RightsEnum.Lettura,
        identificativo: RightsEnum.Lettura,
        generico: RightsEnum.Lettura,
        specifica: RightsEnum.Lettura,
        referenti: RightsEnum.Lettura
      };
      expect(component._isModifiableMapper()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _hasCambioStato
  // ---------------------------------------------------------------------------
  describe('_hasCambioStato', () => {
    it('should return true when user is gestore', () => {
      component.adesione = { stato: 'bozza' };
      component.grant = { ruoli: ['gestore'] } as any;
      mockAuthService.isGestore.mockReturnValue(true);
      expect(component._hasCambioStato()).toBe(true);
    });

    it('should delegate to canChangeStatus when not gestore', () => {
      component.adesione = { stato: 'bozza' };
      component.grant = { ruoli: ['referente'] } as any;
      mockAuthService.isGestore.mockReturnValue(false);
      mockAuthService.canChangeStatus.mockReturnValue(true);
      expect(component._hasCambioStato()).toBe(true);
      expect(mockAuthService.canChangeStatus).toHaveBeenCalledWith(
        'adesione', 'bozza', 'stato_successivo', ['referente']
      );
    });

    it('should return false when neither gestore nor canChangeStatus', () => {
      component.adesione = { stato: 'bozza' };
      component.grant = { ruoli: ['referente'] } as any;
      mockAuthService.isGestore.mockReturnValue(false);
      mockAuthService.canChangeStatus.mockReturnValue(false);
      expect(component._hasCambioStato()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _getProfilo
  // ---------------------------------------------------------------------------
  describe('_getProfilo', () => {
    it('should return codice_interno from client source', () => {
      const client = { source: { codice_interno: 'profilo_1' } };
      expect(component._getProfilo(client)).toBe('profilo_1');
    });
  });

  // ---------------------------------------------------------------------------
  // confirmDissociaClient
  // ---------------------------------------------------------------------------
  describe('confirmDissociaClient', () => {
    it('should call utils._confirmDialog with correct params', () => {
      const data = { source: { codice_interno: 'prof1' } };
      component.confirmDissociaClient(data);
      expect(mockUtils._confirmDialog).toHaveBeenCalled();
      const args = mockUtils._confirmDialog.mock.calls[0];
      expect(args[0]).toBe('APP.CLIENT.MESSAGES.DeassociateClient');
      expect(args[1]).toBe(data);
      expect(typeof args[2]).toBe('function');
    });
  });

  // ---------------------------------------------------------------------------
  // _dissociaClient
  // ---------------------------------------------------------------------------
  describe('_dissociaClient', () => {
    beforeEach(() => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [{ codice_interno: 'prof1', auth_type: 'https', etichetta: 'Prof1' }],
            auth_type: [{ type: 'https', indirizzi_ip: true }]
          }
        },
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };
      component.adesione = {
        id_adesione: 100,
        client_richiesti: [{ profilo: 'prof1' }],
        soggetto: { id_soggetto: 1, organizzazione: { id_organizzazione: 'org1' } }
      };
      component.environment = 'collaudo';
      component.id = 1;
    });

    it('should call deleteElement and reload clients on success', () => {
      mockApiService.deleteElement.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));

      const item = { source: { codice_interno: 'prof1' } };
      component._dissociaClient(item);

      expect(mockApiService.deleteElement).toHaveBeenCalledWith('adesioni', '100/collaudo/client/prof1');
      expect(mockEventsManager.broadcast).toHaveBeenCalled();
    });

    it('should handle error on deleteElement', () => {
      const onErrorSpy = vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
      mockApiService.deleteElement.mockReturnValue(throwError(() => new Error('fail')));

      const item = { source: { codice_interno: 'prof1' } };
      component._dissociaClient(item);

      expect(onErrorSpy).toHaveBeenCalled();
      onErrorSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // loadAdesioneClients (private, tested via initData/ngOnInit)
  // ---------------------------------------------------------------------------
  describe('loadAdesioneClients', () => {
    beforeEach(() => {
      Tools.Configurazione = {
        servizio: {
          api: {
            profili: [
              { codice_interno: 'prof1', auth_type: 'https', etichetta: 'Profile 1' },
              { codice_interno: 'prof2', auth_type: 'pdnd', etichetta: 'Profile 2' },
            ],
            auth_type: [
              { type: 'https', indirizzi_ip: true },
              { type: 'pdnd', indirizzi_ip: false },
            ]
          }
        },
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };
      component.adesione = {
        id_adesione: 100,
        client_richiesti: [{ profilo: 'prof1' }],
        soggetto: { id_soggetto: 1, organizzazione: { id_organizzazione: 'org1' } }
      };
      component.environment = 'collaudo';
    });

    it('should not load when id is 0', () => {
      component.id = 0;
      component.initData();
      expect(mockApiService.getDetails).not.toHaveBeenCalledWith('adesioni', 0, expect.anything());
    });

    it('should load and build client list on success', () => {
      component.id = 42;
      const apiResponse = {
        content: [
          {
            profilo: 'prof1',
            id_client: 'c1',
            nome: 'Client 1',
            nome_proposto: null,
            dati_specifici: { auth_type: 'https' }
          }
        ]
      };
      mockApiService.getDetails.mockReturnValue(of(apiResponse));

      component.initData();

      expect(mockApiService.getDetails).toHaveBeenCalledWith('adesioni', 42, 'collaudo/client');
      expect(component.adesioneClients).toBeDefined();
      expect(component.adesioneClients.length).toBe(1);
      expect(component.adesioneClients[0].auth_type).toBe('https');
      expect(component.spin).toBe(false);
    });

    it('should mark client as NONCONFIGURATO when no matching client in response', () => {
      component.id = 42;
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));

      component.initData();

      expect(component.adesioneClients.length).toBe(1);
      expect(component.adesioneClients[0].source.stato).toBe(StatoConfigurazioneEnum.NONCONFIGURATO);
      expect(component.adesioneClients[0].id_client).toBeNull();
    });

    it('should mark client as CONFIGURATO when matched client exists and has nome', () => {
      component.id = 42;
      const apiResponse = {
        content: [{
          profilo: 'prof1',
          id_client: 'c1',
          nome: 'Client 1',
          nome_proposto: null,
          dati_specifici: { auth_type: 'https' }
        }]
      };
      mockApiService.getDetails.mockReturnValue(of(apiResponse));

      component.initData();

      expect(component.adesioneClients[0].source.stato).toBe(StatoConfigurazioneEnum.CONFIGURATO);
    });

    it('should mark as CONFIGINPROGRESS when nome_proposto but no nome and user is gestore', () => {
      component.id = 42;
      mockAuthService.isGestore.mockReturnValue(true);
      const apiResponse = {
        content: [{
          profilo: 'prof1',
          id_client: 'c1',
          nome: null,
          nome_proposto: 'Proposed',
          dati_specifici: { auth_type: 'https' }
        }]
      };
      mockApiService.getDetails.mockReturnValue(of(apiResponse));

      component.initData();

      expect(component.adesioneClients[0].source.stato).toBe(StatoConfigurazioneEnum.CONFIGINPROGRESS);
    });

    it('should mark as NONCONFIGURATO when nome_proposto but no nome and user is not gestore', () => {
      component.id = 42;
      mockAuthService.isGestore.mockReturnValue(false);
      const apiResponse = {
        content: [{
          profilo: 'prof1',
          id_client: 'c1',
          nome: null,
          nome_proposto: 'Proposed',
          dati_specifici: { auth_type: 'https' }
        }]
      };
      mockApiService.getDetails.mockReturnValue(of(apiResponse));

      component.initData();

      expect(component.adesioneClients[0].source.stato).toBe(StatoConfigurazioneEnum.NONCONFIGURATO);
      // Since not CONFIGURATO, id_client should be nulled
      expect(component.adesioneClients[0].id_client).toBeNull();
    });

    it('should handle API error gracefully', () => {
      component.id = 42;
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));

      component.initData();

      expect(component.spin).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _loadCredenziali$ (Fase 2 Issue #237: Observable-based)
  // ---------------------------------------------------------------------------
  describe('_loadCredenziali$', () => {
    beforeEach(() => {
      component._generalConfig = {
        adesione: {
          visualizza_elenco_client_esistenti: false,
          riuso_client_obbligatorio: false
        }
      };
    });

    it('should push "Nuove credenziali" when organizzazione is empty', () => {
      component._loadCredenziali$('https', '', 'collaudo').subscribe();
      expect(component._arr_clients_riuso).toHaveLength(1);
      expect(component._arr_clients_riuso[0].id_client).toBeNull();
    });

    it('should push NuovoCliente and UsaClientEsistente when no elenco_client_esistenti', () => {
      mockAuthService.isGestore.mockReturnValue(false);
      component._loadCredenziali$('https', 'org1', 'collaudo').subscribe();
      expect(component._arr_clients_riuso.length).toBeGreaterThanOrEqual(2);
      expect(component._arr_clients_riuso[0].id_client).toBe(SelectedClientEnum.NuovoCliente);
      expect(component._arr_clients_riuso[1].id_client).toBe(SelectedClientEnum.UsaClientEsistente);
    });

    it('should also call _loadClientsRiuso$ when user is gestore and no elenco_client_esistenti', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      mockApiService.getList.mockReturnValue(EMPTY);
      component._loadCredenziali$('https', 'org1', 'collaudo').subscribe();
      expect(mockApiService.getList).toHaveBeenCalled();
    });

    it('should call _loadClientsRiuso$ when visualizza_elenco_client_esistenti is true', () => {
      component._generalConfig.adesione.visualizza_elenco_client_esistenti = true;
      mockApiService.getList.mockReturnValue(EMPTY);
      component._loadCredenziali$('https', 'org1', 'collaudo').subscribe();
      expect(mockApiService.getList).toHaveBeenCalledWith('client', expect.objectContaining({
        params: expect.objectContaining({ auth_type: 'https', id_organizzazione: 'org1' })
      }));
    });
  });

  // ---------------------------------------------------------------------------
  // _postProcessClientsList (private, tested via _loadClientsRiuso$)
  // ---------------------------------------------------------------------------
  describe('_postProcessClientsList via _loadClientsRiuso$', () => {
    beforeEach(() => {
      component._generalConfig = {
        adesione: {
          visualizza_elenco_client_esistenti: true,
          riuso_client_obbligatorio: false
        }
      };
      // Form manteniamo stubbato per gli altri test che lo richiedono
      component._editFormGroupClients = new FormGroup({
        credenziali: new FormControl(null),
        nome_proposto: new FormControl(null),
        nome: new FormControl(null),
        tipo_certificato: new FormControl(null),
        tipo_certificato_firma: new FormControl(null),
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null),
        filename_firma: new FormControl(null),
        estensione_firma: new FormControl(null),
        content_firma: new FormControl(null),
        uuid_firma: new FormControl(null),
        filename_csr: new FormControl(null),
        estensione_csr: new FormControl(null),
        content_csr: new FormControl(null),
        uuid_csr: new FormControl(null),
        filename_csr_firma: new FormControl(null),
        estensione_csr_firma: new FormControl(null),
        content_csr_firma: new FormControl(null),
        uuid_csr_firma: new FormControl(null),
        cn: new FormControl(null),
        cn_firma: new FormControl(null),
        csr: new FormControl(null),
        modulo_richiesta_csr: new FormControl(null),
        modulo_richiesta_csr_firma: new FormControl(null),
        ip_fruizione: new FormControl(null),
        descrizione: new FormControl(null),
        rate_limiting: new FormGroup({
          quota: new FormControl(null),
          periodo: new FormControl(null),
        }),
        finalita: new FormControl(null),
        id_utente: new FormControl(null),
        url_redirezione: new FormControl(null),
        url_esposizione: new FormControl(null),
        help_desk: new FormControl(null),
        nome_applicazione_portale: new FormControl(null),
        client_id: new FormControl(null),
        username: new FormControl(null),
      });
    });

    it('should prepend NuoveCredenziali when empty and not obbligatorio', () => {
      mockApiService.getList.mockReturnValue(of({ content: [], page: { number: 0, totalPages: 1 } }));
      component._loadCredenziali$('https', 'org1', 'collaudo').subscribe();
      expect(component._arr_clients_riuso[0].id_client).toBe(SelectedClientEnum.NuovoCliente);
    });

    it('should prepend NuoveCredenziali when not obbligatorio even if clients exist', () => {
      component._generalConfig.adesione.riuso_client_obbligatorio = false;
      const clients = [{ id_client: 'c1', nome: 'Client 1' }];
      mockApiService.getList.mockReturnValue(of({ content: clients, page: { number: 0, totalPages: 1 } }));
      component._loadCredenziali$('https', 'org1', 'collaudo').subscribe();
      expect(component._arr_clients_riuso[0].id_client).toBe(SelectedClientEnum.NuovoCliente);
      expect(component._arr_clients_riuso[1].id_client).toBe('c1');
    });

    it('should NOT prepend NuoveCredenziali when obbligatorio and clients exist', () => {
      component._generalConfig.adesione.riuso_client_obbligatorio = true;
      const clients = [{ id_client: 'c1', nome: 'Client 1' }];
      mockApiService.getList.mockReturnValue(of({ content: clients, page: { number: 0, totalPages: 1 } }));
      component._loadCredenziali$('https', 'org1', 'collaudo').subscribe();
      expect(component._arr_clients_riuso[0].id_client).toBe('c1');
    });

    it('propagates API error to subscribers (Fase 2: error handling e\' del chiamante)', () => {
      mockApiService.getList.mockReturnValue(throwError(() => new Error('fail')));
      let captured: any = null;
      component._loadCredenziali$('https', 'org1', 'collaudo').subscribe({
        error: (err: any) => { captured = err; }
      });
      expect(captured).toBeInstanceOf(Error);
    });
  });

  // ---------------------------------------------------------------------------
  // _downloadsEnabled
  // ---------------------------------------------------------------------------
  describe('_downloadsEnabled', () => {
    it('should return true when current service client matches credenziali value', () => {
      component._editFormGroupClients = new FormGroup({
        credenziali: new FormControl('client-123'),
      });
      component._currentServiceClient = 'client-123';
      expect(component._downloadsEnabled()).toBe(true);
    });

    it('should return false when they do not match', () => {
      component._editFormGroupClients = new FormGroup({
        credenziali: new FormControl('client-456'),
      });
      component._currentServiceClient = 'client-123';
      expect(component._downloadsEnabled()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // _downloadAllegato
  // ---------------------------------------------------------------------------
  describe('_downloadAllegato', () => {
    it('should set _downloading to true then false on success', () => {
      component.environment = 'collaudo';
      component.id = 42;
      mockApiService.download.mockReturnValue(of({ body: new Blob(['test']) }));

      component._downloadAllegato({ uuid: 'uuid-1', filename: 'cert.pem' });

      expect(mockApiService.download).toHaveBeenCalledWith('adesioni', 42, 'collaudo/client/uuid-1/download');
      expect(component._downloading).toBe(false);
    });

    it('should set error state on download failure', () => {
      component.environment = 'collaudo';
      component.id = 42;
      mockApiService.download.mockReturnValue(throwError(() => new Error('fail')));

      component._downloadAllegato({ uuid: 'uuid-1', filename: 'cert.pem' });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._downloading).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onChangeTipoCertificato
  // ---------------------------------------------------------------------------
  describe('onChangeTipoCertificato', () => {
    function setupFormForCertificato() {
      component._editFormGroupClients = new FormGroup({
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        uuid: new FormControl(null),
        cn: new FormControl(null),
        filename_csr: new FormControl(null),
        estensione_csr: new FormControl(null),
        content_csr: new FormControl(null),
        uuid_csr: new FormControl(null),
        tipo_certificato: new FormControl(null),
        tipo_certificato_firma: new FormControl(null),
        filename_firma: new FormControl(null),
        estensione_firma: new FormControl(null),
        content_firma: new FormControl(null),
        uuid_firma: new FormControl(null),
        cn_firma: new FormControl(null),
        filename_csr_firma: new FormControl(null),
        estensione_csr_firma: new FormControl(null),
        content_csr_firma: new FormControl(null),
        uuid_csr_firma: new FormControl(null),
        csr: new FormControl(null),
        modulo_richiesta_csr: new FormControl(null),
        modulo_richiesta_csr_firma: new FormControl(null),
        credenziali: new FormControl(null),
        nome_proposto: new FormControl(null),
        nome: new FormControl(null),
        ip_fruizione: new FormControl(null),
        descrizione: new FormControl(null),
        rate_limiting: new FormGroup({
          quota: new FormControl(null),
          periodo: new FormControl(null),
        }),
        finalita: new FormControl(null),
        id_utente: new FormControl(null),
        url_redirezione: new FormControl(null),
        url_esposizione: new FormControl(null),
        help_desk: new FormControl(null),
        nome_applicazione_portale: new FormControl(null),
        client_id: new FormControl(null),
        username: new FormControl(null),
      });
    }

    // Fase 4.4 (Issue #237): i test erano basati sulle flag orfane
    // `_isFornito/_isRichiesto_cn/_isRichiesto_csr`. Ora che il mode
    // e' letto dal FormControl `tipo_certificato`, i test di `fornito`/`cn`/`csr`
    // sono ridotti a verifiche sui validator e sullo stato dei
    // certificati interni.
    it('should set content required validator for fornito', () => {
      setupFormForCertificato();
      component.onChangeTipoCertificato({ nome: 'fornito' });
      expect(component._editFormGroupClients.controls['content'].hasValidator(Validators.required)).toBe(true);
    });

    it('should set cn required validator for richiesto_cn', () => {
      setupFormForCertificato();
      component.onChangeTipoCertificato({ nome: 'richiesto_cn' });
      expect(component._editFormGroupClients.controls['cn'].hasValidator(Validators.required)).toBe(true);
    });

    it('should set content and content_csr required for richiesto_csr', () => {
      setupFormForCertificato();
      component.onChangeTipoCertificato({ nome: 'richiesto_csr' });
      expect(component._editFormGroupClients.controls['content'].hasValidator(Validators.required)).toBe(true);
      expect(component._editFormGroupClients.controls['content_csr'].hasValidator(Validators.required)).toBe(true);
    });

    it('should clear stored cert state on null event', () => {
      setupFormForCertificato();
      component._certificato_fornito = { uuid: 'x' };
      component.onChangeTipoCertificato(null);
      expect(component._certificato_fornito).toBeNull();
      expect(component._certificato_csr).toBeNull();
      expect(component._modulo_richiesta_csr).toBeNull();
    });

    it('should handle empty form gracefully', () => {
      component._editFormGroupClients = new FormGroup({});
      expect(() => component.onChangeTipoCertificato(null)).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // onChangeTipoCertificatoFirma
  // ---------------------------------------------------------------------------
  describe('onChangeTipoCertificatoFirma', () => {
    function setupFormForFirma() {
      component._editFormGroupClients = new FormGroup({
        filename_firma: new FormControl(null),
        estensione_firma: new FormControl(null),
        content_firma: new FormControl(null),
        uuid_firma: new FormControl(null),
        cn_firma: new FormControl(null),
        filename_csr_firma: new FormControl(null),
        estensione_csr_firma: new FormControl(null),
        content_csr_firma: new FormControl(null),
        uuid_csr_firma: new FormControl(null),
        // Required by parent form validity call
        tipo_certificato: new FormControl(null),
        tipo_certificato_firma: new FormControl(null),
      });
    }

    // Fase 4.4 (Issue #237): come per `onChangeTipoCertificato`, i test sulle
    // flag orfane `_isFornito_firma/_isRichiesto_*_firma` sono stati rimossi.
    it('should set content_firma required for fornito', () => {
      setupFormForFirma();
      component.onChangeTipoCertificatoFirma({ nome: 'fornito' });
      expect(component._editFormGroupClients.controls['content_firma'].hasValidator(Validators.required)).toBe(true);
    });

    it('should set cn_firma required for richiesto_cn', () => {
      setupFormForFirma();
      component.onChangeTipoCertificatoFirma({ nome: 'richiesto_cn' });
      expect(component._editFormGroupClients.controls['cn_firma'].hasValidator(Validators.required)).toBe(true);
    });

    it('should set content_firma and content_csr_firma required for richiesto_csr', () => {
      setupFormForFirma();
      component.onChangeTipoCertificatoFirma({ nome: 'richiesto_csr' });
      expect(component._editFormGroupClients.controls['content_firma'].hasValidator(Validators.required)).toBe(true);
      expect(component._editFormGroupClients.controls['content_csr_firma'].hasValidator(Validators.required)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // __descrittoreChange
  // ---------------------------------------------------------------------------
  describe('__descrittoreChange', () => {
    function setupForm() {
      component._editFormGroupClients = new FormGroup({
        filename: new FormControl(null),
        estensione: new FormControl(null),
        content: new FormControl(null),
        filename_csr: new FormControl(null),
        estensione_csr: new FormControl(null),
        content_csr: new FormControl(null),
      });
    }

    it('should set non-csr fields when csr is not set', () => {
      setupForm();
      component.__descrittoreChange({ file: 'cert.pem', type: 'application/x-pem-file', data: 'base64data' });
      expect(component._editFormGroupClients.controls['filename'].value).toBe('cert.pem');
      expect(component._editFormGroupClients.controls['estensione'].value).toBe('application/x-pem-file');
      expect(component._editFormGroupClients.controls['content'].value).toBe('base64data');
    });

    it('should set csr fields when csr is true', () => {
      setupForm();
      component.__descrittoreChange({ file: 'csr.pem', type: 'application/pem', data: 'csrdata' }, true);
      expect(component._editFormGroupClients.controls['filename_csr'].value).toBe('csr.pem');
      expect(component._editFormGroupClients.controls['estensione_csr'].value).toBe('application/pem');
      expect(component._editFormGroupClients.controls['content_csr'].value).toBe('csrdata');
    });

    it('should reset error state', () => {
      setupForm();
      component._error = true;
      component._errorMsg = 'old error';
      component.__descrittoreChange({ file: 'f', type: 't', data: 'd' });
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // __descrittoreChangeFirma
  // ---------------------------------------------------------------------------
  describe('__descrittoreChangeFirma', () => {
    function setupForm() {
      component._editFormGroupClients = new FormGroup({
        filename_firma: new FormControl(null),
        estensione_firma: new FormControl(null),
        content_firma: new FormControl(null),
        filename_csr_firma: new FormControl(null),
        estensione_csr_firma: new FormControl(null),
        content_csr_firma: new FormControl(null),
      });
    }

    it('should set firma fields when csr is not set', () => {
      setupForm();
      component.__descrittoreChangeFirma({ file: 'firma.pem', type: 'pem', data: 'firmadata' });
      expect(component._editFormGroupClients.controls['filename_firma'].value).toBe('firma.pem');
      expect(component._editFormGroupClients.controls['estensione_firma'].value).toBe('pem');
      expect(component._editFormGroupClients.controls['content_firma'].value).toBe('firmadata');
    });

    it('should set csr firma fields when csr is true', () => {
      setupForm();
      component.__descrittoreChangeFirma({ file: 'csrf.pem', type: 'pem', data: 'csrfdata' }, true);
      expect(component._editFormGroupClients.controls['filename_csr_firma'].value).toBe('csrf.pem');
      expect(component._editFormGroupClients.controls['estensione_csr_firma'].value).toBe('pem');
      expect(component._editFormGroupClients.controls['content_csr_firma'].value).toBe('csrfdata');
    });
  });

  // ---------------------------------------------------------------------------
  // _initEditFormClients
  // ---------------------------------------------------------------------------
  describe('_initEditFormClients', () => {
    it('should create form group with all expected controls', () => {
      component._auth_type = 'https';
      component.adesione = { soggetto: { organizzazione: { id_organizzazione: 'org1' } } };
      component.environment = 'collaudo';
      component._generalConfig = {
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      component._initEditFormClients(null);

      const controls = component._editFormGroupClients.controls;
      expect(controls['credenziali']).toBeDefined();
      expect(controls['nome']).toBeDefined();
      expect(controls['nome_proposto']).toBeDefined();
      expect(controls['tipo_certificato']).toBeDefined();
      expect(controls['tipo_certificato_firma']).toBeDefined();
      expect(controls['ip_fruizione']).toBeDefined();
      expect(controls['rate_limiting']).toBeDefined();
      expect(controls['finalita']).toBeDefined();
      expect(controls['client_id']).toBeDefined();
      expect(controls['username']).toBeDefined();
    });

    it('should set client_id required for pdnd auth type', () => {
      component._auth_type = 'pdnd';
      component.adesione = { soggetto: { organizzazione: { id_organizzazione: 'org1' } } };
      component.environment = 'collaudo';
      component._generalConfig = {
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      component._initEditFormClients(null);

      expect(component._editFormGroupClients.controls['client_id'].hasValidator(Validators.required)).toBe(true);
    });

    it('should enable tipo_certificato_firma for sign auth type', () => {
      component._auth_type = 'sign';
      component.adesione = { soggetto: { organizzazione: { id_organizzazione: 'org1' } } };
      component.environment = AmbienteEnum.Collaudo;
      component.grant = { ruoli: ['referente'], collaudo: RightsEnum.Scrittura, produzione: RightsEnum.Lettura, identificativo: RightsEnum.Lettura, generico: RightsEnum.Lettura, specifica: RightsEnum.Lettura, referenti: RightsEnum.Lettura };
      component._generalConfig = {
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      component._initEditFormClients(null);

      expect(component._editFormGroupClients.controls['tipo_certificato_firma'].enabled).toBe(true);
    });

    it('should set oauth fields required and enabled for oauth_authorization_code', () => {
      component._auth_type = 'oauth_authorization_code';
      component.adesione = { soggetto: { organizzazione: { id_organizzazione: 'org1' } } };
      component.environment = AmbienteEnum.Collaudo;
      component.grant = { ruoli: ['referente'], collaudo: RightsEnum.Scrittura, produzione: RightsEnum.Lettura, identificativo: RightsEnum.Lettura, generico: RightsEnum.Lettura, specifica: RightsEnum.Lettura, referenti: RightsEnum.Lettura };
      component._generalConfig = {
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      component._initEditFormClients(null);

      const ctrls = component._editFormGroupClients.controls;
      expect(ctrls['url_redirezione'].enabled).toBe(true);
      expect(ctrls['url_redirezione'].hasValidator(Validators.required)).toBe(true);
      expect(ctrls['url_esposizione'].enabled).toBe(true);
      expect(ctrls['help_desk'].enabled).toBe(true);
      expect(ctrls['nome_applicazione_portale'].enabled).toBe(true);
    });

    it('should populate form with data when provided', () => {
      component._auth_type = 'https';
      component.adesione = { soggetto: { organizzazione: { id_organizzazione: 'org1' } } };
      component.environment = 'collaudo';
      component._generalConfig = {
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      const data = {
        id_client: 'c1',
        nome: 'Client 1',
        nome_proposto: null,
        indirizzo_ip: '10.0.0.1',
        descrizione: 'Test desc',
        dati_specifici: {
          auth_type: 'https',
          certificato_autenticazione: {
            tipo_certificato: 'fornito',
            certificato: { uuid: 'u1', filename: 'cert.pem', content_type: 'pem', content: 'data' }
          },
          rate_limiting: { quota: 100, periodo: PeriodEnum.Giorno },
          finalita: 'test-uuid'
        }
      };

      component._initEditFormClients(data);

      expect(component._editFormGroupClients.controls['credenziali'].value).toBe('c1');
      // Fase 4.4: `_isFornito` sostituito dalla lettura del FormControl
      // `tipo_certificato` tramite `_currentCertAuthMode`.
      expect(component._editFormGroupClients.controls['tipo_certificato'].value).toBe('fornito');
      expect(component._editFormGroupClients.getRawValue().ip_fruizione).toBe('10.0.0.1');
    });

    it('should show nome_proposto field when data has nome_proposto', () => {
      component._auth_type = 'https';
      component.adesione = { soggetto: { organizzazione: { id_organizzazione: 'org1' } } };
      component.environment = 'collaudo';
      component._generalConfig = {
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      const data = {
        nome_proposto: 'Proposed Client',
        nome: null,
        id_client: null,
      };

      component._initEditFormClients(data);

      expect(component._show_nome_proposto).toBeTruthy();
      expect(component._show_client_form).toBe(false);
    });

    it('should disable all fields when not modifiable', () => {
      component._auth_type = 'https';
      component.adesione = { soggetto: { organizzazione: { id_organizzazione: 'org1' } } };
      component.environment = AmbienteEnum.Collaudo;
      component.grant = null; // No grant means not modifiable
      component._generalConfig = {
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      component._initEditFormClients(null);

      // All controls should be disabled
      const controls = component._editFormGroupClients.controls;
      Object.keys(controls).forEach(key => {
        expect(controls[key].disabled).toBe(true);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // _onSaveModalClient
  // ---------------------------------------------------------------------------
  describe('_onSaveModalClient', () => {
    function setupForSave() {
      component._auth_type = 'https';
      // Fase 4.4: rimosso `_isHttps = true`, flag eliminata. Il comportamento
      // e' derivato da `_auth_type` via predicato `authRequiresCertAuth`.
      component.adesione = {
        id_adesione: 100,
        soggetto: { id_soggetto: 1, organizzazione: { id_organizzazione: 'org1' } }
      };
      component.environment = 'collaudo';
      component._codice_interno_profilo = 'prof1';
      component._show_erogazione_rate_limiting = false;
      component._show_erogazione_finalita = false;
      component._tipo_client = TipoClientEnum.Nuovo;

      component._editFormGroupClients = new FormGroup({
        credenziali: new FormControl(null),
        nome_proposto: new FormControl(null),
        nome: new FormControl('New Client'),
        tipo_certificato: new FormControl('fornito'),
        tipo_certificato_firma: new FormControl(null),
        filename: new FormControl('cert.pem'),
        estensione: new FormControl('pem'),
        content: new FormControl('data'),
        uuid: new FormControl(null),
        filename_firma: new FormControl(null),
        estensione_firma: new FormControl(null),
        content_firma: new FormControl(null),
        uuid_firma: new FormControl(null),
        filename_csr: new FormControl(null),
        estensione_csr: new FormControl(null),
        content_csr: new FormControl(null),
        uuid_csr: new FormControl(null),
        filename_csr_firma: new FormControl(null),
        estensione_csr_firma: new FormControl(null),
        content_csr_firma: new FormControl(null),
        uuid_csr_firma: new FormControl(null),
        cn: new FormControl(null),
        cn_firma: new FormControl(null),
        csr: new FormControl(null),
        modulo_richiesta_csr: new FormControl(null),
        modulo_richiesta_csr_firma: new FormControl(null),
        ip_fruizione: new FormControl(null),
        descrizione: new FormControl(null),
        rate_limiting: new FormGroup({
          quota: new FormControl(null),
          periodo: new FormControl(null),
        }),
        finalita: new FormControl(null),
        id_utente: new FormControl(null),
        url_redirezione: new FormControl(null),
        url_esposizione: new FormControl(null),
        help_desk: new FormControl(null),
        nome_applicazione_portale: new FormControl(null),
        client_id: new FormControl(null),
        username: new FormControl(null),
      });

      component._modalEditRef = { hide: vi.fn() } as any;
    }

    it('should set _saving to true then false on successful new client save', () => {
      setupForSave();
      component._currClient = {}; // No id_client - new client
      component._certificato_fornito = null; // new certificate

      Tools.Configurazione = {
        servizio: { api: { profili: [], auth_type: [{ type: 'https', indirizzi_ip: true }] } },
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      mockApiService.putElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));

      component._onSaveModalClient({ nome: 'New Client' });

      expect(mockApiService.putElementRelated).toHaveBeenCalledWith(
        'adesioni', 100, 'collaudo/client/prof1', expect.any(Object)
      );
      expect(component._saving).toBe(false);
    });

    it('should call putElementRelated for update when currClient has id_client', () => {
      setupForSave();
      component._currClient = {
        id_client: 'c1',
        nome: 'Existing',
        soggetto: { id_soggetto: 1 }
      };

      Tools.Configurazione = {
        servizio: { api: { profili: [], auth_type: [{ type: 'https', indirizzi_ip: true }] } },
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      mockApiService.putElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));

      component._onSaveModalClient({ nome: 'Updated Client' });

      expect(mockApiService.putElementRelated).toHaveBeenCalled();
      const callArgs = mockApiService.putElementRelated.mock.calls[0];
      expect(callArgs[0]).toBe('adesioni');
      expect(callArgs[1]).toBe(100);
      expect(callArgs[2]).toBe('collaudo/client/prof1');
    });

    it('should set error state on save failure', () => {
      setupForSave();
      component._currClient = {};
      component._certificato_fornito = null;

      Tools.Configurazione = {
        servizio: { api: { profili: [], auth_type: [{ type: 'https', indirizzi_ip: true }] } },
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      mockApiService.putElementRelated.mockReturnValue(throwError(() => new Error('save failed')));

      component._onSaveModalClient({ nome: 'New Client' });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._saving).toBe(false);
    });

    it('should set error state on update failure', () => {
      setupForSave();
      component._currClient = {
        id_client: 'c1',
        nome: 'Existing',
        soggetto: { id_soggetto: 1 }
      };

      Tools.Configurazione = {
        servizio: { api: { profili: [], auth_type: [{ type: 'https', indirizzi_ip: true }] } },
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      mockApiService.putElementRelated.mockReturnValue(throwError(() => new Error('update failed')));

      component._onSaveModalClient({ nome: 'Updated' });

      expect(component._error).toBe(true);
      expect(component._saving).toBe(false);
    });

    it('should include rate_limiting in dati_specifici when shown and has quota', () => {
      setupForSave();
      component._currClient = {};
      component._certificato_fornito = null;
      component._show_erogazione_rate_limiting = true;

      Tools.Configurazione = {
        servizio: { api: { profili: [], auth_type: [{ type: 'https', indirizzi_ip: true }] } },
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      component._editFormGroupClients.controls['rate_limiting'].setValue({ quota: 100, periodo: PeriodEnum.Giorno });

      mockApiService.putElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));

      component._onSaveModalClient({});

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.rate_limiting).toEqual({ quota: 100, periodo: PeriodEnum.Giorno });
    });

    it('should include client_id for pdnd auth type', () => {
      setupForSave();
      component._currClient = {};
      component._auth_type = 'pdnd';

      Tools.Configurazione = {
        servizio: { api: { profili: [], auth_type: [{ type: 'pdnd', indirizzi_ip: false }] } },
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      component._editFormGroupClients.controls['client_id'].setValue('pdnd-client-1');

      mockApiService.putElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));

      component._onSaveModalClient({});

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.client_id).toBe('pdnd-client-1');
    });

    it('should include oauth fields for oauth_authorization_code auth type', () => {
      setupForSave();
      component._currClient = {};
      component._auth_type = 'oauth_authorization_code';

      Tools.Configurazione = {
        servizio: { api: { profili: [], auth_type: [{ type: 'oauth_authorization_code', indirizzi_ip: false }] } },
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      component._editFormGroupClients.controls['url_redirezione'].setValue('https://redirect.url');
      component._editFormGroupClients.controls['url_esposizione'].setValue('https://expose.url');
      component._editFormGroupClients.controls['help_desk'].setValue('helpdesk@test.it');
      component._editFormGroupClients.controls['nome_applicazione_portale'].setValue('App Portal');
      component._editFormGroupClients.controls['client_id'].setValue('oauth-client-1');

      mockApiService.putElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));

      component._onSaveModalClient({});

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.url_redirezione).toBe('https://redirect.url');
      expect(payload.dati_specifici.url_esposizione).toBe('https://expose.url');
      expect(payload.dati_specifici.help_desk).toBe('helpdesk@test.it');
      expect(payload.dati_specifici.nome_applicazione_portale).toBe('App Portal');
      expect(payload.dati_specifici.client_id).toBe('oauth-client-1');
    });

    it('should build certificato_autenticazione for richiesto_cn tipo', () => {
      setupForSave();
      component._currClient = {};

      Tools.Configurazione = {
        servizio: { api: { profili: [], auth_type: [{ type: 'https', indirizzi_ip: true }] } },
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      component._editFormGroupClients.controls['tipo_certificato'].setValue('richiesto_cn');
      component._editFormGroupClients.controls['cn'].setValue('CN=test.example.com');

      mockApiService.putElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));

      component._onSaveModalClient({});

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.certificato_autenticazione.tipo_certificato).toBe('richiesto_cn');
      expect(payload.dati_specifici.certificato_autenticazione.cn).toBe('CN=test.example.com');
    });

    it('should build certificato_autenticazione for richiesto_csr tipo', () => {
      setupForSave();
      component._currClient = {};
      component._certificato_csr = null;
      component._modulo_richiesta_csr = null;

      Tools.Configurazione = {
        servizio: { api: { profili: [], auth_type: [{ type: 'https', indirizzi_ip: true }] } },
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      component._editFormGroupClients.controls['tipo_certificato'].setValue('richiesto_csr');

      mockApiService.putElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));

      component._onSaveModalClient({ content_csr: 'csr_content', filename_csr: 'csr.pem', estensione_csr: 'pem', content: 'modulo_content', filename: 'mod.pem', estensione: 'pem' });

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.certificato_autenticazione.tipo_certificato).toBe('richiesto_csr');
      expect(payload.dati_specifici.certificato_autenticazione.richiesta).toBeDefined();
      expect(payload.dati_specifici.certificato_autenticazione.modulo_richiesta).toBeDefined();
    });

    it('should build certificato_firma for richiesto_cn firma tipo', () => {
      setupForSave();
      component._currClient = {};
      component._auth_type = 'https_sign';

      Tools.Configurazione = {
        servizio: { api: { profili: [], auth_type: [{ type: 'https_sign', indirizzi_ip: false }] } },
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      component._editFormGroupClients.controls['tipo_certificato_firma'].setValue('richiesto_cn');
      component._editFormGroupClients.controls['cn_firma'].setValue('CN=sign.example.com');

      mockApiService.putElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));

      component._onSaveModalClient({});

      const payload = mockApiService.putElementRelated.mock.calls[0][3];
      expect(payload.dati_specifici.certificato_firma.tipo_certificato).toBe('richiesto_cn');
      expect(payload.dati_specifici.certificato_firma.cn).toBe('CN=sign.example.com');
    });

    it('should broadcast WIZARD_CHECK_UPDATE on successful save', () => {
      setupForSave();
      component._currClient = {};
      component._certificato_fornito = null;

      Tools.Configurazione = {
        servizio: { api: { profili: [], auth_type: [{ type: 'https', indirizzi_ip: true }] } },
        adesione: { visualizza_elenco_client_esistenti: false, riuso_client_obbligatorio: false }
      };

      mockApiService.putElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));

      component._onSaveModalClient({});

      expect(mockEventsManager.broadcast).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onEdit
  // ---------------------------------------------------------------------------
  describe('onEdit', () => {
    it('should delegate to _onEditClient', () => {
      const spy = vi.spyOn(component, '_onEditClient' as any).mockImplementation(() => {});
      const client = { id_client: null, auth_type: 'https', source: { codice_interno: 'prof1', stato: StatoConfigurazioneEnum.NONCONFIGURATO } };
      component.onEdit(client);
      expect(spy).toHaveBeenCalledWith(client);
      spy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // fRate getter
  // ---------------------------------------------------------------------------
  describe('fRate getter', () => {
    it('should return controls of the rate_limiting sub-group', () => {
      component._editFormGroupClients = new FormGroup({
        rate_limiting: new FormGroup({
          quota: new FormControl(100),
          periodo: new FormControl('giorno'),
        }),
      });
      const rate = component.fRate;
      expect(rate['quota']).toBeDefined();
      expect(rate['quota'].value).toBe(100);
      expect(rate['periodo'].value).toBe('giorno');
    });
  });

  // ---------------------------------------------------------------------------
  // _resetUploadCertificateComponents
  // ---------------------------------------------------------------------------
  describe('_resetUploadCertificateComponents', () => {
    it('should clear and reset validators for certificate controls', () => {
      component._editFormGroupClients = new FormGroup({
        filename: new FormControl('cert.pem'),
        estensione: new FormControl('pem'),
        content: new FormControl('data', Validators.required),
        cn: new FormControl('cn-val', Validators.required),
        filename_csr: new FormControl('csr.pem'),
        estensione_csr: new FormControl('pem'),
        content_csr: new FormControl('csr-data', Validators.required),
      });
      component._descrittoreCtrl.setValue('old');
      component._descrittoreCtrl_csr.setValue('old');
      component._descrittoreCtrl_csr_modulo.setValue('old');

      component._resetUploadCertificateComponents(component._editFormGroupClients.controls);

      expect(component._editFormGroupClients.controls['filename'].value).toBeNull();
      expect(component._editFormGroupClients.controls['content'].value).toBeNull();
      expect(component._editFormGroupClients.controls['cn'].value).toBeNull();
      expect(component._editFormGroupClients.controls['content_csr'].value).toBeNull();
      expect(component._descrittoreCtrl.value).toBe('');
    });
  });
});
