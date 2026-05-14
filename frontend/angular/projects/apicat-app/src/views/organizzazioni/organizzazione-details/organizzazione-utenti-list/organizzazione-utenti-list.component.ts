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
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { YesnoDialogBsComponent } from '@linkit/components';

import { LnkButtonComponent } from '@app/components/lnk-ui/button/button.component';

import { AuthenticationService } from '@services/authentication.service';
import { OpenAPIService } from '@services/openAPI.service';
import { UtilService } from '@services/utils.service';
import { RuoloOrganizzazioneEnum } from '../../../../model/ruoloOrganizzazioneEnum';
import { UtenteOrganizzazioneDialogComponent, UtenteOrganizzazioneDialogMode } from './utente-organizzazione-dialog.component';

const ORG_MODEL = 'organizzazioni';
const UTENTI_SUB_PATH = 'utenti';

@Component({
    selector: 'app-organizzazione-utenti-list',
    templateUrl: './organizzazione-utenti-list.component.html',
    styleUrls: ['./organizzazione-utenti-list.component.scss'],
    standalone: true,
    imports: [CommonModule, TranslateModule, TooltipModule, LnkButtonComponent]
})
export class OrganizzazioneUtentiListComponent implements OnChanges {

    @Input() idOrganizzazione: string | null = null;
    @Input() nomeOrganizzazione: string | null = null;
    @Input() flagAderente: boolean = false;

    items: any[] = [];
    loading = false;
    loadingMore = false;
    error = '';

    private _links: any = null;

    private readonly apiService = inject(OpenAPIService);
    private readonly authenticationService = inject(AuthenticationService);
    private readonly modalService = inject(BsModalService);
    private readonly translate = inject(TranslateService);
    private readonly utils = inject(UtilService);

    private _modalRef: BsModalRef | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.idOrganizzazione) { this.reload(); }
    }

    /**
     * Vero se l'utente loggato puo' gestire la lista (aggiungere,
     * modificare il ruolo, rimuovere). I gestori e i coordinatori
     * passano sempre; gli amministratori organizzazione solo per
     * l'organizzazione corrente.
     */
    canManage(): boolean {
        if (!this.idOrganizzazione) { return false; }
        return this.authenticationService.isGestore()
            || this.authenticationService.isCoordinatore()
            || this.authenticationService.isAmministratoreOrganizzazione(this.idOrganizzazione);
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

    hasMore(): boolean {
        return !!this._links?.next?.href;
    }

    reload(): void {
        if (!this.idOrganizzazione) {
            this.items = [];
            this._links = null;
            return;
        }
        this._load();
    }

    loadMore(): void {
        if (!this.hasMore() || this.loadingMore) { return; }
        this._load(this._links.next.href);
    }

    private _load(url: string = ''): void {
        if (!this.idOrganizzazione) { return; }
        const isInitial = !url;
        if (isInitial) {
            this.loading = true;
            // NON azzeriamo `items` qui per evitare flickering: la
            // tabella resta visibile durante il refresh e viene
            // sostituita atomicamente alla risposta.
            this._links = null;
        } else {
            this.loadingMore = true;
        }
        this.error = '';

        const path = `${ORG_MODEL}/${this.idOrganizzazione}/${UTENTI_SUB_PATH}`;
        this.apiService.getList(path, undefined, url).subscribe({
            next: (response: any) => {
                const list = this._extractList(response);
                const mapped = list.map(u => this._mapUtente(u));
                this.items = isInitial ? mapped : [...this.items, ...mapped];
                this._links = response?._links || null;
                this.loading = false;
                this.loadingMore = false;
            },
            error: (err: any) => {
                this.error = this.utils.GetErrorMsg(err);
                this.loading = false;
                this.loadingMore = false;
            }
        });
    }

    private _extractList(response: any): any[] {
        if (Array.isArray(response?.content)) { return response.content; }
        if (Array.isArray(response?.items)) { return response.items; }
        if (Array.isArray(response)) { return response; }
        return [];
    }

    /**
     * Normalizza l'item della lista. L'endpoint relazionale
     * `GET /organizzazioni/{id}/utenti` ritorna oggetti
     * `{ utente: {...}, ruolo_organizzazione }`. Per robustezza
     * gestisce anche payload "piatti" (utente esposto direttamente)
     * e il fallback su `utente.organizzazioni[]` quando il ruolo
     * non e' presente al primo livello.
     */
    private _mapUtente(item: any): any {
        const utente = item?.utente ?? item;
        let ruolo: any = item?.ruolo_organizzazione ?? utente?.ruolo_organizzazione ?? null;
        if (ruolo === null && Array.isArray(utente?.organizzazioni)) {
            const match = utente.organizzazioni.find((o: any) => o?.organizzazione?.id_organizzazione === this.idOrganizzazione);
            ruolo = match?.ruolo_organizzazione ?? null;
        }
        return {
            id_utente: utente?.id_utente,
            nome: utente?.nome,
            cognome: utente?.cognome,
            email_aziendale: utente?.email_aziendale,
            ruolo_organizzazione: ruolo
        };
    }

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
            presetIdOrganizzazione: this.idOrganizzazione,
            presetNomeOrganizzazione: this.nomeOrganizzazione
        };
        this._modalRef = this.modalService.show(UtenteOrganizzazioneDialogComponent, {
            ignoreBackdropClick: true,
            initialState
        });
        this._modalRef.content.onClose.subscribe((payload: { id_utente: string; ruolo_organizzazione: RuoloOrganizzazioneEnum | null; alreadyAssociated?: boolean } | null) => {
            if (!payload) { return; }
            if (mode === 'add') {
                if (payload.alreadyAssociated) {
                    // Utente creato con `organizzazioni` inline: gia' associato.
                    this.reload();
                } else {
                    this._add(payload.id_utente, payload.ruolo_organizzazione);
                }
            } else {
                this._update(payload.id_utente, payload.ruolo_organizzazione);
            }
        });
    }

    private _add(idUtente: string, ruolo: RuoloOrganizzazioneEnum | null): void {
        if (!this.idOrganizzazione) { return; }
        const body: any = { id_utente: idUtente };
        if (ruolo !== undefined) { body.ruolo_organizzazione = ruolo; }
        this.apiService.postElementRelated(ORG_MODEL, this.idOrganizzazione, UTENTI_SUB_PATH, body).subscribe({
            next: () => this.reload(),
            error: (err: any) => this.error = this.utils.GetErrorMsg(err)
        });
    }

    private _update(idUtente: string, ruolo: RuoloOrganizzazioneEnum | null): void {
        if (!this.idOrganizzazione) { return; }
        const body: any = { ruolo_organizzazione: ruolo };
        this.apiService.putElementRelated(ORG_MODEL, this.idOrganizzazione, `${UTENTI_SUB_PATH}/${idUtente}`, body).subscribe({
            next: () => this.reload(),
            error: (err: any) => this.error = this.utils.GetErrorMsg(err)
        });
    }

    private _remove(idUtente: string): void {
        if (!this.idOrganizzazione) { return; }
        this.apiService.deleteElementRelated(ORG_MODEL, this.idOrganizzazione, `${UTENTI_SUB_PATH}/${idUtente}`).subscribe({
            next: () => this.reload(),
            error: (err: any) => this.error = this.utils.GetErrorMsg(err)
        });
    }
}
