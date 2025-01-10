import { AllegatoMessaggioCreate } from '@app/model/allegatoMessaggioCreate';

export class Messaggio {

  oggetto: string = '';
  testo: string = '';
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
