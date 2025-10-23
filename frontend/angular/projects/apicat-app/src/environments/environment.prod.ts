import { LogLevel } from "../models/log.interface";

export const environment = {
  production: true,
  version: '2.3.0',
  build: '251023.1855',

  logLevel: LogLevel.info,
  configFile: './assets/config/app-config.json'
};
