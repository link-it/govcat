/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EventType } from '@linkit/components';
import { Tools } from '@linkit/components';
import { ConfigService } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { OAuthService } from 'angular-oauth2-oidc';
import { PermessiService } from '@services/permessi.service';

import * as _ from 'lodash';
import { a } from '@angular/cdk/portal-directives.d-BoG39gYN';

export const AUTH_CONST: any = {
  storageSession: 'GWAC_SESSION'
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
    private oauthService: OAuthService,
    private permessiService: PermessiService
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

    // Check if there's an access token to revoke (even if expired)
    const hasAccessToken = !!this.oauthService.getAccessToken();
    console.log('Logging out, hasAccessToken:', hasAccessToken);
    if (hasAccessToken) {
      console.log('revokeTokenAndLogout');
      // Check if revocation endpoint is configured in app config or loaded from discovery document
      const oauthConfig = this.appConfig.AUTH_SETTINGS?.OAUTH;
      const configRevocationEndpoint = oauthConfig?.RevocationEndpoint;
      // Also check if loaded from discovery document (when using Issuer)
      const discoveryRevocationEndpoint = (this.oauthService as any).revocationEndpoint;
      const revocationEndpoint = configRevocationEndpoint || discoveryRevocationEndpoint;

      console.log('revocationEndpoint', revocationEndpoint);
      if (revocationEndpoint) {
        this.oauthService.revokeTokenAndLogout().catch((error: any) => {
          console.warn('Error revoking token, falling back to logOut:', error);
          this.oauthService.logOut(true);
        });
      } else {
        // No revocation endpoint configured, just logout
        const logoutUrl = oauthConfig?.LogoutRedirectUri || null;
        console.log('No revocation endpoint configured, just logout', logoutUrl);
        this.oauthService.logOut(true);
      }
    }
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

  saveSettings(settings: any) {
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

      this.http.put(url, _settings, httpOptions).subscribe({
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
    return !session?.utente;
  }

  getRole() {
    const user = this.getUser();
    return user?.ruolo ?? null;
  }

  hasRole(roles: string[]) {
    const role = this.getRole();
    if (role) {
      return roles.findIndex((x: any) => x === role) > -1;
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

  hasPermission(value: string, grant = 'view') {
    let hasPermission = false;
    const { canRead, canWrite } = this.verificacanPermessiMenuAmministrazione(value);
    switch (grant) {
      case 'view':
        hasPermission = canRead;
        break;
      case 'create':
      case 'edit':
      case 'delete':
        hasPermission = canWrite;
        break;
    }

    return this.isGestore() || hasPermission;
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

  isCoordinatore(grant: string[] = []) {
    let _isCoordinator = (_.indexOf(grant, 'coordinatore') !== -1);
    if (!_isCoordinator) {
      const _user: any = this.getUser();
      _isCoordinator = (_user && _user.ruolo === 'coordinatore');
    }
    return _isCoordinator;
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
    return (_intersection.length > 0) && !this.isAnonymous();
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
    const _monitoraggio = this._getConfigModule('monitoraggio');
    if (!_monitoraggio) {
      return false;
    }
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

  // Verifica permessi menu amministrazione

  verificacanPermessiMenuAmministrazione(menu: string): { canRead: boolean; canWrite: boolean } {
    const ruoli = [ this.getUser().ruolo ];
    const permessi = Tools.Configurazione ? (Tools.Configurazione['amministrazione'] || {}) : {};

    return this.permessiService.verificaPermessi(ruoli, menu, permessi);
  }

  hasMenuAmministrazione(): boolean {
    const permessi = Tools.Configurazione ? (Tools.Configurazione['amministrazione'] || {}) : {};
    return (Object.keys(permessi).length > 0);
  }
}
