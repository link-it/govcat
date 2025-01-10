export enum EditColor {
  Primary = 'primary',
  Accent = 'accent',
  Warn = 'warn'
}

export enum FieldType {
  Text = 'text',
  Image = 'image',
  Link = 'link',
  Email = 'email',
  Route = 'route'
}

export interface IBlock {
  primaryText: string;
  secondaryText: string;
}

export class FragmentClass {
  label: string = '';
  fragment: string = '#';

  constructor(json: any = {}) {
    if (json) {
      this.label = json.label || '';
      if (json.fragment.indexOf('#') === 0) {
        this.fragment = json.fragment || '#';
      } else {
        throw new Error('Fragment URL missing.');
      }
    }
  }
}

export class ExtendedFabClass {
  label: string = '';
  icon: string = '';

  constructor(json: any = {}) {
    if (json) {
      this.label = json.label || '';
      this.icon = json.icon || '';
    }
  }
}

export class FieldClass {
  type: FieldType = FieldType.Text;
  label: string = '';
  value: string = '';
  link: string = '';
  data: string = '';
  icon: string = '';
  download: boolean = false;
  json: any = {};

  constructor(data: any = {}) {
    if (data) {
      this.type = data.type || FieldType.Text;
      this.label = data.label || '';
      this.value = data.value || '';
      this.link = data.link || '';
      this.data = data.data || '';
      this.icon = data.icon || '';
      this.download = data.download || false;
      this.json = data.json || {};
    }
  }
}

export class FieldLinksClass {
  readonly type: FieldType = FieldType.Text;
  label: string = '';
  sublinks: SubLinkClass[] = [];

  constructor(json: any = {}) {
    if (json) {
      this.label = json.label || '';
      this.sublinks = (json.sublinks || []).map((sl: SubLinkClass) => {
        return new SubLinkClass(sl);
      });
    }
  }
}

export class SubLinkClass {
  value: string = '';
  link: string = '';
  data: string = '';
  icon: string = '';

  constructor(json: any = {}) {
    if (json) {
      this.value = json.value || '';
      this.link = json.link || '';
      this.data = json.data || '';
      this.icon = json.icon || '';
    }
  }
}
