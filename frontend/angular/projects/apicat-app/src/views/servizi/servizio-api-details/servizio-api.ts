import { Allegato } from '@app/model/allegato';
import { APIErogazione } from '@app/model/aPIErogazione';
import { ProtocolloEnum } from '@app/model/protocolloEnum';
import { RuoloAPIEnum } from '@app/model/ruoloAPIEnum';
import { Documento } from '@app/model/documento';

import * as moment from 'moment';

export class ServizioApi {

  id_api: number | null = null;
  nome: string | null = null;
  versione: number | null = null;
  descrizione: RuoloAPIEnum | null = null;
  ruolo: string | null = '';
  codice_asset: string | null = null;
  protocollo: ProtocolloEnum | null = null;
  protocollo_dettaglio: string | null = null;
  profilo: any = null;
  allegati?: Array<Allegato>;
  specifica?: Documento;
  dati_erogazione?: APIErogazione;

  nome_gateway: string | null = null;
  gruppo_gateway: string | null = null;

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
