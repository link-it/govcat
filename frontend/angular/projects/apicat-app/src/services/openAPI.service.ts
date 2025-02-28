import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';

import { ApiClient, IRequestOptions, IRawRequestOptions } from './api.client';
import { environment } from '../environments/environment';

import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OpenAPIService {

  private proxyPath: string;

  constructor( private http: ApiClient) 
  {
    this.proxyPath = ""
  }

  getList(name: string, options?: IRequestOptions, pageUrl: string = '') : Observable<any> {
    let url = `${this.proxyPath}/${name}`;
    
    // gestione delle chiamate url per ngx-infinite-scroll o per la paginazione
    if (pageUrl) {
      url = pageUrl;
      // if (!environment.production) {
        let path = pageUrl.replace(/^[^:]+:\/\/[^/?#]+.+?(?=\?)/, '');
        url = `${this.proxyPath}/${name}${path}`;
      // }
    }
    
    return this.http.get<any>(url, options);
  }

  getListPDND(name: string, options?: IRequestOptions, pageUrl: string = '') : Observable<any> {
    let url = `${this.proxyPath}/${name}`;
    
    // gestione delle chiamate url per ngx-infinite-scroll o per la paginazione
    if (pageUrl) {
      url = pageUrl;
      // if (!environment.production) {
        let path = pageUrl.replace(/^[^:]+:\/\/[^/?#]+.+?(?=\?)/, '');
        url = `${this.proxyPath}/${name}${path}`;
      // }
    }
    
    switch (name) {
      case "others":
        return of(null); 
        break;

      default:
        return this.http.getPDND<any>(url, options);
    }
  }

  postPDND(name: string, body: Object, options?: IRequestOptions) {
    let url = `${this.proxyPath}/${name}`;
    return this.http.postPDND<any>(url, body, options);
  }

  getDetails(name: string, id: any, type?: string, options?: IRequestOptions) {
    if(!options) options = {};
    
    const _url = type ? `${this.proxyPath}/${name}/${id}/${type}` : `${this.proxyPath}/${name}/${id}`;
    return this.http.get<any>(_url, options);
  }

  saveElement(name: string, body: Object, options?: IRequestOptions) {
    if(!options) options = {};
    
    const _url = `${this.proxyPath}/${name}`;
    return this.http.post<any>(_url, body, options);
  }

  updateElement(name: string, id: any, body: Object | null, options?: IRequestOptions) {
    if(!options) options = {};
    options.headers = new HttpHeaders();
    // options.headers = options.headers.set('Content-type', 'application/json-patch+json');

    const _url = `${this.proxyPath}/${name}/${id}`;
    return this.http.patch<any>(_url, body, options);
  }

  putElement(name: string, id: any, body: Object | null, options?: IRequestOptions) {
    if(!options) options = {};
    options.headers = new HttpHeaders();
    // options.headers = options.headers.set('Content-type', 'application/json');

    const _url = id ? `${this.proxyPath}/${name}/${id}` : `${this.proxyPath}/${name}`;
    return this.http.put<any>(_url, body, options);
  }

  deleteElement(name: string, id: any, options?: IRequestOptions) {
    if(!options) options = {};
    
    const _url = `${this.proxyPath}/${name}/${id}`;
    return this.http.delete<any>(_url, options);
  }

  upload(name: string, body: any, options?: IRequestOptions) {
    if (!options) options = {};
    options.headers = new HttpHeaders();
    // options.headers = options.headers.set('Content-type', 'multipart/form-data');

    const _url = `${this.proxyPath}/${name}`;
    return this.http.post<any>(_url, body, options);
  }

  download(name: string, id: any, type?: string, params?: HttpParams) {
    let _url = '';
    if (id) {
      _url = type ? `${this.proxyPath}/${name}/${id}/${type}` : `${this.proxyPath}/${name}/${id}`;
    } else {
      _url = `${this.proxyPath}/${name}`;
    }
    return this.http.getContentRaw(_url, params);
  }

  putElementRelated(name: string, id: any, path: string, body: Object | null, options?: IRequestOptions) {
    if(!options) options = {};
    options.headers = new HttpHeaders();
    // options.headers = options.headers.set('Content-type', 'application/json');

    const _url = `${this.proxyPath}/${name}/${id}/${path}`;
    
    return this.http.put<any>(_url, body, options);
  }

  postElementRelated(name: string, id: any, path: string, body: Object, options?: IRequestOptions) {
    if(!options) options = {};
    options.headers = new HttpHeaders();
    // options.headers = options.headers.set('Content-type', 'application/json');

    const _url = `${this.proxyPath}/${name}/${id}/${path}`;
    return this.http.post<any>(_url, body, options);
  }


  postElement(name: string, body: Object, options?: IRequestOptions) {
    if(!options) options = {};
    options.headers = new HttpHeaders();

    const _url = `${this.proxyPath}/${name}`;
    return this.http.post<any>(_url, body, options);
  }
  

  deleteElementRelated(name: string, id: any, path: string, options?: IRequestOptions) {
    if(!options) options = {};
    
    const _url = `${this.proxyPath}/${name}/${id}/${path}`;
    return this.http.delete<any>(_url, options);
  }

  // Monitor

  getMonitor(name: string, options?: IRequestOptions, pageUrl: string = '') : Observable<any> {
    let url = `${this.proxyPath}/${name}`;
    
    if (pageUrl) {
      url = pageUrl;
      // if (!environment.production) {
        let path = pageUrl.replace(/^[^:]+:\/\/[^/?#]+.+?(?=\?)/, '');
        url = `${this.proxyPath}/${name}${path}`;
      // }
    }
    
    switch (name) {
      case "others":
        return of(null); 
        break;

      default:
        return this.http.getMonitor<any>(url, options);
    }
  }

  postMonitor(name: string, body: Object, options?: IRequestOptions) {
    if(!options) options = {};
    
    const _url = `${this.proxyPath}/${name}`;
    return this.http.postMonitor<any>(_url, body, options);
  }

  getMonitorDetails(name: string, id: any, type?: string, options?: IRequestOptions) {
    if(!options) options = {};
    
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
            switch (key) {
                default:
                    httpParams = httpParams.set(key, query[key]);
            }
        }
    });

    return httpParams;
  }

  getData(model: string, term: any = null, pageSize: number = 100, sort: string = 'id', sort_direction: string = 'asc'): Observable<any> {
    let _options: any = { params: { PageSize: pageSize, PageNumber: 1, OrderTerm: `${sort},${sort_direction}` } };
    // let _options: any = { params: { limit: 100, sort: sort, sort_direction: 'asc' } };
    // let _options: any = { params: { } };
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
                    // throwError(resp.Error);
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
                    // throwError(resp.Error);
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
