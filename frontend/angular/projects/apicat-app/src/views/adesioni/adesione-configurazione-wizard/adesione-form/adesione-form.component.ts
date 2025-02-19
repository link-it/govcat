import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { Tools } from 'projects/tools/src/lib/tools.service';
import { OpenAPIService } from '@services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { Grant } from '@app/model/grant';

import { map, of, tap } from 'rxjs';

import { AdesioneUpdate, Servizio } from '../../adesione-details/adesioneUpdate';
import { Soggetto } from '../../adesione-details/adesioneUpdate';

import { Utente } from '@app/model/utente';
import { Profilo } from '@app/model/profilo';
import { RuoloUtenteEnum } from '@app/model/ruoloUtenteEnum';

@Component({
    selector: 'app-adesione-form',
    templateUrl: './adesione-form.component.html',
    styleUrls: ['./adesione-form.component.scss']
})
export class AdesioneFormComponent implements OnInit {

    @Input() id: number = 0;
    @Input() adesione: any = null;
    @Input() servizio: any = null;
    @Input() config: any = null;
    @Input() grant: Grant | null = null;
    @Input() singleColumn: boolean = false;
    @Input() editable: boolean = false;
    
    model: string = 'adesioni';
    dataModel: any = null;

    isBozza: boolean = false;

    formGroup: FormGroup = new FormGroup({});
    
    isEdit: boolean = false;

    error: boolean = false;
    errorMsg: string = '';
    errors: any[] = [];
    
    saving: boolean = false;

    isWeb: boolean = false;

    debugMandatoryFields: boolean = false;

    limit: number = 500;

    initDataService: any = null;
    initDataOrganizzazione: any = null;
    initDataSoggetto: any = null;

    selectedOrganizzazione: any;

    disabled_id_soggetto: any = null;
    hideSoggettoDropdown: boolean = true;
    hideSoggettoInfo: boolean = true;
    elencoSoggetti: any[] = [];

    isDominioEsterno: boolean = false;
    idDominioEsterno: string | null = null;
    idSoggettoDominioEsterno: string | null = null;

    scelta_libera_organizzazione: boolean = false;

    generalConfig: any = Tools.Configurazione;

    profilo: Profilo | null = null;
    orgAppartenenzaUtente: any = null;
    id_servizio: any = null;

