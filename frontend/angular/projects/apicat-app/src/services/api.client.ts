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
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ConfigService } from '@linkit/components';

export interface IRequestOptions {
  headers?: HttpHeaders;
  observe?: 'body';
  params?: HttpParams | { [param: string]: string | string[]; };
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
  body?: any;
}

export interface IRawRequestOptions {
  body?: any;
  headers?: HttpHeaders ;
  reportProgress?: boolean;
  observe: 'response';
  params?: HttpParams | {
    [param: string]: string | string[];
  };
  responseType?: 'json';
  withCredentials?: boolean;
}

export interface IUploadRequestOptions {
  body?: any;
  headers?: HttpHeaders ;
  reportProgress?: boolean;
  observe: 'events';
  params?: HttpParams | {
    [param: string]: string | string[];
  };
  responseType?: 'json';
  withCredentials?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiClient {
  private api_url: string = '';
  private api_url_pdnd: string = '';
  private api_url_monitor: string = '';
  private conf: any;

  // access_token: string = null;
  public locale: string = 'it-IT';

  public constructor(
    public http: HttpClient,
    public configService: ConfigService
  ) {
    this.conf = this.configService.getConfiguration();
    this.api_url = this.conf.AppConfig.GOVAPI.HOST;
    this.api_url_pdnd = this.conf.AppConfig.GOVAPI.HOST_PDND;
    this.api_url_monitor = this.conf.AppConfig.GOVAPI.HOST_MONITOR;
  }

  /**
   * GET request
   * @param {string} endPoint it doesn't need / in front of the end point
   * @param {IRequestOptions} options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public get<T>(endPoint: string, options?: IRequestOptions): Observable<T> {
  
    if (!options) options = {};
    
    return this.http.get<T>(this.api_url + endPoint, options);
  }

  /**
   * GET request and return the HttpResponse instance
   * @param {string} endPoint it doesn't need / in front of the end point
   * @param {IRequestOptions} options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public getRaw<T>(endPoint: string, options?: IRawRequestOptions): Observable<HttpResponse<T>> {
    if (!options) options = {observe: 'response'};

    return this.http.get<T>(this.api_url + endPoint, options);
  }

  getContentRaw(endPoint: string, params?: HttpParams, headers?: HttpHeaders): Observable<HttpResponse<Blob>> {
    return this.http.get(this.api_url + endPoint, { observe: 'response', responseType: 'blob', headers: headers, params: params});
  }

  /**
   * POST request
   * @param {string} endPoint end point of the api
   * @param {Object} params body of the request.
   * @param {IRequestOptions} options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public post<T>(endPoint: string, params: Object, options?: IRequestOptions): Observable<T> {
    if (!options) options = {};

    return this.http.post<T>(this.api_url + endPoint, params, options);
  }

  public postRaw<T>(endPoint: string, params: any, options?: IRawRequestOptions): Observable<HttpResponse<T>> {
    if (!options) options = {observe: 'response'};
    return this.http.post<T>(this.api_url + endPoint, params, options);
  }

  public postUpload<T>(endPoint: string, params: any, options?: IUploadRequestOptions): Observable<HttpEvent<T>> {
    if (!options) options = {observe: 'events'};
    return this.http.post<T>(this.api_url + endPoint, params, options);
  }

  /**
   * PATCH request
   * @param {string} endPoint end point of the api
   * @param {Object} params body of the request.
   * @param {IRequestOptions} options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public patch<T>(endPoint: string, params: Object | null, options?: IRequestOptions): Observable<T> {
    if (!options) options = {};
    return this.http.patch<T>(this.api_url + endPoint, params, options);
  }

  /**
   * PUT request
   * @param {string} endPoint end point of the api
   * @param {Object} params body of the request.
   * @param {IRequestOptions} options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public put<T>(endPoint: string, params: Object | null, options?: IRequestOptions): Observable<T> {
    if (!options) options = {};
    return this.http.put<T>(this.api_url + endPoint, params, options);
  }

  public putRaw<T>(endPoint: string, params: Object, options?: IRawRequestOptions): Observable<T> {
    if (!options) options = {observe: 'response'};
    return this.http.put<T>(this.api_url + endPoint, options);
  }

  /**
   * DELETE request
   * @param {string} endPoint end point of the api
   * @param {IRequestOptions} options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public delete<T>(endPoint: string, options?: IRequestOptions): Observable<T> {
    if (!options) options = {};
    return this.http.delete<T>(this.api_url + endPoint, options);
  }

  // PDND

  /**
   * GET request
   * @param {string} endPoint it doesn't need / in front of the end point
   * @param {IRequestOptions} options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public getPDND<T>(endPoint: string, options?: IRequestOptions): Observable<T> {
  
    if (!options) options = {};
    
    return this.http.get<T>(this.api_url_pdnd + endPoint, options);
  }

  /**
   * GET request
   * @param {string} endPoint it doesn't need / in front of the end point
   * @param {Object} params body of the request.
   * @param {IRequestOptions} options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public postPDND<T>(endPoint: string, params: Object, options?: IRequestOptions): Observable<T> {
    if (!options) options = {};

    return this.http.post<T>(this.api_url_pdnd + endPoint, params, options);
  }

  // Monitor

  /**
   * GET request Monitor
   * @param {string} endPoint it doesn't need / in front of the end point
   * @param {IRequestOptions} options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public getMonitor<T>(endPoint: string, options?: IRequestOptions): Observable<T> {
  
    if (!options) options = {};
    
    return this.http.get<T>(this.api_url_monitor + endPoint, options);
  }

  /**
   * POST request Monitor
   * @param {string} endPoint end point of the api
   * @param {Object} params body of the request.
   * @param {IRequestOptions} options of the request like headers, body, etc.
   * @returns {Observable<T>}
   */
  public postMonitor<T>(endPoint: string, params: Object, options?: IRequestOptions): Observable<T> {
    if (!options) options = {};

    return this.http.post<T>(this.api_url_monitor + endPoint, params, options);
  }

  public getMonitorContentRaw(endPoint: string, params?: HttpParams, headers?: HttpHeaders): Observable<HttpResponse<Blob>> {
    return this.http.get(this.api_url_monitor + endPoint, { observe: 'response', responseType: 'blob', headers: headers, params: params});
  }
}
