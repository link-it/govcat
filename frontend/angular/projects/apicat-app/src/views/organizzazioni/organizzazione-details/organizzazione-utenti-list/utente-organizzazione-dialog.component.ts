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
import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { NgSelectModule } from '@ng-select/ng-select';

import { LnkButtonComponent } from '@app/components/lnk-ui/button/button.component';

import { Observable, Subject, concat, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

import { ConfigService } from '@linkit/components';

import { OpenAPIService } from '@services/openAPI.service';
import { RuoloOrganizzazioneEnum } from '../../../../model/ruoloOrganizzazioneEnum';
import { RuoloUtenteEnum } from '../../../../model/ruoloUtenteEnum';
import { StatoUtenteEnum } from '../../../../model/statoUtenteEnum';

export type UtenteOrganizzazioneDialogMode = 'add' | 'edit';
export type UtenteOrganizzazioneDialogSubMode = 'search' | 'new';

@Component({
    selector: 'app-utente-organizzazione-dialog',
    templateUrl: './utente-organizzazione-dialog.component.html',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, NgSelectModule, LnkButtonComponent]
})
export class UtenteOrganizzazioneDialogComponent implements OnInit {

    mode: UtenteOrganizzazioneDialogMode = 'add';
    subMode: UtenteOrganizzazioneDialogSubMode = 'search';
    title: string = '';
    /** Solo nel caso `edit`: l'utente gia' associato (read-only). */
    utente: any = null;
    /** Ruolo iniziale nell'organizzazione (badge per-org). */
    ruolo: RuoloOrganizzazioneEnum | null = null;
    /** Id utente selezionato in modalita' add/search. */
    selectedUtenteId: string | null = null;
    /**
     * Id dell'organizzazione corrente (passato dal parent). Usato per
     * pre-popolare il campo organizzazione quando si crea un nuovo
     * utente dalla dialog di associazione.
     */
    presetIdOrganizzazione: string | null = null;
    /**
     * Nome dell'organizzazione corrente. Quando valorizzato, il campo
     * organizzazione nel form "nuovo utente" e' visualizzato come
     * label/input readonly invece del select di ricerca: l'utente non
     * puo' cambiare l'organizzazione di destinazione, che e' fissata
     * dal contesto della pagina chiamante.
     */
    presetNomeOrganizzazione: string | null = null;

    submitting = false;
    errorMessage = '';

    utenti$: Observable<any[]> = of([]);
    utentiInput$ = new Subject<string>();
    utentiLoading = false;

    organizzazioni$: Observable<any[]> = of([]);
    organizzazioniInput$ = new Subject<string>();
    organizzazioniLoading = false;
    /** Pool corrente di organizzazioni mostrate nel select (preset + ricerche). */
    organizzazioniItems: any[] = [];

    /** Form per la creazione di un nuovo utente. */
    newUserForm!: FormGroup;

    /**
     * Payload emesso al chiudersi della dialog:
     * - `id_utente` + `ruolo_organizzazione` per il caller che fara'
     *   la chiamata di associazione (POST /organizzazioni/{id}/utenti);
     * - `alreadyAssociated: true` se la dialog ha gia' creato l'utente
     *   con `organizzazioni` inline (POST /utenti) — il caller deve
     *   solo refreshare la lista, non rifare l'associazione;
     * - `null` su cancel.
     */
    @Output() onClose: EventEmitter<{ id_utente: string; ruolo_organizzazione: RuoloOrganizzazioneEnum | null; alreadyAssociated?: boolean } | null> = new EventEmitter();

    readonly RUOLO_ORG_OPTIONS: { value: RuoloOrganizzazioneEnum | null; labelKey: string }[] = [
        { value: RuoloOrganizzazioneEnum.AmministratoreOrganizzazione, labelKey: 'APP.RUOLI.AmministratoreOrganizzazione' },
        { value: RuoloOrganizzazioneEnum.OperatoreApi, labelKey: 'APP.RUOLI.OperatoreApi' },
        { value: null, labelKey: 'APP.ORGANIZATION_SWITCHER.NoRole' }
    ];

