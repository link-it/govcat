
// import { ItemCategoria } from '@app/model/itemCategoria';
// import { DocumentoCreate } from '@app/model/documentoCreate';
import { ReferenteCreate } from '@app/model/referenteCreate';
import { VisibilitaEnum } from '@app/model/visibilitaEnum';

export class AdesioneCreate {
  id_logico: string | null = null;
  referenti: Array<ReferenteCreate> = [];
  
  visibilita: VisibilitaEnum | null = null;

  referente: string = '';
  referente_tecnico: string = '';

  servizio: string | null = null;
  id_servizio: string | null = null;

  soggetto: string | null = null;
  id_soggetto: string | null = null;

  organizzazione: string | null = null;
  id_organizzazione: string | null = null;

  servizio_nome: string | null = null;
  soggetto_nome: string | null = null;

  skip_collaudo: boolean = false;

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
