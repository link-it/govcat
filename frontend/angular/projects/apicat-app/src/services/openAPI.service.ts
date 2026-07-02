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
import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';

import { ApiClient, IRequestOptions } from './api.client';

import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OpenAPIService {

  private readonly proxyPath: string = "";

  constructor( private readonly http: ApiClient) {}

  getList(name: string, options?: IRequestOptions, pageUrl: string = '') : Observable<any> {
    let url = `${this.proxyPath}/${name}`;

    // gestione delle chiamate url per ngx-infinite-scroll o per la paginazione
    if (pageUrl) {
      let path = pageUrl.replace(/^[^:]+:\/\/[^/?#]+.+?(?=\?)/, '');
      url = `${this.proxyPath}/${name}${path}`;
    }

    return this._withPagedLinks(this.http.get<any>(url, options));
  }

  /**
   * Operatore condiviso applicato a TUTTE le API che restituiscono liste
   * paginate (`getList`, `getListPDND`, `getMonitor`, e di conseguenza
   * `getData`/`getDataPagination` che delegano a `getList`). Centralizza la
   * normalizzazione dei link di paginazione: qualsiasi nuova API lista deve
   * solo passare per questo operatore, senza interventi sui componenti.
   */
  private _withPagedLinks(obs: Observable<any>): Observable<any> {
    return obs.pipe(map((resp: any) => this._normalizePagedLinks(resp)));
  }

  /**
   * Normalizza i link di paginazione. Il backend restituisce `links` come
   * array `[{ rel, href }]` (rel: first/self/next/last); i componenti lista
   * (infinite-scroll) leggono invece `_links.next.href` come oggetto per-rel.
   * Qui costruiamo `_links` (oggetto) a partire dall'array `links` quando
   * assente, mantenendo retro-compatibilita` senza toccare i componenti.
   */
  private _normalizePagedLinks(resp: any): any {
    if (resp && typeof resp === 'object' && !resp._links && Array.isArray(resp.links)) {
      const _links: any = {};
      for (const link of resp.links) {
        if (link?.rel) { _links[link.rel] = { href: link.href }; }
      }
      resp._links = _links;
    }
    return resp;
  }

  getListPDND(name: string, options?: IRequestOptions, pageUrl: string = '') : Observable<any> {
    let url = `${this.proxyPath}/${name}`;
    
    // gestione delle chiamate url per ngx-infinite-scroll o per la paginazione
    if (pageUrl) {
      let path = pageUrl.replace(/^[^:]+:\/\/[^/?#]+.+?(?=\?)/, '');
      url = `${this.proxyPath}/${name}${path}`;
    }
    
    if (name === "others") {
      return of(null);
    }

    return this._withPagedLinks(this.http.getPDND<any>(url, options));
  }

  postPDND(name: string, body: Object, options?: IRequestOptions) {
    let url = `${this.proxyPath}/${name}`;
    return this.http.postPDND<any>(url, body, options);
  }

  getDetails(name: string, id: any, type?: string, options?: IRequestOptions) {
    options ??= {};
    
    const _url = type ? `${this.proxyPath}/${name}/${id}/${type}` : `${this.proxyPath}/${name}/${id}`;
    return this.http.get<any>(_url, options);
  }

  saveElement(name: string, body: Object, options?: IRequestOptions) {
    options ??= {};
    
    const _url = `${this.proxyPath}/${name}`;
    return this.http.post<any>(_url, body, options);
  }

  updateElement(name: string, id: any, body: Object | null, options?: IRequestOptions) {
    options ??= {};

    options.headers = new HttpHeaders();

    const _url = `${this.proxyPath}/${name}/${id}`;
    return this.http.patch<any>(_url, body, options);
  }

  putElement(name: string, id: any, body: Object | null, options?: IRequestOptions) {
    options ??= {};

    options.headers = new HttpHeaders();

    const _url = id ? `${this.proxyPath}/${name}/${id}` : `${this.proxyPath}/${name}`;
    return this.http.put<any>(_url, body, options);
  }

  deleteElement(name: string, id: any, options?: IRequestOptions) {
    options ??= {};

    // Issue 229 evolutiva 3 — l'`id` opzionale permette di
    // chiamare endpoint con path fissi (es.
    // `DELETE /profilo/organizzazione`) coerentemente con
    // `putElement` (vedi sopra). Senza questa guardia veniva
    // costruito un URL con il letterale "null"/"undefined".
    const _url = id ? `${this.proxyPath}/${name}/${id}` : `${this.proxyPath}/${name}`;
    return this.http.delete<any>(_url, options);
  }

  upload(name: string, body: any, options?: IRequestOptions) {
    options ??= {};

    options.headers = new HttpHeaders();

    const _url = `${this.proxyPath}/${name}`;
    return this.http.post<any>(_url, body, options);
  }

  download(name: string, id: any, type?: string, params?: HttpParams, headers?: HttpHeaders) {
    let _url = '';
    if (id) {
      _url = type ? `${this.proxyPath}/${name}/${id}/${type}` : `${this.proxyPath}/${name}/${id}`;
    } else {
      _url = `${this.proxyPath}/${name}`;
    }
    return this.http.getContentRaw(_url, params, headers);
  }

  putElementRelated(name: string, id: any, path: string, body: Object | null, options?: IRequestOptions) {
    options ??= {};

    options.headers = new HttpHeaders();

    const _url = `${this.proxyPath}/${name}/${id}/${path}`;
    
    return this.http.put<any>(_url, body, options);
  }

  postElementRelated(name: string, id: any, path: string, body: Object, options?: IRequestOptions) {
    options ??= {};

    options.headers = new HttpHeaders();

    const _url = `${this.proxyPath}/${name}/${id}/${path}`;
    return this.http.post<any>(_url, body, options);
  }


  postElement(name: string, body: Object, options?: IRequestOptions) {
    options ??= {};

    options.headers = new HttpHeaders();

    const _url = `${this.proxyPath}/${name}`;
    return this.http.post<any>(_url, body, options);
  }
  

  deleteElementRelated(name: string, id: any, path: string, options?: IRequestOptions) {
    options ??= {};
    
    const _url = `${this.proxyPath}/${name}/${id}/${path}`;
    return this.http.delete<any>(_url, options);
  }

  // Monitor

  getMonitor(name: string, options?: IRequestOptions, pageUrl: string = '') : Observable<any> {
    let url = `${this.proxyPath}/${name}`;
    
    if (pageUrl) {
      let path = pageUrl.replace(/^[^:]+:\/\/[^/?#]+.+?(?=\?)/, '');
      url = `${this.proxyPath}/${name}${path}`;
    }
    
    if (name === "others") {
      return of(null);
    }

    return this._withPagedLinks(this.http.getMonitor<any>(url, options));
  }

  postMonitor(name: string, body: Object, options?: IRequestOptions) {
    options ??= {};
    
    const _url = `${this.proxyPath}/${name}`;
    return this.http.postMonitor<any>(_url, body, options);
  }

  getMonitorDetails(name: string, id: any, type?: string, options?: IRequestOptions) {
    options ??= {};
    
    const _url = type ? `${this.proxyPath}/${name}/${id}/${type}` : `${this.proxyPath}/${name}/${id}`;
    return this.http.getMonitor<any>(_url, options);
  }

  downloadMonitor(name: string, params?: HttpParams, headers?: HttpHeaders) {
    let url = `${this.proxyPath}/${name}`;
    return this.http.getMonitorContentRaw(url, params, headers);
  }

  // Utilities

  queryToHttpParams(query: any): HttpParams {
    let httpParams = new HttpParams();

    Object.keys(query).forEach(key => {
      if (query[key] !== null) {
        httpParams = httpParams.set(key, query[key]);
      }
    });

    return httpParams;
  }

  getData(model: string, term: any = null, pageSize: number = 100, sort: string = 'id', sort_direction: string = 'asc'): Observable<any> {
    let _options: any = { params: { PageSize: pageSize, PageNumber: 1, OrderTerm: `${sort},${sort_direction}` } };
    if (term) {
      if (typeof term === 'string' ) {
        _options.params =  { ..._options.params, q: term };
      }
      if (typeof term === 'object' ) {
        _options.params =  { ..._options.params, ...term };
      }
    }

    return this.getList(model, _options)
      .pipe(
        map((resp: any) => {
          if (resp.Error) {
            return of({status: 500, message: resp.Error});
          } else {
            const _items = (resp.content || resp).map((item: any) => {
              return item;
            });
            return _items;
          }
        })
      );
  }

  getDataPagination(model: string, term: any = null, pageNumber: number = 0, pageSize: number = 100, sort: string = 'id', sort_direction: string = 'asc'): Observable<any> {
    let _options: any = { params: { size: pageSize, page: pageNumber, sort: `${sort},${sort_direction}` } };
    if (term) {
      if (typeof term === 'string' ) {
        _options.params =  { ..._options.params, q: term };
      }
      if (typeof term === 'object' ) {
        _options.params =  { ..._options.params, ...term };
      }
    }

    return this.getList(model, _options)
      .pipe(
        map((resp: any) => {
          if (resp.Error) {
            return of({status: 500, message: resp.Error});
          } else {
            const _items = (resp.content || resp).map((item: any) => {
              return item;
            });
            return _items;
          }
        })
      );
  }

}