    /**
     * Stesso ordine e stesse chiavi i18n usate dalla form principale
     * `utente-details` (`APP.USERS.ROLES.*`) per coerenza visiva e di
     * traduzione. `null` indica "Nessun ruolo".
     */
    readonly RUOLO_UTENTE_OPTIONS: { value: RuoloUtenteEnum | null; labelKey: string }[] = [
        { value: null, labelKey: 'APP.USERS.ROLES.nessun_ruolo' },
        { value: RuoloUtenteEnum.Gestore, labelKey: 'APP.USERS.ROLES.gestore' },
        { value: RuoloUtenteEnum.UtenteOrganizzazione, labelKey: 'APP.USERS.ROLES.utente_organizzazione' },
        { value: RuoloUtenteEnum.Coordinatore, labelKey: 'APP.USERS.ROLES.coordinatore' }
    ];

    private readonly modalRef = inject(BsModalRef);
    private readonly apiService = inject(OpenAPIService);
    private readonly translate = inject(TranslateService);
    private readonly configService = inject(ConfigService);

    /** Visibilita' del campo email personale (cfr. profilo). */
    get mostraEmail(): boolean {
        return this.configService.getConfiguration()?.AppConfig?.Profile?.showEmail === true;
    }

    /** Visibilita' del campo telefono personale (cfr. profilo). */
    get mostraTelefono(): boolean {
        return this.configService.getConfiguration()?.AppConfig?.Profile?.showPhone === true;
    }

    readonly STATO_OPTIONS: { value: StatoUtenteEnum; labelKey: string }[] = [
        { value: StatoUtenteEnum.Abilitato, labelKey: 'APP.USERS.STATUS.abilitato' },
        { value: StatoUtenteEnum.Disabilitato, labelKey: 'APP.USERS.STATUS.disabilitato' },
        { value: StatoUtenteEnum.NonConfigurato, labelKey: 'APP.USERS.STATUS.non_configurato' }
    ];

    ngOnInit(): void {
        if (this.mode === 'add') {
            this._initUtentiTypeahead();
            this._initNewUserForm();
            this._initOrganizzazioniTypeahead();
        }
    }

    // --- Modalita' add: switch search/new --------------------------------

    switchToNew(): void {
        this.subMode = 'new';
        this.errorMessage = '';
        // La form di creazione utente ha molti campi su 2 colonne:
        // allarghiamo la dialog per evitare che gli input vadano a capo.
        this.modalRef.setClass('modal-lg');
    }

    switchToSearch(): void {
        this.subMode = 'search';
        this.errorMessage = '';
        // Torna alla dimensione standard: la ricerca utente e' compatta.
        this.modalRef.setClass('');
    }

    // --- Submit ----------------------------------------------------------

    canConfirm(): boolean {
        if (this.submitting) { return false; }
        if (this.mode === 'edit') { return true; }
        if (this.subMode === 'search') { return !!this.selectedUtenteId; }
        return this.newUserForm?.valid;
    }

    confirm(): void {
        if (!this.canConfirm()) { return; }
        if (this.mode === 'edit') {
            this._emit(this.utente?.id_utente);
            return;
        }
        if (this.subMode === 'search') {
            this._emit(this.selectedUtenteId!);
            return;
        }
        this._createUser();
    }

    cancel(): void {
        this.onClose.emit(null);
        this.modalRef.hide();
    }

    // --- Form nuovo utente ----------------------------------------------

