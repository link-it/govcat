import { describe, it, expect } from 'vitest';
import {
  AuthType,
  CertificateMode,
  ClientDialogInput,
  Scenario,
  authIsPdndVariant,
  authRequiresCertAuth,
  authRequiresCertSign,
  authRequiresClientId,
  authRequiresOauthUrls,
  authRequiresUsername,
  computeFormConfig,
} from './client-dialog-state';

function makeInput(partial: Partial<ClientDialogInput> = {}): ClientDialogInput {
  return {
    scenario: { kind: 'new' },
    authType: 'https',
    certAuth: { kind: 'none' },
    certSign: { kind: 'none' },
    isModifiable: true,
    credentialsMode: 'toggle',
    riusoObbligatorio: false,
    clientsRiusoCount: 0,
    showIpFruizione: true,
    showRateLimiting: false,
    showFinalita: false,
    ...partial,
  };
}

describe('client-dialog-state: predicati auth type', () => {
  it('cert auth richiesto solo per le varianti https*', () => {
    const withCert: AuthType[] = ['https', 'https_sign', 'https_pdnd', 'https_pdnd_sign'];
    const withoutCert: AuthType[] = [
      'no_dati', 'indirizzo_ip', 'http_basic', 'pdnd',
      'oauth_authorization_code', 'oauth_client_credentials', 'sign', 'sign_pdnd',
    ];
    withCert.forEach(t => expect(authRequiresCertAuth(t)).toBe(true));
    withoutCert.forEach(t => expect(authRequiresCertAuth(t)).toBe(false));
  });

  it('cert sign richiesto per *_sign e sign*', () => {
    const withSign: AuthType[] = ['https_sign', 'https_pdnd_sign', 'sign', 'sign_pdnd'];
    const withoutSign: AuthType[] = [
      'no_dati', 'indirizzo_ip', 'http_basic', 'https', 'pdnd', 'https_pdnd',
      'oauth_authorization_code', 'oauth_client_credentials',
    ];
    withSign.forEach(t => expect(authRequiresCertSign(t)).toBe(true));
    withoutSign.forEach(t => expect(authRequiresCertSign(t)).toBe(false));
  });

  it('client_id richiesto per pdnd*/oauth_client_credentials', () => {
    const withClientId: AuthType[] = [
      'pdnd', 'https_pdnd', 'https_pdnd_sign', 'sign_pdnd', 'oauth_client_credentials',
    ];
    withClientId.forEach(t => expect(authRequiresClientId(t)).toBe(true));
    expect(authRequiresClientId('https')).toBe(false);
    expect(authRequiresClientId('oauth_authorization_code')).toBe(false);
  });

  it('url oauth richiesti solo per oauth_authorization_code', () => {
    expect(authRequiresOauthUrls('oauth_authorization_code')).toBe(true);
    expect(authRequiresOauthUrls('oauth_client_credentials')).toBe(false);
    expect(authRequiresOauthUrls('https')).toBe(false);
  });

  it('username richiesto solo per http_basic', () => {
    expect(authRequiresUsername('http_basic')).toBe(true);
    expect(authRequiresUsername('https')).toBe(false);
    expect(authRequiresUsername('pdnd')).toBe(false);
  });
});

describe('client-dialog-state: predicato authIsPdndVariant', () => {
  it('true per le 4 varianti PDND', () => {
    const pdndVariants: AuthType[] = ['pdnd', 'https_pdnd', 'https_pdnd_sign', 'sign_pdnd'];
    pdndVariants.forEach(t => expect(authIsPdndVariant(t)).toBe(true));
  });

  it('false per oauth_client_credentials (che richiede client_id ma non e\' PDND)', () => {
    expect(authIsPdndVariant('oauth_client_credentials')).toBe(false);
  });

  it('false per altre auth type', () => {
    const others: AuthType[] = ['no_dati', 'indirizzo_ip', 'http_basic', 'https', 'https_sign',
      'oauth_authorization_code', 'sign'];
    others.forEach(t => expect(authIsPdndVariant(t)).toBe(false));
  });
});

