import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

export enum SpecificoPerEnum {
    Adesione = 'adesione',
    Api = 'api',
    ApiSoggettoDominio = 'api_soggetto_dominio',
    ApiSoggettoAderente = 'api_soggetto_aderente'
}

@Component({
    selector: 'app-api-custom-properties',
    templateUrl: './api-custom-properties.component.html',
    styleUrls: ['./api-custom-properties.component.scss']
})
export class ApiCustomPropertiesComponent implements OnInit {

    @Input() ambiente: string | null = null;
    @Input() id_adesione: string | null = null;
    @Input() stato_adesione: string = '';
    @Input() id_servizio: string | null = null;
    @Input() data: any[] | null = null;
    @Input() group: any = null;
    @Input() showGroupLabel: boolean = true;
    @Input() editable: boolean = true;

    @Input() containerClass: string = '';

    @Output() onSave = new EventEmitter<any>();

    public loading: boolean = false;
    public loadingApi: boolean = false;
    public serviceApi: any[] = [];
    public currentApi: any = null;

    public _message: string = 'APP.MESSAGE.SelectApi';
    public _messageHelp: string = 'APP.MESSAGE.SelectApiHelp';

    public forAllApi: boolean = false;

    public apiConfig: any;

    constructor(
        private configService: ConfigService,
        private apiService: OpenAPIService,
        private utils: UtilService
    ) { }

    ngOnInit() {
        this.forAllApi = this.group.specifico_per === SpecificoPerEnum.Adesione;

        this.configService.getConfig('api').subscribe(
            (config: any) => {
                this.apiConfig = config;
                if (!this.forAllApi) { this._loadServiceApi(); }
            }
        );
    }

    _onSaveCustomProperty(event: any) {
        this.onSave.emit(event);
    }

    _loadServiceApi() {
        if (this.id_servizio) {
        this.serviceApi = [];

        let aux: any;
        let _query: any = { id_servizio: this.id_servizio, sort: `id,asc` };
        switch (this.group.specifico_per) {
            case SpecificoPerEnum.Api:
                break;
            case SpecificoPerEnum.ApiSoggettoDominio:
                _query.ruolo = 'erogato_soggetto_dominio';
                break;
            case SpecificoPerEnum.ApiSoggettoAderente:
                _query.ruolo = 'erogato_soggetto_aderente';
                break;
            default:
                break;
        }
        if (_query) aux = { params: this.utils._queryToHttpParams(_query) };
    
        this.loadingApi = true;
        this.apiService.getList('api', aux).subscribe({
            next: (response: any) => {
                if (response && response.content) {
                    const _list: any = response.content.map((api: any) => {
                        const element = {
                            id: api.id_api,
                            nome: api.nome,
                            versione: api.versione,
                            editMode: false,
                            source: { ...api }
                        };
                        return element;
                    });
                    this.serviceApi = [ ..._list ];
                    // this.serviceApi = [ ...response.content ];
                    if (this.serviceApi.length === 1) {
                        this.currentApi = this.serviceApi[0].source;
                    }
                }
                this.loadingApi = false;
            },
            error: (error: any) => {
                this.loadingApi = false;
            }
        });
        }
    }

    _selectApi(item: any) {
        this.currentApi = null;
        // this.loading = true;
        setTimeout(() => {
            this.currentApi = item;
            this.loading = false;
        }, 100);
    }

    _isHiddenSideList() {
        return this.forAllApi || (this.serviceApi.length === 1);
    }
}
