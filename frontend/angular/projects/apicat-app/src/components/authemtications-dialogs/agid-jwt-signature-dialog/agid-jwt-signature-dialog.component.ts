import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Clipboard } from '@angular/cdk/clipboard';

import { Subject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { AuthenticationService } from '@services/authentication.service';
import { ConfigService } from '@linkit/components';
import { AuthenticationDialogService } from '../services/authentication-dialog.service';

import * as rs from 'jsrsasign';
import { UtilsLib } from 'projects/linkit/components/src/lib/utils/utils.lib';

@Component({
    selector: 'app-agid-jwt-signature-dialog',
    templateUrl: './agid-jwt-signature-dialog.component.html',
    styleUrls: ['./agid-jwt-signature-dialog.component.scss'],
    standalone: false
})
export class AgidJwtSignatureDialogComponent implements OnInit {

    tipoPolicy: string = 'pdnd_integrity';
    title: string = 'APP.AUTHENTICATION.TITLE.GenerateSignature';

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
    _algDefault: string = 'RS256';
    _algOptions: string[] = ['RS256'];
    _audience: string = '';
    _audience_integrity: string = '';
    _editAudienceIntegrity: boolean = true;
    _expiration: number = 5;
    _tokenUrl: string = '';

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
        console.log('AgidJwtSignatureDialogComponent', this.tokenPolicy);
        this._codicePolicy = this.tokenPolicy ? this.tokenPolicy['codice_policy'] : this._codicePolicy;
        this._type = this.tokenPolicy ? this.tokenPolicy['type'] : this._type;
        this._algDefault = this.tokenPolicy ? this.tokenPolicy['alg_default'] : this._algDefault;
        this._algOptions = this.tokenPolicy ? this.tokenPolicy['alg_options'] : this._algOptions;
        this._audience = this.tokenPolicy ? this.tokenPolicy['audience'] : this._audience;
        this._audience_integrity = this.tokenPolicy ? this.tokenPolicy['audience_integrity'] : this._audience_integrity;
        this._editAudienceIntegrity = this._audience_integrity ? false : true;
        this._expiration = this.tokenPolicy ? this.tokenPolicy['expires_in'] : this._expiration;
        this._tokenUrl = this.tokenPolicy ? this.tokenPolicy['token_url'] : this._tokenUrl;

        this.onClose = new Subject();
        this.initForm();
    }

    get f(): { [key: string]: AbstractControl } {
        return this.formGroup.controls;
    }

    initForm() {
        this.formGroup = new FormGroup({
            kid: new FormControl('', [Validators.required]),
            alg: new FormControl(this._algDefault, [Validators.required]),
            typ: new FormControl({ value: this._type, disabled: true }, [Validators.required]),
            clientId: new FormControl('', [Validators.required]),

            audience: new FormControl({ value: this._audience, disabled: false }, [Validators.required]),
            audience_integrity: new FormControl({ value: this._audience_integrity, disabled: false }, [Validators.required]),

            purposeId: new FormControl('', [Validators.required]),
            expiration: new FormControl(this._expiration, []),
            userPayload: new FormControl(null, []),

            key: new FormControl(null, [Validators.required]),
            keyFile: this._keyFileCtrl,
            keyFormat: new FormControl(null, []),

            result: new FormControl(null, []),
            unsignedToken: new FormControl(null, []),
            signedToken: new FormControl(null, []),
            expiresIn: new FormControl(null, []),

            digest: new FormControl(null, [])
        });
    }

    closeModal(data: any = null) {
        this.onClose.next({ close: true, result: { ...data } });
        this.bsModalRef.hide();
    }

    useResultModal() {
        const result = this.formGroup.get('result')?.value;
        // const unsignedToken = this.formGroup.get('unsignedToken')?.value;
        const digest = this.formGroup.get('digest')?.value;
        const signedToken = this.formGroup.get('signedToken')?.value;
        this.closeModal({
            digest: digest,
            signature: signedToken,
            voucher: result
        });
    }

    async generateJWT(values: any) {
        const issued = Math.floor(Date.now() / 1000); // Tempo corrente in secondi
        const delta = this._expiration * 60; // Scadenza in secondi
        const expire_in = issued + delta;
        const jti = this.authenticationDialogService.uuidv4(); // Assicurati di avere una funzione UUIDv4

        // Header per JWT
        const headers_rsa = {
            kid: values.kid,
            alg: values.alg,
            typ: values.typ
        };

        // Payload del JWT
        const payload = {
            // client_id: values.clientId,
            iss: values.clientId,
            sub: values.clientId,
            aud: values.audience,
            purposeId: values.purposeId,
            jti: jti,
            iat: issued,
            exp: expire_in
        };

        const payload_jwt_signature = {
            client_id: values.clientId,
            iss: values.clientId,
            sub: values.clientId,
            aud: values.audience_integrity,
            purposeId: values.purposeId,
            jti: jti,
            iat: issued,
            exp: expire_in,
            signed_headers: [
                { 'digest' : '' },
                { 'content-type' : 'application/json'}
            ]
        };

        const sHeader = JSON.stringify(headers_rsa);
        
        const keyFormat = this.formGroup.get('keyFormat')?.value;

        let rsaKey = null;
        if (keyFormat === 'PEM') {
            try {
                // Prima tenta di interpretare la chiave come PKCS#8
                rsaKey = rs.KEYUTIL.getKey(values.key);
            } catch (e) {
                console.error("Errore durante la lettura della chiave: ", e);
                return;
            }
        } else if (keyFormat === 'DER') {
            try {
                // Se è DER, convertilo in PEM prima di passarlo a KEYUTIL.getKey
                const pemKey = this.authenticationDialogService.buildPEMString(values.key, 'PRIVATE KEY');
                rsaKey = rs.KEYUTIL.getKey(pemKey);
            } catch (e) {
                try {
                    // Se è DER, convertilo in PEM prima di passarlo a KEYUTIL.getKey
                    const pemKey = this.authenticationDialogService.buildPEMString(values.key, 'RSA PRIVATE KEY');
                    rsaKey = rs.KEYUTIL.getKey(pemKey);
                } catch (e1) {
                    this._error = true;
                    this._errorMsg = 'Errore durante la lettura della chiave';
                    console.error("Errore durante la lettura della chiave: ", e1);
                    return;
                }
            }
        } else {
            this._error = true;
            this._errorMsg = 'Formato della chiave non supportato';
        }

        // Calcola l'hash SHA-256 del token firmato
        const sha256Hash = await this.authenticationDialogService.calculateSHA256(values.userPayload, true);

        // imposto l'hash delle info complementari nel campo digest
        const digest = `SHA-256=${sha256Hash}`;
        payload_jwt_signature.signed_headers[0]['digest'] = digest;

        // string del payload
        const sPayload = JSON.stringify(payload);

        let client_assertion = null;
        
        try {
            const sPayload = JSON.stringify(payload);
            
            client_assertion = rs.KJUR.jws.JWS.sign("RS256", sHeader, sPayload, rsaKey as rs.RSAKey);

        } catch (error: any) {
            this._error = true;
            this._errorMsg = error;
            this._errorObject = null;
            client_assertion = null;
        }

        this.formGroup.get('unsignedToken')?.setValue(`${JSON.stringify(headers_rsa, null, 2)}.${JSON.stringify(payload, null, 2)}`);

        const sPayload_jwt_signature = JSON.stringify(payload_jwt_signature);
        const jwt_signature = rs.KJUR.jws.JWS.sign("RS256", sHeader, sPayload_jwt_signature, rsaKey as rs.RSAKey);
    
        this.formGroup.get('digest')?.setValue(digest);
        this.formGroup.get('signedToken')?.setValue(jwt_signature);

        return client_assertion;
    }

    clearError() {
        this._error = false;
        this._errorMsg = '';
        this._errorObject = null;
        this.formGroup.get('result')?.setValue(null);
        this.formGroup.get('expiresIn')?.setValue(null);
        this.formGroup.get('unsignedToken')?.setValue(null);
        this.formGroup.get('signedToken')?.setValue(null);
    }

    async onGenerate(values: any) {
        this.clearError();

        if (this.formGroup.valid) {
            const clientAssertion = await this.generateJWT(values);
            console.log('clientAssertion', clientAssertion);

            if (clientAssertion) {
                this._spin = true;
                const _body = {
                    client_id: values.clientId,
                    client_assertion: clientAssertion,
                    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
                    grant_type: 'client_credentials'
                };

                (await this.getVoucher(_body)).subscribe({
                    next: (response: any) => {
                        const accessToken = response.access_token;
                        const expiresIn = response.expires_in;
                
                        console.log('Voucher ottenuto con successo!');
                        console.log('Access Token:', accessToken);
                        console.log('Expires In:', expiresIn, 'secondi');

                        this.formGroup.get('result')?.setValue(accessToken);
                        this.formGroup.get('expiresIn')?.setValue(expiresIn);
                        this._spin = false;
                    },
                    error: (error: any) => {
                        this._error = true;
                        this._errorObject = error.error;
                        this._errorMsg = error.message;
                        this._spin = false;
                    }
                });
            }
        }
    }

    async getVoucher(body: any) {
        const httpOptions = {
            headers: new HttpHeaders({}),
            params: {}
        };

        let headers = new HttpHeaders()
            .set('Content-Type', 'application/x-www-form-urlencoded');
        httpOptions.headers = headers;

        const params = new HttpParams({
            fromObject: body
        });

        return this.http.post(this._tokenUrl, params, httpOptions);
    }

    async _onKeyChange(file: any) {
        this.clearError();

        let keyContent: any = '';
        try {
            keyContent = await this._readKeyFile(file.target.files[0]);
            this.formGroup.get('key')?.setValue(keyContent);
        } catch (error: any) {
            this._error = true;
            this._errorMsg = error.message || error;
            this._errorObject = null;
            this.formGroup.get('key')?.setValue(null);
        }
    }

    _readKeyFile(file: any) {
        const _this = this;
        if (!file) {
            this.clearError();
            return;
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            let triedAsBinary = false;  // Flag per prevenire il loop

            reader.onload = function(event: any) {
                const fileContent = event.target.result;

                try {
                    // Rileva il formato basato sul contenuto
                    const keyFormat = _this.authenticationDialogService.detectKeyFormat(fileContent);
                    _this.formGroup.get('keyFormat')?.setValue(keyFormat);
                
                    if (keyFormat === 'PEM') {
                        resolve(fileContent); // Se è PEM, restituisci direttamente il contenuto
                    } else if (keyFormat === 'DER') {
                        // Se è DER (binario), converti in PEM
                        const pemContent = _this.authenticationDialogService.convertDERToPEM(fileContent);
                        resolve(pemContent);
                    } else {
                        _this._error = true;
                        _this._errorMsg = "Formato chiave non riconosciuto";
                        _this._errorObject = null;
                        // reject(new Error("Formato chiave non riconosciuto"));
                    }
                } catch (error: any) {
                    // Se c'è un errore, non rileggere come binario più di una volta
                    if (!triedAsBinary) {
                        triedAsBinary = true;  // Imposta il flag per evitare il loop
                        reader.readAsArrayBuffer(file);  // Rileggi come binario (DER)
                    } else {
                        _this._error = true;
                        _this._errorMsg = error.message || error;
                        _this._errorObject = error;
                        // reject(error);  // Se già tentato, interrompi con l'errore
                    }
                }
            };

            reader.onerror = function(event: any) {
                reject(new Error("Errore nella lettura del file: " + event.target.error));
            };

            // Inizialmente, leggiamo come testo. Se non rileviamo PEM, rileggiamo come binario.
            reader.readAsText(file);
        });
    }

    convertSecondsToHours(seconds: number) {
        return this.authenticationDialogService.convertSecondsToHours(seconds); 
    }

    toggleResult() {
        this._showResult = !this._showResult;
    }

    onCopyClipboard() {
        this.clipboard.copy(this.formGroup.get('result')?.value);
        this._showMessageClipboard = true;
        setTimeout(() => {
            this._showMessageClipboard = false;
        }, 3000);
    }
}
