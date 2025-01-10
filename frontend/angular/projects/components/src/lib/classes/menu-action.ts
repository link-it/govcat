export class MenuAction {

  title: string = '';
  subTitle: string = '';
  action: string = '';
  url: string = '';
  type: string = '';
  image: string = '';
  icon: string = '';
  micon: string = '';
  iconUrl: string = '';
  bgColor: string = '';
  color: string = '';
  enabled: boolean = true;
  checked: boolean = false;

  submenus: MenuAction[] = [];

  constructor (_data?: any) {
    if (_data) {
      for (const key in _data) {
        if(this.hasOwnProperty(key)) {
          if(_data[key] !== null && _data[key] !== undefined) {
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
