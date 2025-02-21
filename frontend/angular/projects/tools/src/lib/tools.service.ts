import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { MultiSnackbarComponent } from 'projects/components/src/lib/dialogs/multi-snackbar/multi-snackbar.component';
import { GridFormatters } from './utils/grid-formatters';
import { FieldClass, FieldLinksClass } from 'projects/components/src/lib/classes/definitions';

import cssVars from 'css-vars-ponyfill';

import { BehaviorSubject, Subscription } from 'rxjs';

import * as moment from 'moment';
declare const $: any;

@Injectable({
  providedIn: 'root'
})
export class Tools {

  public static Configurazione: any = null;
  public static CustomFieldsLabel: any = null;

  public static EmergencyCall: Subscription[] = [];
  protected static Spinner: boolean = false;
  protected static SpinnerCount: number = 0;
  protected static SpinnerGlobal: boolean = false;

  public static OpenIDConnectTokenLoaded: BehaviorSubject<any> = new BehaviorSubject(null);
  public static OpenIDConnectAccess: BehaviorSubject<any> = new BehaviorSubject(null);

  public static Versione: string;

  // Utente di sessione
  public static USER_LOGGED: any;

  static translate: any;

  public static CurrentApplication: any;

  constructor(
    private translate: TranslateService
  ) { }

  getSpinner(): any {
    return Tools.Spinner;
  }

  isSpinnerGlobal(): any {
    return Tools.SpinnerGlobal;
  }

  public static WaitForResponse(value: boolean = true, ecall: boolean = false, global: boolean = true) {
    Tools.SpinnerGlobal = global;
    Tools.SpinnerCount = (value) ? Tools.SpinnerCount + 1 : Tools.SpinnerCount - 1;
    if (!Tools.Spinner || Tools.SpinnerCount <= 0 || ecall) {
      Tools.Spinner = value;
      if (Tools.SpinnerCount < 0 || ecall) {
        Tools.SpinnerCount = 0;
      }
      if (Tools.SpinnerCount === 0 && Tools.EmergencyCall) {
        Tools.EmergencyCall.forEach(ec => ec.unsubscribe());
        Tools.EmergencyCall = [];
      }
    }
  }

  public static LoginAccess(reset: boolean = true) {
    if (reset) {
      Tools.USER_LOGGED = null;
    }
    Tools.OpenIDConnectAccess.next(true);
  }

  public static SetThemeColors(colors: any) {
    if (colors) {
      const _options: any = {
        variables: {}
      };
      const rex: any = /^#[abcdefABCDEF0-9]{6}$/;
      if (colors.Variables) {
        Object.keys(colors.Variables).forEach((key: any) => {
          const color = colors.Variables[key];
          if (color && color.search(rex) !== -1) {
            document.documentElement.style.setProperty(key, color);
            _options.variables[key] = color;
          }
        });
      }
      cssVars(_options);
    }
  }

  public static Allegati: any = {
    GENERICO: { Code: 'generico', Label: 'generico'},
    SPECIFICA: { Code: 'specifica', Label: 'specifica' },
    SPECIFICA_COLLAUDO: { Code: 'specifica_collaudo', Label: 'specifica_collaudo' },
    SPECIFICA_PRODUZIONE: { Code: 'specifica_produzione', Label: 'specifica_produzione' }
  };
  public static TipiAllegati: any[] = Object.keys(Tools.Allegati).map((key: string) => {
    return { label: Tools.Allegati[key].Label, value: Tools.Allegati[key].Code };
  });
  public static TipiAllegaatiEnum: any = {};
  _tempTATT = Object.keys(Tools.Allegati).map((key: string) => {
    Tools.TipiAllegaatiEnum =  { ...Tools.TipiAllegaatiEnum, [Tools.Allegati[key].Code]: 'APP.VISIBILITY.' + Tools.Allegati[key].Code};
    return key;
  });

  // Tipoologie visibilità servizio
  public static VisibilitaServizio: any = {
    PUBLIC: { Code: 'pubblico', Label: 'pubblico'},
    CLASSE: { Code: 'riservato', Label: 'riservato' },
    PRIVATE: { Code: 'privato', Label: 'privato' }
  };
  public static TipiVisibilitaServizio: any[] = Object.keys(Tools.VisibilitaServizio).map((key: string) => {
    return { label: Tools.VisibilitaServizio[key].Label, value: Tools.VisibilitaServizio[key].Code };
  });
  public static VisibilitaServizioEnum: any = {};
  _tempTV = Object.keys(Tools.VisibilitaServizio).map((key: string) => {
    Tools.VisibilitaServizioEnum =  { ...Tools.VisibilitaServizioEnum, [Tools.VisibilitaServizio[key].Code]: 'APP.VISIBILITY.' + Tools.VisibilitaServizio[key].Code};
    return key;
  });