describe('client-dialog-state: blocchi opzionali di FormConfig', () => {
  it('showClientFormBody e\' falso solo in scenario proposed', () => {
    const newS = computeFormConfig(makeInput({ scenario: { kind: 'new' } }));
    const edit = computeFormConfig(makeInput({ scenario: { kind: 'edit' } }));
    const ref = computeFormConfig(makeInput({ scenario: { kind: 'referenced', referencedClientId: 1 } }));
    const ro = computeFormConfig(makeInput({ scenario: { kind: 'readonly' } }));
    const prop = computeFormConfig(makeInput({ scenario: { kind: 'proposed' } }));
    expect(newS.showClientFormBody).toBe(true);
    expect(edit.showClientFormBody).toBe(true);
    expect(ref.showClientFormBody).toBe(true);
    expect(ro.showClientFormBody).toBe(true);
    expect(prop.showClientFormBody).toBe(false);
  });

  it('showPdndClientIdBlock true per varianti PDND, anche in scenario new', () => {
    const pdndVariants: AuthType[] = ['pdnd', 'https_pdnd', 'https_pdnd_sign', 'sign_pdnd'];
    pdndVariants.forEach(authType => {
      const cfg = computeFormConfig(makeInput({ authType, scenario: { kind: 'new' } }));
      expect(cfg.showPdndClientIdBlock).toBe(true);
    });
  });

  it('showPdndClientIdBlock false per oauth_client_credentials', () => {
    const cfg = computeFormConfig(makeInput({ authType: 'oauth_client_credentials' }));
    expect(cfg.showPdndClientIdBlock).toBe(false);
  });

  it('showPdndClientIdBlock false in scenario proposed', () => {
    const cfg = computeFormConfig(makeInput({ authType: 'pdnd', scenario: { kind: 'proposed' } }));
    expect(cfg.showPdndClientIdBlock).toBe(false);
  });

  it('showHttpBasicUsernameBlock true solo con http_basic + edit/readonly', () => {
    const newS = computeFormConfig(makeInput({ authType: 'http_basic', scenario: { kind: 'new' } }));
    const edit = computeFormConfig(makeInput({ authType: 'http_basic', scenario: { kind: 'edit' } }));
    const ro = computeFormConfig(makeInput({ authType: 'http_basic', scenario: { kind: 'readonly' } }));
    const otherAuth = computeFormConfig(makeInput({ authType: 'https', scenario: { kind: 'edit' } }));
    expect(newS.showHttpBasicUsernameBlock).toBe(false);
    expect(edit.showHttpBasicUsernameBlock).toBe(true);
    expect(ro.showHttpBasicUsernameBlock).toBe(true);
    expect(otherAuth.showHttpBasicUsernameBlock).toBe(false);
  });

  it('showOauthClientCredentialsBlock true solo con oauth_client_credentials + edit/readonly', () => {
    const edit = computeFormConfig(makeInput({ authType: 'oauth_client_credentials', scenario: { kind: 'edit' } }));
    const ro = computeFormConfig(makeInput({ authType: 'oauth_client_credentials', scenario: { kind: 'readonly' } }));
    const newS = computeFormConfig(makeInput({ authType: 'oauth_client_credentials', scenario: { kind: 'new' } }));
    expect(edit.showOauthClientCredentialsBlock).toBe(true);
    expect(ro.showOauthClientCredentialsBlock).toBe(true);
    expect(newS.showOauthClientCredentialsBlock).toBe(false);
  });

  it('showOauthAuthCodeClientIdBlock true solo con oauth_authorization_code + edit/readonly', () => {
    const edit = computeFormConfig(makeInput({ authType: 'oauth_authorization_code', scenario: { kind: 'edit' } }));
    const newS = computeFormConfig(makeInput({ authType: 'oauth_authorization_code', scenario: { kind: 'new' } }));
    expect(edit.showOauthAuthCodeClientIdBlock).toBe(true);
    expect(newS.showOauthAuthCodeClientIdBlock).toBe(false);
  });
});

