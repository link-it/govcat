import { LogLevel } from "../models/log.interface";

export const environment = {
  production: true,
  version: '2.0.5',
  build: '250219.1646',

  logLevel: LogLevel.info,

  configFile: './assets/config/app-config.json'
};
