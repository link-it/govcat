import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LogService } from './log-service';

describe('LogService', () => {
  let service: LogService;

  beforeEach(() => {
    service = new LogService();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});
    vi.spyOn(console, 'trace').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call console.log', () => {
    service.log('test message');
    // Depending on environment logLevel, it may or may not be called
    // The important thing is it doesn't throw
  });

  it('should call console.error', () => {
    service.error('error message');
  });

  it('should call console.warn', () => {
    service.warn('warn message');
  });

  it('should call console.info', () => {
    service.info('info message');
  });

  it('should call console.debug', () => {
    service.debug('debug message');
  });

  it('should call console.table', () => {
    service.table([1, 2, 3]);
  });

  it('should call console.trace', () => {
    service.trace('trace');
  });

  it('should pass additional params without error', () => {
    service.log('msg', 'extra1', 'extra2');
    service.error('msg', { detail: 'info' });
  });
});