describe('client-dialog-state: scenario `new`', () => {
  it('mostra nome obbligatorio e nasconde nome_proposto', () => {
    const cfg = computeFormConfig(makeInput({ scenario: { kind: 'new' } }));
    expect(cfg.fields.nome.visible).toBe(true);
    expect(cfg.fields.nome.enabled).toBe(true);
    expect(cfg.fields.nome.required).toBe(true);
    expect(cfg.fields.nome_proposto.visible).toBe(false);
  });

  it('con auth https mostra tipo_certificato required e blocco cert_auth', () => {
    const cfg = computeFormConfig(makeInput({
      authType: 'https',
      certAuth: { kind: 'fornito' },
    }));
    expect(cfg.fields.tipo_certificato.visible).toBe(true);
    expect(cfg.fields.tipo_certificato.required).toBe(true);
    expect(cfg.certAuth.visible).toBe(true);
    expect(cfg.certAuth.mode).toEqual({ kind: 'fornito' });
    expect(cfg.certAuth.fileRequired).toBe(true);
    expect(cfg.certSign.visible).toBe(false);
  });

  it('con auth https_sign mostra entrambi i blocchi certificato', () => {
    const cfg = computeFormConfig(makeInput({
      authType: 'https_sign',
      certAuth: { kind: 'richiesto_cn' },
      certSign: { kind: 'fornito' },
    }));
    expect(cfg.certAuth.visible).toBe(true);
    expect(cfg.certAuth.cnRequired).toBe(true);
    expect(cfg.certAuth.fileRequired).toBe(false);
    expect(cfg.certSign.visible).toBe(true);
    expect(cfg.certSign.fileRequired).toBe(true);
    expect(cfg.fields.tipo_certificato_firma.required).toBe(true);
  });

  it('con auth pdnd mostra client_id required, non mostra certificati', () => {
    const cfg = computeFormConfig(makeInput({ authType: 'pdnd' }));
    expect(cfg.fields.client_id.visible).toBe(true);
    expect(cfg.fields.client_id.required).toBe(true);
    expect(cfg.certAuth.visible).toBe(false);
    expect(cfg.certSign.visible).toBe(false);
  });

  it('con auth http_basic mostra username required', () => {
    const cfg = computeFormConfig(makeInput({ authType: 'http_basic' }));
    expect(cfg.fields.username.visible).toBe(true);
    expect(cfg.fields.username.required).toBe(true);
    expect(cfg.fields.client_id.visible).toBe(false);
  });

  it('con oauth_authorization_code richiede tutti i 4 campi OAuth', () => {
    // Dopo Issue #237 Passo 1 help_desk e nome_applicazione_portale
    // sono required (allineamento al comportamento esistente nel
    // wizard adesione che gia' li marcava required a runtime).
    const cfg = computeFormConfig(makeInput({ authType: 'oauth_authorization_code' }));
    expect(cfg.fields.url_redirezione.required).toBe(true);
    expect(cfg.fields.url_esposizione.required).toBe(true);
    expect(cfg.fields.help_desk.required).toBe(true);
    expect(cfg.fields.nome_applicazione_portale.required).toBe(true);
  });

  it('flag show* nascondono ip_fruizione/rate_limiting/finalita', () => {
    const cfg = computeFormConfig(makeInput({
      showIpFruizione: false,
      showRateLimiting: false,
      showFinalita: false,
    }));
    expect(cfg.fields.ip_fruizione.visible).toBe(false);
    expect(cfg.fields.rate_limiting.visible).toBe(false);
    expect(cfg.fields.finalita.visible).toBe(false);
  });
});

describe('client-dialog-state: scenario `proposed`', () => {
  it('mostra solo nome_proposto e nasconde il resto del corpo del form', () => {
    const cfg = computeFormConfig(makeInput({
      scenario: { kind: 'proposed' },
      authType: 'https',
      certAuth: { kind: 'fornito' },
    }));
    expect(cfg.fields.nome_proposto.visible).toBe(true);
    expect(cfg.fields.nome_proposto.required).toBe(true);
    expect(cfg.fields.nome.visible).toBe(false);
    expect(cfg.fields.descrizione.visible).toBe(false);
    expect(cfg.fields.tipo_certificato.visible).toBe(false);
    expect(cfg.certAuth.visible).toBe(false);
  });
});

describe('client-dialog-state: scenario `referenced`', () => {
  const referenced: Scenario = { kind: 'referenced', referencedClientId: 42 };

  it('i campi visibili sono disabled ma il blocco certificato resta visibile', () => {
    const cfg = computeFormConfig(makeInput({
      scenario: referenced,
      authType: 'https',
      certAuth: { kind: 'fornito' },
    }));
    expect(cfg.fields.nome.visible).toBe(true);
    expect(cfg.fields.nome.enabled).toBe(false);
    expect(cfg.certAuth.visible).toBe(true);
    expect(cfg.certAuth.fileRequired).toBe(false);
  });

  it('Save e\' comunque abilitato quando modifiable', () => {
    const cfg = computeFormConfig(makeInput({ scenario: referenced }));
    expect(cfg.save.enabled).toBe(true);
  });
});

