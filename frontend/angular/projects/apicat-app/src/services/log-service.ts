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
import { Injectable } from "@angular/core";
import { environment } from "@env";
import { LogLevel } from "../models/log.interface";

@Injectable({
  providedIn: "root",
})
export class LogService {
  constructor() {}

  log(message?: any, ...optionalParams: any[]) {
    if (environment.logLevel >= LogLevel.debug) {
      console.log(...[message, ...optionalParams]);
    }
  }

  table(message?: any, ...optionalParams: any[]) {
    if (environment.logLevel >= LogLevel.debug) {
      console.table(...[message, ...optionalParams]);
    }
  }

  trace(message?: any, ...optionalParams: any[]) {
    if (environment.logLevel >= LogLevel.debug) {
      console.trace(...[message, ...optionalParams]);
    }
  }

  error(message?: any, ...optionalParams: any[]) {
    if (environment.logLevel >= LogLevel.error) {
      console.error(...[message, ...optionalParams]);
    }
  }

  debug(message?: any, ...optionalParams: any[]) {
    if (environment.logLevel >= LogLevel.debug) {
      console.debug(...[message, ...optionalParams]);
    }
  }

  info(message?: any, ...optionalParams: any[]) {
    if (environment.logLevel >= LogLevel.info) {
      console.info(...[message, ...optionalParams]);
    }
  }

  warn(message?: any, ...optionalParams: any[]) {
    if (environment.logLevel >= LogLevel.warn) {
      console.warn(...[message, ...optionalParams]);
    }
  }
}
