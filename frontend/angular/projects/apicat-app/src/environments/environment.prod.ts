import { LogLevel } from "../models/log.interface";

export const environment = {
  production: true,
  version: '2.1.0',
  build: '250528.2331',
  logLevel: LogLevel.info,
  configFile: './assets/config/app-config.json'
};