  // Tipoologie visibilità allegato
  public static VisibilitaAllegato: any = {
    PUBLIC: { Code: 'pubblico', Label: 'Pubblico'},
    SUBSCRIPTION: { Code: 'adesione', Label: 'Adesione' },
    REFERENTE: { Code: 'servizio', Label: 'Servizio' },
    GESTORE: { Code: 'gestore', Label: 'Gestore' }
  };
  public static TipiVisibilitaAllegato: any[] = Object.keys(Tools.VisibilitaAllegato).map((key: string) => {
    return { label: Tools.VisibilitaAllegato[key].Label, value: Tools.VisibilitaAllegato[key].Code };
  });
  public static TipiVisibilitaAllegatoEnum: any = {};
  _tempTA = Object.keys(Tools.VisibilitaAllegato).map((key: string) => {
    Tools.TipiVisibilitaAllegatoEnum =  { ...Tools.TipiVisibilitaAllegatoEnum, [Tools.VisibilitaAllegato[key].Code]: 'APP.VISIBILITY.' + Tools.VisibilitaAllegato[key].Code};
    return key;
  });

  // Stati servizio
  public static StatoServizio: any = {
    BOZZA: { Code: 'bozza', Label: 'Bozza', Order: 0 },
    RICHIESTO_COLLAUDO: { Code: 'richiesto_collaudo', Label: 'Richiesta configurazione in collaudo', Order: 2 },
    AUTORIZZATO_COLLAUDO: { Code: 'autorizzato_collaudo', Label: 'Richiesta configurazione in collaudo', Order: 2 },
    IN_CONFIGURAZIONE_COLLAUDO: { Code: 'in_configurazione_collaudo', Label: 'In configurazione in collaudo', Order: 4 },
    PUBBLICATO_COLLAUDO: { Code: 'pubblicato_collaudo', Label: 'Pubblicato in collaudo', Order: 6 },
    RICHIESTO_PRODUZIONE: { Code: 'richiesto_produzione', Label: 'Richiesto in produzione', Order: 8 },
    AUTORIZZATO_PRODUZIONE: { Code: 'autorizzato_produzione', Label: 'Richiesto in produzione', Order: 8 },
    IN_CONFIGURAZIONE_PRODUZIONE: { Code: 'in_configurazione_produzione', LABEL: 'In configurazione in produzione', ORDER: 10 },
    PUBBLICATO_PRODUZIONE: { Code: 'pubblicato_produzione', Label: 'Richiesto in produzione', Order: 12 },
    ARCHIVIATO: { Code: 'archiviato', Label: 'Archiviato', Order: 14 },
  };
  public static StatiServizio: any[] = Object.keys(Tools.StatoServizio).map((key: string) => {
    return { label: Tools.StatoServizio[key].Label, value: Tools.StatoServizio[key].Code, order: Tools.StatoServizio[key].Order };
  });
  public static StatiServizioEnum: any = {};
  _tempS = Object.keys(Tools.StatoServizio).map((key: string) => {
    Tools.StatiServizioEnum = { ...Tools.StatiServizioEnum, [Tools.StatoServizio[key].Code]: 'APP.WORKFLOW.STATUS.' + Tools.StatoServizio[key].Code };
    return key;
  });

  // Stati servizio collaudo
  public static StatoServizioCollaudo: any = {
    INVIATA_COLLAUDO: { Code: 'inviata_collaudo', Label: 'Richiesto in collaudo', Order: 1 },
    AUTORIZZATA_COLLAUDO: { Code: 'autorizzata_collaudo', Label: 'Autorizzato in collaudo', Order: 3 },
    IN_CONFIGURAZIONE_COLLAUDO: { Code: 'in_configurazione_collaudo', Label: 'In configurazione in collaudo', Order: 5 },
    CONFIGURATA_COLLAUDO: { Code: 'configurata_collaudo', Label: 'Configurato in collaudo', Order: 7 }
  };
  public static StatiServizioCollaudo: any[] = Object.keys(Tools.StatoServizioCollaudo).map((key: string) => {
    return { label: Tools.StatoServizioCollaudo[key].Label, value: Tools.StatoServizioCollaudo[key].Code, order: Tools.StatoServizioCollaudo[key].Order };
  });
  
