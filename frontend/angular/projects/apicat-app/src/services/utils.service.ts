import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { OpenAPIService } from '@services/openAPI.service';

import { YesnoDialogBsComponent } from '@linkit/components';

import * as moment from 'moment';
import { FormGroup, Validators } from '@angular/forms';

import { TipiCertificato, TipoCertificatoEnum } from '@app/views/adesioni/adesione-configurazioni/adesione-configurazioni.component';

export type Certificato = {
    file?: boolean;
    cn?: boolean;
    csr?: boolean;
    csr_modulo?: boolean;
};

type Elemento = { index?: number; [key: string]: any };
type GenericItem = { [key: string]: any };

const MappaCertificato: Record<TipoCertificatoEnum, (keyof Certificato)[]> = {
    [TipoCertificatoEnum.FORNITO]: ['file'],
    [TipoCertificatoEnum.RICHIESTO_CN]: ['cn'],
    [TipoCertificatoEnum.RICHIESTO_CSR]: ['csr']
};

export type AuthConfig = {
  type: string;
  certificato?: Certificato;
  certificato_autenticazione?: Certificato;
  certificato_firma?: Certificato;
  [key: string]: any;
};

@Injectable({
  providedIn: 'root',
})
export class UtilService {

  // Cache
  private cacheAnagrafiche: any = {};

  _modalConfirmRef!: BsModalRef;
  _modalGenerateRef!: BsModalRef;

  constructor(
    private apiService: OpenAPIService,
    private translate: TranslateService,
    private modalService: BsModalService,
  ) { }

