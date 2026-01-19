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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

import { ConfigService } from '@linkit/components';

@Injectable({
  providedIn: 'root',
})
export class RestApiService {
  // Define API
  apiURL = 'http://localhost:6200';

  private conf: any;

  constructor(
    private http: HttpClient,
    public configService: ConfigService
  ) {
    this.conf = this.configService;

    this.conf.getConfig('app').subscribe(
      (result: any) => this.apiURL = result.AppConfig.GOVAPI.HOST,
      (err: any) => console.error(err));
  }

  /*========================================
    CRUD Methods for consuming RESTful API
  =========================================*/
  // Http Options
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  // HttpClient API get() method => Fetch list
  get(endPoint: string,): Observable<any> {
    return this.http
      .get<any>(`${this.apiURL}/${endPoint}`)
      .pipe(retry(1), catchError(this.handleError));
  }

  // HttpClient API get() method => Fetch details
  getDetails(endPoint: string, id: any): Observable<any> {
    return this.http
      .get<any>(`${this.apiURL}/${endPoint}/${id}`)
      .pipe(retry(1), catchError(this.handleError));
  }

  // HttpClient API post() method => Create
  create(endPoint: string, body: any): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiURL}/${endPoint}`,
        JSON.stringify(body),
        this.httpOptions
      )
      .pipe(retry(1), catchError(this.handleError));
  }

  // HttpClient API put() method => Update
  updatePut(endPoint: string, id: any, body: any): Observable<any> {
    return this.http
      .put<any>(
        `${this.apiURL}/${endPoint}/${id}`,
        JSON.stringify(body),
        this.httpOptions
      )
      .pipe(retry(1), catchError(this.handleError));
  }

  // HttpClient API patch() method => Update
  update(endPoint: string, id: any, body: any): Observable<any> {
    return this.http
      .patch<any>(
        `${this.apiURL}/${endPoint}/${id}`,
        JSON.stringify(body),
        this.httpOptions
      )
      .pipe(retry(1), catchError(this.handleError));
  }

  // HttpClient API delete() method => Delete
  delete(endPoint: string, id: any) {
    return this.http
      .delete<any>(`${this.apiURL}/${endPoint}/${id}`, this.httpOptions)
      .pipe(retry(1), catchError(this.handleError));
  }

  // Error handling
  handleError(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Get client-side error
      errorMessage = error.error.message;
    } else {
      // Get server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    // window.alert(errorMessage);
    return throwError(() => {
      return errorMessage;
    });
  }
}