    private _initNewUserForm(): void {
        this.newUserForm = new FormGroup({
            nome: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(255)]),
            cognome: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(255)]),
            principal: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(255)]),
            email_aziendale: new FormControl<string | null>(null, [Validators.required, Validators.email, Validators.maxLength(255)]),
            telefono_aziendale: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(255)]),
            email: new FormControl<string | null>(null, [Validators.email, Validators.maxLength(255)]),
            telefono: new FormControl<string | null>(null, [Validators.maxLength(255)]),
            ruolo: new FormControl<RuoloUtenteEnum | null>(null),
            stato: new FormControl<StatoUtenteEnum>(StatoUtenteEnum.Abilitato, [Validators.required]),
            note: new FormControl<string | null>(null, [Validators.maxLength(255)]),
            id_organizzazione: new FormControl<string | null>(this.presetIdOrganizzazione, [this._idOrganizzazioneRequiredIfRuolo()]),
            organizzazione_esterna: new FormControl<string | null>(null, [Validators.maxLength(255)])
        });

        // Quando cambia il ruolo, ri-valuta il validator condizionale di id_organizzazione.
        this.newUserForm.get('ruolo')!.valueChanges.subscribe(() => {
            this.newUserForm.get('id_organizzazione')!.updateValueAndValidity();
        });

        if (this.presetIdOrganizzazione) {
            this.organizzazioniItems = [{
                id_organizzazione: this.presetIdOrganizzazione,
                nome: this.translate.instant('APP.UTENTI_ORG.LABEL.CurrentOrganization')
            }];
        }
    }

    /**
     * Validator: `id_organizzazione` e' obbligatorio solo se il ruolo
     * (utente) e' `utente_organizzazione` — stessa logica della form
     * principale `utente-details` (vedi `_changeRuolo`). Per gli altri
     * ruoli (gestore, coordinatore, nessun ruolo) il campo
     * organizzazione e' opzionale.
     */
    private _idOrganizzazioneRequiredIfRuolo() {
        return (control: AbstractControl): ValidationErrors | null => {
            const parent = control.parent;
            if (!parent) { return null; }
            const ruolo = parent.get('ruolo')?.value;
            if (ruolo !== RuoloUtenteEnum.UtenteOrganizzazione) { return null; }
            return control.value ? null : { required: true };
        };
    }

    private _createUser(): void {
        const raw = this.newUserForm.getRawValue();
        const body: any = {
            principal: raw.principal,
            nome: raw.nome,
            cognome: raw.cognome,
            email_aziendale: raw.email_aziendale,
            telefono_aziendale: raw.telefono_aziendale,
            stato: raw.stato || StatoUtenteEnum.Abilitato
        };
        if (raw.email) { body.email = raw.email; }
        if (raw.telefono) { body.telefono = raw.telefono; }
        if (raw.note) { body.note = raw.note; }
        if (raw.ruolo) { body.ruolo = raw.ruolo; }
        if (raw.organizzazione_esterna) { body.organizzazione_esterna = raw.organizzazione_esterna; }
        if (raw.id_organizzazione) {
            body.organizzazioni = [{
                id_organizzazione: raw.id_organizzazione,
                ruolo_organizzazione: this.ruolo
            }];
        }

        this.submitting = true;
        this.errorMessage = '';
        this.apiService.saveElement('utenti', body).subscribe({
            next: (response: any) => {
                this.submitting = false;
                // L'utente e' gia' associato (campo `organizzazioni` nel
                // body), quindi il caller deve solo refreshare la lista.
                const associated = !!body.organizzazioni;
                this._emit(response?.id_utente, associated);
            },
            error: (err: any) => {
                this.submitting = false;
                this.errorMessage = err?.error?.detail
                    ? this.translate.instant(`APP.MESSAGE.ERROR.${err.error.detail}`, err?.error?.errori?.[0]?.params || {})
                    : (err?.message || this.translate.instant('APP.MESSAGE.ERROR.GENERIC'));
            }
        });
    }

    private _emit(idUtente: string | null | undefined, alreadyAssociated = false): void {
        if (!idUtente) { return; }
        this.onClose.emit({
            id_utente: idUtente,
            ruolo_organizzazione: this.ruolo,
            alreadyAssociated
        });
        this.modalRef.hide();
    }

    // --- Typeahead ricerca utenti esistenti -----------------------------

    private _initUtentiTypeahead(): void {
        this.utenti$ = concat(
            of([]),
            this.utentiInput$.pipe(
                debounceTime(300),
                distinctUntilChanged(),
                tap(() => this.utentiLoading = true),
                switchMap(term => term && term.length >= 2
                    ? this.apiService.getList('utenti', { params: { q: term } as any }).pipe(
                        map((res: any) => Array.isArray(res?.content) ? res.content
                            : Array.isArray(res?.items) ? res.items
                            : Array.isArray(res) ? res : []),
                        catchError(() => of([]))
                    )
                    : of([])
                ),
                tap(() => this.utentiLoading = false)
            )
        );
    }

    // --- Typeahead organizzazioni (form nuovo utente) -------------------

    private _initOrganizzazioniTypeahead(): void {
        this.organizzazioni$ = concat(
            of(this.organizzazioniItems),
            this.organizzazioniInput$.pipe(
                debounceTime(300),
                distinctUntilChanged(),
                tap(() => this.organizzazioniLoading = true),
                switchMap(term => term && term.length >= 2
                    ? this.apiService.getList('organizzazioni', { params: { q: term } as any }).pipe(
                        map((res: any) => Array.isArray(res?.content) ? res.content
                            : Array.isArray(res?.items) ? res.items
                            : Array.isArray(res) ? res : []),
                        catchError(() => of([]))
                    )
                    : of(this.organizzazioniItems)
                ),
                tap(() => this.organizzazioniLoading = false)
            )
        );
    }
}