  getUtenti(term: string | null = null, role: string | null = null, stato: string = 'abilitato', organizzazione: string | null = null, referenteTecnico: boolean = false): Observable<any> {
    const _options: any = { params: { q: term } };
    if (role) { _options.params.ruolo = role; }
    if (stato) { _options.params.stato = stato; }
    if (organizzazione) { _options.params.id_organizzazione = organizzazione; }
    if (referenteTecnico) { _options.params.referente_tecnico = true; }

    return this.apiService.getList('utenti', _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          const _items = resp.content.map((item: any) => {
            item.nome_completo = `${item.nome} ${item.cognome}`;
            // item.disabled = _.findIndex(this._toExcluded, (excluded) => excluded.name === item.name) !== -1;
            return item;
          });
          return _items;
        }
      })
      );
  }

  getAnagrafiche(tables: any[]) {
    const reqs: Observable<any>[] = [];

    tables.forEach(table => {
      let _table = '';
      let _param: any;
      if (typeof table === 'string') {
        _table = table;
      } else {
        _table = table.name;
        if (table.param) _param = { params: this._queryToHttpParams(table.param) };
      }

      // if (!this.cacheAnagrafiche[table]) {
        this.cacheAnagrafiche[table] = [];
        switch (table) {
          default:
            reqs.push(
              this.apiService.getList(_table, _param)
                .pipe(
                  catchError((err) => {
                    console.log('getAnagrafiche error', table, err);
                    return of({ items: [] });
                  })
                )
            );
        }
      // }
    });

    forkJoin(reqs).subscribe({
      next: (results: Array<any>) => {
        tables.forEach((table, index) => {
          const _table = (typeof table === 'string') ? table : table.name;
          const resultContent = results[index].content || results[index].items || [];
          switch (_table) {
            case 'utenti':
              resultContent.map((item: any) => ({
                  id: item.id_utente,
                  nome: `${item.nome} ${item.cognome}`
                })).sort(this._order);
              break;
            case 'domini':
              resultContent.map((item: any) => ({
                  id: item.id_dominio,
                  nome: `${item.nome}`
                })).sort(this._order);
              break;
            case 'organizzazioni':
              resultContent.map((item: any) => ({
                  id: item.id_organizzazione,
                  nome: `${item.nome}`,
                  // descrizione: `${item.descrizione}`
                })).sort(this._order);
              break;
            case 'classi-utente':
              resultContent.map((item: any) => ({
                  id_classe_utente: item.id_classe_utente,
                  nome: `${item.nome}`
                })).sort(this._order);
              break;
            case 'gruppi':
              resultContent.map((item: any) => ({
                  id: item.id_gruppo,
                  nome: item.nome,
                  descrizione: item.descrizione_sintetica
                })).sort(this._order);
              break;
            case 'tassonomie':
              resultContent.map((item: any) => ({
                  id: item.id_tassonomia,
                  nome: item.nome,
                  descrizione: item.descrizione,
                  obbligatorio: item.obbligatorio,
                  visibile: item.visibile
                })).sort(this._order);
              break;
            case 'tags':
              this.cacheAnagrafiche[_table] = results[index]
                .map((item: any) => ({
                  id: item,
                  nome: item
                })).sort(this._order);
                break;
            default:
              // this.cacheAnagrafiche[_table] = results[index].content
              //   .map((item: any) => ({
              //     id: item.id,
              //     descrizione: item.nome
              //   })).sort(this._order);
              // break;
          }
        });
      },
      error: (error: any) => {
        console.log('getAnagrafiche forkJoin', error);
      }
    });

    return this.cacheAnagrafiche;
  }

  refreshAnagrafiche(tables: string[]){
    tables.forEach(table => delete this.cacheAnagrafiche[table]);
    return this.getAnagrafiche(tables);
  }

  _queryToHttpParams(query: any, formatDate: boolean = true) : HttpParams {
    let httpParams = new HttpParams();

    Object.keys(query).forEach(key => {
      if (query[key]) {
        let _dateTime = '';
        switch (key)
        {
          // case 'data_da':
          // case 'data_a':
          //   _dateTime = JSON.parse(JSON.stringify(moment(query[key])));
          //   httpParams = httpParams.set(key, _dateTime);
          //   break;
          case 'data_da':
          case 'data_a':
          case 'data_inizio':
          case 'data_fine':
            if (formatDate) {
              _dateTime = moment(query[key]).format('YYYY-MM-DD');
              httpParams = httpParams.set(key, _dateTime);
            } else {
              httpParams = httpParams.set(key, query[key]);
            }
            break;
          default:
            httpParams = httpParams.set(key, query[key]);
        }
      }
    });
    
    return httpParams; 
  }

  _order(a: any, b: any) {
    function _orderByComparator(a: any, b: any): number {
      if (
        isNaN(parseFloat(a)) ||
        !isFinite(a) ||
        (isNaN(parseFloat(b)) || !isFinite(b))
      ) {
        // Isn't a number so lowercase the string to properly compare
        if (a.toLowerCase() < b.toLowerCase()) { return -1; }
        if (a.toLowerCase() > b.toLowerCase()) { return 1; }
      } else {
        // Parse strings as numbers to compare properly
        if (parseFloat(a) < parseFloat(b)) { return -1; }
        if (parseFloat(a) > parseFloat(b)) { return 1; }
      }

      return 0; // equal each other
    }

    return _orderByComparator(a['nome'], b['nome']);
  }

  _confirmDialog(message: string | null, data: any, callback: (data: any) => void, initialState: any = {}) {
    const _initialState = {
        title: this.translate.instant('APP.TITLE.Attention'),
        messages: [
            this.translate.instant(message ? message : 'APP.MESSAGE.AreYouSure')
        ],
        cancelText: this.translate.instant('APP.BUTTON.Cancel'),
        confirmText: this.translate.instant('APP.BUTTON.Confirm'),
        cancelColor: 'secondary',
        confirmColor: 'danger',
        ...initialState
    };

    this._modalConfirmRef = this.modalService.show(YesnoDialogBsComponent, {
        ignoreBackdropClick: true,
        initialState: _initialState
    });
        this._modalConfirmRef.content.onClose.subscribe(
            (response: any) => {
                if (response) {
                    callback(data);
                }
            }
    );
  }

  _confirmDelection(data: any, callback: (data: any) => void) {
    const initialState = {
      title: this.translate.instant('APP.TITLE.Attention'),
      messages: [
        this.translate.instant('APP.MESSAGE.AreYouSure')
      ],
      cancelText: this.translate.instant('APP.BUTTON.Cancel'),
      confirmText: this.translate.instant('APP.BUTTON.Confirm'),
      confirmColor: 'danger'
    };

    this._modalConfirmRef = this.modalService.show(YesnoDialogBsComponent, {
      ignoreBackdropClick: true,
      initialState: initialState
    });
    this._modalConfirmRef.content.onClose.subscribe(
      (response: any) => {
        if (response) {
          callback(data);
        }
      }
    );
  }

  __confirmCambioStatoServizio(status: any, servizio: any, callback: (status: any, data: any) => void) {
    const _newStatus = status.status?.stato_successivo?.nome || status.status.nome
    const _newStatusTransl = this.translate.instant(`APP.WORKFLOW.STATUS.${_newStatus}`);
    const initialState = {
      title: this.translate.instant('APP.TITLE.Attention'),
      messages: [
        this.translate.instant('APP.WORKFLOW.MESSAGE.AreYouSure', { next: _newStatusTransl })
      ],
      cancelText: this.translate.instant('APP.BUTTON.Cancel'),
      confirmText: this.translate.instant('APP.BUTTON.Confirm'),
      confirmColor: 'danger'
    };

    this._modalConfirmRef = this.modalService.show(YesnoDialogBsComponent, {
      ignoreBackdropClick: true,
      initialState: initialState
    });
    this._modalConfirmRef.content.onClose.subscribe(
      (response: any) => {
        if (response) {
          callback(status, servizio);
        }
      }
    );
  }

  _openGenerateTokenDialog(component: any, state: any, callback: (data: any) => void) {
    const initialState = { ...state };

    this._modalGenerateRef && this._modalGenerateRef.content? this._modalGenerateRef.content.onClose.unsubscribe() : null;

    this._modalGenerateRef = this.modalService.show(component, {
      id: 'generate-jwt',
      ignoreBackdropClick: true,
      class: 'modal-with-65',
      initialState: initialState
    });
    this._modalGenerateRef.content.onClose.subscribe(
      (response: any) => {
        console.log('_modalGenerateRef onClose', response);
        if (response) {
          callback(response);
        }
      }
    );
  }

  _removeEmpty(obj: any) {
    const $this = this;
    return Object.keys(obj)
        .filter(function (k) {
            return ( obj[k] !== null && obj[k] !== undefined && obj[k] !== '' && typeof obj[k] !== "object");
        })
        .reduce(function (acc: any, k: string) {
            acc[k] = typeof obj[k] === "object" ? $this._removeEmpty(obj[k]) : obj[k];
            return acc;
        }, {});
  }

  _showMandatoryFields(formGroup: FormGroup) {
      console.group('_showMandatoryFields');
      Object.keys(formGroup.getRawValue()).forEach((key) => {
          if (formGroup.controls[key].hasValidator(Validators.required))
              console.log(key, formGroup.controls[key].value);
          }
      );
      console.groupEnd();
  }

  // ScrollTo

  scrollTo(id: string) {
      document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "end"
      });

      // const box = document.querySelector('.container-scroller');
      // const targetElm = document.getElementById(id);
      // this.scrollToElm(box, targetElm, 600);
  }

  scrollToElm(container: any, elm: any, duration: number){
      var pos = this.getRelativePos(elm);

      this._scrollTo(container, pos.top, duration);  // duration in seconds
  }

  getRelativePos(elm: any){
      const pPos: any = elm.parentNode.getBoundingClientRect(), // parent pos
          cPos: any = elm.getBoundingClientRect(), // target pos
          pos: any = {};

      pos.top    = cPos.top    - pPos.top + elm.parentNode.scrollTop + (pPos.bottom - pPos.top),
      pos.right  = cPos.right  - pPos.right,
      pos.bottom = cPos.bottom - pPos.bottom,
      pos.left   = cPos.left   - pPos.left;

      return pos;
  }
  
  _scrollTo(element: any, to: any, duration: number) {
      var start = element.scrollTop,
          change = to - start;

      element.scrollTop = start + change;
  }

    // Utilities per filtro certificati

    filtraCertificatiAttivi(certificato: Certificato): Partial<Record<TipoCertificatoEnum, true>> {
        const risultato: Partial<Record<TipoCertificatoEnum, true>> = {};

        for (const [tipo, chiavi] of Object.entries(MappaCertificato)) {
            const attivo = chiavi.some(chiave => certificato[chiave]);
            if (attivo) {
                risultato[tipo as TipoCertificatoEnum] = true;
            }
        }

        return risultato;
    }

    getTipiCertificatoAttivi(certificato: Certificato): TipoCertificatoEnum[] {
        return Object.entries(MappaCertificato)
            .filter(([_, chiavi]) => chiavi.some(k => certificato[k]))
            .map(([tipo]) => tipo as TipoCertificatoEnum);
    }

    getTipiCertificatoDettagliati(certificato: Certificato) {
        const attivi = this.getTipiCertificatoAttivi(certificato);
        return TipiCertificato.filter(tc => attivi.includes(tc.value));
    }

    /* Esempio d'uso

        const certificato = {
            file: true,
            cn: false,
            csr: false,
            csr_modulo: false
        };

        const attivi = filtraCertificatiAttivi(certificato);
        console.log(attivi);
        // Output: { fornito: true }

        const attiviDettagliati = getTipiCertificatoDettagliati(certificato);
        console.log(attiviDettagliati);
        // Output: [{ value: 'fornito', label: 'Fornito' }]
    */

  getCertificatoByAuthType(authConfigs: AuthConfig[], authType: string): Certificato | null {
    const config = authConfigs.find(conf => conf.type === authType);
    if (!config) {
      console.warn(`Tipo di autenticazione "${authType}" non trovato.`);
      return null;
    }

    return config.certificato 
        ?? config.certificato_autenticazione 
        ?? config.certificato_firma 
        ?? null;
  }

  // Sort functions

  sortByIndexPreservingOrder(arr: Elemento[]): Elemento[] {
    // Mappa degli elementi con index, salvando la loro posizione originale
    const indexedItems: { originalIndex: number; item: Elemento }[] = arr
      .map((item, i) => ({ item, originalIndex: i }))
      .filter(({ item }) => typeof item.index === 'number');

    // Ordina quelli con index
    indexedItems.sort((a, b) => (a.item.index! - b.item.index!));

    // Clona l’array per non modificarlo in-place
    const result = [...arr];

    // Inserisce gli item ordinati nella loro posizione originale
    let sortedIndex = 0;
    for (let i = 0; i < result.length; i++) {
      if (typeof result[i].index === 'number') {
        result[i] = indexedItems[sortedIndex].item;
        sortedIndex++;
      }
    }

    return result;
  }

  sortByFieldPreservingOthersMapper = (arr: any[], field: string) => this.sortByFieldPreservingOthers(arr, field);

  sortByFieldPreservingOthers<T extends GenericItem>(
    array: T[],
    field: string
  ): T[] {
    // Estrai gli elementi che hanno il campo definito e sono numerici
    const itemsWithField: { originalIndex: number; item: T }[] = array
      .map((item, i) => ({ item, originalIndex: i }))
      .filter(({ item }) => typeof item[field] === 'number');

    // Ordina quelli con il campo specificato
    itemsWithField.sort((a, b) => a.item[field] - b.item[field]);

    // Crea una copia dell’array originale
    const result = [...array];

    // Inserisce gli elementi ordinati nei rispettivi posti (solo dove il campo era presente)
    let sortedIndex = 0;
    for (let i = 0; i < result.length; i++) {
      if (typeof result[i][field] === 'number') {
        result[i] = itemsWithField[sortedIndex].item;
        sortedIndex++;
      }
    }

    return result;
  }

  public GetErrorMsg(error: any) {
    let _msg = 'Warning: status ' + error.status;
    const _msgA: string[] = [];
    try {
      if (error.error?.detail) {
        const code = error.error.detail;
        let params = {};
        if (error.error.errori?.length > 0) {
          params = error.error.errori[0].params || {};
        }
        _msg = this.translate.instant(`APP.MESSAGE.ERROR.${code}`, params);
      } else if (error.error?.title || error.error?.detail) {
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
}
