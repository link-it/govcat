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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormsModule, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Clipboard } from '@angular/cdk/clipboard';

import { Subject } from 'rxjs';

import { NgSelectModule } from '@ng-select/ng-select';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { AuthenticationService } from '@services/authentication.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { COMPONENTS_IMPORTS, ConfigService, Tools } from '@linkit/components';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { MarkAsteriskDirective } from '@app/directives/mark-asterisk/mark-asterisk.directive';
import { UtilsLib } from '@app/lib/utils/utils.lib';
import { AuthenticationDialogService } from '../services/authentication-dialog.service';

import { jwtDecode } from "jwt-decode";
import { DISABLE_GLOBAL_EXCEPTION_HANDLING } from '@app/lib/interceptors/error.interceptor';


@Component({
    selector: 'app-client-credentials-dialog',
    templateUrl: './client-credentials-dialog.component.html',
    styleUrls: ['./client-credentials-dialog.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule, TooltipModule, TranslateModule, ...COMPONENTS_IMPORTS, ...APP_COMPONENTS_IMPORTS, MarkAsteriskDirective]
})
export class ClientCredentialsDialogComponent implements OnInit {

    tipoPolicy: string = 'client_credentials';
    title: string = 'APP.AUTHENTICATION.TITLE.GenerateCredentials';

    tokenPolicy: any = null;
    debug: boolean = false;

    onClose: Subject<any> = new Subject();

    _spin: boolean = false;

    _error: boolean = false;
    _errorObject: any = null;
    _errorMsg: string = '';

    formGroup: FormGroup = new FormGroup({
        clientId: new FormControl(null, [Validators.required]),
        clientSecret: new FormControl(null, [Validators.required]),
        scope: new FormControl('', []),
        result: new FormControl('', []),
        encodedToken: new FormControl('', []),
        decodedToken: new FormControl('', [])
    });

    _showResult: boolean = false;
    _showMessageClipboard: boolean = false;

    _codicePolicy: string = '';
    _type: string = 'JWT';
    _tokenUrl: string = '';
    _scope: string = '';

    _keyFileCtrl: FormControl = new FormControl(null, [Validators.required]);

    /** Lista client OAuth Client Credentials configurati dell'utente.
        Popolata in `ngOnInit` via `GET /client?auth_type=oauth_client_credentials&stato=configurato`. */
    _availableClients: any[] = [];
    /** Id del client selezionato nel dropdown. */
    _selectedClientId: any = null;
    /** Loading: lista client + fetch secret on-demand. */
    _clientsLoading: boolean = false;
    _secretLoading: boolean = false;
    /** Toggle visibilita` del campo secret (mask vs plain). */
    _showSecret: boolean = false;
    /** Feedback transitorio post-copia clipboard (~1.5s). */
    _secretCopied: boolean = false;

    constructor(
        private readonly http: HttpClient,
        private readonly clipboard: Clipboard,
        public bsModalRef: BsModalRef,
        private readonly translate: TranslateService,
        private readonly authenticationService: AuthenticationService,
        private readonly configService: ConfigService,
        public utils: UtilsLib,
        private readonly authenticationDialogService: AuthenticationDialogService,
        private readonly apiService: OpenAPIService
    ) { }

    ngOnInit() {
        this._codicePolicy = this.tokenPolicy ? this.tokenPolicy['codice_policy'] : this._codicePolicy;
        this._type = this.tokenPolicy ? this.tokenPolicy['type'] : this._type;
        this._tokenUrl = this.tokenPolicy ? this.tokenPolicy['token_url'] : this._tokenUrl;
        this._scope = this.tokenPolicy ? this.tokenPolicy['scope'] : this._scope;

        this.onClose = new Subject();
        this.initForm();
        this._loadAvailableClients();
    }

    /** Carica i client OAuth Client Credentials configurati per l'utente
        corrente. Se ne trova esattamente uno lo pre-seleziona e fetcha
        gia` il secret. Su errore lascia la lista vuota: la dialog torna
        al comportamento legacy (input manuali). */
    private _loadAvailableClients(): void {
        this._clientsLoading = true;
        const options = { params: { size: 100, auth_type: 'oauth_client_credentials', stato: 'configurato' } as any };
        this.apiService.getList('client', options).subscribe({
            next: (response: any) => {
                this._availableClients = response?.content || [];
                this._clientsLoading = false;
                if (this._availableClients.length === 1) {
                    const only = this._availableClients[0];
                    this._selectedClientId = only.id_client;
                    this._onSelectClient(only.id_client);
                }
            },
            error: () => {
                this._availableClients = [];
                this._clientsLoading = false;
            }
        });
    }

    /** Selezione di un client dal dropdown: patcha il `clientId`
        del form e fetcha il secret on-demand. Deselezione (null)
        libera entrambi i campi per inserimento manuale. */
    _onSelectClient(idClient: any): void {
        if (idClient === null || idClient === undefined) {
            this._selectedClientId = null;
            this.formGroup.get('clientId')?.setValue(null);
            this.formGroup.get('clientSecret')?.setValue(null);
            this._showSecret = false;
            return;
        }
        const client = this._availableClients.find((c: any) => c.id_client === idClient);
        if (!client) { return; }
        this.formGroup.get('clientId')?.setValue(client.client_id || client.nome || null);
        this.formGroup.get('clientSecret')?.setValue(null);
        this._showSecret = false;
        this._fetchSecret(idClient);
    }

    private _fetchSecret(idClient: any): void {
        if (this._secretLoading) { return; }
        this._secretLoading = true;
        this.apiService.getDetails('client', idClient, 'client-secret').subscribe({
            next: (res: any) => {
                this.formGroup.get('clientSecret')?.setValue(res?.secret ?? null);
                this._secretLoading = false;
            },
            error: (error: any) => {
                this._secretLoading = false;
                Tools.OnError(error, this.translate.instant('APP.CLIENT.MESSAGES.SecretUnavailable'));
            }
        });
    }

    /** Toggle mostra/nasconde secret. Se il valore non e` ancora stato
        fetchato (e c'e` un client selezionato) ri-tenta il fetch. */
    _toggleSecret(): void {
        if (this._secretLoading) { return; }
        const willShow = !this._showSecret;
        if (willShow && !this.formGroup.get('clientSecret')?.value && this._selectedClientId) {
            this._fetchSecret(this._selectedClientId);
        }
        this._showSecret = willShow;
    }

    /** Copia il secret negli appunti con feedback transitorio. */
    _copySecret(): void {
        if (this._secretLoading) { return; }
        const value = this.formGroup.get('clientSecret')?.value;
        if (!value) {
            if (this._selectedClientId) { this._fetchSecret(this._selectedClientId); }
            return;
        }
        try {
            this.clipboard.copy(String(value));
            this._secretCopied = true;
            setTimeout(() => { this._secretCopied = false; }, 1500);
        } catch {
            // Clipboard non disponibile (es. http): silente.
        }
    }

    get f(): { [key: string]: AbstractControl } {
        return this.formGroup.controls;
    }

    initForm() {
        this.formGroup.patchValue({
            scope: this._scope,
        });
    }

    closeModal(data: any = null) {
        this.onClose.next({ close: true, result: { ...data } });
        this.bsModalRef.hide();
    }

    useResultModal() {
        const token = this.formGroup.get('encodedToken')?.value;
        this.closeModal({ token: token });
    }

    clearError() {
        this._error = false;
        this._errorMsg = '';
        this._errorObject = null;
        this.formGroup.get('result')?.setValue(null);
    }

    /** Estrae un messaggio leggibile da un errore HTTP del token endpoint.
     *  Difende dai vari shape: RFC 6749 (`error`/`error_description`),
     *  ProblemDetail (`error.error.message`), status 0 (CSP/rete),
     *  body stringa, oppure errore generico. */
    private _extractTokenErrorMessage(e: any): string {
        // Status 0: response non ricevuta (CSP, CORS, DNS, rete).
        if (e?.status === 0) {
            return this.translate.instant('APP.AUTHENTICATION.MESSAGE.NetworkOrCspError');
        }
        const err = e?.error;
        if (err) {
            if (typeof err === 'string' && err.trim()) { return err; }
            if (typeof err === 'object') {
                if (err.error_description) { return err.error_description; }
                const inner = err.error;
                if (typeof inner === 'string' && inner.trim()) { return inner; }
                if (inner?.message) { return inner.message; }
                if (err.message) { return err.message; }
            }
        }
        if (e?.message) { return e.message; }
        return this.translate.instant('APP.AUTHENTICATION.MESSAGE.TokenGenerationError');
    }

    async onGenerateToken(values: any) {
        this.clearError();

        if (this.formGroup.valid) {
            this._spin = true;

            const _body = { ...values };

            (await this._getToken(_body)).subscribe({
                next: (response: any) => {
                    const token = response.access_token;

                    this.formGroup.get('result')?.setValue(JSON.stringify(response, null, 2));
                    this.formGroup.get('encodedToken')?.setValue(token);

                    let decodedToken = null;
                    try {
                        decodedToken = jwtDecode(token);
                        this.formGroup.get('decodedToken')?.setValue(JSON.stringify(decodedToken, null, 2));
                    } catch {
                        this.formGroup.get('decodedToken')?.setValue('Errore nella decodifica del token.');
                    }

                    this.formGroup.get('encodedToken')?.setValue(response.access_token);
                    this._spin = false;
                },

                error: (e: any) => {
                    this._spin = false;
                    this._error = true;
                    const err = e?.error;
                    const inner = (err && typeof err === 'object') ? err.error : null;
                    this._errorObject = (inner && typeof inner === 'object') ? inner : null;
                    this._errorMsg = this._extractTokenErrorMessage(e);
                }
            });
        }
    }

    async _getToken(body: any) {
        const httpOptions = {
            headers: new HttpHeaders({}),
            params: {},
            context: new HttpContext().set(DISABLE_GLOBAL_EXCEPTION_HANDLING, true)
        };

        let headers = new HttpHeaders()
            .set('Content-Type', 'application/x-www-form-urlencoded');

        httpOptions.headers = headers;

        const params = new HttpParams({
            fromObject: body
        });

        let postData = `grant_type=client_credentials&client_id=${body.clientId}&client_secret=${body.clientSecret}`;
        if (body.scope) {
            postData += `&scope=${encodeURIComponent(body.scope)}`;
        }

        return this.http.post(this._tokenUrl, postData, httpOptions);
    }

    toggleResult() {
        this._showResult = !this._showResult;
    }

    onCopyClipboard() {
        this.clipboard.copy(this.formGroup.get('encodedToken')?.value);
        this._showMessageClipboard = true;
        setTimeout(() => {
            this._showMessageClipboard = false;
        }, 3000);
    }
}