  //  ======= Stati Adesione ======= 
  public static StatoAdesione: any = {
    BOZZA: { Code: 'bozza', Label: 'Bozza', Order: 0 },
    RICHIESTO_COLLAUDO: { Code: 'richiesto_collaudo', Label: 'Richiesta in collaudo', Order: 2 },
    AUTORIZZATO_COLLAUDO: { Code: 'autorizzato_collaudo', Label: 'Richiesta in collaudo', Order: 4 },
    IN_CONFIGURAZIONE_COLLAUDO: { Code: 'in_configurazione_collaudo', Label: 'In configurazione in collaudo', Order: 6 },
    PUBBLICATO_COLLAUDO: { Code: 'pubblicato_collaudo', Label: 'Pubblicato in collaudo', Order: 8 },
    RICHIESTO_PRODUZIONE: { Code: 'richiesto_produzione', Label: 'Richiesto produzione', Order: 10 },
    RICHIESTO_PRODUZIONE_SENZA_COLLAUDO: { Code: 'richiesto_produzione_senza_collaudo', Label: 'Richiesto produzione senza collaudo', Order: 10 },
    AUTORIZZATO_PRODUZIONE: { Code: 'autorizzato_produzione', Label: 'Richiesto produzione', Order: 11 },
    AUTORIZZATO_PRODUZIONE_SENZA_COLLAUDO: { Code: 'autorizzato_produzione_senza_collaudo', Label: 'Richiesto produzione senza collaudo', Order: 11 },
    IN_CONFIGURAZIONE_PRODUZIONE: { Code: 'in_configurazione_produzione', Label: 'In configurazione in produzione', Order: 14 },
    IN_CONFIGURAZIONE_PRODUZIONE_SENZA_COLLAUDO: { Code: 'in_configurazione_produzione_senza_collaudo', Label: 'In configurazione in produzione senza collaudo', Order: 14 },
    PUBBLICATO_PRODUZIONE: { Code: 'pubblicato_produzione', Label: 'Pubblicato in produzione', Order: 16 },
    PUBBLICATO_PRODUZIONE_SENZA_COLLAUDO: { Code: 'pubblicato_produzione_senza_collaudo', Label: 'Pubblicato in produzione senza collaudo', Order: 16 },
    ARCHIVIATO: { Code: 'archiviato', Label: 'Archiviato', Order: 18 }
  };
  public static StatiAdesione: any[] = Object.keys(Tools.StatoAdesione).map((key: string) => {
    return { label: Tools.StatoAdesione[key].Label, value: Tools.StatoAdesione[key].Code, order: Tools.StatoAdesione[key].Order };
  });
  public static StatiAdesioneEnum: any = {};
  _tempA = Object.keys(Tools.StatoAdesione).map((key: string) => {
    Tools.StatiAdesioneEnum = { ...Tools.StatiAdesioneEnum, [Tools.StatoAdesione[key].Code]: 'APP.WORKFLOW.STATUS.' + Tools.StatoAdesione[key].Code };
    return key;
  });
  // ==============================



  //  ======= Stati Client ======= 
  public static StatoClient: any = {
    NUOVO: { Code: 'nuovo', Label: 'NotConfigured', Order: 0 },
    CONFIGURATO: { Code: 'configurato', Label: 'Configured', Order: 2 },
  };
  public static StatiClient: any[] = Object.keys(Tools.StatoClient).map((key: string) => {
    return { label: Tools.StatoClient[key].Label, value: Tools.StatoClient[key].Code, order: Tools.StatoClient[key].Order };
  });
  
  public static StatiClientEnum: any = {};
  _tempC = Object.keys(Tools.StatoClient).map((key: string) => {
    Tools.StatiClientEnum = { ...Tools.StatiClientEnum, [Tools.StatoClient[key].Code]: 'APP.CLIENT.STATUS.' + Tools.StatoClient[key].Label };
    return key;
  });
  // ==============================

  public static StepsOrderServizio: any = {
    ARCHIVIATO: -1,
    BOZZA: 0,
    RICHIESTO_COLLAUDO: 1,
    IN_CONFIGURAZIONE_COLLAUDO: 2,
    PUBBLICATO_COLLAUDO: 3,
    RICHIESTO_PRODUZIONE: 4,
    IN_CONFIGURAZIONE_PRODUZIONE: 5,
    PUBBLICATO_PRODUZIONE: 6
  };