    updateMapper: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private fb: FormBuilder,
        private translate: TranslateService,
        private apiService: OpenAPIService,
        private authenticationService: AuthenticationService,
        private utils: UtilService
    ) { }

    ngOnInit() {
        this.scelta_libera_organizzazione = this.generalConfig.adesione.scelta_libera_organizzazione;

        this.loadProfilo();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.adesione) {
            this.dataModel = changes.adesione.currentValue;
            this.initForm();
            this.initDataForm(this.adesione);
        }
        if (changes.editable) {
            this.editable = changes.editable.currentValue;
            this.isEdit = false;
        }
    }

    loadProfilo() {
        this.profilo = this.authenticationService.getCurrentSession();
        const _ruolo: string | null = this.profilo?.utente.ruolo || null;
    
        if (this.scelta_libera_organizzazione) {
            // this._initOrganizzazioniSelect([]);
        } else {
            if (_ruolo === 'gestore' || !this.profilo?.utente.organizzazione) {
                // this._initOrganizzazioniSelect([]);
            } else {
                this.loadOrganizzazione(this.profilo?.utente.organizzazione.id_organizzazione);
            }
        }
    }

    _getSoggetti() {
        const id_organizzazione: any = this.formGroup.get('id_organizzazione')?.value;
        let options: any = { id_organizzazione: id_organizzazione, 'aderente': true };
        return this.apiService.getData('soggetti', options, this.limit, 'nome');
    }

    loadSoggetti() {
        this._getSoggetti().subscribe({
            next: (result: any) => {
                this.elencoSoggetti = [...result];

                if (result.length == 1) {
                    this.hideSoggettoDropdown = true;
                    this.hideSoggettoInfo = true;
                } else {
                    this.hideSoggettoDropdown = false;
                    this.hideSoggettoInfo = false;
                    this.elencoSoggetti = [...result];
                    this.formGroup.controls.id_soggetto.patchValue(this.adesione.soggetto.id_soggetto)
                    this.formGroup.controls.id_soggetto.updateValueAndValidity()
                    this.formGroup.updateValueAndValidity();
                }
                },
            error: (error: any) => {
                Tools.OnError(error);
            }
        });
    }

    get f(): { [key: string]: AbstractControl } {
        return this.formGroup.controls;
    }

    fieldIsDisabled(field: string) {
        this.formGroup.controls[field];
        return this.editable && !this.isEdit;
    }

    initForm() {
        this.formGroup = this.fb.group({
            id_adesione: ['', [Validators.required]],
            id_servizio: ['', [Validators.required]],
            id_soggetto: ['', [Validators.required]],
            id_organizzazione: ['', [Validators.required]],
            stato: ['', []],
            data_creazione: ['', []],
            data_ultimo_aggiornamento: ['', []],
            utente_richiedente: ['', []],
            utente_ultimo_aggiornamento: ['', []],
            skip_collaudo: [false, []],
            id_logico: ['', []],
            referente: [{ value: '', disabled: true}, []],
            soggetto_nome: ['', []],
        });
    }

    initDataForm(dataModel: any) {
        if (dataModel) {
            this.formGroup.patchValue({
                id_adesione: dataModel?.id_adesione,
                id_servizio: dataModel?.servizio?.id_servizio,
                id_soggetto: dataModel?.soggetto?.id_soggetto,
                id_organizzazione: dataModel?.soggetto?.organizzazione?.id_organizzazione,
                stato: dataModel?.stato,
                data_creazione: dataModel?.data_creazione,
                data_ultimo_aggiornamento: dataModel?.data_ultimo_aggiornamento,
                skip_collaudo: dataModel?.skip_collaudo,
                referente: dataModel?.referente,
                soggetto_nome: dataModel?.soggetto?.nome
            });
        }

        this.initDataService = dataModel?.servizio !== null ? { label: `${dataModel.servizio.nome} v.${dataModel.servizio.versione}`, value: dataModel.servizio.id_servizio, item: dataModel.servizio } : null;
        this.initDataOrganizzazione = dataModel?.soggetto !== null ? { label: dataModel.soggetto.organizzazione.nome, value: dataModel.soggetto.organizzazione.id_organizzazione, item: dataModel.soggetto.organizzazione } : null;
        this.initDataSoggetto = dataModel?.soggetto !== null ? { label: dataModel.soggetto.nome, value: dataModel.soggetto.id_soggetto, item: dataModel.soggetto } : null;

        if (this.initDataOrganizzazione) { this.formGroup.get('id_organizzazione')?.disable(); }
        this.formGroup.get('soggetto_nome')?.disable();
        this.formGroup.get('id_organizzazione')?.updateValueAndValidity();
        this.formGroup.get('soggetto_nome')?.updateValueAndValidity();

        this.onChangeServizio(this.initDataService);

        // console.group('initDataForm');
        // console.log('dataModel', dataModel);
        // console.log('formGroup', this.formGroup);
        // console.log('initDataService', this.initDataService);
        // console.log('initDataOrganizzazione', this.initDataOrganizzazione);
        // console.log('initDataSoggetto', this.initDataSoggetto);
        // console.groupEnd();

        this.loadSoggetti();
    }

    showMandatoryFields() {
        if (this.debugMandatoryFields) {
            this.utils._showMandatoryFields(this.formGroup);
        }
    }

    _prepareBodyUpdateAdesione(body: any) {
        const _newBody: any = {
            identificativo: {
                id_logico: body.id_logico || null,
                id_soggetto: body.id_soggetto || this.disabled_id_soggetto,
                id_servizio: body.id_servizio || null,
                skip_collaudo: body.skip_collaudo || false
            }
        };
    
        if(this.id_servizio){
            _newBody.identificativo.id_servizio = this.servizio.id_servizio
        }
    
        _newBody.identificativo = this.utils._removeEmpty(_newBody.identificativo);
        return _newBody;
    }

    _onUpdate(id: string, body: any) {
        this.error = false;
        
        const _body = this._prepareBodyUpdateAdesione(body);
        console.log('_onUpdate', _body)
    
        this.saving = true;
        if (_body) {
            this.apiService.putElement(this.model, id, _body).subscribe({
                next: (response: any) => {
                    this.isEdit = false;
                    this.adesione = response;
                    // this.adesione = new Adesione({ ...response });
                    this.id = this.adesione.id_adesione;
                    this.saving = false;
                },
                error: (error: any) => {
                    this.error = true;
                    this.errorMsg = Tools.GetErrorMsg(error);
                    this.saving = false;
                }
            });
        } else {
            console.log('No difference');
        }
    }
    
    onSubmit(form: any, close: boolean = true) {
        if (this.isEdit && this.formGroup.valid) {
            this._onUpdate(this.adesione.id_adesione, form);
        }
    }

    onEdit(event: any) {
        this.initDataForm(this.adesione);

        this.isBozza = (this.adesione.stato === 'bozza');

        this.error = false;
        this.errorMsg = '';
        this.isEdit = true;
    }

    onCancelEdit() {
        this.error = false;
        this.errorMsg = '';
        this.isEdit = false;

        this.adesione = { ...this.dataModel };
        this.initDataForm(this.adesione);
    }

    canDownloadSchedaAdesioneMapper = (): boolean => {
        return this.authenticationService.canDownloadSchedaAdesione(this.adesione?.stato);
    }
    
    canEditMapper = (): boolean => {
        return this.authenticationService.canEdit('adesione', 'adesione', this.adesione?.stato, this.grant?.ruoli);
    }

    getSearchServizi() {
        return this.searchServizi.bind(this)
    }

    private searchServizi(term: string) {
        // if (!term) {
        //     return of([]);
        // }
        return this.apiService.getData('servizi', { q: term }, this.limit, 'nome').pipe(
            map((response: any) => response.map(
                (item: any) => (item.id_servizio) ? ({
                    label: `${item.nome} v.${item.versione}`,
                    value: item.id_servizio,
                    item: item
                }) : null
            ).filter((item: any) => item !== null))
        );
    }

    getSearchOrganizzazioni() {
        return this.searchOrganizzazioni.bind(this)
    }

    private searchOrganizzazioni(term: string) {
        // if (!term) {
        //     return of([]);
        // }
        const options: any = { q: term, 'soggetto_aderente' : true };
        return this.apiService.getData('organizzazioni', options, this.limit, 'nome').pipe(
            // tap((response: any) => console.log('ORGANIZZAZIONI: ', response)),
            map((response: any) => response.map(
                (item: any) => (item.id_organizzazione) ? ({
                    label: `${item.nome}`,
                    value: item.id_organizzazione,
                    item: item
                }) : null
            ).filter((item: any) => item !== null))
        );
    }

    getSearchSoggetti() {
        return this.searchSoggetti.bind(this)
    }

    private searchSoggetti(term: string) {
        const elencoSoggetti: any = this.elencoSoggetti.map((item: any) => {
                return {
                    label: `${item.nome}`,
                    value: item.id_soggetto,
                    item: item
                }
            });
        return of([ ...elencoSoggetti ]);
    }

    onChangeIdLogico(event: any) {
        this.showMandatoryFields();
    }

    onChangeSoggetto(event: any) {
        console.log('onChangeSoggetto', event)
    }

    async onChangeServizio(event?: any) {
        this.servizio = event.item;
        this.isDominioEsterno = this.servizio?.dominio?.soggetto_referente?.organizzazione?.esterna || false;
        this.idDominioEsterno = this.servizio?.dominio?.soggetto_referente?.organizzazione?.id_organizzazione || null;
        this.idSoggettoDominioEsterno = this.servizio?.dominio?.soggetto_referente?.id_soggetto || null;
    
        // console.group('_onChangeServizio');
        // console.log('servizio', this.servizio);
        // console.log('isDominioEsterno', this.isDominioEsterno);
        // console.log('idDominioEsterno', this.idDominioEsterno);
        // console.log('idSoggettoDominioEsterno', this.idSoggettoDominioEsterno);
        // console.log('profilo', this.profilo);
        // console.groupEnd();
    
        this.updateIdLogico();
        
        if (this.isDominioEsterno) {
            const _organizzazione = this.servizio.soggetto_interno?.organizzazione;
            this.idDominioEsterno = _organizzazione?.id_organizzazione || null;
            this.idSoggettoDominioEsterno = this.servizio.soggetto_interno?.id_soggetto || null;
            // this._initOrganizzazioniSelect([_organizzazione]);
            this.initDataOrganizzazione = _organizzazione ? { label: _organizzazione.nome, value: _organizzazione.id_organizzazione, item: _organizzazione } : null;
            this.formGroup.get('id_organizzazione')?.setValue(this.idDominioEsterno);
            this.formGroup.get('id_organizzazione')?.disable();
            this.formGroup.get('id_soggetto')?.setValue(this.idSoggettoDominioEsterno);
            this.formGroup.get('id_soggetto')?.disable();
            this.hideSoggettoDropdown = true;
        } else {
            if (this.profilo?.utente.ruolo === RuoloUtenteEnum.ReferenteServizio){
                if (this.servizio && await this.isCurrentUserReferenteServizio(this.servizio)){
                    this.formGroup.get('id_organizzazione')?.enable();
                    this.formGroup.get('id_organizzazione')?.reset();
                    // this.ngSelectOrganizazione?.handleClearClick();
                } else {
                    if (this.profilo.utente.organizzazione) {
                        this.loadOrganizzazione(this.profilo.utente.organizzazione.id_organizzazione);
                    }
                }
            }
        }
    
        this.showMandatoryFields();
    }

    loadOrganizzazione(id: string) {
        const _options: any = { params: { id_organizzazione: `${id}` } };
        this.apiService.getList('soggetti', _options).subscribe({
            next: (response: any) => {
                this.orgAppartenenzaUtente = response.content[0];
                const aux: any = {
                    id_organizzazione: this.orgAppartenenzaUtente.organizzazione.id_organizzazione,
                    nome: this.orgAppartenenzaUtente.organizzazione.nome,
                }
        
                // this.ngSelectOrganizazione?.handleClearClick();
                this.formGroup.get('id_organizzazione')?.disable();
                // this.initOrganizzazioniSelect([aux]);
                this.initDataOrganizzazione = this.orgAppartenenzaUtente ? { label: this.orgAppartenenzaUtente.nome, value: this.orgAppartenenzaUtente.id_organizzazione, item: this.orgAppartenenzaUtente } : null;

                setTimeout(() => {
                    this.formGroup.patchValue({id_organizzazione: this.orgAppartenenzaUtente.organizzazione.id_organizzazione});
                    this.checkSoggetto(this.orgAppartenenzaUtente);
                }, 10);
            },
            error: (error: any) => {
                Tools.OnError(error);
            }
        });
    }

    checkSoggetto(event: any) {
        if (event) {
            this.selectedOrganizzazione = event.item;
            this._getSoggetti().subscribe({
                next: (result: any) => {
                    const controls = this.formGroup.controls;
                    if (result.length === 1) {
                        this.hideSoggettoDropdown = true;

                        let aux: Soggetto = {
                            aderente: result[0].aderente,
                            id_soggetto: result[0].id_soggetto,
                            nome: result[0].nome,
                            organizzazione: result[0].organizzazione,
                            referente: result[0].referente,
                        }
                        // this._initSoggettiSelect([aux]);
                        controls.id_soggetto.patchValue(aux.id_soggetto);
                        controls.soggetto_nome.patchValue(aux.nome);
                        controls.id_soggetto.disable();
                        controls.referente.enable();
                        this.disabled_id_soggetto = aux.id_soggetto;
                    } else {

                        this.elencoSoggetti = [...result];

                        if (this.selectedOrganizzazione?.soggetto_default) {
                            controls.id_soggetto.patchValue(this.selectedOrganizzazione?.soggetto_default.id_soggetto);
                            controls.soggetto_nome.patchValue(this.selectedOrganizzazione?.soggetto_default.nome);
                            controls.id_soggetto.updateValueAndValidity();
                            controls.soggetto_nome.updateValueAndValidity();
                        }
                        controls.referente.enable();
                        controls.id_soggetto.enable();
                        controls.referente.updateValueAndValidity();
                        controls.id_soggetto.updateValueAndValidity();
                        this.disabled_id_soggetto = null;
                        this.hideSoggettoDropdown = true;
                    }

                    // this._initReferentiSelect([]);
                    controls.referente.patchValue(null);

                    this.formGroup.updateValueAndValidity();
                    this.showMandatoryFields();
                },
                error: (error: any) => {
                    console.log(error);
                }
            });
        
        } else {

            this.formGroup.controls.id_soggetto.setValue(this.idSoggettoDominioEsterno);
            this.formGroup.controls.referente.patchValue(null);
            // this._initSoggettiSelect([]);
            // this._initReferentiSelect([]);
            this.formGroup.updateValueAndValidity();

            this.elencoSoggetti = [];
            this.hideSoggettoDropdown = true;
        }
    }

    updateIdLogico() {
        if (this.servizio) {
            if (this.servizio.multi_adesione) {
                this.formGroup.get('id_logico')?.setValidators([Validators.required]);
            } else {
                this.formGroup.get('id_logico')?.clearValidators();
            }
            this.formGroup.get('id_logico')?.updateValueAndValidity();
        }
    }

    private async isCurrentUserReferenteServizio(servizio: Servizio){
        const referenti = await this.getReferentiServizio(servizio);
        return referenti.some(referente => referente.utente.id_utente === this.profilo?.utente.id_utente);
    }

    private async getReferentiServizio(servizio: Servizio):Promise<{utente: Utente, tipo: string}[]>{
        const result = await this.apiService.getList(`servizi/${servizio.id_servizio}/referenti`, {params: {tipo_referente: 'referente'}}).toPromise()
        return result.content;
    }

}
