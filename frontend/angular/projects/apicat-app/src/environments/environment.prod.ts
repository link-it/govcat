import { LogLevel } from "../models/log.interface";

export const environment = {
  production: true,
  version: '2.3.1',
  build: '260105.1539',

  logLevel: LogLevel.info,
  configFile: './assets/config/app-config.json'
};