  public static formatValue(value: any, data: any, html: boolean = true, options: any = null): string {
    switch (data.type) {
      case 'number':
        return GridFormatters.numberFormatter({ value: value }, html);
      case 'date':
        return GridFormatters.dateFormatter({ value: value, format: data.format || 'DD-MM-YYYY' }, html);
      case 'currency':
        return GridFormatters.currencyFormatter({ value: value }, html);
      case 'progress':
        return html ? GridFormatters.progressFormatter({ value: value }) : value;
      case 'tag':
        return GridFormatters.typeTagFormatter({ field: data, value: value, optionsName: data.options, options: options });
      default:
        return value;
    }
  }

  public static simpleItemFormatter(fields: any[], data: any, options: any = null, join: string = ' · ') {
    const results: string[] = [];
    fields.forEach(field => {
      const value = Tools.getObjectValue(data, field.field); // data[field.field]
      switch (field.type) {
        case 'number':
          const _tooltip = null; // field.tooltip ? this.translate.instant(field.tooltip) : null;
          results.push(GridFormatters.numberFormatter({ value: value, icon: field.icon, hideZero: field.hideZero, tooltip: _tooltip }, true));
          break;
        case 'currency':
          results.push(GridFormatters.currencyFormatter({ value: value }, false));
          break;
        case 'date':
          results.push(GridFormatters.dateFormatter({ value: value, format: field.format }, false));
          break;
        case 'progress':
          results.push(GridFormatters.progressFormatter({ value: value }));
          break;
        case 'message':
          results.push(field.field);
          break;
        case 'currentDate':
          results.push(moment().format(field.format));
          break;
        case 'status':
          results.push(GridFormatters.statusFormatter({ value: value, options: options }));
          break;
        case 'label':
          results.push(GridFormatters.typeLabelFormatter({ field: field.field, value: value, optionsName: field.options, options: options }));
          break;
        case 'cardinal':
          results.push(`#${value}`);
          break;
        default:
          results.push(value);
      }
    });
    return results.join(join);
  }

  public static generateFields(fields: any, data: any, empty: boolean | string = false, options: any = null) {
    const _list: any[] = [];
    fields.map((field: any) => {
      if (field.type === 'download') {
        _list.push(new FieldClass({ label: 'APP.LABEL.Content', value: field.field, download: true, icon: 'download', json: data }));
      } else {
        const value = Tools.getObjectValue(data, field.field);
        if (value || (field.type === 'number')) {
          _list.push(new FieldClass({ label: field.label, value: Tools.formatValue(value, field, true, options), json: data }));
        } else {
          if (empty) {
            _list.push(new FieldClass({ label: field.label, value: empty, json: data }));
          }
        }
      }
    });
    return _list;
  }

  public static getObjectValue(obj: any, path: string): any {
    if (!path) { return obj; }
    const properties: string[] = path.split('.');
    const first = properties.shift() || '';
    return obj[first] ? Tools.getObjectValue(obj[first], properties.join('.')) : '';
  }

  public static MaxUpload(): number {
    // const _rms: any = Tools.Cache.RemoteSettings;
    // return _rms?_rms.GeneralSettings.MaxKBSize:null;
    return 0;
  }

  public static FileExceedError(max: number = 0) {
    const MAXK: number = (max || Tools.MaxUpload());
    let limit: string = `di ${new Intl.NumberFormat('it-IT').format(MAXK)} bytes`;
    if (!MAXK) {
      limit = `stata superata`;
    }
    Tools.Alert(`La dimensione massima consentita per l'upload di un file è ${limit}`);
  }

  public static ScrollTo(offset: number, callback: Function | null = null) {
    setTimeout(() => {
      const $routeSection: any = $('#route-section');
      if ($routeSection && $routeSection.length !== 0) {
        $routeSection.animate({
          scrollTop: offset
        }, 800, () => {
          if (callback) {
            callback();
          }
        });
      }
    }, 250);
  }

  public static ScrollElement(elementId: string, offset: number, callback: Function | null = null) {
    setTimeout(() => {
      const $section: any = $(`#${elementId}`);
      if ($section && $section.length !== 0) {
        $section.animate({
          scrollTop: offset
        }, 400, () => {
          if (callback) {
            callback();
          }
        });
      }
    }, 250);
  }

