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
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '@app/services/authentication.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { ServiceBreadcrumbsData } from '@app/views/servizi/route-resolver/service-breadcrumbs.resolver';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '@linkit/components';

import { Tools } from '@linkit/components';
import { forkJoin } from 'rxjs';
import { ComponentAuthTypeEnum } from '@app/model/componentAuthTypeEnum';
import { MenuAction } from '@linkit/components';
import { Grant } from '@app/model/grant';

import * as _ from 'lodash';
declare const saveAs: any;

export interface Organization {
  id_organizzazione: string;
  nome: string;
  descrizione: string;
  codice_ente: string;
  codice_fiscale_soggetto: string;
  id_tipo_utente: string;
  referente: boolean;
  aderente: boolean;
  multi_soggetto: boolean;
}

export interface User {
  id_utente: string;
  nome: string;
  cognome: string;
  telefono_aziendale: string;
  email_aziendale: string;
  username: string;
  stato: string;
  ruolo: string;
  organizzazione?: Organization;
  classi_utente: string[];
}

export interface Referent {
  utente: User;
  tipo: 'referente' | 'referente_servizio' | 'referente_tecnico' | 'referente_dominio';
}

export interface Domain {
  id_dominio: string;
  nome: string;
  soggetto_referente: {
    id_soggetto: string;
    nome: string;
    descrizione: string;
    organizzazione: Organization;
    referente: boolean;
    aderente: boolean;
  };
  visibilita: string;
  classi: any[];
  descrizione: string;
}

export interface Service {
  id_servizio: string;
  nome: string;
  versione: string;
  immagine?: boolean;
  descrizione_sintetica: string;
  visibilita: string;
  stato: string;
  multi_adesione: boolean;
  dominio: Domain;
}

export interface RichiestaErogazione {
  api: {
    id_api: string;
    nome: string;
    versione: number;
    servizio: Service;
    descrizione: string;
    codice_asset: string;
    ruolo: string;
    protocollo: string;
    protocollo_dettaglio: string;
    specifica: {
      uuid: string;
      content_type: string;
      filename: string;
    };
    proprieta_custom: any[];
  };
}

export interface Adesione {
  id_adesione: string;
  id_logico: string | null;
  soggetto: {
    id_soggetto: string;
    nome: string;
    organizzazione: Organization;
    referente: boolean;
    aderente: boolean;
  };
  servizio: Service;
  stato: string;
  data_creazione: string;
  data_ultimo_aggiornamento: string;
  utente_richiedente: User;
  utente_ultimo_aggiornamento: User;
  client_richiesti: { profilo: string }[];
  erogazioni_richieste: RichiestaErogazione[];
}

export interface Certificate {
  uuid: string;
  content_type: string;
  filename: string;
}

export interface Client {
  id_client: string;
  descrizione?: string;
  indirizzo_ip?: string;
  soggetto: {
    id_soggetto: string;
    nome: string;
    organizzazione: Organization;
    referente: boolean;
    aderente: boolean;
  };
  ambiente: string;
  nome: string;
  stato: string;
  dati_specifici: {
    auth_type: string;
    certificato_autenticazione: {
      tipo_certificato: string;
      certificato: Certificate;
    };
    certificato_firma: {
      tipo_certificato: string;
      certificato: Certificate;
    };
    username: string;
    url_redirezione: string;
    url_esposizione: string;
    help_desk: string;
    nome_applicazione_portale: string;
  };
  profilo: string;
}

export interface ReferentView {
  id: string;
  name: string;
  email: string;
  types: string[];
}

export interface AuthModeView {
  iop: string;
  client_id: string;
  client_id_label: string;
  canViewClientId: boolean;
  name: string;
  description: string;
  ip: string;
  authCertificate?: Certificate;
  canDownloadAuthCertificate: boolean;
  signCertificate?: Certificate;
  canDownloadSignCertificate: boolean;
  editMode: boolean;
  username: string;
  canViewUsername: boolean;
  url_redirezione: string;
  url_esposizione: string;
  help_desk: string;
  nome_applicazione_portale?: string;
  canViewOAuthCode: boolean;
  canViewIpfruizione: boolean;
}

export interface ApiView {
  name: string;
  url: string;
  ip: string;
  editMode: boolean;
}

const clientRowConfig = {
  itemRow: {
    primaryText: [{ field: "name", type: "text", emptySpace: true }],
    secondaryText: [
      {
        "badged": true,
        "field": "iop",
        "type": "tag",
        "class": "badge badge-pill badge-success",
      }
    ]
  },
  metadata: {
    text: [
      {
        field: "profilo",
        type: "text",
        tooltip: "subscriber"
      }
    ],
    label: []
  },
  options: {
    iop: {}
  }
};

