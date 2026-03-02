import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { Tools } from '@linkit/components';
import { StatoRegistrazioneEnum } from '@app/model/registrazione';
import { RegistrazioneComponent } from './registrazione.component';

describe('RegistrazioneComponent', () => {
  let component: RegistrazioneComponent;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { Layout: { Login: { title: 'T', logo: 'l.png' } } }
    }),
  } as any;
  const mockRegistrazioneService = {
    getStato: vi.fn().mockReturnValue(of({
      stato: StatoRegistrazioneEnum.InAttesaConferma,
      email_jwt: 'jwt@test.it',
      nome: 'Mario',
      cognome: 'Rossi',
    })),
    confermaEmail: vi.fn().mockReturnValue(of({ profilo: {} })),
    modificaEmail: vi.fn().mockReturnValue(of({})),
    inviaCodice: vi.fn().mockReturnValue(of({})),
    verificaCodice: vi.fn().mockReturnValue(of({ esito: true })),
    completaRegistrazione: vi.fn().mockReturnValue(of({ profilo: {} })),
    stopCountdown: vi.fn(),
  } as any;
  const mockAuthService = {
    getCurrentSession: vi.fn().mockReturnValue({ idm: { nome: 'Test', email: 'e@t.it', principal: 'CF' } }),
    setCurrentSession: vi.fn(),
    reloadSession: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    Tools.MultiSnackbarDestroyAll = vi.fn();
    component = new RegistrazioneComponent(
      mockRouter, mockTranslate, mockConfigService,
      mockRegistrazioneService, mockAuthService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should set title and logo from config', () => {
    expect(component._title).toBe('T');
    expect(component._logo).toContain('l.png');
  });

  it('should have default step conferma', () => {
    expect(component.currentStep).toBe('conferma');
  });

  it('should load IDM from session on ngOnInit', () => {
    component.ngOnInit();
    expect(component.nome).toBe('Mario');
  });

  it('should determine step from stato CodiceInviato', () => {
    mockRegistrazioneService.getStato.mockReturnValue(of({
      stato: StatoRegistrazioneEnum.CodiceInviato,
    }));
    component.ngOnInit();
    expect(component.currentStep).toBe('verifica');
  });

  it('should determine step from stato Completata', () => {
    mockRegistrazioneService.getStato.mockReturnValue(of({
      stato: StatoRegistrazioneEnum.Completata,
    }));
    component.ngOnInit();
    expect(component.currentStep).toBe('completato');
  });

  it('should handle getStato error with session data', () => {
    mockRegistrazioneService.getStato.mockReturnValue(throwError(() => new Error('err')));
    component.ngOnInit();
    expect(component.currentStep).toBe('conferma');
    expect(component.loading).toBe(false);
  });

  it('should go to modifica step', () => {
    component.onModificaEmail();
    expect(component.currentStep).toBe('modifica');
  });

  it('should go back to conferma step', () => {
    component.currentStep = 'modifica';
    component.onTornaAConferma();
    expect(component.currentStep).toBe('conferma');
    expect(component.error).toBeNull();
  });

  it('should navigate to servizi on vaiAlCatalogo', () => {
    component.onVaiAlCatalogo();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi']);
  });

  it('should clear alert', () => {
    component.error = 'test';
    component.closeAlert();
    expect(component.error).toBeNull();
  });

  it('should stop countdown and go to modifica on cambiaEmail', () => {
    component.onCambiaEmail();
    expect(mockRegistrazioneService.stopCountdown).toHaveBeenCalled();
    expect(component.currentStep).toBe('modifica');
  });

  it('should unsubscribe on destroy', () => {
    component.ngOnInit();
    expect(() => component.ngOnDestroy()).not.toThrow();
    expect(mockRegistrazioneService.stopCountdown).toHaveBeenCalled();
  });
});
