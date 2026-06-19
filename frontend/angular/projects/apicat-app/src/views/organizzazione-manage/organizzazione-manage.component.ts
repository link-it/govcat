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
import { AfterContentChecked, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { COMPONENTS_IMPORTS, ConfigService, SearchBarFormComponent, Tools, YesnoDialogBsComponent } from '@linkit/components';

import { LnkButtonComponent } from '@app/components/lnk-ui/button/button.component';

import { AuthenticationService } from '@services/authentication.service';
import { OpenAPIService } from '@services/openAPI.service';
import { UtilService } from '@services/utils.service';

import { Page } from '../../models/page';
import { ItemOrganizzazione } from '../../model/itemOrganizzazione';
import { RuoloOrganizzazioneEnum } from '../../model/ruoloOrganizzazioneEnum';
import {
    UtenteOrganizzazioneDialogComponent,
    UtenteOrganizzazioneDialogMode
} from '../organizzazioni/organizzazione-details/organizzazione-utenti-list/utente-organizzazione-dialog.component';

const ORG_MODEL = 'organizzazioni';
const UTENTI_SUB_PATH = 'utenti';
const UTENTI_MODEL = 'utenti';
const DOMINI_MODEL = 'domini';

/**
 * Tab attivo nella pagina di gestione organizzazione. La pagina espone
 * due aree CRUD (vedi tabs nell'HTML): `'utenti'` per la gestione
 * delle associazioni utente-organizzazione, `'domini'` per la
 * gestione dei domini il cui soggetto referente appartiene
 * all'organizzazione di sessione (Issue 229 multi-org, evolutiva
 * domini-AMM_ORG).
 */
export type OrganizzazioneManageTab = 'utenti' | 'domini' | 'utenti_pending';

@Component({
    selector: 'app-organizzazione-manage',
    templateUrl: './organizzazione-manage.component.html',
    styleUrls: ['./organizzazione-manage.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        TranslateModule,
        TooltipModule,
        ...COMPONENTS_IMPORTS,
        LnkButtonComponent
    ]
})
export class OrganizzazioneManageComponent implements OnInit, AfterContentChecked {
    static readonly Name = 'OrganizzazioneManageComponent';
    readonly model: string = 'organizzazioni';

    @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

    config: any;
    /** Config caricato da `assets/config/utenti-organizzazione-config.json`, passato a `<ui-item-row>`. */
    utentiConfig: any = null;
    /** Config caricato da `assets/config/utenti-config.json`, riusato per
     *  la tab "Utenti da gestire" — mostra cognome/nome + chip status
     *  (`pending_update`, `non_configurato`, ...) come nella dashboard. */
    utentiPendingConfig: any = null;
    /** Config caricato da `assets/config/domini-config.json`, passato a `<ui-item-row>`. */
    dominiConfig: any = null;

    id: string | null = null;
    organizzazione: ItemOrganizzazione | null = null;

    /** Tab attiva: utenti o domini. Quando l'utente passa da una
     *  tab all'altra carichiamo (se non gia` fatto) la lista
     *  corrispondente. */
    _activeTab: OrganizzazioneManageTab = 'utenti';

    // --- Stato lista utenti ----------------------------------------------
    items: any[] = [];
    _paging: Page = new Page({});
    _links: any = {};

    // --- Stato lista domini (Issue 229 evolutiva multi-org/domini) -------
    dominiItems: any[] = [];
    _dominiPaging: Page = new Page({});
    _dominiLinks: any = {};

    // --- Stato lista utenti in attesa di approvazione --------------------
    // Membership evolutiva 2026-06-11: nuovo tab `utenti_pending` che
    // mostra le richieste `pending_update` per questa organizzazione.
    // Visibilita` decisa da `_pendingPaging.totalElements > 0` (count
    // utenti pending PER QUESTA ORG, popolato all'init via
    // `_loadPendingCount` con `size=1`).
    pendingItems: any[] = [];
    _pendingPaging: Page = new Page({});
    _pendingLinks: any = {};

    _hasFilter: boolean = true;
    _formGroup: FormGroup = new FormGroup({});
    _filterData: any = {};

    _preventMultiCall: boolean = false;
    _spin: boolean = true;
    desktop: boolean = false;

    _message: string = 'APP.MESSAGE.NoResults';
    _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';

    _error: boolean = false;

    showHistory: boolean = false;
    showSearch: boolean = true;
    showSorting: boolean = false;

    sortField: string = 'cognome';
    sortDirection: string = 'asc';
    sortFields: any[] = [];

    searchFields: any[] = [
        { field: 'q', label: 'APP.LABEL.FreeSearch', type: 'string', condition: 'like' }
    ];
    useCondition: boolean = false;

    breadcrumbs: any[] = [];

    _useNewSearchUI: boolean = true;

    private _modalRef: BsModalRef | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly translate: TranslateService,
        private readonly configService: ConfigService,
        private readonly modalService: BsModalService,
        public tools: Tools,
        public apiService: OpenAPIService,
        private readonly authenticationService: AuthenticationService,
        private readonly utils: UtilService
    ) {
        this.config = this.configService.getConfiguration();
        this._initSearchForm();
    }

    @HostListener('window:resize') _onResize() {
        this.desktop = (window.innerWidth >= 992);
    }

    ngOnInit(): void {
        this.configService.getConfig('utenti-organizzazione').subscribe((cfg: any) => {
            this.utentiConfig = cfg;
        });
        this.configService.getConfig('utenti').subscribe((cfg: any) => {
            this.utentiPendingConfig = cfg;
        });
        this.configService.getConfig('domini').subscribe((cfg: any) => {
            this.dominiConfig = cfg;
        });
        // Issue 229 evolutiva multi-org/domini — pre-selezione tab
        // via query param `?tab=domini`. Usato quando l'utente
        // torna dal dettaglio dominio (via breadcrumb, cancel o
        // delete) per ripristinare il contesto della navigazione.
        this.route.queryParams.subscribe(qp => {
            const tab = qp?.['tab'];
            if (tab === 'domini' || tab === 'utenti' || tab === 'utenti_pending') {
                this._activeTab = tab as OrganizzazioneManageTab;
            }
        });
        this.route.params.subscribe(params => {
            this.id = params['id'] || null;
            if (this.id) {
                this._loadOrganizzazione();
                // Counter di tutte le tab sempre visibili all'init:
                // precarichiamo le liste delle tab NON attive cosi`
                // ogni `*_paging.totalElements` e` popolato anche
                // quando la tab non e` ancora stata attivata. La
                // tab attiva viene caricata da `_loadActiveTab`
                // sotto, evitando una doppia chiamata.
                if (this._activeTab !== 'utenti') { this._loadUtenti(); }
                if (this._activeTab !== 'domini') { this._loadDomini(); }
                if (this._activeTab !== 'utenti_pending') { this._loadPending(); }
                // Caricamento iniziale diretto: in `ngOnInit` la
                // `@ViewChild('searchBarForm')` non e' ancora risolta,
                // quindi non possiamo passare per `searchBarForm._onSearch()`.
                this._loadActiveTab();
            }
        });
    }

    ngAfterContentChecked(): void {
        this.desktop = (window.innerWidth >= 992);
    }

    // --- Permessi ---------------------------------------------------------

    canManage(): boolean {
        if (!this.id) { return false; }
        return this.authenticationService.isGestore()
            || this.authenticationService.isCoordinatore()
            || this.authenticationService.isAmministratoreOrganizzazione(this.id);
    }

    // --- Caricamento dati -------------------------------------------------

    private _initSearchForm(): void {
        this._formGroup = new FormGroup({
            q: new FormControl('')
        });
    }

    private _loadOrganizzazione(): void {
        if (!this.id) { return; }
        this.apiService.getDetails(ORG_MODEL, this.id).subscribe({
            next: (response: any) => {
                this.organizzazione = response;
                this._initBreadcrumb();
            },
            error: (err: any) => {
                this._error = true;
                this._message = this.utils.GetErrorMsg(err);
            }
        });
    }

    private _initBreadcrumb(): void {
        const _title = this.organizzazione?.nome || this.id || '';
        // Breadcrumb minimo: la rotta e' top-level e l'utente potrebbe non
        // avere accesso all'area gestori `/organizzazioni`, quindi non
        // mostriamo link a quel ramo.
        this.breadcrumbs = [
            { label: 'APP.ORGANIZATION_MANAGE.Title', url: '', type: 'title', iconBs: 'buildings' },
            { label: _title, url: '', type: 'title' }
        ];
    }

    onBreadcrumb(event: any): void {
        if (event?.url) { this.router.navigate([event.url]); }
    }

    refresh(): void {
        this._loadActiveTab();
    }

    // --- Tabs -------------------------------------------------------------

    /**
     * Imposta la tab attiva e ricarica la lista corrispondente
     * dall'inizio. Le ricerche libere sono shared (campo `q`):
     * passando da utenti a domini la stessa stringa filtra entrambe
     * le viste sul rispettivo endpoint.
     */
    setActiveTab(tab: OrganizzazioneManageTab): void {
        if (this._activeTab === tab) { return; }
        this._activeTab = tab;
        this._loadActiveTab();
    }

    private _loadActiveTab(): void {
        if (this._activeTab === 'domini') {
            this._loadDomini(this._filterData);
        } else if (this._activeTab === 'utenti_pending') {
            this._loadPending(this._filterData);
        } else {
            this._loadUtenti(this._filterData);
        }
    }

    private _setErrorMessages(error: boolean): void {
        this._error = error;
        if (error) {
            this._message = 'APP.MESSAGE.ERROR.Default';
            this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
        } else {
            this._message = 'APP.MESSAGE.NoResults';
            this._messageHelp = 'APP.MESSAGE.NoResultsHelp';
        }
    }

    private _loadUtenti(query: any = null, url: string = ''): void {
        if (!this.id) { return; }
        this._spin = true;
        this._setErrorMessages(false);

        let aux: any = undefined;
        if (!url) {
            this.items = [];
            this._links = null;
            aux = { params: this.utils._queryToHttpParams(query || {}) };
        }

        const path = `${ORG_MODEL}/${this.id}/${UTENTI_SUB_PATH}`;
        this.apiService.getList(path, aux, url).subscribe({
            next: (response: any) => {
                if (response) {
                    this._paging = new Page(response.page);
                    this._links = response._links || null;
                }
                const list = Array.isArray(response?.content) ? response.content
                    : Array.isArray(response?.items) ? response.items
                    : Array.isArray(response) ? response : [];
                const mapped = list.map((u: any) => this._mapItem(u));
                this.items = url ? [...this.items, ...mapped] : mapped;
                this._preventMultiCall = false;
                this._spin = false;
            },
            error: (err: any) => {
                this._setErrorMessages(true);
                this._preventMultiCall = false;
                this._spin = false;
                Tools.OnError(err);
            }
        });
    }

    /**
     * Carica la lista dei domini visibili per l'organizzazione di
     * sessione. Il BE filtra automaticamente in base al header
     * `X-Organization-Context` (impostato globalmente
     * dall'`OrganizationContextInterceptor`): non passiamo
     * `id_organizzazione` come query param. Issue 229 multi-org,
     * evolutiva domini-AMM_ORG.
     */
    private _loadDomini(query: any = null, url: string = ''): void {
        if (!this.id) { return; }
        this._spin = true;
        this._setErrorMessages(false);

        let aux: any = undefined;
        if (!url) {
            this.dominiItems = [];
            this._dominiLinks = null;
            aux = { params: this.utils._queryToHttpParams(query || {}) };
        }

        this.apiService.getList(DOMINI_MODEL, aux, url).subscribe({
            next: (response: any) => {
                if (response) {
                    this._dominiPaging = new Page(response.page);
                    this._dominiLinks = response._links || null;
                }
                const list = Array.isArray(response?.content) ? response.content
                    : Array.isArray(response?.items) ? response.items
                    : Array.isArray(response) ? response : [];
                this.dominiItems = url ? [...this.dominiItems, ...list] : list;
                this._preventMultiCall = false;
                this._spin = false;
            },
            error: (err: any) => {
                this._setErrorMessages(true);
                this._preventMultiCall = false;
                this._spin = false;
                Tools.OnError(err);
            }
        });
    }

    /**
     * Carica la lista degli "Utenti da gestire" per l'organizzazione
     * corrente. Riusa lo stesso endpoint usato dalla dashboard
     * (`GET /utenti?dashboard=true`): il filtro lato BE include
     * automaticamente gli utenti in stato `pending_update` ed
     * eventuali altri che richiedono azione dell'amministratore.
     * Il filtro utente (se valorizzato) viene unito ai parametri.
     */
    private _loadPending(query: any = null, url: string = ''): void {
        if (!this.id) { return; }
        this._spin = true;
        this._setErrorMessages(false);

        let aux: any = undefined;
        if (!url) {
            this.pendingItems = [];
            this._pendingLinks = null;
            // `dashboard=true` e` il discriminante BE per ottenere
            // gli utenti "da gestire" (mirror di
            // `DashboardService.getUtenti()`). Filtri utente
            // applicati per primi, `dashboard` non sovrascrivibile.
            const params: any = {
                ...(query || {}),
                dashboard: 'true'
            };
            aux = { params: this.utils._queryToHttpParams(params) };
        }

        this.apiService.getList(UTENTI_MODEL, aux, url).subscribe({
            next: (response: any) => {
                if (response) {
                    this._pendingPaging = new Page(response.page);
                    this._pendingLinks = response._links || null;
                }
                const list = Array.isArray(response?.content) ? response.content
                    : Array.isArray(response?.items) ? response.items
                    : Array.isArray(response) ? response : [];
                this.pendingItems = url ? [...this.pendingItems, ...list] : list;
                // Il tab "Utenti da gestire" e` visibile solo con
                // `pendingItems.length > 0`: se siamo arrivati con
                // `?tab=utenti_pending` (es. dashboard AMM_ORG) ma
                // la lista e` vuota, ricadiamo sul tab di default
                // `utenti` per evitare un body orfano senza tab.
                if (this._activeTab === 'utenti_pending' && this.pendingItems.length === 0) {
                    this._activeTab = 'utenti';
                }
                this._preventMultiCall = false;
                this._spin = false;
            },
            error: (err: any) => {
                this._setErrorMessages(true);
                this._preventMultiCall = false;
                this._spin = false;
                Tools.OnError(err);
            }
        });
    }

    /** Estrae i campi anagrafici dal payload relazionale e calcola il ruolo. */
    private _mapItem(raw: any): any {
        const utente = raw?.utente ?? raw;
        const ruolo = raw?.ruolo_organizzazione ?? utente?.ruolo_organizzazione ?? null;
        return {
            id_utente: utente?.id_utente,
            nome: utente?.nome,
            cognome: utente?.cognome,
            email_aziendale: utente?.email_aziendale,
            ruolo_organizzazione: ruolo
        };
    }

    __loadMoreData(): void {
        if (this._preventMultiCall) { return; }
        if (this._activeTab === 'domini') {
            if (this._dominiLinks?.next) {
                this._preventMultiCall = true;
                this._loadDomini(null, this._dominiLinks.next.href);
            }
            return;
        }
        if (this._activeTab === 'utenti_pending') {
            if (this._pendingLinks?.next) {
                this._preventMultiCall = true;
                this._loadPending(null, this._pendingLinks.next.href);
            }
            return;
        }
        if (this._links?.next) {
            this._preventMultiCall = true;
            this._loadUtenti(null, this._links.next.href);
        }
    }

    _onSubmit(): void {
        this.searchBarForm?._onSearch();
    }

    _onSearch(values: any): void {
        this._filterData = this.utils._removeEmpty(values);
        this._loadActiveTab();
    }

    _resetForm(): void {
        this._filterData = {};
        this._loadActiveTab();
    }

    _onSort(_event: any): void { /* no-op: sort fisso */ }

    // --- Helpers UI -------------------------------------------------------

    /** Totale records della tab attiva (per badge tab/counter). */
    get _activeTotal(): number {
        if (this._activeTab === 'domini') {
            return this._dominiPaging.totalElements || 0;
        }
        if (this._activeTab === 'utenti_pending') {
            return this._pendingPaging.totalElements || 0;
        }
        return this._paging.totalElements || 0;
    }

    /** Counter pending per il badge tab "Utenti in attesa". */
    get _pendingTotal(): number {
        return this._pendingPaging.totalElements || 0;
    }

    roleLabelKey(uo: any): string {
        switch (uo?.ruolo_organizzazione) {
            case RuoloOrganizzazioneEnum.AmministratoreOrganizzazione:
                return 'APP.RUOLI.AmministratoreOrganizzazione';
            case RuoloOrganizzazioneEnum.OperatoreApi:
                return 'APP.RUOLI.OperatoreApi';
            default:
                return 'APP.ORGANIZATION_SWITCHER.NoRole';
        }
    }

    // --- Azioni CRUD utenti -----------------------------------------------

    openAdd(): void {
        if (!this.canManage()) { return; }
        if (this._activeTab === 'domini') {
            this.openAddDominio();
            return;
        }
        this._openDialog('add', null);
    }

    openEdit(uo: any): void {
        if (!this.canManage() || !uo) { return; }
        this._openDialog('edit', uo);
    }

    confirmRemove(uo: any): void {
        if (!this.canManage() || !uo?.id_utente) { return; }
        const initialState = {
            title: this.translate.instant('APP.TITLE.Attention'),
            messages: [
                this.translate.instant('APP.UTENTI_ORG.MESSAGE.RemoveConfirm', {
                    nome: `${uo.nome || ''} ${uo.cognome || ''}`.trim()
                })
            ],
            cancelText: this.translate.instant('APP.BUTTON.Cancel'),
            confirmText: this.translate.instant('APP.BUTTON.Confirm'),
            confirmColor: 'danger'
        };
        this._modalRef = this.modalService.show(YesnoDialogBsComponent, {
            ignoreBackdropClick: true,
            initialState
        });
        this._modalRef.content.onClose.subscribe((response: boolean) => {
            if (!response) { return; }
            this._remove(uo.id_utente);
        });
    }

    private _openDialog(mode: UtenteOrganizzazioneDialogMode, uo: any | null): void {
        const initialState = {
            mode,
            title: mode === 'add' ? 'APP.UTENTI_ORG.TITLE.Add' : 'APP.UTENTI_ORG.TITLE.Edit',
            utente: uo,
            ruolo: (uo?.ruolo_organizzazione ?? null) as RuoloOrganizzazioneEnum | null,
            presetIdOrganizzazione: this.id,
            presetNomeOrganizzazione: this.organizzazione?.nome ?? null
        };
        this._modalRef = this.modalService.show(UtenteOrganizzazioneDialogComponent, {
            ignoreBackdropClick: true,
            initialState
        });
        this._modalRef.content.onClose.subscribe((payload: { id_utente: string; ruolo_organizzazione: RuoloOrganizzazioneEnum | null; alreadyAssociated?: boolean } | null) => {
            if (!payload) { return; }
            if (mode === 'add') {
                if (payload.alreadyAssociated) {
                    this.refresh();
                } else {
                    this._add(payload.id_utente, payload.ruolo_organizzazione);
                }
            } else {
                this._update(payload.id_utente, payload.ruolo_organizzazione);
            }
        });
    }

    private _add(idUtente: string, ruolo: RuoloOrganizzazioneEnum | null): void {
        if (!this.id) { return; }
        const body: any = { id_utente: idUtente };
        if (ruolo !== undefined) { body.ruolo_organizzazione = ruolo; }
        this.apiService.postElementRelated(ORG_MODEL, this.id, UTENTI_SUB_PATH, body).subscribe({
            next: () => this.refresh(),
            error: (err: any) => Tools.OnError(err)
        });
    }

    private _update(idUtente: string, ruolo: RuoloOrganizzazioneEnum | null): void {
        if (!this.id) { return; }
        this.apiService.putElementRelated(ORG_MODEL, this.id, `${UTENTI_SUB_PATH}/${idUtente}`, { ruolo_organizzazione: ruolo }).subscribe({
            next: () => this.refresh(),
            error: (err: any) => Tools.OnError(err)
        });
    }

    private _remove(idUtente: string): void {
        if (!this.id) { return; }
        this.apiService.deleteElementRelated(ORG_MODEL, this.id, `${UTENTI_SUB_PATH}/${idUtente}`).subscribe({
            next: () => this.refresh(),
            error: (err: any) => Tools.OnError(err)
        });
    }

    // --- Azioni CRUD domini -----------------------------------------------

    /**
     * Issue 229 evolutiva multi-org/domini — naviga alla pagina di
     * creazione dominio sotto la route `organizzazione-manage/:id/
     * domini/new` per preservare il contesto (breadcrumb + back
     * verso la tab Domini). Il form `dominio-details` si occupa
     * di validazione e POST. AMM_ORG: il typeahead del soggetto
     * referente e` gia` filtrato sull'org di sessione (vedi
     * `dominio-details.component.ts::getSoggetti`).
     */
    openAddDominio(): void {
        if (!this.canManage() || !this.id) { return; }
        this.router.navigate(['organizzazione-manage', this.id, 'domini', 'new']);
    }

    /** Naviga al dettaglio/edit del dominio nel contesto della
     *  gestione organizzazione (`organizzazione-manage/:id/
     *  domini/:idDominio`). Il breadcrumb riporta correttamente
     *  alla lista dell'organizzazione. */
    openEditDominio(dominio: any): void {
        if (!this.canManage() || !this.id || !dominio?.id_dominio) { return; }
        this.router.navigate(['organizzazione-manage', this.id, 'domini', dominio.id_dominio]);
    }

    /** Naviga al dettaglio dell'utente in attesa di approvazione nel
     *  contesto della gestione organizzazione
     *  (`organizzazione-manage/:id/utenti/:uid`). Sostituisce la
     *  vecchia dialog di solo cambio ruolo: la form completa di
     *  `<utente-details>` gestisce sia approvazione/rifiuto sia
     *  modifica del ruolo. Al ritorno il breadcrumb riporta alla
     *  lista pending. */
    openUserDetail(item: any): void {
        if (!this.canManage() || !this.id || !item?.id_utente) { return; }
        this.router.navigate(['organizzazione-manage', this.id, 'utenti', item.id_utente], {
            queryParams: { tab: this._activeTab }
        });
    }

    /** Conferma + DELETE /domini/{id}. Errori BE (es.
     *  `AUT.403.AMM.ORG.DOMINIO.FUORI.ORG`) sono gestiti via
     *  `Tools.OnError` -> `GetErrorMsg` con traduzione i18n. */
    confirmRemoveDominio(dominio: any): void {
        if (!this.canManage() || !dominio?.id_dominio) { return; }
        const initialState = {
            title: this.translate.instant('APP.TITLE.Attention'),
            messages: [
                this.translate.instant('APP.DOMINI.MESSAGE.RemoveConfirm', {
                    nome: dominio.nome || dominio.id_dominio
                })
            ],
            cancelText: this.translate.instant('APP.BUTTON.Cancel'),
            confirmText: this.translate.instant('APP.BUTTON.Confirm'),
            confirmColor: 'danger'
        };
        this._modalRef = this.modalService.show(YesnoDialogBsComponent, {
            ignoreBackdropClick: true,
            initialState
        });
        this._modalRef.content.onClose.subscribe((response: boolean) => {
            if (!response) { return; }
            this._removeDominio(dominio.id_dominio);
        });
    }

    private _removeDominio(idDominio: string): void {
        this.apiService.deleteElement(DOMINI_MODEL, idDominio).subscribe({
            next: () => this.refresh(),
            error: (err: any) => Tools.OnError(err)
        });
    }
}
