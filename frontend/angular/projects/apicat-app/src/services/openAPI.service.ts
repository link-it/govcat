import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { ApiClient, IRequestOptions, IRawRequestOptions } from './api.client';
import { environment } from '../environments/environment';
import { HttpHeaders, HttpParams } from '@angular/common/http';

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
    
    switch (name) {
      case "others":
        return of(null); 
        break;

      default:
        return this.http.get<any>(url, options);
    }
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

    const _url = `${this.proxyPath}/${name}/${id}`;
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
}
