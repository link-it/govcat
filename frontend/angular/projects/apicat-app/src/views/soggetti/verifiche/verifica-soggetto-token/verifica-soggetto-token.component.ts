/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Component, HostListener, Input, SimpleChanges } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { OpenAPIService } from '@app/services/openAPI.service';

import _ from 'lodash';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'ui-verifica-soggetto-token',
  styleUrls: ['./verifica-soggetto-token.component.scss'],
  templateUrl: './verifica-soggetto-token.component.html',
  standalone: false
})
export class VerificaSoggettoTokenComponent {

  @Input() environmentId: string = 'collaudo'; // collaudo - produzione
  @Input() pdnd: boolean = true;
  @Input() soggetto: any = null;
  @Input() verifica: string = 'soggetti'; // soggetti - token-policy
  @Input() type: string = 'certificati'; // certificati - backend
  @Input() listTokenPolicy: any[] = [];
  @Input() showInfo: boolean = true;
  @Input() icon: string = '';
  @Input() iconSvg: string = '';
  @Input() title: string = 'APP.TITLE.Certificati';

  // uid: string = new Date().getTime().toString();
  uid: string = Math.random().toString(36).slice(2, 7);

  _profilo: string = '';

  _stato: string = 'scaduti'; // scaduti - in-scadenza | stato

  _loading: number = 0;

  _esiti: any[] = [
    { value: 'valido', label: 'APP.VERIFY.ESITO.Valido', color: 'success', colorHex: '#a6d75b' },
    { value: 'in_scadenza', label: 'APP.VERIFY.ESITO.InScadenza', color: 'warning', colorHex: '#f0ad4e' },
    { value: 'scaduto', label: 'APP.VERIFY.ESITO.Scaduto', color: 'danger', colorHex: '#dd2b0e' },
    { value: 'http_error', label: 'APP.VERIFY.ESITO.HttpError', color: 'danger', colorHex: '#dd2b0e' },
    { value: 'ok', label: 'APP.VERIFY.ESITO.Ok', color: 'success', colorHex: '#a6d75b' },
    { value: 'warning', label: 'APP.VERIFY.ESITO.Warning', color: 'warning', colorHex: '#f0ad4e' },
    { value: 'errore', label: 'APP.VERIFY.ESITO.Errore', color: 'danger', colorHex: '#dd2b0e' },
  ];

  _result: any = null;
  _showGroupDetails: boolean = false;
  _showDetails: boolean = false;

  _vgEsito: any = { esito: 'ok' };
  _gRes: any[] = [];

  constructor(
    private translateService: TranslateService,
    private apiService: OpenAPIService
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.environmentId) {
      this.environmentId = changes.environmentId.currentValue;
      this._showDetails = false;
    }
    if (changes.pdnd) {
      this._profilo = changes.pdnd.currentValue ? 'pdnd' : 'modi';
    }
    if (changes.type) {
      this._stato = (changes.type.currentValue === 'backend') ? 'stato' : 'scaduti';
    }
    if (changes.listTokenPolicy) {
      this.listTokenPolicy = changes.listTokenPolicy.currentValue;
      this._vgEsito.esito = 'ok';
    }
    if (changes.soggetto) {
      this.soggetto = changes.soggetto.currentValue;
    }