  public static WorkflowErrorMsg(error: any) {
    let _msg = '';
    const _msgA: string[] = [];
    try {
      if (error.error && error.error.errori) {
        error.error.errori.forEach((item: any) => {
          item.campi.forEach((field: any) => {
            _msgA.push(`${item.dato} - ${field}`);
          });
          // const _fields: string = item.campi.join(', ');
          // _msgA.push(`${item.dato} - [${_fields}]`);
        });
        _msg = _msgA.join(' - ');
      } else {
        _msg = error.message;
      }
    } catch (e) {
      _msg = 'Si è verificato un problema non previsto.';
    }

    return _msg;
  }

  public static GetErrorMsg(error: any) {
    let _msg = 'Warning: status ' + error.status;
    const _msgA: string[] = [];
    try {
      if (error.error && (error.error.title || error.error.detail)) {
        if (error.error.title) {
          _msgA.push(error.error.title);
        }
        if (error.error.detail) {
          _msgA.push(error.error.detail);
        }
        _msg = _msgA.join(' - ');
      } else {
        if (error.status !== 0 && error.statusText) {
          _msg = error.status + ': ' + error.statusText;
          if (error.status === 404) {
            _msg += error.url ? ` ${error.url.split('?')[0]}` : '';
          }
        } else {
          _msg = error.message;
        }
      }
      if (error.name && !error.error) {
        _msg = this.translate.instant(`APP.MESSAGE.ERROR.${error.name}`);
      }
    } catch (e) {
      _msg = 'Si è verificato un problema non previsto.';
    }

    return _msg;
  }

  public static MultiSnackbarDestroyAll() {
    MultiSnackbarComponent.DestroyAllStickyMessages();
  }

  public static showMessage(message: string, type: string, action: boolean = false, keep: boolean = false, actionLabel: string | null = null) {
    const _action: boolean = action;
    const _keep: boolean = keep;
    const _actionLabel: string | null = actionLabel;
    MultiSnackbarComponent.PushMessage(message, _action, _keep, _actionLabel, null, type);
  }
  
  /**
   * On error handler
   * @param error
   * @param {string} customMessage
   */
  public static OnError(error: any, customMessage?: string) {
    let _msg = 'Warning: status ' + error.status;
    const _keep: boolean = false;
    const _msgA: string[] = [];
    try {
      if (customMessage) {
        _msg = customMessage;
      } else {
        _msg = Tools.GetErrorMsg(error);
      }
      if (_msg.length > 200) {
        _msg = _msg.substring(0, 200);
      }
    } catch (e) {
      _msg = 'Si è verificato un problema non previsto.';
    }
    MultiSnackbarComponent.PushMessage((_msg || error.message), true, _keep);
    // Tools.Alert(_msg || error.message);
  }
  
  /**
   *
   * Alert messages
   * @param {string} _message
   * @param {boolean} _action
   * @param {boolean} _keep
   * @param {string} _actionLabel
   */
    public static Alert(_message: string, _action: boolean = true, _keep: boolean = false, _actionLabel: string | null = null) {
      MultiSnackbarComponent.PushMessage(_message, _action, _keep, _actionLabel);
    }
  
