export class Language {

  language: string = 'Italiano';
  alpha2Code: string = 'it';
  alpha3Code: string = 'ita';
  defaultLanguage: boolean = false;

  constructor (_data?: any) {

    if (_data) {
      for (const key in _data) {
        if(this.hasOwnProperty(key)) {
          if(_data[key] !== null && _data[key] !== undefined) {
            switch (key) {
              case 'alpha2Code':
                this[key] = _data[key].toLowerCase();
              break;
              case 'alpha3Code':
                this[key] = _data[key].substring(0,3).toLowerCase();
              break;
              default:
                (this as any)[key] = _data[key];
            }
          }
        }
      }
    }
  }
}