    this._loadAll();
  }

  _loadAll() {
    const reqs: Observable<any>[] = [];
    const paths: any[] = [];

    let _path = `${this.environmentId}/${this.verifica}/${this.soggetto.nome}/${this.type}`;
    paths.push(_path);
    reqs.push(
      this.apiService.getMonitor(`${_path}/${this._stato}`)
        .pipe(
          catchError((err) => {
            return of({ items: [] });
          })
        )
    );

    if (this.listTokenPolicy.length > 0 && this.pdnd) {
        this.listTokenPolicy.forEach(item => {
        _path = `${this.environmentId}/token-policy/${item}/${this.type}`;

        this._stato = (this.type === 'backend') ? 'stato' : 'scaduti';

        paths.push(_path);
        reqs.push(
          this.apiService.getMonitor(`${_path}/${this._stato}`)
            .pipe(
              catchError((err) => {
                return of({ items: [] });
              })
            )
        );
      });
    }

    this._showGroupDetails = false;
    this._loading++;
    this._gRes = [];

    forkJoin(reqs).subscribe(
      (results: Array<any>) => {
        results.forEach((result, index) => {
          const _index = index;
          const _loading = this._isValidOk(result) && (this.type === 'certificati');

          if (_index === 0) {
            this._gRes.push({
              uid: Math.random().toString(36).slice(2, 7),
              index: _index,
              name: this.translateService.instant('APP.SOGGETTI.TITLE.soggetti'),
              result: this._normalizeResult(result),
              open: false,
              loading: _loading
            });
          } else {
            this._gRes.push({
              uid: Math.random().toString(36).slice(2, 7),
              index: _index,
              name: this.translateService.instant('APP.SOGGETTI.TITLE.token-policy') + ': ' + this.listTokenPolicy[_index - 1],
              result: this._normalizeResult(result),
              open: false,
              loading: _loading
            });
          }
          if (_loading) {
            this._vgEsito.esito = 'ok';
            this._loadInScadenza(paths[_index], _index);
          }
        });
        this._hasErrorVesa(this._gRes);
        this._loading--;
      },
      (error: any) => {
        console.log('_loadAllTokenPolicy forkJoin', error);
        this._gRes = [];
        this._loading--;
      }
    );
  }

  _loadInScadenza(path: string, index: number) {
    if (!path) { return; }
    const _stato = 'in-scadenza';
    this.apiService.getMonitor(`${path}/${_stato}`).subscribe({
      next: (response: any) => {
        this._result = this._normalizeResult(response);
        this._gRes[index].result = this._normalizeResult(response);
        this._gRes[index].loading = false;
        this._hasErrorVesa(this._gRes);
      },
      error: (error: any) => {
        this._gRes[index].result = {
          esito: 'http_error',
          dettagli: (JSON.stringify(error) || 'Http error') + '\n\n' + path
        };
        this._gRes[index].loading = false;
        this._gRes[index].open = false;
        this._hasErrorVesa(this._gRes);
      }
    })
  }

  _normalizeResult(result: any) {
    let _esito = result.esito;
    switch (result.esito) {
      case 'valido':
        _esito = 'ok';
        break;
      case 'in_scadenza':
        _esito = 'warning';
        break;
      case 'scaduto':
        _esito = 'errore';
        break;
      default:
        break;
    }
    return {
      ...result,
      esito: _esito
    };
  }

  _hasErrorVesa(arr: any[]) {
    arr.every(elem => {
      if (this._isNotValidoOk(elem.result)) {
        this._vgEsito = this._normalizeResult(elem.result);
        return false;
      }
      return true;
    });
  }

  _isNotValidoOk(data: any) {
    return (data.esito !== 'valido') && (data.esito !== 'ok');
  }

  _onSevaDetails(event: any, esito: any) {
    if (this._isNotValidoOk(esito) || event.altKey) {
      this._showGroupDetails = !this._showGroupDetails;
    }
  }

  _onErrorDetails(event: any, item: any, divId: string) {
    item.open = !item.open;
    if (item.open) { this.scrollToTop(divId); }
  }

  _onDetails(event: any, esito: any) {
    if (this._isNotValidoOk(esito)) {
      this._showDetails = !this._showDetails;
    }
  }

  _getColor(data: any) {
    const _esito: any = this._esiti.find((item: any) => { return item.value === data.esito });
    return _esito ? _esito.color : 'secondary';
  }

  _getColorMapper = (data: any): string => {
    return this._getColor(data);
  }

  _getColorHex(data: any) {
    const _esito: any = this._esiti.find((item: any) => { return item.value === data.esito });
    return _esito ? _esito.colorHex : '#f1f1f1';
  }

  _getColorHexMapper = (data: any): string => {
    return this._getColorHex(data);
  }

  _getLabel(data: any) {
    const _esito: any = this._esiti.find((item: any) => { return item.value === data.esito });
    return _esito ? _esito.label : data.esito;
  }

  _getLabelMapper = (data: any): string => {
    return this._getLabel(data);
  }

  _isValidOk(data: any) {
    return data ? (data.esito === 'valido') || (data.esito === 'ok') : false;
  }

  _isValidOkMapper = (data: any): boolean => {
    return this._isValidOk(data);
  }

  scrollToBottom() {
    const div = document.getElementById(this.uid);
    div?.scrollTo({
      top: div.scrollHeight,
      behavior: 'smooth'
    });
  }

  scrollToTop(id: string) {
    setTimeout(() => {
      const scroller = document.getElementById(this.uid);
      const div = document.getElementById(id);
      if (div && scroller) {
        scroller.scrollTo({
          top: div.offsetTop - scroller.offsetTop,
          behavior: 'smooth'
        });
      }
    }, 200);
  }
}
