import { LogLevel } from "../models/log.interface";

export const environment = {
  production: true,
  version: '2.2.0',
  build: '251007.1053',

  logLevel: LogLevel.info,
  configFile: './assets/config/app-config.json'
};