describe('client-dialog-state: scenario `edit`', () => {
  it('il selettore credenziali e\' nascosto', () => {
    const cfg = computeFormConfig(makeInput({ scenario: { kind: 'edit' } }));
    expect(cfg.fields.credenziali.visible).toBe(false);
  });

  it('i campi sono editabili quando modifiable (eccetto nome)', () => {
    // `nome` e' editabile solo in scenario `new` (una volta creato il
    // client, il nome non si cambia). Gli altri campi restano editabili.
    const cfg = computeFormConfig(makeInput({
      scenario: { kind: 'edit' },
      authType: 'https_pdnd',
      certAuth: { kind: 'richiesto_cn' },
    }));
    expect(cfg.fields.nome.enabled).toBe(false);
    expect(cfg.fields.client_id.enabled).toBe(true);
    expect(cfg.fields.descrizione.enabled).toBe(true);
    expect(cfg.certAuth.cnRequired).toBe(true);
  });
});

describe('client-dialog-state: scenario `readonly`', () => {
  it('tutti i campi sono disabled e Save non e\' abilitato', () => {
    const cfg = computeFormConfig(makeInput({
      scenario: { kind: 'readonly' },
      authType: 'https_pdnd_sign',
      certAuth: { kind: 'fornito' },
      certSign: { kind: 'richiesto_cn' },
    }));
    Object.values(cfg.fields).forEach(f => {
      if (f.visible) expect(f.enabled).toBe(false);
      if (f.visible) expect(f.required).toBe(false);
    });
    expect(cfg.save.enabled).toBe(false);
    expect(cfg.certAuth.fileRequired).toBe(false);
    expect(cfg.certSign.cnRequired).toBe(false);
  });

  it('isModifiable=false implica readonly anche se lo scenario e\' new', () => {
    const cfg = computeFormConfig(makeInput({ isModifiable: false }));
    expect(cfg.save.enabled).toBe(false);
    expect(cfg.fields.nome.enabled).toBe(false);
  });
});

describe('client-dialog-state: credentialsOptions', () => {
  it('in toggle mode mostra "Usa Client Esistente"', () => {
    const cfg = computeFormConfig(makeInput({ credentialsMode: 'toggle' }));
    expect(cfg.credentialsOptions.showUsaClientEsistente).toBe(true);
    expect(cfg.credentialsOptions.showClientList).toBe(false);
  });

  it('in dropdown mode mostra la lista client quando ci sono riusi', () => {
    const cfg = computeFormConfig(makeInput({
      credentialsMode: 'dropdown',
      clientsRiusoCount: 3,
    }));
    expect(cfg.credentialsOptions.showClientList).toBe(true);
    expect(cfg.credentialsOptions.showUsaClientEsistente).toBe(false);
  });

  it('riuso_obbligatorio + lista non vuota nasconde "Nuove credenziali"', () => {
    const cfg = computeFormConfig(makeInput({
      credentialsMode: 'dropdown',
      riusoObbligatorio: true,
      clientsRiusoCount: 2,
    }));
    expect(cfg.credentialsOptions.showNuoveCredenziali).toBe(false);
  });

  it('riuso_obbligatorio ma lista vuota mantiene "Nuove credenziali"', () => {
    const cfg = computeFormConfig(makeInput({
      credentialsMode: 'dropdown',
      riusoObbligatorio: true,
      clientsRiusoCount: 0,
    }));
    expect(cfg.credentialsOptions.showNuoveCredenziali).toBe(true);
    expect(cfg.credentialsOptions.showClientList).toBe(false);
  });
});

describe('client-dialog-state: certificate mode transitions', () => {
  const modes: CertificateMode[] = [
    { kind: 'none' },
    { kind: 'fornito' },
    { kind: 'richiesto_cn' },
    { kind: 'richiesto_csr' },
  ];

  it.each(modes)('mode %o: richiede solo i campi coerenti', (mode) => {
    const cfg = computeFormConfig(makeInput({ authType: 'https', certAuth: mode }));
    expect(cfg.certAuth.mode).toEqual(mode);
    if (mode.kind === 'richiesto_cn') {
      expect(cfg.certAuth.cnRequired).toBe(true);
      expect(cfg.certAuth.fileRequired).toBe(false);
    } else if (mode.kind === 'fornito') {
      expect(cfg.certAuth.fileRequired).toBe(true);
      expect(cfg.certAuth.cnRequired).toBe(false);
      expect(cfg.certAuth.moduloRequired).toBe(false);
    } else if (mode.kind === 'richiesto_csr') {
      expect(cfg.certAuth.fileRequired).toBe(true);
      expect(cfg.certAuth.moduloRequired).toBe(true);
    } else {
      // mode.kind === 'none' su auth type https → il blocco resta visibile
      // ma nessun sub-field e' required finche' l'utente non sceglie
      expect(cfg.certAuth.cnRequired).toBe(false);
      expect(cfg.certAuth.fileRequired).toBe(false);
      expect(cfg.certAuth.moduloRequired).toBe(false);
    }
  });
});

