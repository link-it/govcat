import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EventType } from 'projects/tools/src/lib/classes/events';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { ConfigService } from 'projects/tools/src/lib/config.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OAuthService } from 'angular-oauth2-oidc';

import * as _ from 'lodash';

export const AUTH_CONST: any = {
  storageSession: 'GWAC_SESSION'
};

export const PERMISSIONS: any = {
  // G
  "gestore": [
    { name: 'SERVIZI', view: true, edit: true, create: true, delete: true },
    { name: 'ADESIONI', view: true, edit: true, create: true, delete: true },
  ],
  "coordinatore": [
    { name: 'SERVIZI', view: true, edit: true, create: true, delete: true },
    { name: 'ADESIONI', view: true, edit: true, create: true, delete: true },
  ],
  // RTD
  "referente-tecnico-dominio": [
    { name: 'SERVIZI', view: true, edit: false, create: false, delete: false },
    { name: 'ADESIONI', view: true, edit: false, create: false, delete: false },
  ],
  // RD
  "referente-dominio": [
    { name: 'SERVIZI', view: true, edit: false, create: false, delete: false },
    { name: 'ADESIONI', view: true, edit: false, create: false, delete: false },
  ],
  // RT
  "referente-tecnico": [
    { name: 'SERVIZI', view: true, edit: false, create: false, delete: false },
    { name: 'ADESIONI', view: true, edit: false, create: false, delete: false },
  ],
  // RT
  "referente-superiore": [
    { name: 'SERVIZI', view: true, edit: false, create: false, delete: false },
    { name: 'ADESIONI', view: true, edit: false, create: false, delete: false },
  ],
  // RT
  "referente-tecnico-superiore": [
    { name: 'SERVIZI', view: true, edit: false, create: false, delete: false },
    { name: 'ADESIONI', view: true, edit: false, create: false, delete: false },
  ],
  // RS
  "referente-servizio": [
    { name: 'SERVIZI', view: true, edit: false, create: false, delete: false },
    { name: 'ADESIONI', view: true, edit: false, create: false, delete: false },
  ],
  // rS
  "richiedente-servizio": [
    { name: 'SERVIZI', view: true, edit: false, create: false, delete: false },
    { name: 'ADESIONI', view: true, edit: false, create: false, delete: false },
  ],
  // P
  "anonimo": [
    { name: 'SERVIZI', view: true, edit: true, create: true, delete: true },
    { name: 'ADESIONI', view: true, edit: true, create: true, delete: true },
  ],
};

