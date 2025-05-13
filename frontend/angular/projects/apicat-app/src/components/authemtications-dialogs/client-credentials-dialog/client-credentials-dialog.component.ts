import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Clipboard } from '@angular/cdk/clipboard';

import { Subject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { AuthenticationService } from '@services/authentication.service';
import { ConfigService } from '@linkit/components';
import { UtilsLib } from 'projects/linkit/components/src/lib/utils/utils.lib';
import { AuthenticationDialogService } from '../services/authentication-dialog.service';

import { jwtDecode } from "jwt-decode";
import { DISABLE_GLOBAL_EXCEPTION_HANDLING } from 'projects/linkit/components/src/lib/interceptors/error.interceptor';


@Component({
    selector: 'app-client-credentials-dialog',
    templateUrl: './client-credentials-dialog.component.html',
    styleUrls: ['./client-credentials-dialog.component.scss'],
    standalone: false

})
export class ClientCredentialsDialogComponent implements OnInit {

    tipoPolicy: string = 'client_credentials';
    title: string = 'APP.AUTHENTICATION.TITLE.GenerateCredentials';

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
    _type: string = 'JWT';
    _tokenUrl: string = '';
    _scope: string = '';

    _keyFileCtrl: FormControl = new FormControl(null, [Validators.required]);
    
    constructor(
        private http: HttpClient,
        private clipboard: Clipboard,
        public bsModalRef: BsModalRef,
        private translate: TranslateService,
        private authenticationService: AuthenticationService,
        private configService: ConfigService,
        public utils: UtilsLib,
        private authenticationDialogService: AuthenticationDialogService
    ) { }

    ngOnInit() {
        console.log('ClientCredentialsDialogComponent', this.tokenPolicy);
        this._codicePolicy = this.tokenPolicy ? this.tokenPolicy['codice_policy'] : this._codicePolicy;
        this._type = this.tokenPolicy ? this.tokenPolicy['type'] : this._type;
        this._tokenUrl = this.tokenPolicy ? this.tokenPolicy['token_url'] : this._tokenUrl;
        this._scope = this.tokenPolicy ? this.tokenPolicy['scope'] : this._scope;
        
        this.onClose = new Subject();
        this.initForm();
    }

    get f(): { [key: string]: AbstractControl } {
        return this.formGroup.controls;
    }

    initForm() {
        console.log('ClientCredentialsDialogComponent.initForm');
        this.formGroup = new FormGroup({
            clientId: new FormControl(null, [Validators.required]),
            clientSecret: new FormControl(null, [Validators.required]),
            scope: new FormControl(this._scope, []),
            result: new FormControl('', []),
            encodedToken: new FormControl('', []),
            decodedToken: new FormControl('', [])
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
                    } catch (error) {
                        this.formGroup.get('decodedToken')?.setValue('Errore nella decodifica del token.');
                    }

                    this.formGroup.get('encodedToken')?.setValue(response.access_token);
                    this._spin = false;
                },

                error: (e: any) => {
                    this._error = true;
                    this._errorObject = typeof e.error.error === 'object' ? e.error.error : null;
                    this._errorMsg = e.error.error_description || e.error.error.message || 'Errore generazione token';
                    this._spin = false;
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
