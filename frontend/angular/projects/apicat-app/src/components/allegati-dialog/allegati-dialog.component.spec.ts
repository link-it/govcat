import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AllegatiDialogComponent } from './allegati-dialog.component';
import { Tools } from '@linkit/components';

describe('AllegatiDialogComponent', () => {
  let component: AllegatiDialogComponent;
  const mockModalRef = { hide: vi.fn() } as any;
  const mockApiService = {} as any;
  const mockAuthService = { isGestore: vi.fn().mockReturnValue(false) } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    Tools.Configurazione = { servizio: { visibilita_allegati_consentite: ['aderente', 'gestore'] } } as any;
    component = new AllegatiDialogComponent(mockModalRef, mockApiService, mockAuthService);
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default model empty', () => {
    expect(component.model).toBe('');
  });

  it('should have multiple true by default', () => {
    expect(component.multiple).toBe(true);
  });

  it('should initialize onClose on ngOnInit', () => {
    component.isNew = true;
    component.ngOnInit();
    expect(component.onClose).toBeDefined();
  });

  it('should close modal', () => {
    component.ngOnInit();
    component.closeModal();
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  it('should filter tipiVisibilitaAllegato excluding gestore for non-gestore', () => {
    expect(component.tipiVisibilitaAllegato).toEqual([{ label: 'aderente', value: 'aderente' }]);
  });
});
