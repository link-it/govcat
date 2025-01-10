import { APIErogazione } from '@app/model/aPIErogazione';
import { DocumentoCreate } from '@app/model/documentoCreate';
import { ProtocolloEnum } from '@app/model/protocolloEnum';
import { RuoloAPIEnum } from '@app/model/ruoloAPIEnum';

export class ServizioApiCreate {

    id_api: string | null = null;
    nome: string | null = null;
    versione: number | null = null;
    id_servizio: string | null = null;
    ruolo: RuoloAPIEnum | null = null;
    protocollo: ProtocolloEnum | null = null;
    specifica?: DocumentoCreate;
    dati_erogazione?: APIErogazione;
    descrizione: string | null = null;
    codice_asset: string | null = null;

    filename: string | null = null;
    estensione: string | null = null;
    content: string | null = null;
    uuid: string | null = null;

    url_produzione: string | null = null;
    url_collaudo: string | null = null;

    proprieta_custom: any[] | null = null;

    nome_gateway: string | null = null;
    versione_gateway: string | null = null;

    constructor(_data?: any) {
        if (_data) {
            for (const key in _data) {
                if (this.hasOwnProperty(key)) {
                    if (_data[key] !== null && _data[key] !== undefined) {
                        switch (key) {
                            default:
                                (this as any)[key] = _data[key];
                        }
                    }
                }
            }
        }
    }
}
