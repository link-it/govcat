import { AllegatoMessaggioCreate } from '@app/model/allegatoMessaggioCreate';

export type TargetComunicazione = 'pubblica' | 'solo_referenti' | 'solo_aderenti';

export class Messaggio {

  oggetto: string = '';
  testo: string = '';
  target?: TargetComunicazione;
  includi_tecnici?: boolean;
  allegati?: Array<AllegatoMessaggioCreate>;

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
