export class Page {

  readonly classname?: string = 'PageClass';

  first: string = '';
  last: string = '';
  limit: number = 25;
  offset: number = 0;
  next: string = '';
  prev: string = '';
  total: number = 0;

  number?: number = 0;
  size?: number = 0;
  totalElements?: number = 0;
  totalPages?: number = 0;

  constructor(_data?: any) {
    if (_data) {
      for (const key in _data) {
        if (this.hasOwnProperty(key)) {
          if (_data[key] !== null && _data[key] !== undefined) {
            (this as any)[key] = _data[key];
          }
        }
      }
    }
  }

}
