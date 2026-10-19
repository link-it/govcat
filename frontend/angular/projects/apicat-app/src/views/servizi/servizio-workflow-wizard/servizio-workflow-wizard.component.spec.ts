import { describe, it, expect } from 'vitest';
import { ServizioWorkflowWizardComponent } from './servizio-workflow-wizard.component';
import { STEP_WIZARD_SERVIZIO_FALLBACK } from './servizio-wizard.config';

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