  /**
   * Hex to RGB
   * @param {string} hex
   * @returns {any} { r: number; g: number; b: number }
   * @constructor
   */
  public static HexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  }

  public static IsBase64(str: any): boolean {
    if (str === undefined || str === null || str === '' || str.trim() === '') {
      return false;
    }
    try {
      return (str.fromBase64().toBase64() === str);
    } catch (err) {
      return false;
    }
  }

  static DateFormatByLanguage(timestamp: boolean = false): string {
    let currentFormat = '';
    switch (this.translate.currentLang) {
      case 'en':
        currentFormat = timestamp ? 'YYYY/MM/DD, HH:mm:ss' : 'YYYY/MM/DD';
        break;
      case 'it':
        currentFormat = timestamp ? 'DD-MM-YYYY, HH:mm:ss' : 'DD-MM-YYYY';
        break;
      default:
        currentFormat = timestamp ? 'DD-MM-YYYY, HH:mm:ss' : 'DD-MM-YYYY';
    }
    return currentFormat;
  }

  getNumberFormatByLanguage(): string {
    let currentFormat = '';
    switch (this.translate.currentLang) {
      case 'en':
        currentFormat = 'en-US';
        break;
      case 'it':
        currentFormat = 'it-IT';
        break;
      default:
        currentFormat = 'it-IT';
    }
    return currentFormat;
  }

  dateFormat(date: string, format: string = 'YYYY-MM-DD', timestamp: boolean = false) {
    return (moment(date, format).format(Tools.DateFormatByLanguage()));
  }

  /**
   * Numero in formato valuta €
   * @param value
   * @returns
   */
  currencyFormat(value: number): string {
    if (!isNaN(value)) {
      let currency;
      try {
        currency = new Intl.NumberFormat(this.getNumberFormatByLanguage(), {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value);
      } catch (e) {
        currency = 'n/a';
      }
      return '€ ' + currency;
    }
    return '';
  }

  public static DecodeB64(str: string): string {
    try {
      return decodeURIComponent(atob(str).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) {
      console.log('Formato non corretto');
      return '';
    }
  }

  B64toBlob(b64Data: any, contentType: string = '', sliceSize: number = 512): any {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });

    return blob;
  }

  public static GetFilenameFromHeader(response: any): string {
    let name: string = '';
    if (response) {
      const _cd = response.headers.get('content-disposition');
      const _re = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/gm;
      const _results = _re.exec(_cd);
      if (_results && _results[1]) {
        name = _results[1].replace(/['"]/g, '');
      }
    }

    return name;
  }

  /**
   * Convert code AA_BB or aa_bb to AaBb
   * @param {string} str
   * @returns {string}
   * @constructor
   */
  CamelCode(str: string): string {
    return str.toLowerCase().split('_').map((s: string) => {
      return s.charAt(0).toUpperCase() + s.substring(1);
    }).join('');
  }

  /**
   * Download CSV file
   * @param {any} data
   * @param {string} filename
   */
  public static DownloadCSVFile(data: any, filename: string = 'data') {
    if (!data) { return; }
    let csvData = Tools.ConvertToCSV(data);
    // console.log(csvData)
    let blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
    let dwldLink = document.createElement("a");
    let url = URL.createObjectURL(blob);
    let isSafariBrowser = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
    if (isSafariBrowser) {  //if Safari open in new window to save file with random filename.
      dwldLink.setAttribute("target", "_blank");
    }
    dwldLink.setAttribute("href", url);
    dwldLink.setAttribute("download", filename + ".csv");
    dwldLink.style.visibility = "hidden";
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
  }

  public static ConvertToCSV(objArray: any[]) {
    const headerList: any[] = Object.keys(objArray[0]);
    let array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    let row = 'Index,';
    for (let index in headerList) {
      row += headerList[index] + ',';
    }
    row = row.slice(0, -1);
    str += row + '\r\n';
    for (let i = 0; i < array.length; i++) {
      let line = (i + 1) + '';
      for (let index in headerList) {
        let head = headerList[index];
        line += ',' + array[i][head];
      }
      str += line + '\r\n';
    }
    return str;
  }

  /**
   * Sort by properties
   * @param {string[]} properties
   * @param {boolean} asc
   * @param {boolean} isDate
   * @returns {any[]}
   */
  static SortBy(properties: string[], asc: boolean = true, isDate: boolean = false) {
    return ((value1: any, value2: any) => {
      properties.forEach((p: string)  => {
        value1 = value1[p] || '';
        value2 = value2[p] || '';
      });
      if (isDate) {
        value1 = new Date(value1);
        value2 = new Date(value2);
      }
      if (value1 < value2) {
        return asc?-1:1;
      }
      if (value1 > value2) {
        return asc?1:-1;
      }
      return 0;
    });
  }

  public static TruncateRows(text: string, rows: number = 2, maxchars: number = 160): string {
    let split: string[] = [];
    if (text && text.search(/\r\n|\r|\n/) !== -1) {
      split = text.split(/\r\n|\r|\n/);
      text = split.slice(0, Math.min(rows, split.length)).join('\n').trim();
    }
    if (text && (text.length > maxchars || rows < split.length)) {
      return text.substring(0, maxchars).trim() + '...';
    }
    return text;
  }

  public static Trunc(value: number): number {
    return value < 0 ? Math.ceil(value) : Math.floor(value);
  }

  public static IsNullOrUndefined<T>(obj: T | null | undefined): obj is null | undefined {
    return typeof obj === 'undefined' || obj === null;
  }

  public static DecodeDataOptions(data: any): any {
    const decodeData = JSON.parse(decodeURI(window.atob(data)));
    return decodeData;
  }

  public static EncodeDataOptions(data: any): any {
    const encodeData = window.btoa(encodeURI(JSON.stringify(data)));
    return encodeData;
  }
}
