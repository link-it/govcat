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
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor(private config: ConfigService) { }

  set<T extends string | number | boolean>(key: string, value: T) {
    localStorage.setItem(this._prefix(key), String(value));
  }

  getString(key: string, defaultValue: string = ''): string {
    const value = localStorage.getItem(this._prefix(key));
    return value ? value : defaultValue;
  }

  getNumber(key: string, defaultValue?: number): number | undefined {
    const value = localStorage.getItem(this._prefix(key));
    return value ? Number.parseFloat(value) : defaultValue;
  }

  getBoolean(key: string, defaultValue?: boolean): boolean | undefined {
    const value = localStorage.getItem(this._prefix(key));
    return value ? value === 'true' : defaultValue;
  }

  setItem(key: string, item: any) {
    localStorage.setItem(this._prefix(key), this.encodeData(item));
  }

  getItem<T>(key: string, defaultValue?: T): any {
    const prefixedKey = this._prefix(key);
    try {
      return this.decodeData(localStorage.getItem(prefixedKey));
    } catch (e) {
      return defaultValue;
    }
  }

  remove(key: string) {
    localStorage.removeItem(this._prefix(key));
  }

  clear() {
    localStorage.clear();
  }

  _prefix(key: string) {
    return `${this.config.getSessionPrefix()}_${key}`;
  }

  decodeData(data: any) {
    const decodeData = JSON.parse(decodeURI(window.atob(data)));
    return decodeData;
  }

  encodeData(data: any) {
    const encodeData = window.btoa(encodeURI(JSON.stringify(data)));
    return encodeData;
  }
}
