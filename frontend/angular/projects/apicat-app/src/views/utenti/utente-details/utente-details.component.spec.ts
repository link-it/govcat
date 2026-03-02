import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UtenteDetailsComponent } from './utente-details.component';
import { Ruolo, Stato } from './utente';
import { Tools } from '@linkit/components';

describe('UtenteDetailsComponent', () => {
  let component: UtenteDetailsComponent;
  let savedConfigurazione: any;

  let mockRoute: any;
  let mockRouter: any;
  let mockTranslate: any;
  let mockModalService: any;
  let mockConfigService: any;
  let mockTools: any;
  let mockEventsManagerService: any;
  let mockApiService: any;
  let mockUtils: any;

  beforeEach(() => {
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = null;

    mockRoute = {
      params: of({}),
      queryParams: of({}),
      data: of({})
    };
    mockRouter = {
      navigate: vi.fn()
    };
    mockTranslate = {
      instant: vi.fn((key: string) => key)
    };
    mockModalService = {
      show: vi.fn()
    };
    mockConfigService = {
      getConfiguration: vi.fn().mockReturnValue({
        AppConfig: {
          GOVAPI: { HOST: 'http://localhost' },
          Services: {},
          Layout: {}
        }
      }),
      getConfig: vi.fn().mockReturnValue(of({}))
    };
    mockTools = {};
    mockEventsManagerService = {
      on: vi.fn(),
      broadcast: vi.fn(),
      off: vi.fn()
    };
    mockApiService = {
      getList: vi.fn().mockReturnValue(of({ content: [] })),
      getDetails: vi.fn().mockReturnValue(of({})),
      saveElement: vi.fn().mockReturnValue(of({})),
      putElement: vi.fn().mockReturnValue(of({})),
      deleteElement: vi.fn().mockReturnValue(of({}))
    };
    mockUtils = {
      GetErrorMsg: vi.fn().mockReturnValue('Error'),
      _removeEmpty: vi.fn((obj: any) => obj)
    };

    component = new UtenteDetailsComponent(
      mockRoute as any,
      mockRouter as any,
      mockTranslate as any,
      mockModalService as any,
      mockConfigService as any,
      mockTools as any,
      mockEventsManagerService as any,
      mockApiService as any,
      mockUtils as any
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(UtenteDetailsComponent.Name).toBe('UtenteDetailsComponent');
  });

  it('should have model set to utenti', () => {
    expect(component.model).toBe('utenti');
  });

  it('should set appConfig from configService', () => {
    expect(component.appConfig).toBeDefined();
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should have default values', () => {
    expect(component.id).toBeNull();
    expect(component.utente).toBeNull();
    expect(component._isDetails).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._isNew).toBe(false);
    expect(component._spin).toBe(true);
    expect(component._error).toBe(false);
    expect(component._currentTab).toBe('details');
    expect(component.hasTab).toBe(true);
    expect(component._useRoute).toBe(true);
    expect(component._fromDashboard).toBe(false);
  });

  it('should have close and save EventEmitters', () => {
    expect(component.close).toBeDefined();
    expect(component.save).toBeDefined();
  });

  it('should have default breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Configurations');
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Users');
  });

  describe('_initBreadcrumb', () => {
    it('should set breadcrumbs with utente name', () => {
      component.utente = { nome: 'Mario', cognome: 'Rossi' };
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[2].label).toBe('Mario Rossi');
    });

    it('should set breadcrumbs for new utente when utente is null', () => {
      component.utente = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[component.breadcrumbs.length - 1].label).toBe('APP.TITLE.New');
    });

    it('should set dashboard breadcrumbs when _fromDashboard is true', () => {
      component._fromDashboard = true;
      component.utente = { nome: 'Mario', cognome: 'Rossi' };
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(2);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
      expect(component.breadcrumbs[0].url).toBe('/dashboard');
    });
  });

  describe('_clickTab', () => {
    it('should change current tab', () => {
      component._clickTab('info');
      expect(component._currentTab).toBe('info');
    });
  });

  describe('_onCancelEdit', () => {
    it('should reset edit state', () => {
      component._isEdit = true;
      component._error = true;
      component._errorMsg = 'some error';
      component._isNew = false;
      component.utente = { nome: 'Test', cognome: 'User' };
      component._onCancelEdit();
      expect(component._isEdit).toBe(false);
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
    });

    it('should navigate when new and using route', () => {
      component._isNew = true;
      component._useRoute = true;
      component._onCancelEdit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['utenti']);
    });

    it('should emit close when new and not using route', () => {
      component._isNew = true;
      component._useRoute = false;
      const spy = vi.fn();
      component.close.subscribe(spy);
      component._onCancelEdit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onBreadcrumb', () => {
    it('should navigate when using route', () => {
      component._useRoute = true;
      component.onBreadcrumb({ url: '/utenti' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/utenti'], { queryParamsHandling: 'preserve' });
    });

    it('should call _onClose when not using route', () => {
      component._useRoute = false;
      const spy = vi.fn();
      component.close.subscribe(spy);
      component.onBreadcrumb({ url: '/utenti' });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_onClose / _onSave', () => {
    it('should emit close event', () => {
      const spy = vi.fn();
      component.close.subscribe(spy);
      component._onClose();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit save event', () => {
      const spy = vi.fn();
      component.save.subscribe(spy);
      component._onSave();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_onSubmit', () => {
    it('should not save if form is invalid', () => {
      component._isEdit = true;
      component._formGroup.setErrors({ invalid: true });
      component._onSubmit({});
      expect(mockApiService.saveElement).not.toHaveBeenCalled();
    });
  });

  describe('_checkRuolo', () => {
    it('should return ruolo from data', () => {
      expect(component._checkRuolo({ ruolo: Ruolo.GESTOERE })).toBe(Ruolo.GESTOERE);
    });

    it('should return NESSUN_RUOLO when data has no ruolo', () => {
      expect(component._checkRuolo({})).toBe(Ruolo.NESSUN_RUOLO);
    });

    it('should return NESSUN_RUOLO for null data', () => {
      expect(component._checkRuolo(null)).toBe(Ruolo.NESSUN_RUOLO);
    });
  });

  describe('_prapareData', () => {
    it('should clean up body for API submission', () => {
      const body = {
        nome: 'Test',
        cognome: 'User',
        ruolo: Ruolo.NESSUN_RUOLO,
        classi_utente: null,
        organizzazione: { id: 1 }
      };
      const result = component._prapareData(body);
      expect(result.ruolo).toBeNull();
      expect(result.organizzazione).toBeUndefined();
      expect(mockUtils._removeEmpty).toHaveBeenCalled();
    });

    it('should keep ruolo when not NESSUN_RUOLO', () => {
      const body = {
        nome: 'Test',
        cognome: 'User',
        ruolo: Ruolo.GESTOERE,
        classi_utente: null,
        organizzazione: {}
      };
      const result = component._prapareData(body);
      expect(result.ruolo).toBe(Ruolo.GESTOERE);
    });

    it('should map classi_utente to id array', () => {
      const body = {
        nome: 'Test',
        ruolo: Ruolo.GESTOERE,
        classi_utente: [{ id_classe_utente: 'c1' }, { id_classe_utente: 'c2' }],
        organizzazione: {}
      };
      const result = component._prapareData(body);
      expect(result.classi_utente).toEqual(['c1', 'c2']);
    });
  });

  describe('_changeRuolo', () => {
    it('should clear validators for Gestore role', () => {
      component._formGroup = new FormGroup({
        ruolo: new FormControl('gestore'),
        id_organizzazione: new FormControl(null, [Validators.required])
      });
      component._changeRuolo();
      // After clearing validators, the control should be valid even without a value
      expect(component._formGroup.get('id_organizzazione')?.valid).toBe(true);
    });

    it('should set required validator for non-Gestore role', () => {
      component._formGroup = new FormGroup({
        ruolo: new FormControl('referente_servizio'),
        id_organizzazione: new FormControl(null)
      });
      component._changeRuolo();
      // After setting required, control should be invalid without a value
      expect(component._formGroup.get('id_organizzazione')?.valid).toBe(false);
    });

    it('should handle missing id_organizzazione control gracefully', () => {
      component._formGroup = new FormGroup({
        ruolo: new FormControl('gestore')
      });
      // Should not throw
      expect(() => component._changeRuolo()).not.toThrow();
    });
  });

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('_compareClassiFn', () => {
    it('should compare by id_classe_utente', () => {
      expect(component._compareClassiFn(
        { id_classe_utente: 'a' },
        { id_classe_utente: 'a' }
      )).toBe(true);
      expect(component._compareClassiFn(
        { id_classe_utente: 'a' },
        { id_classe_utente: 'b' }
      )).toBe(false);
    });
  });
});
