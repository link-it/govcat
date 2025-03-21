import { LogLevel } from "../models/log.interface";

export const environment = {
  production: true,
  version: '2.1.0',
  build: '250320.1013',

  logLevel: LogLevel.info,

  configFile: './assets/config/app-config.json'
};
