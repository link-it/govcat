import { LogLevel } from "../models/log.interface";

export const environment = {
  production: true,
  version: '2.2.0',
  build: '251009.0839',

  logLevel: LogLevel.info,
  configFile: './assets/config/app-config.json'
};
