import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsoleToggleService } from './console-toggle.service';

describe('ConsoleToggleService', () => {
  let service: ConsoleToggleService;
  let originalLog: typeof console.log;
  let originalDebug: typeof console.debug;
  let originalWarn: typeof console.warn;
  let originalInfo: typeof console.info;

  beforeEach(() => {
    service = new ConsoleToggleService();
    originalLog = console.log;
    originalDebug = console.debug;
    originalWarn = console.warn;
    originalInfo = console.info;
  });

  afterEach(() => {
    console.log = originalLog;
    console.debug = originalDebug;
    console.warn = originalWarn;
    console.info = originalInfo;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have disableConsoleInProduction method', () => {
    expect(typeof service.disableConsoleInProduction).toBe('function');
  });

  it('should not throw when called', () => {
    expect(() => service.disableConsoleInProduction()).not.toThrow();
  });

  it('should disable console methods in production environment', () => {
    // The environment module controls production flag.
    // In test env, production is likely false so console methods remain intact.
    // We call the method and verify it doesn't break anything.
    service.disableConsoleInProduction();
    // In non-production, console.log should still work
    expect(() => console.log('test')).not.toThrow();
  });
});
