import { LogLevel } from "../models/log.interface";

export const environment = {
  production: true,
  version: '2.3.1',
  build: '251216.1320',

  logLevel: LogLevel.info,
  configFile: './assets/config/app-config.json'
};
