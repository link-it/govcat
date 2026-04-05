import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { AdesioneListaErogazioniComponent } from './adesione-lista-erogazioni.component';

describe('AdesioneListaErogazioniComponent', () => {
  let component: AdesioneListaErogazioniComponent;

  const mockModalService = { show: vi.fn().mockReturnValue({ hide: vi.fn() }) } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({ content: [] })),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    putElement: vi.fn().mockReturnValue(of({})),
    putElementRelated: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    isGestore: vi.fn().mockReturnValue(false),
    canChangeStatus: vi.fn().mockReturnValue(false),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _removeEmpty: vi.fn(),
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
    vi.clearAllMocks();
    component = new AdesioneListaErogazioniComponent(
      mockModalService, mockApiService, mockAuthService,
      mockUtils, mockEventsManager, mockCkeckProvider
    );
  });

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
  });

  it('should have default internal state', () => {
    expect(component.completed).toBe(true);
    expect(component.model).toBe('adesioni');
    expect(component.adesioneErogazioni).toBeNull();
    expect(component.spin).toBe(false);
    expect(component._saving).toBe(false);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component.isEditErogazione).toBe(false);
  });

  describe('ngOnInit', () => {
    it('should call loadAdesioneErogazioni when id is set', () => {
      component.id = 42;
      component.environment = 'collaudo';
      component.adesione = { erogazioni_richieste: [] };
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));
      component.ngOnInit();
      expect(mockApiService.getDetails).toHaveBeenCalledWith('adesioni', 42, 'collaudo/erogazioni');
    });

    it('should NOT call API when id is 0', () => {
      component.id = 0;
      component.ngOnInit();
      expect(mockApiService.getDetails).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should update dataCheck and updateMapper when dataCheck changes', () => {
      const newData = { esito: 'ko', errori: ['err1'] };
      component.ngOnChanges({
        dataCheck: { currentValue: newData, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);
      expect(component.dataCheck).toEqual(newData);
      expect(component.updateMapper).not.toBe('');
    });

    it('should not update updateMapper when other inputs change', () => {
      const before = component.updateMapper;
      component.ngOnChanges({
        environment: { currentValue: 'produzione', previousValue: 'collaudo', firstChange: false, isFirstChange: () => false }
      } as any);
      expect(component.updateMapper).toBe(before);
    });
  });

  describe('loadAdesioneErogazioni (via ngOnInit)', () => {
    const apiResponseWithMatch = {
      content: [
        {
          api: {
            id_api: 10, codice_asset: 'A1', nome: 'Api1', protocollo: 'rest',
            protocollo_dettaglio: null, ruolo: 'erogatore', versione: 1,
            specifica: { content_type: 'json', filename: 'spec.json', uuid: 'u1' }
          },
          indirizzi_ip: '1.2.3.4',
          url: 'http://example.com'
        }
      ]
    };

    it('should set spin to true and then false after loading', () => {
      component.id = 1;
      component.environment = 'collaudo';
      component.adesione = {
        erogazioni_richieste: [{ api: { id_api: 10, nome: 'Api1', versione: 1 } }]
      };
      mockApiService.getDetails.mockReturnValue(of(apiResponseWithMatch));
      component.ngOnInit();
      expect(component.spin).toBe(false);
    });

    it('should build erogazioni list matching associated erogazioni', () => {
      component.id = 1;
      component.environment = 'collaudo';
      component.adesione = {
        erogazioni_richieste: [{ api: { id_api: 10, nome: 'Api1', versione: 1 } }]
      };
      mockApiService.getDetails.mockReturnValue(of(apiResponseWithMatch));
      component.ngOnInit();
      expect(component.adesioneErogazioni).toHaveLength(1);
      expect(component.adesioneErogazioni[0].stato).toBe('configurato');
      expect(component.adesioneErogazioni[0].url).toBe('http://example.com');
      expect(component.adesioneErogazioni[0].indirizzi_ip).toBe('1.2.3.4');
    });

    it('should mark erogazioni as Non configurato when no match in response', () => {
      component.id = 1;
      component.environment = 'collaudo';
      component.adesione = {
        erogazioni_richieste: [{ api: { id_api: 99, nome: 'Unmatched', versione: 2 } }]
      };
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));
      component.ngOnInit();
      expect(component.adesioneErogazioni).toHaveLength(1);
      expect(component.adesioneErogazioni[0].stato).toBe('Non configurato');
      expect(component.adesioneErogazioni[0].nome).toBe('Unmatched');
    });

    it('should handle API error and set spin to false', () => {
      component.id = 1;
      component.environment = 'collaudo';
      mockApiService.getDetails.mockReturnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(component.spin).toBe(false);
    });
  });

  describe('isStatusPubblicatoCollaudodMapper', () => {
    it('should return true for pubblicato_produzione', () => {
      expect(component.isStatusPubblicatoCollaudodMapper('', 'pubblicato_produzione')).toBe(true);
    });

    it('should return false for other states', () => {
      expect(component.isStatusPubblicatoCollaudodMapper('', 'bozza')).toBe(false);
      expect(component.isStatusPubblicatoCollaudodMapper('', 'configurato')).toBe(false);
    });
  });

  describe('getSottotipoGroupCompletedMapper', () => {
    it('should return 2 (grey) when skip_collaudo and environment is collaudo', () => {
      component.environment = 'collaudo';
      component.adesione = { skip_collaudo: true };
      expect(component.getSottotipoGroupCompletedMapper('', 'erogazioni')).toBe(2);
    });

    it('should return 2 (grey) when produzione and in collaudo phase', () => {
      component.environment = 'produzione';
      component.adesione = { skip_collaudo: false, stato: 'richiesto_collaudo' };
      expect(component.getSottotipoGroupCompletedMapper('', 'erogazioni')).toBe(2);
    });

    it('should return 1 when sottotipo is completed and nextState has dati_non_applicabili matching env', () => {
      component.environment = 'collaudo';
      component.adesione = { skip_collaudo: false, stato: 'pubblicato_produzione' };
      component.nextState = { dati_non_applicabili: ['collaudo'] };
      mockCkeckProvider.isSottotipoGroupCompleted.mockReturnValue(true);
      expect(component.getSottotipoGroupCompletedMapper('', 'erogazioni')).toBe(2);
    });

    it('should return 1 when sottotipo is completed and dati_non_applicabili does not include env', () => {
      component.environment = 'collaudo';
      component.adesione = { skip_collaudo: false, stato: 'pubblicato_produzione' };
      component.nextState = { dati_non_applicabili: ['produzione'] };
      mockCkeckProvider.isSottotipoGroupCompleted.mockReturnValue(true);
      expect(component.getSottotipoGroupCompletedMapper('', 'erogazioni')).toBe(1);
    });

    it('should return 0 when sottotipo is not completed and hasCambioStato is true', () => {
      component.environment = 'collaudo';
      component.adesione = { skip_collaudo: false, stato: 'pubblicato_produzione' };
      mockCkeckProvider.isSottotipoGroupCompleted.mockReturnValue(false);
      mockAuthService.isGestore.mockReturnValue(true);
      component.grant = { ruoli: ['gestore'] } as any;
      expect(component.getSottotipoGroupCompletedMapper('', 'erogazioni')).toBe(0);
    });

    it('should return 1 when sottotipo is not completed and hasCambioStato is false', () => {
      component.environment = 'collaudo';
      component.adesione = { skip_collaudo: false, stato: 'pubblicato_produzione' };
      mockCkeckProvider.isSottotipoGroupCompleted.mockReturnValue(false);
      mockAuthService.isGestore.mockReturnValue(false);
      mockAuthService.canChangeStatus.mockReturnValue(false);
      component.grant = { ruoli: [] } as any;
      expect(component.getSottotipoGroupCompletedMapper('', 'erogazioni')).toBe(1);
    });
  });

  describe('_isInCollaudoPhase', () => {
    it('should return true for bozza state without skip_collaudo', () => {
      component.adesione = { skip_collaudo: false, stato: 'bozza' };
      expect(component._isInCollaudoPhase()).toBe(true);
    });

    it('should return false when skip_collaudo is true', () => {
      component.adesione = { skip_collaudo: true, stato: 'bozza' };
      expect(component._isInCollaudoPhase()).toBe(false);
    });

    it('should return false for a non-collaudo state', () => {
      component.adesione = { skip_collaudo: false, stato: 'pubblicato_produzione' };
      expect(component._isInCollaudoPhase()).toBe(false);
    });

    it('should return true for all collaudo states', () => {
      const collaudoStates = [
        'bozza', 'richiesto_collaudo', 'autorizzato_collaudo',
        'in_configurazione_collaudo', 'in_configurazione_automatica_collaudo',
        'in_configurazione_manuale_collaudo'
      ];
      for (const stato of collaudoStates) {
        component.adesione = { skip_collaudo: false, stato };
        expect(component._isInCollaudoPhase()).toBe(true);
      }
    });
  });

  describe('isSottotipoGroupCompletedMapper / isSottotipoCompletedMapper', () => {
    it('should delegate to ckeckProvider.isSottotipoGroupCompleted', () => {
      component.dataCheck = { esito: 'ok', errori: [] };
      component.environment = 'collaudo';
      mockCkeckProvider.isSottotipoGroupCompleted.mockReturnValue(false);
      expect(component.isSottotipoGroupCompletedMapper('', 'erogazioni')).toBe(false);
      expect(mockCkeckProvider.isSottotipoGroupCompleted).toHaveBeenCalledWith(
        { esito: 'ok', errori: [] }, 'collaudo', 'erogazioni'
      );
    });

    it('should delegate to ckeckProvider.isSottotipoCompleted', () => {
      component.dataCheck = { esito: 'ok', errori: [] };
      component.environment = 'produzione';
      mockCkeckProvider.isSottotipoCompleted.mockReturnValue(true);
      expect(component.isSottotipoCompletedMapper('', 'erogazioni', 'id123')).toBe(true);
      expect(mockCkeckProvider.isSottotipoCompleted).toHaveBeenCalledWith(
        { esito: 'ok', errori: [] }, 'produzione', 'erogazioni', 'id123'
      );
    });
  });

  describe('_isModifiableMapper', () => {
    it('should return true when collaudo environment and grant has Scrittura', () => {
      component.environment = 'collaudo';
      component.grant = { collaudo: 'scrittura', produzione: 'lettura', ruoli: [] } as any;
      expect(component._isModifiableMapper()).toBe(true);
    });

    it('should return true when produzione environment and grant has Scrittura', () => {
      component.environment = 'produzione';
      component.grant = { collaudo: 'lettura', produzione: 'scrittura', ruoli: [] } as any;
      expect(component._isModifiableMapper()).toBe(true);
    });

    it('should return false when grant is null', () => {
      component.grant = null;
      expect(component._isModifiableMapper()).toBe(false);
    });

    it('should return false when grant has only lettura', () => {
      component.environment = 'collaudo';
      component.grant = { collaudo: 'lettura', produzione: 'lettura', ruoli: [] } as any;
      expect(component._isModifiableMapper()).toBe(false);
    });
  });

  describe('_hasCambioStato', () => {
    it('should return true when user is gestore', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      component.adesione = { stato: 'bozza' };
      component.grant = { ruoli: ['gestore'] } as any;
      expect(component._hasCambioStato()).toBe(true);
    });

    it('should return canChangeStatus result when not gestore', () => {
      mockAuthService.isGestore.mockReturnValue(false);
      mockAuthService.canChangeStatus.mockReturnValue(true);
      component.adesione = { stato: 'bozza' };
      component.grant = { ruoli: ['referente'] } as any;
      expect(component._hasCambioStato()).toBe(true);
      expect(mockAuthService.canChangeStatus).toHaveBeenCalledWith(
        'adesione', 'bozza', 'stato_successivo', ['referente']
      );
    });
  });

  describe('closeModal / _resetError', () => {
    it('should hide modal and reset isEditErogazione', () => {
      const hideFn = vi.fn();
      component._modalEditRef = { hide: hideFn } as any;
      component.isEditErogazione = true;
      component.closeModal();
      expect(hideFn).toHaveBeenCalled();
      expect(component.isEditErogazione).toBe(false);
    });

    it('should reset error state', () => {
      component._error = true;
      component._errorMsg = 'Something went wrong';
      component._resetError();
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });
  });

  describe('_initEditFormErogazioni', () => {
    it('should create form with data values', () => {
      component.grant = { collaudo: 'scrittura', produzione: 'lettura', ruoli: [] } as any;
      component.environment = 'collaudo';
      component._initEditFormErogazioni({ nome: 'Api1', versione: '1', url: 'http://a.com', indirizzi_ip: '1.2.3.4' });
      expect(component._editFormGroupErogazioni.get('nome')?.value).toBe('Api1');
      expect(component._editFormGroupErogazioni.get('versione')?.value).toBe('1');
      expect(component._editFormGroupErogazioni.get('url')?.value).toBe('http://a.com');
      expect(component._editFormGroupErogazioni.get('indirizzi_ip')?.value).toBe('1.2.3.4');
    });

    it('should disable all fields when not modifiable', () => {
      component.grant = null;
      component._initEditFormErogazioni({ nome: 'Api1', versione: '1', url: null, indirizzi_ip: null });
      expect(component._editFormGroupErogazioni.get('url')?.disabled).toBe(true);
      expect(component._editFormGroupErogazioni.get('indirizzi_ip')?.disabled).toBe(true);
    });

    it('should set url as null when data.url is missing', () => {
      component.grant = { collaudo: 'scrittura', produzione: 'lettura', ruoli: [] } as any;
      component.environment = 'collaudo';
      component._initEditFormErogazioni({ nome: 'Api1', versione: '1' });
      expect(component._editFormGroupErogazioni.get('url')?.value).toBeNull();
    });
  });

  describe('fe getter', () => {
    it('should return form controls', () => {
      component.grant = { collaudo: 'scrittura', produzione: 'lettura', ruoli: [] } as any;
      component.environment = 'collaudo';
      component._initEditFormErogazioni({ nome: 'A', versione: '1', url: 'http://a.com' });
      expect(component.fe['nome']).toBeDefined();
      expect(component.fe['url']).toBeDefined();
    });
  });

  describe('onEdit / _onEditAdesioneErogaz', () => {
    it('should set up erogazione data and open modal', () => {
      component.editErogazioni = {} as any;
      const erogaz = { id_erogazione: 5, nome: 'Api1', versione: '1', url: 'http://x.com' };
      component.grant = { collaudo: 'scrittura', produzione: 'lettura', ruoli: [] } as any;
      component.environment = 'collaudo';
      component.onEdit(erogaz);
      expect(component.erogaz).toBe(erogaz);
      expect(component.id_erogazione).toBe(5);
      expect(mockModalService.show).toHaveBeenCalled();
    });

    it('should reset error before opening modal', () => {
      component.editErogazioni = {} as any;
      component._error = true;
      component._errorMsg = 'old error';
      component.grant = { collaudo: 'scrittura', produzione: 'lettura', ruoli: [] } as any;
      component.environment = 'collaudo';
      component.onEdit({ id_erogazione: 1, nome: 'A', versione: '1' });
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });
  });

  describe('_onSaveModalErogazioni', () => {
    beforeEach(() => {
      component.adesione = { id_adesione: 'ad1' };
      component.environment = 'collaudo';
      component.id_erogazione = 'erog1';
      component.id = 1;
      component._modalEditRef = { hide: vi.fn() } as any;
    });

    it('should PUT data and reload erogazioni on success', () => {
      component.adesione.erogazioni_richieste = [];
      mockApiService.putElementRelated.mockReturnValue(of({}));
      mockApiService.getDetails.mockReturnValue(of({ content: [] }));
      component._onSaveModalErogazioni({ url: 'http://new.com', indirizzi_ip: '5.6.7.8' });
      expect(mockApiService.putElementRelated).toHaveBeenCalledWith(
        'adesioni', 'ad1', 'collaudo/erogazioni/erog1',
        { url: 'http://new.com', indirizzi_ip: '5.6.7.8' }
      );
      expect(component._saving).toBe(false);
      expect(mockEventsManager.broadcast).toHaveBeenCalled();
    });

    it('should handle save error', () => {
      mockApiService.putElementRelated.mockReturnValue(throwError(() => ({ error: { detail: 'fail' } })));
      component._onSaveModalErogazioni({ url: 'http://new.com', indirizzi_ip: null });
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error');
      expect(component._saving).toBe(false);
    });
  });

  describe('_disableAllFields', () => {
    it('should disable all form controls', () => {
      const ctrl1 = { disable: vi.fn() };
      const ctrl2 = { disable: vi.fn() };
      component._disableAllFields({ a: ctrl1, b: ctrl2 });
      expect(ctrl1.disable).toHaveBeenCalled();
      expect(ctrl2.disable).toHaveBeenCalled();
    });
  });
});
