import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { combineLatest, forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { OpenAPIService } from '@services/openAPI.service';

import { YesnoDialogBsComponent } from 'projects/components/src/lib/dialogs/yesno-dialog-bs/yesno-dialog-bs.component';

import * as moment from 'moment';

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

  getUtenti(term: string | null = null, role: string | null = null, stato: string = 'abilitato', organizzazione: string | null = null): Observable<any> {
    const _options: any = { params: { q: term } };
    if (role) { _options.params.ruolo = role; }
    if (stato) { _options.params.stato = stato; }
    if (organizzazione) { _options.params.id_organizzazione = organizzazione; }

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

    forkJoin(reqs).subscribe(
      (results: Array<any>) => {
        tables.forEach((table, index) => {
          const _table = (typeof table === 'string') ? table : table.name;
          switch (_table) {
            case 'utenti':
              this.cacheAnagrafiche[_table] = results[index].content
                .map((item: any) => ({
                  id: item.id_utente,
                  nome: `${item.nome} ${item.cognome}`
                })).sort(this._order);
              break;
            case 'domini':
              this.cacheAnagrafiche[_table] = results[index].content
                .map((item: any) => ({
                  id: item.id_dominio,
                  nome: `${item.nome}`
                })).sort(this._order);
              break;
            case 'organizzazioni':
              this.cacheAnagrafiche[_table] = results[index].content
                .map((item: any) => ({
                  id: item.id_organizzazione,
                  nome: `${item.nome}`,
                  // descrizione: `${item.descrizione}`
                })).sort(this._order);
              break;
            case 'classi-utente':
              this.cacheAnagrafiche[_table] = results[index].content
                .map((item: any) => ({
                  id_classe_utente: item.id_classe_utente,
                  nome: `${item.nome}`
                })).sort(this._order);
              break;
            case 'gruppi':
              this.cacheAnagrafiche[_table] = results[index].content
                .map((item: any) => ({
                  id: item.id_gruppo,
                  nome: item.nome,
                  descrizione: item.descrizione_sintetica
                })).sort(this._order);
              break;
            case 'tassonomie':
              this.cacheAnagrafiche[_table] = results[index].content
                .map((item: any) => ({
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
      (error: any) => {
        console.log('getAnagrafiche forkJoin', error);
      }
    );

    return this.cacheAnagrafiche;
  }

  refreshAnagrafiche(tables: string[]){
    tables.forEach(table => delete this.cacheAnagrafiche[table]);
    return this.getAnagrafiche(tables);
  }

  _queryToHttpParams(query: any) : HttpParams {
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
            _dateTime = moment(query[key]).format('YYYY-MM-DD');
            httpParams = httpParams.set(key, _dateTime);
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
    const _newStatus = status.status.nome;
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
}
