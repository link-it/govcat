import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Clipboard } from '@angular/cdk/clipboard';

import { Subject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { AuthenticationService } from '@services/authentication.service';
import { ConfigService } from 'projects/tools/src/lib/config.service';
import { UtilsLib } from 'projects/components/src/lib/utils/utils.lib';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { AuthenticationDialogService } from '../services/authentication-dialog.service';

import { jwtDecode } from "jwt-decode";

@Component({
selector: 'app-code-grant-dialog',
templateUrl: './code-grant-dialog.component.html',
styleUrls: ['./code-grant-dialog.component.scss']
})
export class CodeGrantDialogComponent implements OnInit {

    tipoPolicy: string = 'code_grant';
    title: string = 'APP.AUTHENTICATION.TITLE.GenerateCodeGrant';

    tokenPolicy: any = null;
    debug: boolean = false;

    onClose!: Subject<any>;

    _spin: boolean = false;
    
    _error: boolean = false;
    _errorObject: any = null;
    _errorMsg: string = '';
    
    formGroup: FormGroup = new FormGroup({});

    _showResult: boolean = false;
    _showMessageClipboard: boolean = false;

    _codicePolicy: string = '';
    _scope: string = '';
    _redirectUri: string = '';
    _authUrl: string = '';
    _tokenUrl: string = '';
    
    broadcastChannel = new BroadcastChannel('CODE-GRANT-AUTHORIZATION');

    authWindow: any = null;

    constructor(
        private http: HttpClient,
        private clipboard: Clipboard,
        private bsModalRef: BsModalRef,
        private translate: TranslateService,
        private authenticationService: AuthenticationService,
        private configService: ConfigService,
        private utils: UtilsLib,
        private authenticationDialogService: AuthenticationDialogService
    ) { }

    ngOnInit() {
        console.log('CodeGrantDialogComponent');

        const _configGenerale = Tools.Configurazione.generale;
        console.log('_configGenerale', _configGenerale);
        const codeGrantOptions = this.configService.getAppConfig()['AUTH_SETTINGS']['TOKEN_POLICIES'][this.tipoPolicy];

        this._codicePolicy = this.tokenPolicy ? this.tokenPolicy['codice_policy'] : this._codicePolicy;

        this._scope = this.tokenPolicy ? this.tokenPolicy['scope'] : this._scope;
        const _siteBase = _configGenerale ? _configGenerale.site : this._redirectUri;
        const _appRedirectUri = codeGrantOptions ? codeGrantOptions['redirect_uri'] : this._redirectUri;
        this._redirectUri = `${_siteBase}${_appRedirectUri}`;
        console.log('this._redirectUri', this._redirectUri);
        this._authUrl = this.tokenPolicy ? this.tokenPolicy['auth_url'] : this._authUrl;
        this._tokenUrl = this.tokenPolicy ? this.tokenPolicy['token_url'] : this._tokenUrl;

        this.onClose = new Subject();
        this.initForm();

        // Listen authentication value
        this.broadcastChannel.onmessage = (event) => {
            if (event.data) {
                this.authWindow.close();
                this.scambiaToken(this.formGroup.getRawValue(), event.data);
            }
        }
    }

    ngOnDestroy(): void {
        this.broadcastChannel.close()
    }

    get f(): { [key: string]: AbstractControl } {
        return this.formGroup.controls;
    }

    initForm() {
        this.formGroup = new FormGroup({
            clientId: new FormControl('', [Validators.required]),
            clientSecret: new FormControl('', [Validators.required]),
            redirectUri: new FormControl(this._redirectUri, [Validators.required]),
            authorizationUrl: new FormControl(this._authUrl, [Validators.required]),
            tokenUrl: new FormControl(this._tokenUrl, [Validators.required]),
            scope: new FormControl(this._scope, []),
            authLocation: new FormControl(null, []),

            result: new FormControl(null, []),
            authCode: new FormControl(null, []),
            accessToken: new FormControl(null, []),
            decodedToken: new FormControl(null, []),
        });
    }

    closeModal(data: any = null) {
        this.onClose.next({ close: true, result: { ...data } });
        this.bsModalRef.hide();
    }

    useResultModal() {
        const token = this.formGroup.get('accessToken')?.value;
        this.closeModal({ token: token });
    }

    clearError() {
        this._error = false;
        this._errorMsg = '';
        this._errorObject = null;
        this.formGroup.get('result')?.setValue(null);
        this.formGroup.get('expiresIn')?.setValue(null);
    }

    async onStartAuth(values: any) {
        this.clearError();

        if (this.formGroup.valid) {
            const clientId = values.clientId;
            const redirectUri = values.redirectUri;
            const authorizationUrl = values.authorizationUrl;
            let scope = values.scope;

            // Sostituisci le virgole con spazi nel campo scope
            scope = scope.replace(/,/g, ' ');

            // Costruzione dell'URL di autorizzazione con corretta codifica dello scope
            const authUrl = `${authorizationUrl}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

            // Apri una nuova finestra per l'URL di autorizzazione
            this.authWindow = window.open(authUrl, '_blank', 'width=600,height=700');

            this._spin = true;
            const $this = this;
            const checkWindowClosed = setInterval(function () {
                if ($this.authWindow.closed) {
                    clearInterval(checkWindowClosed);
                    $this._spin = false;
                }
            }, 1000);
        }
    }

    async scambiaToken(values: any, params: any = null) {
        const clientId = values.clientId;
        const clientSecret = values.clientSecret;
        const tokenUrl = values.tokenUrl;
        const redirectUri = values.redirectUri;

        // Params -> Recuperato dall'URL della finestra di autenticazione
        const authCode = params.code || null;
        if (authCode) {
            this.formGroup.get('authCode')?.setValue(authCode);
        }

        // Codifica Base64 di clientId:clientSecret
        const credentials = btoa(`${clientId}:${clientSecret}`);

        const postData = {
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: redirectUri
        };

        const headers = new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
        });

        const httpParams = new HttpParams({
            fromObject: postData
        });

        try {
            const response: any = await this.http.post(tokenUrl, httpParams, { headers: headers }).toPromise();
            const accessToken = response.access_token;
            const decodedToken = jwtDecode(accessToken);
            const expiresIn = decodedToken['exp'];

            this.formGroup.get('result')?.setValue(accessToken);
            this.formGroup.get('accessToken')?.setValue(accessToken);
            this.formGroup.get('decodedToken')?.setValue(JSON.stringify(decodedToken, null, 2));
            this.formGroup.get('expiresIn')?.setValue(expiresIn);

        } catch (error: any) {
            this._error = true;
            this._errorObject = typeof error.error === 'object' ? error.error : null;
            this._errorMsg = this._errorObject ? (this._errorObject.error_description || this._errorObject.message) : 'Errore generazione token';
            console.error(error);
            console.error("Errore durante il recupero del token con Code Grant.");
        }
    }

    toggleResult() {
        this._showResult = !this._showResult;
    }
}
