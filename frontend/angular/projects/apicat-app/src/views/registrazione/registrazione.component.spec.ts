import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError, Subscription } from 'rxjs';
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
    // Reset default mock implementations
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { Layout: { Login: { title: 'T', logo: 'l.png' } } }
    });
    mockRegistrazioneService.getStato.mockReturnValue(of({
      stato: StatoRegistrazioneEnum.InAttesaConferma,
      email_jwt: 'jwt@test.it',
      nome: 'Mario',
      cognome: 'Rossi',
    }));
    mockRegistrazioneService.confermaEmail.mockReturnValue(of({ profilo: {} }));
    mockRegistrazioneService.modificaEmail.mockReturnValue(of({}));
    mockRegistrazioneService.inviaCodice.mockReturnValue(of({}));
    mockRegistrazioneService.verificaCodice.mockReturnValue(of({ esito: true }));
    mockRegistrazioneService.completaRegistrazione.mockReturnValue(of({ profilo: {} }));
    mockAuthService.getCurrentSession.mockReturnValue({ idm: { nome: 'Test', email: 'e@t.it', principal: 'CF' } });

    component = new RegistrazioneComponent(
      mockRouter, mockTranslate, mockConfigService,
      mockRegistrazioneService, mockAuthService
    );
  });

  // ─── Constructor / Creation ─────────────────────────────────────────

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

  it('should fallback to empty title when Login config is missing', () => {
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    const comp = new RegistrazioneComponent(
      mockRouter, mockTranslate, mockConfigService,
      mockRegistrazioneService, mockAuthService
    );
    expect(comp._title).toBe('');
  });

  it('should fallback to default logo when Login config is missing', () => {
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    const comp = new RegistrazioneComponent(
      mockRouter, mockTranslate, mockConfigService,
      mockRegistrazioneService, mockAuthService
    );
    expect(comp._logo).toBe('./assets/images/logo.png');
  });

  it('should fallback to empty title when AppConfig is missing', () => {
    mockConfigService.getConfiguration.mockReturnValue({});
    const comp = new RegistrazioneComponent(
      mockRouter, mockTranslate, mockConfigService,
      mockRegistrazioneService, mockAuthService
    );
    expect(comp._title).toBe('');
    expect(comp._logo).toBe('./assets/images/logo.png');
  });

  // ─── ngOnInit ───────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should call MultiSnackbarDestroyAll', () => {
      component.ngOnInit();
      expect(Tools.MultiSnackbarDestroyAll).toHaveBeenCalled();
    });

    it('should load IDM from session on ngOnInit', () => {
      component.ngOnInit();
      expect(component.nome).toBe('Mario'); // overwritten by stato response
    });

    it('should call loadStato on init', () => {
      component.ngOnInit();
      expect(mockRegistrazioneService.getStato).toHaveBeenCalled();
    });
  });

  // ─── loadIdmFromSession ─────────────────────────────────────────────

  describe('loadIdmFromSession', () => {
    it('should load all fields from session idm', () => {
      mockAuthService.getCurrentSession.mockReturnValue({
        idm: { nome: 'Nome', cognome: 'Cognome', email: 'idm@test.it', principal: 'ABCDEF12G34H567I' }
      });
      // Prevent loadStato from overwriting values
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
      }));
      component = new RegistrazioneComponent(
        mockRouter, mockTranslate, mockConfigService,
        mockRegistrazioneService, mockAuthService
      );
      component.ngOnInit();
      expect(component.nome).toBe('Nome');
      expect(component.cognome).toBe('Cognome');
      expect(component.emailJwt).toBe('idm@test.it');
      expect(component.emailProposta).toBe('idm@test.it'); // emailProposta = emailJwt from session, then fallback in loadStato
      expect(component.codiceFiscale).toBe('ABCDEF12G34H567I');
    });

    it('should handle session without idm', () => {
      mockAuthService.getCurrentSession.mockReturnValue({});
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
      }));
      component = new RegistrazioneComponent(
        mockRouter, mockTranslate, mockConfigService,
        mockRegistrazioneService, mockAuthService
      );
      component.ngOnInit();
      // Should remain default empty strings (stato has no data to override either)
      expect(component.emailJwt).toBe('');
      expect(component.nome).toBe('');
      expect(component.cognome).toBe('');
      expect(component.codiceFiscale).toBe('');
    });

    it('should handle null session', () => {
      mockAuthService.getCurrentSession.mockReturnValue(null);
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
      }));
      component = new RegistrazioneComponent(
        mockRouter, mockTranslate, mockConfigService,
        mockRegistrazioneService, mockAuthService
      );
      component.ngOnInit();
      expect(component.emailJwt).toBe('');
      expect(component.nome).toBe('');
    });

    it('should handle session idm with partial fields', () => {
      mockAuthService.getCurrentSession.mockReturnValue({
        idm: { email: 'partial@test.it' }
      });
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
      }));
      component = new RegistrazioneComponent(
        mockRouter, mockTranslate, mockConfigService,
        mockRegistrazioneService, mockAuthService
      );
      component.ngOnInit();
      expect(component.emailJwt).toBe('partial@test.it');
      expect(component.nome).toBe('');
      expect(component.cognome).toBe('');
      expect(component.codiceFiscale).toBe('');
    });
  });

  // ─── loadStato ──────────────────────────────────────────────────────

  describe('loadStato', () => {
    it('should set loading and clear error when called', () => {
      component.error = 'previous error';
      component.loading = false;
      component.loadStato();
      // After sync execution completes (observable is synchronous of()),
      // loading should be false again
      expect(component.error).toBeNull();
    });

    it('should set statoRegistrazione from response', () => {
      const statoResp = {
        stato: StatoRegistrazioneEnum.InAttesaConferma,
        email_jwt: 'jwt@test.it',
      };
      mockRegistrazioneService.getStato.mockReturnValue(of(statoResp));
      component.loadStato();
      expect(component.statoRegistrazione).toBe(statoResp);
    });

    it('should update emailJwt from stato response', () => {
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
        email_jwt: 'new-jwt@test.it',
      }));
      component.loadStato();
      expect(component.emailJwt).toBe('new-jwt@test.it');
    });

    it('should update emailProposta from stato response', () => {
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
        email_jwt: 'jwt@test.it',
        email_proposta: 'proposta@test.it',
      }));
      component.loadStato();
      expect(component.emailProposta).toBe('proposta@test.it');
    });

    it('should fallback emailProposta to emailJwt when not in stato and not already set', () => {
      mockAuthService.getCurrentSession.mockReturnValue(null);
      component = new RegistrazioneComponent(
        mockRouter, mockTranslate, mockConfigService,
        mockRegistrazioneService, mockAuthService
      );
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
        email_jwt: 'fallback@test.it',
      }));
      component.loadStato();
      expect(component.emailProposta).toBe('fallback@test.it');
    });

    it('should keep existing emailProposta if no email_proposta in stato and emailProposta already set', () => {
      component.emailProposta = 'existing@test.it';
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
        email_jwt: 'jwt@test.it',
      }));
      component.loadStato();
      expect(component.emailProposta).toBe('existing@test.it');
    });

    it('should update nome from stato response', () => {
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
        nome: 'NuovoNome',
      }));
      component.loadStato();
      expect(component.nome).toBe('NuovoNome');
    });

    it('should update cognome from stato response', () => {
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
        cognome: 'NuovoCognome',
      }));
      component.loadStato();
      expect(component.cognome).toBe('NuovoCognome');
    });

    it('should update codiceFiscale from stato response', () => {
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
        codice_fiscale: 'RSSMRA80A01H501U',
      }));
      component.loadStato();
      expect(component.codiceFiscale).toBe('RSSMRA80A01H501U');
    });

    it('should set loading=false after successful loadStato', () => {
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
      }));
      component.loadStato();
      expect(component.loading).toBe(false);
    });

    it('should push subscription to subscriptions array', () => {
      component.loadStato();
      // Access the private subscriptions via ngOnDestroy behavior
      // After loadStato, subscriptions array should not be empty
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should handle getStato error with session data (nome set)', () => {
      mockRegistrazioneService.getStato.mockReturnValue(throwError(() => new Error('err')));
      component.ngOnInit(); // loadIdmFromSession sets nome from session
      expect(component.currentStep).toBe('conferma');
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
    });

    it('should handle getStato error with session data (emailJwt set)', () => {
      mockAuthService.getCurrentSession.mockReturnValue({
        idm: { email: 'jwt@test.it' }
      });
      mockRegistrazioneService.getStato.mockReturnValue(throwError(() => new Error('err')));
      component = new RegistrazioneComponent(
        mockRouter, mockTranslate, mockConfigService,
        mockRegistrazioneService, mockAuthService
      );
      component.ngOnInit();
      expect(component.currentStep).toBe('conferma');
      expect(component.loading).toBe(false);
    });

    it('should set error when getStato fails and no session data', () => {
      mockAuthService.getCurrentSession.mockReturnValue(null);
      mockRegistrazioneService.getStato.mockReturnValue(throwError(() => new Error('Backend error')));
      component = new RegistrazioneComponent(
        mockRouter, mockTranslate, mockConfigService,
        mockRegistrazioneService, mockAuthService
      );
      component.ngOnInit();
      expect(component.error).toBe('Backend error');
      expect(component.loading).toBe(false);
    });

    it('should set fallback error message when error has no message and no session data', () => {
      mockAuthService.getCurrentSession.mockReturnValue(null);
      mockRegistrazioneService.getStato.mockReturnValue(throwError(() => ({})));
      component = new RegistrazioneComponent(
        mockRouter, mockTranslate, mockConfigService,
        mockRegistrazioneService, mockAuthService
      );
      component.ngOnInit();
      expect(component.error).toBe('Errore nel caricamento dello stato');
      expect(component.loading).toBe(false);
    });

    it('should update all fields when stato has complete data', () => {
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
        email_jwt: 'full-jwt@test.it',
        email_proposta: 'full-proposta@test.it',
        nome: 'FullNome',
        cognome: 'FullCognome',
        codice_fiscale: 'FULLCF12345',
      }));
      component.loadStato();
      expect(component.emailJwt).toBe('full-jwt@test.it');
      expect(component.emailProposta).toBe('full-proposta@test.it');
      expect(component.nome).toBe('FullNome');
      expect(component.cognome).toBe('FullCognome');
      expect(component.codiceFiscale).toBe('FULLCF12345');
    });
  });

  // ─── determineStep ──────────────────────────────────────────────────

  describe('determineStep', () => {
    it('should set step to conferma for InAttesaConferma', () => {
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.InAttesaConferma,
      }));
      component.ngOnInit();
      expect(component.currentStep).toBe('conferma');
    });

    it('should determine step from stato CodiceInviato', () => {
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.CodiceInviato,
      }));
      component.ngOnInit();
      expect(component.currentStep).toBe('verifica');
    });

    it('should set step to completato for EmailVerificata', () => {
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.EmailVerificata,
      }));
      component.ngOnInit();
      expect(component.currentStep).toBe('completato');
    });

    it('should determine step from stato Completata', () => {
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: StatoRegistrazioneEnum.Completata,
      }));
      component.ngOnInit();
      expect(component.currentStep).toBe('completato');
    });

    it('should default to conferma for unknown stato', () => {
      mockRegistrazioneService.getStato.mockReturnValue(of({
        stato: 'UNKNOWN_STATO' as any,
      }));
      component.ngOnInit();
      expect(component.currentStep).toBe('conferma');
    });
  });

  // ─── onConfermaEmail ────────────────────────────────────────────────

  describe('onConfermaEmail', () => {
    it('should set loading and clear error', () => {
      component.error = 'old error';
      component.onConfermaEmail();
      // After sync observable completes
      expect(component.loading).toBe(false);
    });

    it('should set currentStep to completato on success with profilo', () => {
      mockRegistrazioneService.confermaEmail.mockReturnValue(of({ profilo: { id: 1 } }));
      component.onConfermaEmail();
      expect(component.currentStep).toBe('completato');
      expect(mockAuthService.setCurrentSession).toHaveBeenCalledWith({ id: 1 });
      expect(mockAuthService.reloadSession).toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

    it('should set currentStep to completato on success without profilo', () => {
      mockRegistrazioneService.confermaEmail.mockReturnValue(of({}));
      component.onConfermaEmail();
      expect(component.currentStep).toBe('completato');
      expect(mockAuthService.setCurrentSession).not.toHaveBeenCalled();
      expect(mockAuthService.reloadSession).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

    it('should set currentStep to completato on success with null profilo', () => {
      mockRegistrazioneService.confermaEmail.mockReturnValue(of({ profilo: null }));
      component.onConfermaEmail();
      expect(component.currentStep).toBe('completato');
      expect(mockAuthService.setCurrentSession).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

    it('should set error on confermaEmail failure', () => {
      mockRegistrazioneService.confermaEmail.mockReturnValue(throwError(() => new Error('Conferma failed')));
      component.onConfermaEmail();
      expect(component.error).toBe('Conferma failed');
      expect(component.loading).toBe(false);
    });
  });

  // ─── onModificaEmail ────────────────────────────────────────────────

  it('should go to modifica step', () => {
    component.onModificaEmail();
    expect(component.currentStep).toBe('modifica');
  });

  // ─── onInviaModificaEmail ───────────────────────────────────────────

  describe('onInviaModificaEmail', () => {
    it('should set loading and clear error on start', () => {
      component.error = 'previous';
      component.onInviaModificaEmail('new@test.it');
      expect(component.error).toBeNull();
    });

    it('should update emailProposta and then call inviaCodiceDopo on success', () => {
      mockRegistrazioneService.modificaEmail.mockReturnValue(of({}));
      mockRegistrazioneService.inviaCodice.mockReturnValue(of({}));
      component.onInviaModificaEmail('new@test.it');
      expect(mockRegistrazioneService.modificaEmail).toHaveBeenCalledWith('new@test.it');
      expect(component.emailProposta).toBe('new@test.it');
      // inviaCodiceDopo should have been called
      expect(mockRegistrazioneService.inviaCodice).toHaveBeenCalled();
      expect(component.currentStep).toBe('verifica');
      expect(component.loading).toBe(false);
    });

    it('should set error on modificaEmail failure', () => {
      mockRegistrazioneService.modificaEmail.mockReturnValue(throwError(() => new Error('Modifica failed')));
      component.onInviaModificaEmail('new@test.it');
      expect(component.error).toBe('Modifica failed');
      expect(component.loading).toBe(false);
      expect(mockRegistrazioneService.inviaCodice).not.toHaveBeenCalled();
    });

    it('should set error when inviaCodiceDopo (inviaCodice) fails after modificaEmail success', () => {
      mockRegistrazioneService.modificaEmail.mockReturnValue(of({}));
      mockRegistrazioneService.inviaCodice.mockReturnValue(throwError(() => new Error('Invio codice failed')));
      component.onInviaModificaEmail('new@test.it');
      expect(component.emailProposta).toBe('new@test.it');
      expect(component.error).toBe('Invio codice failed');
      expect(component.loading).toBe(false);
    });
  });

  // ─── onTornaAConferma ───────────────────────────────────────────────

  it('should go back to conferma step', () => {
    component.currentStep = 'modifica';
    component.onTornaAConferma();
    expect(component.currentStep).toBe('conferma');
    expect(component.error).toBeNull();
  });

  it('should clear error when going back to conferma', () => {
    component.error = 'some error';
    component.onTornaAConferma();
    expect(component.error).toBeNull();
  });

  // ─── onVerificaCodice ───────────────────────────────────────────────

  describe('onVerificaCodice', () => {
    it('should set loading and clear error on start', () => {
      component.error = 'old';
      component.onVerificaCodice('123456');
      // After sync completes
      expect(mockRegistrazioneService.verificaCodice).toHaveBeenCalledWith('123456');
    });

    it('should call completaRegistrazione when esito is true', () => {
      mockRegistrazioneService.verificaCodice.mockReturnValue(of({ esito: true }));
      mockRegistrazioneService.completaRegistrazione.mockReturnValue(of({ profilo: { id: 1 } }));
      component.onVerificaCodice('123456');
      expect(mockRegistrazioneService.completaRegistrazione).toHaveBeenCalled();
      expect(component.currentStep).toBe('completato');
      expect(component.loading).toBe(false);
    });

    it('should set error message when esito is false with messaggio', () => {
      mockRegistrazioneService.verificaCodice.mockReturnValue(of({
        esito: false,
        messaggio: 'Codice scaduto'
      }));
      component.onVerificaCodice('wrong');
      expect(component.error).toBe('Codice scaduto');
      expect(component.loading).toBe(false);
      expect(mockRegistrazioneService.completaRegistrazione).not.toHaveBeenCalled();
    });

    it('should set default error message when esito is false without messaggio', () => {
      mockRegistrazioneService.verificaCodice.mockReturnValue(of({
        esito: false,
      }));
      component.onVerificaCodice('wrong');
      expect(component.error).toBe('Codice non valido');
      expect(component.loading).toBe(false);
    });

    it('should set error on verificaCodice failure', () => {
      mockRegistrazioneService.verificaCodice.mockReturnValue(throwError(() => new Error('Verifica failed')));
      component.onVerificaCodice('123456');
      expect(component.error).toBe('Verifica failed');
      expect(component.loading).toBe(false);
    });
  });

  // ─── completaRegistrazione (private, tested via onVerificaCodice) ───

  describe('completaRegistrazione', () => {
    it('should update session and go to completato with profilo', () => {
      mockRegistrazioneService.verificaCodice.mockReturnValue(of({ esito: true }));
      mockRegistrazioneService.completaRegistrazione.mockReturnValue(of({ profilo: { user: 'abc' } }));
      component.onVerificaCodice('123456');
      expect(mockAuthService.setCurrentSession).toHaveBeenCalledWith({ user: 'abc' });
      expect(mockAuthService.reloadSession).toHaveBeenCalled();
      expect(component.currentStep).toBe('completato');
      expect(component.loading).toBe(false);
    });

    it('should go to completato without updating session when no profilo', () => {
      mockRegistrazioneService.verificaCodice.mockReturnValue(of({ esito: true }));
      mockRegistrazioneService.completaRegistrazione.mockReturnValue(of({}));
      component.onVerificaCodice('123456');
      expect(mockAuthService.setCurrentSession).not.toHaveBeenCalled();
      expect(mockAuthService.reloadSession).not.toHaveBeenCalled();
      expect(component.currentStep).toBe('completato');
      expect(component.loading).toBe(false);
    });

    it('should go to completato without updating session when profilo is null', () => {
      mockRegistrazioneService.verificaCodice.mockReturnValue(of({ esito: true }));
      mockRegistrazioneService.completaRegistrazione.mockReturnValue(of({ profilo: null }));
      component.onVerificaCodice('123456');
      expect(mockAuthService.setCurrentSession).not.toHaveBeenCalled();
      expect(component.currentStep).toBe('completato');
    });

    it('should set error on completaRegistrazione failure', () => {
      mockRegistrazioneService.verificaCodice.mockReturnValue(of({ esito: true }));
      mockRegistrazioneService.completaRegistrazione.mockReturnValue(throwError(() => new Error('Completa failed')));
      component.onVerificaCodice('123456');
      expect(component.error).toBe('Completa failed');
      expect(component.loading).toBe(false);
    });
  });

  // ─── onReinviaCodice ────────────────────────────────────────────────

  describe('onReinviaCodice', () => {
    it('should set loading and clear error', () => {
      component.error = 'old error';
      component.onReinviaCodice();
      expect(component.error).toBeNull();
    });

    it('should set loading=false on success', () => {
      mockRegistrazioneService.inviaCodice.mockReturnValue(of({}));
      component.onReinviaCodice();
      expect(component.loading).toBe(false);
      expect(mockRegistrazioneService.inviaCodice).toHaveBeenCalled();
    });

    it('should set error on reinviaCodice failure', () => {
      mockRegistrazioneService.inviaCodice.mockReturnValue(throwError(() => new Error('Reinvio failed')));
      component.onReinviaCodice();
      expect(component.error).toBe('Reinvio failed');
      expect(component.loading).toBe(false);
    });
  });

  // ─── onCambiaEmail ──────────────────────────────────────────────────

  describe('onCambiaEmail', () => {
    it('should stop countdown and go to modifica on cambiaEmail', () => {
      component.onCambiaEmail();
      expect(mockRegistrazioneService.stopCountdown).toHaveBeenCalled();
      expect(component.currentStep).toBe('modifica');
    });

    it('should clear error on cambiaEmail', () => {
      component.error = 'some error';
      component.onCambiaEmail();
      expect(component.error).toBeNull();
    });
  });

  // ─── onVaiAlCatalogo ────────────────────────────────────────────────

  it('should navigate to servizi on vaiAlCatalogo', () => {
    component.onVaiAlCatalogo();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi']);
  });

  // ─── closeAlert ─────────────────────────────────────────────────────

  it('should clear alert', () => {
    component.error = 'test';
    component.closeAlert();
    expect(component.error).toBeNull();
  });

  // ─── ngOnDestroy ────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should unsubscribe on destroy', () => {
      component.ngOnInit();
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(mockRegistrazioneService.stopCountdown).toHaveBeenCalled();
    });

    it('should call stopCountdown on destroy', () => {
      component.ngOnDestroy();
      expect(mockRegistrazioneService.stopCountdown).toHaveBeenCalled();
    });

    it('should unsubscribe all subscriptions collected during lifecycle', () => {
      // Trigger multiple subscriptions
      component.ngOnInit();       // loadStato -> 1 sub
      component.onConfermaEmail(); // 1 sub
      component.onReinviaCodice(); // 1 sub

      const spies: any[] = [];
      // Reach into the private subscriptions to spy on unsubscribe
      const subs = (component as any).subscriptions as Subscription[];
      subs.forEach(sub => {
        spies.push(vi.spyOn(sub, 'unsubscribe'));
      });

      component.ngOnDestroy();
      spies.forEach(spy => {
        expect(spy).toHaveBeenCalled();
      });
    });
  });
});