describe('client-dialog-state: authTypeEditable (contesto pagina)', () => {
  it('con authTypeEditable=false (default) il campo auth_type non e\' visibile', () => {
    const cfg = computeFormConfig(makeInput({}));
    expect(cfg.fields.auth_type.visible).toBe(false);
    expect(cfg.fields.auth_type.required).toBe(false);
  });

  it('con authTypeEditable=true il campo auth_type e\' visibile e obbligatorio in new', () => {
    const cfg = computeFormConfig(makeInput({ scenario: { kind: 'new' }, authTypeEditable: true }));
    expect(cfg.fields.auth_type.visible).toBe(true);
    expect(cfg.fields.auth_type.enabled).toBe(true);
    expect(cfg.fields.auth_type.required).toBe(true);
  });

  it('con authTypeEditable=true in readonly il campo e\' visibile ma disabled', () => {
    const cfg = computeFormConfig(makeInput({ scenario: { kind: 'readonly' }, authTypeEditable: true }));
    expect(cfg.fields.auth_type.visible).toBe(true);
    expect(cfg.fields.auth_type.enabled).toBe(false);
    expect(cfg.fields.auth_type.required).toBe(false);
  });

  it('con authTypeEditable=true il toggle credenziali resta invisibile', () => {
    // Contesto pagina client-details: "Nuovo client" e' determinato
    // dall'isNew/isEdit della pagina, non c'e' scelta scenario nella UI.
    const cfgNew = computeFormConfig(makeInput({ scenario: { kind: 'new' }, authTypeEditable: true }));
    expect(cfgNew.fields.credenziali.visible).toBe(false);

    const cfgEdit = computeFormConfig(makeInput({ scenario: { kind: 'edit' }, authTypeEditable: true }));
    expect(cfgEdit.fields.credenziali.visible).toBe(false);
  });

  it('con authTypeEditable=false (default dialog) il toggle credenziali e\' visibile in new', () => {
    const cfg = computeFormConfig(makeInput({ scenario: { kind: 'new' } }));
    expect(cfg.fields.credenziali.visible).toBe(true);
  });
});

describe('client-dialog-state: statoNuovo (contesto pagina)', () => {
  it('con statoNuovo=false (default) cert_generato richiesto per richiesto_cn', () => {
    const cfg = computeFormConfig(makeInput({
      authType: 'https',
      certAuth: { kind: 'richiesto_cn' },
    }));
    expect(cfg.certAuth.cnRequired).toBe(true);
    expect(cfg.certAuth.certGeneratoFileRequired).toBe(true);
  });

  it('con statoNuovo=true cert_generato NON richiesto per richiesto_cn', () => {
    const cfg = computeFormConfig(makeInput({
      authType: 'https',
      certAuth: { kind: 'richiesto_cn' },
      statoNuovo: true,
    }));
    expect(cfg.certAuth.cnRequired).toBe(true);
    expect(cfg.certAuth.certGeneratoFileRequired).toBe(false);
  });

  it('con statoNuovo=true cert_generato NON richiesto per richiesto_csr', () => {
    const cfg = computeFormConfig(makeInput({
      authType: 'https',
      certAuth: { kind: 'richiesto_csr' },
      statoNuovo: true,
    }));
    expect(cfg.certAuth.fileRequired).toBe(true);
    expect(cfg.certAuth.moduloRequired).toBe(true);
    expect(cfg.certAuth.certGeneratoFileRequired).toBe(false);
  });

  it('statoNuovo non influenza fornito (no cert generato)', () => {
    const cfg = computeFormConfig(makeInput({
      authType: 'https',
      certAuth: { kind: 'fornito' },
      statoNuovo: true,
    }));
    expect(cfg.certAuth.fileRequired).toBe(true);
    expect(cfg.certAuth.certGeneratoFileRequired).toBe(false);
  });

  it('statoNuovo=true rende username non obbligatorio (http_basic)', () => {
    const cfg = computeFormConfig(makeInput({
      authType: 'http_basic',
      statoNuovo: true,
    }));
    expect(cfg.fields.username.visible).toBe(true);
    expect(cfg.fields.username.required).toBe(false);
  });

  it('statoNuovo=false mantiene username obbligatorio (http_basic)', () => {
    const cfg = computeFormConfig(makeInput({ authType: 'http_basic' }));
    expect(cfg.fields.username.required).toBe(true);
  });
});
