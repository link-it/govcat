import { LogLevel } from "../models/log.interface";

export const environment = {
  production: true,
  version: '2.2.5',
  build: '251219.1026',

  logLevel: LogLevel.info,
  configFile: './assets/config/app-config.json'
};
