import { describe, it, expect, vi, afterEach } from 'vitest';
import { Tools } from '@linkit/components';
import { ServizioWorkflowWizardComponent } from './servizio-workflow-wizard.component';
import { STEP_WIZARD_SERVIZIO_FALLBACK, STEP_WIZARD_COLLAUDO_SERVIZIO } from './servizio-wizard.config';
import { of, throwError } from 'rxjs';

describe('ServizioWorkflowWizardComponent - fase iniziale', () => {
  const build = (data: any, requestedFase: string | null = null): any => {
    const component: any = Object.create(ServizioWorkflowWizardComponent.prototype);
    component.stepWizard = STEP_WIZARD_SERVIZIO_FALLBACK;
    component.data = data;
    component._requestedFase = requestedFase;
    component._initSelectedFase();
    return component;
  };

  it('should open the collaudo phase after creation', () => {
    expect(build({ stato: 'bozza' }, 'api')._selectedFase).toBe('collaudo');
  });

  it('should open the produzione phase after creation when collaudo is skipped', () => {
    expect(build({ stato: 'bozza', skip_collaudo: true }, 'api')._selectedFase).toBe('produzione');
  });

  it('should ignore a requested phase that is skipped', () => {
    expect(build({ stato: 'bozza', skip_collaudo: true }, 'collaudo')._selectedFase).toBe('produzione');
    expect(build({ stato: 'bozza' }, 'collaudo')._selectedFase).toBe('collaudo');
  });

  it('should follow the current state without a requested phase', () => {
    expect(build({ stato: 'bozza', skip_collaudo: true })._selectedFase).toBe('produzione');
    expect(build({ stato: 'richiesto_collaudo' })._selectedFase).toBe('collaudo');
  });
});

describe('ServizioWorkflowWizardComponent - rifiuto (Issue 401)', () => {
  const _configurazione = Tools.Configurazione;
  afterEach(() => { Tools.Configurazione = _configurazione; vi.restoreAllMocks(); });

  const build = (canChange: (type: string) => boolean): any => {
    Tools.Configurazione = { servizio: { workflow: { cambi_stato: [{
      stato_attuale: 'richiesto_collaudo',
      stato_successivo: { nome: 'autorizzato_collaudo', ruoli_abilitati: ['gestore'] },
      stato_precedente: { nome: 'bozza', ruoli_abilitati: ['richiedente', 'gestore'] }
    }] } } };
    const component: any = Object.create(ServizioWorkflowWizardComponent.prototype);
    component.model = 'servizi';
    component.id = 's1';
    component.data = { id_servizio: 's1', nome: 'PetStore', versione: 1, stato: 'richiesto_collaudo' };
    component.stepWizard = STEP_WIZARD_SERVIZIO_FALLBACK;
    component.stepWizardCollaudo = STEP_WIZARD_COLLAUDO_SERVIZIO;
    component._selectedFase = 'collaudo';
    component._grant = { ruoli: ['gestore'] };
    component.authenticationService = {
      canChangeStatus: vi.fn((_m: string, _s: string, type: string) => canChange(type)),
      getRequiredProfiles: vi.fn().mockReturnValue([])
    };
    component.translate = { instant: vi.fn((k: string) => k), currentLang: 'it', getDefaultLang: vi.fn().mockReturnValue('it') };
    component.apiService = { postElementRelated: vi.fn(), getDetails: vi.fn().mockReturnValue(of([])) };
    component.utils = { GetErrorMsg: vi.fn().mockReturnValue('Errore') };
    component._verificaTrigger$ = { next: vi.fn() };
    vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});
    return component;
  };

  it('should offer the rejection in the approval step only to who can also authorize', () => {
    expect(build(() => true).canRifiutare()).toBe(true);
    expect(build((type: string) => type === 'stato_precedente').canRifiutare()).toBe(false);
    const _bozza = build(() => true);
    _bozza.data.stato = 'bozza';
    expect(_bozza.canRifiutare()).toBe(false);
  });

  it('should go back to the previous state and message the service referents', () => {
    const component = build(() => true);
    component.apiService.postElementRelated.mockReturnValue(of({ id_servizio: 's1', stato: 'bozza' }));
    component._rifiutoOpen = true;
    component.onConfermaRifiuto({ oggetto: 'Oggetto', testo: 'Motivo' });
    expect(component.apiService.postElementRelated).toHaveBeenCalledWith('servizi', 's1', 'stato-messaggio', {
      stato: { stato: 'bozza' },
      messaggio: { oggetto: 'Oggetto', testo: 'Motivo', target: ['REFERENTI_SERVIZIO'], includi_tecnici: true }
    });
    expect(component._rifiutoOpen).toBe(false);
    expect(component.data.stato).toBe('bozza');
  });

  it('should keep the form open with the error when the rejection fails', () => {
    const component = build(() => true);
    component.apiService.postElementRelated.mockReturnValue(throwError(() => ({ status: 400 })));
    component._rifiutoOpen = true;
    component.onConfermaRifiuto({ oggetto: 'Oggetto', testo: 'Motivo' });
    expect(component._rifiutoOpen).toBe(true);
    expect(component._rifiutoErrore).toBeTruthy();
    expect(component._changingStatus).toBe(false);
  });
});
