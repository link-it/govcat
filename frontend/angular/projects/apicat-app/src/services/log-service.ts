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
