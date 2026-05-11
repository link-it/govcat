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

    id: string | null = null;
    organizzazione: ItemOrganizzazione | null = null;

    items: any[] = [];
    _paging: Page = new Page({});
    _links: any = {};

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
        this.route.params.subscribe(params => {
            this.id = params['id'] || null;
            if (this.id) {
                this._loadOrganizzazione();
                // Caricamento iniziale diretto: in `ngOnInit` la
                // `@ViewChild('searchBarForm')` non e' ancora risolta,
                // quindi non possiamo passare per `searchBarForm._onSearch()`.
                this._loadUtenti(this._filterData);
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
        this._loadUtenti(this._filterData);
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
        if (this._links?.next && !this._preventMultiCall) {
            this._preventMultiCall = true;
            this._loadUtenti(null, this._links.next.href);
        }
    }

    _onSubmit(): void {
        this.searchBarForm?._onSearch();
    }

    _onSearch(values: any): void {
        this._filterData = this.utils._removeEmpty(values);
        this._loadUtenti(this._filterData);
    }

    _resetForm(): void {
        this._filterData = {};
        this._loadUtenti(this._filterData);
    }

    _onSort(_event: any): void { /* no-op: sort fisso */ }

    // --- Helpers UI -------------------------------------------------------

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

    // --- Azioni CRUD ------------------------------------------------------

    openAdd(): void {
        if (!this.canManage()) { return; }
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
}