@Component({
  selector: 'app-adesione-view',
  templateUrl: './adesione-view.component.html',
  styleUrls: ['./adesione-view.component.scss'],
  standalone: false
})
export class AdesioneViewComponent implements OnInit {

  @ViewChild("myScroll") myScroll!: ElementRef;

  public id: number | null = null;
  public config: any = {};
  public breadcrumbs: any[] = [
    { label: 'APP.TITLE.Subscriptions', url: '', type: 'title', iconBs: 'display' },
    { label: '...', url: '', type: 'title' }
  ];
  public _spin = false;
  public _loadingConfiguration = false;
  public _showScroll = false;
  public adesione: Adesione | null = null;
  public _downloading = false;
  public referents: ReferentView[] = [];
  public referentiLoading: boolean = true;
  public maxReferenti: number = 3;
  public environment: string = 'collaudo';
  public authModes: AuthModeView[] = [];
  public apis: ApiView[] = [];
  public clientRowConfig = clientRowConfig;

  private readonly model = 'adesioni';
  private apiUrl: string = '';
  private defaultLogo: string = './assets/images/logo-servizio.png';
  private _serviceBreadcrumbs: ServiceBreadcrumbsData | null = null;

  public grant: Grant | null = null;
  
  _otherActions: MenuAction[] = [];
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private apiService: OpenAPIService,
    private configService: ConfigService,
    private authenticationService: AuthenticationService
  ) {
    const config = this.configService.getConfiguration();
    this.apiUrl = config.AppConfig.GOVAPI.HOST;

    this.route.data.subscribe((data) => {
      if (!data.serviceBreadcrumbs) return;
      this._serviceBreadcrumbs = data.serviceBreadcrumbs;
      this._initBreadcrumb();
    });
  }

  public ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];
        this.loadAdesione(true);
      }
    });

    this.configService.getConfig(this.model).subscribe(
      (config: any) => {
        this.config = config;
      }
    );
  }

  public onScroll(e: Event): void {
    this._showScroll = ((e.target as Element).scrollTop > 180);
  }

  public _onScrollToTop() {
    const _curPos = this.myScroll.nativeElement.scrollTop;
    this.myScroll.nativeElement.scrollTop = 0;
  }

  public onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  updateOtherAction() {
    this._otherActions = []
    const _statiFinali = ['pubblicato_produzione', 'pubblicato_produzione_senza_collaudo'];
    const _isStatoFinale = _statiFinali.includes(this.adesione?.stato || '');
    const _isGestore = this.authenticationService.isGestore(this.grant?.ruoli || []);
    if (!_isStatoFinale || _isGestore) {
      this._otherActions = [
          new MenuAction({
            type: 'menu',
            title: 'APP.ADESIONI.TITLE.Configure',
            icon: 'gear',
            subTitle: '',
            action: 'configura',
            enabled: true
          }),
          new MenuAction({
            type: 'divider',
            title: '',
            enabled: true
          })
        ];
    }
  }

  public getLogoMapper = (bg: boolean = false): string => {
    return this.adesione?.servizio.immagine ? `${this.apiUrl}/servizi/${this.adesione.servizio.id_servizio}/immagine` : this.defaultLogo;
  }

  public downloadSchedaAdesione() {
    if (this.id) {
      this._downloading = true;

      const _partial = `export`;
      this.apiService.download(this.model, this.id, _partial).subscribe({
        next: (response: any) => {
          let name: string = `SchedaAdesione.pdf`;
          saveAs(response.body, name);
          this._downloading = false;
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  public canDownloadSchedaAdesioneMapper(): boolean {
    if (!this.adesione) return false;
    return this.authenticationService.canDownloadSchedaAdesione(this.adesione.stato);
  }

  public onProductionClick() {
    this.environment = 'produzione';
    this.onEnvironmentChange();
  }

  public onTestClick() {
    this.environment = 'collaudo';
    this.onEnvironmentChange();
  }

  public download(mode: AuthModeView, certificate?: Certificate) {
    if (!certificate) return;

    const _partial = `${this.environment}/client/${certificate.uuid}/download`;
    this.apiService.download(this.model, this.id, _partial).subscribe({
      next: (response: any) => {
        let name: string = `${certificate.filename}`;
        saveAs(response.body, name);
        this._downloading = false;
      },
      error: (error: any) => {
        Tools.OnError(error);
      }
    });
  }

  public onActionMonitor(event: any) {
    switch (event.action) {
      case 'configura':
        this.configureAdesione();
        break;
      case 'gestione':
        this.router.navigate([`..`], { relativeTo: this.route });
        break;
      case 'comunicazioni':
      default:
        localStorage.setItem('ADESIONI_VIEW', 'TRUE');
        this.router.navigate([`../comunicazioni`], { relativeTo: this.route });
        break;
    }
  }

  private _initBreadcrumb() {
    const _organizzazione = this.adesione ? this.adesione.soggetto.organizzazione.nome : null;
    const _servizio = this.adesione ? this.adesione.servizio.nome : null;
    const _versione = this.adesione ? this.adesione.servizio.versione : null;

    let title = this.adesione ? `${_organizzazione} - ${_servizio} v. ${_versione}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    let baseUrl = `/${this.model}`;

    if (this._serviceBreadcrumbs) {
      title = _organizzazione;
      baseUrl = `/servizi/${this._serviceBreadcrumbs.service.id_servizio}/${this.model}`;
    }

    if (this.adesione?.id_logico) {
      title = `${this.adesione.id_logico} (${_organizzazione})`;
    }

    this.breadcrumbs = [
      { label: 'APP.TITLE.Subscriptions', url: `${baseUrl}/`, type: 'link', iconBs: 'display' },
      { label: title, url: ``, type: 'link' },
    ];

    if (this._serviceBreadcrumbs) {
      this.breadcrumbs.unshift(...this._serviceBreadcrumbs.breadcrumbs);
    }
  }

  private loadAdesione(spin: boolean = true) {
    this._spin = spin;
    this.apiService.getDetails(this.model, this.id, 'grant').subscribe({
      next: (grant: any) => {
        this.grant = grant;
        console.log('grant: ', this.grant);

        this.apiService.getDetails(this.model, this.id).subscribe({
          next: (response: any) => {
            console.log('adesione: ', response);
            this.adesione = response;
            this._spin = false;
            this._initBreadcrumb();

            if (this.adesione?.stato.includes('produzione')){
              this.environment = 'produzione';
            }

            this.updateOtherAction();
            
            this.loadReferents();
            this.onEnvironmentChange();
          },
          error: (error: any) => {
            Tools.OnError(error);
            this._spin = false;
          }
        });
      },
      error: (error: any) => {
        Tools.OnError(error);
        this._spin = false;
      }
    });
  }

  private loadReferents() {
    this.referentiLoading = true;
    forkJoin({
      referenti: this.apiService.getDetails(this.model, this.id, 'referenti'),
      referentiDominio: this.apiService.getDetails('domini', this.adesione?.servizio.dominio.id_dominio, 'referenti'),
      referentiServizio: this.apiService.getDetails('servizi', this.adesione?.servizio.id_servizio, 'referenti')
    }).subscribe({
      next: (response: any) => {
        const referents: Referent[] = response.referenti.content.map((item: any) => ({ ...item, tipo: `${item.tipo}_adesione` }));
        const serviceReferents: Referent[] = response.referentiServizio.content.map((item: any) => ({ ...item, tipo: `${item.tipo}_servizio` }));
        const domainReferents: Referent[] = response.referentiDominio.content.map((item: any) => ({ ...item, tipo: `${item.tipo}_dominio` }));

        const reduceReferents = (acc: ReferentView[], cur: Referent) => {
          const index = acc.findIndex((item: ReferentView) => item.id === cur.utente.id_utente);
          if (index === -1) {
            acc.push({
              id: cur.utente.id_utente,
              email: cur.utente.email_aziendale,
              name: `${cur.utente.nome} ${cur.utente.cognome}`,
              types: [cur.tipo != 'referente' || !cur.utente.ruolo ? cur.tipo : cur.utente.ruolo]
            });
          } else {
            acc[index].types.push(cur.tipo);
          }
          return acc;
        };

        const allReferents = [
          ...serviceReferents.filter(ref => ref.tipo === 'referente_servizio'),
          ...domainReferents.filter(ref => ref.tipo === 'referente_dominio'),
          ...referents
        ];
        this.referents = allReferents.reduce(reduceReferents, []);

        this.referentiLoading = false;
      },
      error: (error: any) => {
        Tools.OnError(error);
        this._spin = false;
        this.referentiLoading = false;
      }
    });
  }

  private loadErogazioni() {
    // endpoint API risposta
    this.apiService.getDetails(this.model, this.id, this.environment + '/erogazioni').subscribe({
      next: (result) => {
        const mapApiDetails = (configuredApis: any[]) => {
          if (!this.adesione || !this.adesione.erogazioni_richieste) return [];

          return this.adesione.erogazioni_richieste.map((requestedApi: RichiestaErogazione): ApiView => {
            const associatedApi: any = configuredApis.find((el: any) => { return requestedApi.api.id_api === el.api.id_api })

            return {
              name: `${requestedApi.api.nome} v.${requestedApi.api.versione}`,
              url: associatedApi ? associatedApi.url : '-',
              ip: associatedApi ? associatedApi.indirizzi_ip : '-',
              editMode: false
            };
          })
        };

        this.apis = mapApiDetails(result.content);

      }, error: (error: any) => {
        Tools.OnError(error);
      }
    });
  }

  private loadClients() {
    this._loadingConfiguration = true;
    // modalita di autenticazione
    this.apiService.getDetails(this.model, this.id, this.environment + '/client').subscribe({
      next: (result) => {
        if (!this.adesione || !this.adesione.client_richiesti) return;

        const mapClientDetails = (clients: Client[]): AuthModeView[] => {
          if (!this.adesione || !this.adesione.client_richiesti) return [];

          return _.uniqWith(this.adesione.client_richiesti, _.isEqual).map((clientRichiesto) => {
            const client: Client | undefined = clients.find((client: Client) => client.profilo === clientRichiesto.profilo);

            const profiloRichiesto = Tools.Configurazione.servizio.api.profili.find((profilo: {codice_interno: string, etichetta: string, auth_type: string}) => profilo.codice_interno === clientRichiesto.profilo);

            return {
              iop: profiloRichiesto.etichetta,
              client_id: client ? client.id_client : '-',
              client_id_label: this.getLabelClientId(client?.dati_specifici?.auth_type),
              canViewClientId: this.canViewClientId(client?.dati_specifici?.auth_type),
              name: client ? client.nome : '-',
              description: client && client.descrizione ? client.descrizione : '',
              ip: client && client.indirizzo_ip ? client.indirizzo_ip : '-',
              authCertificate: client?.dati_specifici?.certificato_autenticazione?.certificato,
              canDownloadAuthCertificate: this.canDownloadAuthCertificate(client?.dati_specifici?.auth_type),
              signCertificate: client?.dati_specifici?.certificato_firma?.certificato,
              canDownloadSignCertificate: this.canDownloadSignCertificate(client?.dati_specifici?.auth_type),
              editMode: false,
              username: client?.dati_specifici?.username || '-',
              canViewUsername: client?.dati_specifici?.auth_type === ComponentAuthTypeEnum.HttpBasic,
              url_redirezione: client?.dati_specifici?.url_redirezione || '-',
              url_esposizione: client?.dati_specifici?.url_esposizione || '-',
              help_desk: client?.dati_specifici?.help_desk || '-',
              nome_applicazione_portale: client?.dati_specifici?.nome_applicazione_portale || '-',
              canViewOAuthCode: this.canViewOAuthCode(client?.dati_specifici?.auth_type),
              canViewIpfruizione: this.canViewIpFruizione(client?.dati_specifici?.auth_type)
            };
          });
        }

        this.authModes = mapClientDetails(result.content);
        this._loadingConfiguration = false;
      },
      error: (error: any) => {
        this._loadingConfiguration = false;
        Tools.OnError(error);
      }
    });
  }

  private canViewIpFruizione(authType: string | undefined): boolean {
    if (!authType) return false;
    const authTypes: any = this.authenticationService._getConfigModule('servizio').api.auth_type;
    const configAuthType = authTypes.find((x: any) => x.type == authType);
    return (configAuthType && configAuthType.indirizzi_ip) || false;
  }

  private canDownloadSignCertificate(authType: string | undefined): boolean {
    if (!authType) return false;
    ComponentAuthTypeEnum.HttpsSign
    return ['sign', 'https_sign', 'sign_pdnd', 'https_pdnd_sign'].indexOf(authType) !== -1;
  }

  private canDownloadAuthCertificate(authType: string | undefined): boolean {
    if (!authType) return false;
    return ['https', 'https_sign', 'https_pdnd', 'https_pdnd_sign'].indexOf(authType) !== -1;
  }

  private canViewClientId(authType: string | undefined): boolean {
    if (!authType) return false;
    return ['pdnd', 'https_pdnd', 'sign_pdnd', 'https_pdnd_sign', 'oauth_client_credentials', 'oauth_authorization_code'].indexOf(authType) !== -1;
  }

  private canViewOAuthCode(authType: string | undefined): boolean {
    if (!authType) return false;
    return ['oauth_authorization_code'].indexOf(authType) !== -1;
  }

  private getLabelClientId(authType: string | undefined): string {
    if (!authType) return 'APP.CLIENT.LABEL.ClientId';
    return (['pdnd', 'https_pdnd', 'sign_pdnd', 'https_pdnd_sign'].indexOf(authType) !== -1) ? 'APP.CLIENT.LABEL.ClientIdPDND' : 'APP.CLIENT.LABEL.ClientId';
  }

  private onEnvironmentChange() {
    this.apis = [];
    this.authModes = [];
    this.loadErogazioni();
    this.loadClients();
  }

  onAvatarError(event: any) {
    event.target.src = './assets/images/avatar.png'
  }

  configureAdesione() {
    if (this.config?.useEditWizard) {
      this.router.navigate([`../`], { relativeTo: this.route });
    } else {
      this.router.navigate([`../configurazione`], { relativeTo: this.route });
    }
  }
}