export const CLASSES: any = {
  servizio: {
    identificativo: {
      type: 'internal',
      fields: [
        { field: 'nome', view: true, edit: false, create: false, delete: false },
        { field: 'versione', view: true, edit: false, create: false, delete: false },
        { field: 'dominio', view: true, edit: false, create: false, delete: false },
        { field: 'id_dominio', view: true, edit: false, create: false, delete: false },
        { field: 'visibilita', view: true, edit: false, create: false, delete: false },
        { field: 'multi_adesione', view: true, edit: false, create: false, delete: false },
      ]
    },
    generico: { // I dati generici sono sempre modificabili
      type: 'internal',
        fields: [
        { field: 'gruppo', view: true, edit: true, create: true, delete: true },
        { field: 'descrizione_sintetica', view: true, edit: true, create: true, delete: true },
        { field: 'descrizione', view: true, edit: true, create: true, delete: true },
        { field: 'immagine', view: true, edit: true, create: true, delete: true },
        { field: 'tags', view: true, edit: true, create: true, delete: true },
        { field: 'tassonomie', view: true, edit: true, create: true, delete: true },
        { field: 'termini_ricerca', view: true, edit: true, create: true, delete: true },
        { field: 'note', view: true, edit: true, create: true, delete: true },
        { field: 'allegati', view: true, edit: true, create: true, delete: true },
      ]
    },
    specifica: {
      type: 'external',
      fields: [
        { field: 'allegati', view: true, edit: true, create: true, delete: true },
      ],
    },
    referenti: {
      type: 'external',
      fields: [
        { field: 'referente', view: true, edit: true, create: true, delete: true },
        { field: 'referente_tecnico', view: true, edit: true, create: true, delete: true },
        { field: 'referente_superiore', view: true, edit: true, create: true, delete: true },
        { field: 'referente_tecnico_superiore', view: true, edit: true, create: true, delete: true },
      ]
    }
  },
  api: {
    identificativo: {
      type: 'external',
      fields: [
        { field: 'nome', view: true, edit: false, create: false, delete: false },
        { field: 'ruolo', view: true, edit: false, create: false, delete: false },
        { field: 'versione', view: true, edit: false, create: false, delete: false },
        { field: 'protocollo', view: true, edit: false, create: false, delete: false },
      ]
    },
    specifica: {
      type: 'external',
      fields: [
        { field: 'allegati', view: true, edit: true, create: true, delete: true },
        { field: 'profilo', view: true, edit: true, create: true, delete: true },
        { field: 'resources', view: true, edit: true, create: true, delete: true },
        { field: 'note', view: true, edit: true, create: true, delete: true },
      ]
    },
    generico: {
      type: 'external',
      fields: [
        { field: 'descrizione', view: true, edit: true, create: true, delete: true },
        { field: 'codice_asset', view: true, edit: true, create: true, delete: true },
        { field: 'allegati', view: true, edit: true, create: true, delete: true },
      ]
    },
    dati_erogazione: {
      type: 'external',
      fields: [
        { field: 'url_collaudo', view: true, edit: true, create: true, delete: true },
        { field: 'baseUrlCollaudo', view: true, edit: true, create: true, delete: true },
        { field: 'baseUrl', view: true, edit: true, create: true, delete: true },
        { field: 'url_produzione', view: false, edit: false, create: false, delete: false },
      ]
    },
    collaudo: {
      type: 'external',
      fields: [
        { field: 'collaudo', view: true, edit: true, create: true, delete: true },
        { field: 'url_collaudo', view: true, edit: true, create: true, delete: true },
        { field: 'baseUrlCollaudo', view: true, edit: true, create: true, delete: true },
      ]
    },
    collaudo_configurato: {
      type: 'external',
      fields: [
        { field: 'url_collaudo', view: true, edit: true, create: true, delete: true },
        { field: 'baseUrlCollaudo', view: true, edit: true, create: true, delete: true },
      ]
    },
    produzione: {
      type: 'external',
      fields: [
        { field: 'produzione', view: true, edit: true, create: true, delete: true },
        { field: 'url_produzione', view: true, edit: true, create: true, delete: true },
        { field: 'baseUrl', view: true, edit: true, create: true, delete: true },
      ]
    },
    produzione_configurato: {
      type: 'external',
      fields: [
        { field: 'url_produzione', view: true, edit: true, create: true, delete: true },
        { field: 'baseUrl', view: true, edit: true, create: true, delete: true },
      ]
    }
  },
  adesione: {
    identificativo: {
      type: 'internal',
      fields: [
        { field: 'id_servizio', view: true, edit: false, create: false, delete: false },
        { field: 'servizio', view: true, edit: false, create: false, delete: false },
        { field: 'servizio_nome', view: true, edit: false, create: false, delete: false },
        { field: 'id_organizzazione', view: true, edit: false, create: false, delete: false },
        { field: 'organizzazione', view: true, edit: false, create: false, delete: false },
        { field: 'organizzazione_nome', view: true, edit: false, create: false, delete: false },
        { field: 'id_soggetto', view: true, edit: false, create: false, delete: false },
        { field: 'soggetto', view: true, edit: false, create: false, delete: false },
        { field: 'soggetto_nome', view: true, edit: false, create: false, delete: false },
        { field: 'identificativo', view: true, edit: false, create: false, delete: false },
        { field: 'servizio_nome', view: true, edit: false, create: false, delete: false },
      ]
    },
    generico: { // I dati generici sono sempre modificabili
      type: 'internal',
        fields: [
          { field: 'id_logico', view: true, edit: false, create: false, delete: false },
          { field: 'identificativo', view: true, edit: false, create: false, delete: false },
        ]
    },
    referenti: {
      type: 'external',
      fields: [
        { field: 'referente', view: true, edit: true, create: true, delete: true },
        { field: 'referente_tecnico', view: true, edit: true, create: true, delete: true },
        { field: 'referente_superiore', view: true, edit: true, create: true, delete: true },
        { field: 'referente_tecnico_superiore', view: true, edit: true, create: true, delete: true },
      ]
    },
    specifica: {
      type: 'external',
      fields: [
        { field: 'allegati', view: true, edit: true, create: true, delete: true },
      ],
    },
    collaudo: {
      type: 'external',
      fields: [
        { field: 'configurazione_collaudo', view: true, edit: true, create: true, delete: true },
      ],
    },
    collaudo_configurato: {
      type: 'external',
      fields: [
        { field: 'configurazione_collaudo', view: true, edit: true, create: true, delete: true },
      ],
    },
    produzione: {
      type: 'external',
      fields: [
        { field: 'configurazione_produzione', view: true, edit: true, create: true, delete: true },
      ],
    },
    produzione_configurato: {
      type: 'external',
      fields: [
        { field: 'configurazione_produzione', view: true, edit: true, create: true, delete: true },
      ],
    }
  }
};

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private currentSession: any = null;

  config: any = null;
  appConfig: any = null;
  backdoorOAuth: boolean = false;
  anonymousAccess: boolean = false;

  API_PROFILE: string = '/profile';
  API_UTENTI: string = '/utenti';
  API_LOGOUT: string = '/logout';

  constructor(
    private http: HttpClient,
    public configService: ConfigService,
    private eventsManagerService: EventsManagerService,
    private oauthService: OAuthService
  ) {
    this.config = this.configService.getConfiguration();
    this.appConfig = this.configService.getAppConfig();
    const _oauthConfig = this.appConfig.AUTH_SETTINGS?.OAUTH;
    this.backdoorOAuth = _oauthConfig?.BackdoorOAuth || false;
    this.anonymousAccess = this.appConfig.ANONYMOUS_ACCESS || false;

    if (this.appConfig?.GOVAPI?.LOGOUT_URL) {
      this.API_LOGOUT = this.appConfig.GOVAPI.LOGOUT_URL;
    }

    this.reloadSession();
  }

  ngOnInit(): void {
  }

  login(username: string, password: string) {
    const _basiAuth = `${username}:${password}`;
    let httpHeaders = new HttpHeaders();
    httpHeaders = httpHeaders.set("Authorization", "Basic " + btoa(_basiAuth));

    const httpOptions = {
      headers: httpHeaders,
      withCredentials: true
    };

    let url = `${this.appConfig.GOVAPI['HOST']}${this.API_PROFILE}`;

    return this.http.get(url, httpOptions);
  }

  oauthLogin() {
    this.oauthService.initCodeFlow();
  }

  logout() {
    localStorage.removeItem(AUTH_CONST.storageSession);
    
    if (this.isAuthLogged()) {
      this.oauthService.revokeTokenAndLogout();
      // this.oauthService.logOut(true);
    }

    // let url = `${this.appConfig.GOVAPI['HOST']}${this.API_LOGOUT}`;
    // return this.http.get(url);
  }

  setCurrentSession(data: any) {
    const session = btoa(encodeURI(JSON.stringify(data)));
    localStorage.setItem(AUTH_CONST.storageSession, session);
  }

  getCurrentSession() {
    const storage = localStorage.getItem(AUTH_CONST.storageSession);
    if (storage) {
      const currentSession = JSON.parse(decodeURI(atob(storage)));
      return currentSession;
    }
    return null;
  }

  reloadSession() {
    this.currentSession = this.getCurrentSession();
    this.eventsManagerService.broadcast(EventType.SESSION_UPDATE, this.currentSession);
    return this.currentSession;
  }

  isAuthLogged() {
    const hasIdToken = this.oauthService.hasValidIdToken();
    const hasAccessToken = this.oauthService.hasValidAccessToken();
    return (hasIdToken && hasAccessToken);
  }

  isLogged() {
    if (!this.backdoorOAuth && !this.anonymousAccess) {
      return this.isAuthLogged();
    } else {
      return true;
    }
  }

  getSettings() {
    const session = this.getCurrentSession();
    return session?.settings || null;
  }

  async saveSettings(settings: any) {
    const utente = this.getUser();
    if (utente) {
      let session = this.getCurrentSession();
      let _settings = { ...session.settings, ...settings };
      if (_.isEmpty(settings)) {
        // Default settings
        _settings = {
          version: '0.1',
          servizi: {
            view: 'card',
    
            viewBoxed: false,
            showImage: true,
            showEmptyImage: false,
            fillBox: true,
            showMasonry: false,
          
            editSingleColumn: false,
            showMarkdown: true,
            showPresentation: true,
            showTechnicalReferent: false
          }
        };
      }

      let httpHeaders = new HttpHeaders();
      
      const httpOptions = {
        headers: httpHeaders,
      };
      
      let url = `${this.appConfig.GOVAPI['HOST']}${this.API_UTENTI}/${utente.id_utente}/settings`;

      await this.http.put(url, _settings, httpOptions).subscribe({
        next: (response: any) => {
          session = this.getCurrentSession();
          session.settings = response;
          this.setCurrentSession(session);
        },
        error: (error: any) => {
          console.log('settings error', error);
        }
      });
    }
  }

  getUser() {
    const session = this.getCurrentSession();
    return session?.utente || null;
  }

  getUserName() {
    const session = this.getCurrentSession();
    return session?.utente ? `${session?.utente.nome} ${session?.utente.cognome}` : 'sconosciuto';
  }

  isAnonymous() {
    const session = this.getCurrentSession();
    return session?.utente ? false : true;
  }

  getRoles() {
    const session = this.getCurrentSession();
    return session?.roles ?? [];
  }

  hasRole(role: string) {
    const roles = this.getRoles();
    if (roles.findIndex((x: any) => x.name === role) > -1) {
      return true;
    }
    return false;
  }

  isAdmin() {
    if (!this.currentSession) {
      return false;
    } else {
      return (_.includes(this.currentSession.roles, 'apicat_adm'));
    }
  }

  getPermissions() {
    const roles: any[] = this.getRoles();
    let permissions: any[] = [];
    roles.forEach((role: any) => {
      permissions = permissions.concat(PERMISSIONS[role]);
    });
    return permissions;
  }

  hasPermission(value: string, grant = 'view') {
    const uValue = value ? value.toUpperCase() : value;
    if (this.isAdmin() || uValue === 'PUBLIC') { return true; }
    const permissions = this.getPermissions();
    const idx = permissions.findIndex(o => o.name.toUpperCase() === uValue);
    const permission = (idx > -1) ? permissions[idx] : null;
    if (permission) {
      return permission[grant];
    }
    return false;
  }

  // Gestione Grant

  _getConfigModule(module: string) {
    return Tools.Configurazione ? Tools.Configurazione[module] : null;
  }

  _getWorkflow(module: string) {
    return this._getConfigModule(module)?.workflow || null;
  }

  _getWorkflowCambiStato(module: string, state: string) {
    return this._getWorkflow(module)?.cambi_stato.find((item: any) => { return item.stato_attuale === state }) || null;
  }

  isGestore(grant: string[] = []) {
    let _isGestore = (_.indexOf(grant, 'gestore') !== -1);
    if (!_isGestore) {
      const _user: any = this.getUser();
      _isGestore = (_user && _user.ruolo === 'gestore');
    }
    return _isGestore;
  }

  canAdd(module: string, state: string, grant: string[] = []) {
    if (this.isGestore(grant)) { return true; }
    if (state) {
      const _wfcs = this._getWorkflowCambiStato(module, state);
      const _dnm = (_wfcs && _wfcs.dati_non_modificabili) ? _wfcs.dati_non_modificabili : [];

      return (_dnm.length === 0);
    }
    return false;
  }

  canEdit(module: string, submodule: string, state: string, grant: string[] = []) {
    if (this.isGestore(grant)) { return true; }
    if (state) {
      const _wfcs = this._getWorkflowCambiStato(module, state);
      const _ssra = (_wfcs && _wfcs.stato_successivo) ? _wfcs.stato_successivo.ruoli_abilitati : [];
      const _dnm = (_wfcs && _wfcs.dati_non_modificabili) ? _wfcs.dati_non_modificabili : [];

      let _can: boolean = true;
      Object.keys(CLASSES[submodule] || []).forEach((key: string) => {
        if ((CLASSES[submodule][key].type === 'internal') && (_.indexOf(key, _dnm) !== -1)) {
          _can = false;
        }
      });

      const _grant: string[] = [ ...grant ];
      if (_grant.indexOf('referente_tecnico') !== -1) {
        _grant.push('referente');
      }
      if (_grant.indexOf('referente_tecnico_superiore') !== -1) {
        _grant.push('referente_superiore');
      }

      const _intersection = _.intersection(_grant, _ssra);
      return _can && (_intersection.length > 0);
    }
    return false;
  }

  canManagement(module: string, submodule: string, state: string, grant: string[] = []) {
    if (this.isGestore(grant)) { return true; }

    const _grantManagement: string[] = ['gestore', 'referente', 'referente_tecnico', 'referente_superiore', 'referente_tecnico_superiore', 'richiedente'];

    const _intersection = _.intersection(grant, _grantManagement);
    return (_intersection.length > 0);
  }

  canManagementComunicazioni(module: string, submodule: string, state: string, grant: string[] = []) {
    if (this.isGestore(grant)) { return true; }

    const _grantManagement: string[] = ['gestore', 'referente', 'referente_tecnico', 'referente_superiore', 'referente_tecnico_superiore', 'richiedente'];

    const _intersection = _.intersection(grant, _grantManagement);
    return (_intersection.length > 0) || true;
  }

  canEditField(module: string, submodule: string, state: string, field: string, grant: string[] = []) {
    if (this.isGestore(grant)) { return true; }
    if (state) {
      const _wfcs = this._getWorkflowCambiStato(module, state);
      const _ssra = (_wfcs && _wfcs.stato_successivo) ? _wfcs.stato_successivo.ruoli_abilitati : [];
      const _dnm = (_wfcs && _wfcs.dati_non_modificabili) ? _wfcs.dati_non_modificabili : [];
      const _do = (_wfcs && _wfcs.dati_obbligatori) ? _wfcs.dati_obbligatori : [];

      if (_dnm.length > 0) {
        const _fields: string[] = [];
        _dnm.forEach((item: string) => {
          if (CLASSES[submodule][item]) {
            (CLASSES[submodule][item].fields || []).forEach((f: any) => {
              _fields.push(f.field);
            });
          }
        });
        if ((_.indexOf(_fields, field) !== -1)) {
          return false;
        }
      }

      const _grant: string[] = [ ...grant ];
      if (_grant.indexOf('referente_tecnico') !== -1) {
        _grant.push('referente');
      }
      if (_grant.indexOf('referente_tecnico_superiore') !== -1) {
        _grant.push('referente_superiore');
      }

      const _intersection = _.intersection(_grant, _ssra);
      return (_intersection.length > 0);
    }
    return false;
  }
  
  canChangeStatus(module: string, state: string, type: string, grant: string[] = [], currentStatus: string = '') {
    const _wfcs = this._getWorkflowCambiStato(module, state);
    let _ss = (_wfcs && _wfcs[type]) ? _wfcs[type].ruoli_abilitati : [];
    if (type === 'stati_ulteriori') {
      _ss = _wfcs[type].find((item: any) => item.nome === currentStatus)?.ruoli_abilitati || [];
    }
    const _intersection = _.intersection(grant, _ss);
    return (_intersection.length > 0);
  }

  canJoin(module: string, state: string, usePackage: boolean = false) {
    const _sac = (module === 'adesione') ? this._getConfigModule(module).stati_scheda_adesione : this._getConfigModule(usePackage ? 'package' : module).stati_adesione_consentita;
    return (_.indexOf(_sac, state) !== -1);
  }

  canTypeAttachment(module: string, state: string, type: string, grant: string[] = []) {
    if (this.isGestore(grant)) { return true; }
    if (state && type) {
      const _wfcs = this._getWorkflowCambiStato(module, state);
      const _dnm = (_wfcs && _wfcs.dati_non_modificabili) ? _wfcs.dati_non_modificabili : [];
      return (_.indexOf(_dnm, type) === -1 );
    }
    return false;
  }

  _removeDNM(module: string, state: string, body: any, grant: string[] = []) {
    if (this.isGestore(grant)) { return body; }
    const _wfcs = this._getWorkflowCambiStato(module, state);
    const _dnm = (_wfcs && _wfcs.dati_non_modificabili) ? _wfcs.dati_non_modificabili : [];
    _dnm.forEach((key: string) => {
      switch (key) {
        case 'specifica':
          delete body['dati_specifica'];
          break;
        case 'collaudo':
          delete body['configurazione_collaudo'];
          break;
        case 'produzione':
          delete body['configurazione_produzione'];
          break;
        case 'generico':
          delete body['dati_generici'];
          break;
        default:
          delete body[key];
          break;
      };
    });
    return body;
  }

  _getClassesMandatory(module: string, submodule: string, state: string) {
    const _wfcs = this._getWorkflowCambiStato(module, state);
    return (_wfcs && _wfcs.dati_obbligatori) ? _wfcs.dati_obbligatori : [];
  }

  _getClassesNotModifiable(module: string, submodule: string, state: string) {
    const _wfcs = this._getWorkflowCambiStato(module, state);
    return (_wfcs && _wfcs.dati_non_modificabili) ? _wfcs.dati_non_modificabili : [];
  }

  _getFieldsMandatory(module: string, submodule: string, state: string) {
    const _do = this._getClassesMandatory(module, submodule, state);

    const _fields: string[] = [];
    if (_do.length > 0) {
      _do.forEach((item: string) => {
        if (CLASSES[submodule][item]) {
          (CLASSES[submodule][item].fields || []).forEach((f: any) => {
            _fields.push(f.field);
          });
        }
      });
    }
    return _fields;
  }

  _getFieldsNotModifiable(module: string, submodule: string, state: string) {
    const _dnm = this._getClassesNotModifiable(module, submodule, state);

    const _fields: string[] = [];
    if (_dnm.length > 0) {
      _dnm.forEach((item: string) => {
        if (CLASSES[submodule][item]) {
          (CLASSES[submodule][item].fields || []).forEach((f: any) => {
            _fields.push(f.field);
          });
        }
      });
    }
    return _fields;
  }

  canDownloadSchedaAdesione(state: string) {
    const _sac = this._getConfigModule('adesione').stati_scheda_adesione;
    return (_.indexOf(_sac, state) !== -1);
  }

  canMonitoraggio(grant: string[] = []) {
    const _grant = [ ...grant ];
    const _monitoraggio = this._getConfigModule('servizio').monitoraggio;
    const _ruoliAbilitati = _monitoraggio.ruoli_abilitati;
    if ((_.indexOf(grant, 'referente_tecnico') !== -1) && (_.indexOf(grant, 'referente') === -1)) {
      _grant.push('referente');
    }
    if ((_.indexOf(grant, 'referente_tecnico_superiore') !== -1) && (_.indexOf(grant, 'referente_superiore') === -1)) {
      _grant.push('referente_superiore');
    }
    const _intersection = _.intersection(grant, _ruoliAbilitati);
    return _monitoraggio.abilitato && !!_intersection.length;
  }
}
