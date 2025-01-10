import { DatiGenericiServizioUpdate } from '@app/model/datiGenericiServizioUpdate';
import { IdentificativoServizioUpdate } from '@app/model/identificativoServizioUpdate';

export class ServizioUpdate { 
    identificativo?: IdentificativoServizioUpdate;
    dati_generici?: DatiGenericiServizioUpdate;

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

