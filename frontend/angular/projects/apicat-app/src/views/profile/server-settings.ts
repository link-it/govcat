import * as moment from 'moment';

export class ServerSettings {

  enable_notifications: boolean = false;

  emetti_per_tipi: any[] = [];
  emetti_per_tipi_for_all: boolean = true;

  emetti_per_entita: any[] = [];
  emetti_per_entita_for_all: boolean = true;

  emetti_per_ruoli: any[] = [];
  emetti_per_ruoli_for_all: boolean = true;

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
