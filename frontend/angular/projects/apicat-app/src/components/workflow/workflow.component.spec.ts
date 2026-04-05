import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowComponent } from './workflow.component';

describe('WorkflowComponent', () => {
  let component: WorkflowComponent;
  const mockAuthService = {
    canChangeStatus: vi.fn().mockReturnValue(false),
    isGestore: vi.fn().mockReturnValue(false),
    canArchiviare: vi.fn().mockReturnValue(false),
  } as any;

  beforeEach(() => {
    component = new WorkflowComponent(mockAuthService);
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default showStatus false', () => {
    expect(component.showStatus).toBe(false);
  });

  it('should initialize with archiviato status', () => {
    component.data = { stato: 'archiviato', stato_precedente: 'pubblicato' };
    component.workflow = { cambi_stato: [] };
    component.config = { options: { status: { values: {} } } };
    component.ngOnInit();
    expect(component._currentStatus).toBe('archiviato');
    expect(component._previousStatus).toEqual({ nome: 'pubblicato' });
  });

  it('should initialize with non-archiviato status', () => {
    component.data = { stato: 'bozza' };
    component.workflow = { cambi_stato: [{ stato_attuale: 'bozza', stato_successivo: 'pubblicato' }] };
    component.config = { options: { status: { values: { bozza: { label: 'Bozza' } } } } };
    component.ngOnInit();
    expect(component._currentStatus).toBe('bozza');
    expect(component._cambioStato).toEqual({ stato_attuale: 'bozza', stato_successivo: 'pubblicato' });
  });

  it('should emit action on onAction', () => {
    const spy = vi.fn();
    component.action.subscribe(spy);
    component.onAction('change', 'pubblicato');
    expect(spy).toHaveBeenCalledWith({ action: 'change', status: 'pubblicato' });
  });

  it('should delegate isActionEnabled to authService', () => {
    component.module = 'servizi';
    component.data = { stato: 'bozza' };
    component.grant = { ruoli: ['referente_servizio'] } as any;
    component.isActionEnabled('stato_successivo');
    expect(mockAuthService.canChangeStatus).toHaveBeenCalledWith('servizi', 'bozza', 'stato_successivo', ['referente_servizio']);
  });

  it('should delegate isGestore to authService', () => {
    component.grant = { ruoli: ['gestore'] } as any;
    component.isGestore();
    expect(mockAuthService.isGestore).toHaveBeenCalledWith(['gestore']);
  });

  it('should delegate canArchiviare to authService', () => {
    component.module = 'servizi';
    component.data = { stato: 'pubblicato' };
    component.grant = { ruoli: ['gestore'] } as any;
    component.canArchiviare();
    expect(mockAuthService.canArchiviare).toHaveBeenCalledWith('servizi', 'pubblicato', ['gestore']);
  });

  it('should _hasActions return true if gestore', () => {
    component.data = { stato: 'bozza' };
    component.module = 'servizi';
    component.grant = { ruoli: ['gestore'] } as any;
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component._hasActions()).toBe(true);
  });
});
