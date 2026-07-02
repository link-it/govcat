import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationDialogService } from './authentication-dialog.service';

describe('AuthenticationDialogService', () => {
  let service: AuthenticationDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthenticationDialogService,
        { provide: TranslateService, useValue: { instant: (key: string) => key } }
      ]
    });
    service = TestBed.inject(AuthenticationDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('detectKeyFormat', () => {
    it('should detect PEM format from string with BEGIN marker', () => {
      expect(service.detectKeyFormat('-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----')).toBe('PEM');
    });

    it('should detect DER format for non-string content', () => {
      expect(service.detectKeyFormat(new Uint8Array([0x30, 0x82]))).toBe('DER');
    });

    it('should detect DER format for string without BEGIN marker', () => {
      expect(service.detectKeyFormat('just some text')).toBe('DER');
    });
  });

  describe('convertDERToPEM', () => {
    it('should convert a DER buffer to base64 string', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
      const result = service.convertDERToPEM(buffer);
      expect(result).toBe(btoa('Hello'));
    });
  });

  describe('uuidv4', () => {
    it('should generate a valid UUID v4 format', () => {
      const uuid = service.uuidv4();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = service.uuidv4();
      const uuid2 = service.uuidv4();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('bufferToHex', () => {
    it('should convert buffer to hex string', () => {
      const buffer = new Uint8Array([0, 255, 16, 171]).buffer;
      expect(service.bufferToHex(buffer)).toBe('00ff10ab');
    });

    it('should handle empty buffer', () => {
      const buffer = new Uint8Array([]).buffer;
      expect(service.bufferToHex(buffer)).toBe('');
    });
  });

  describe('bufferToBase64', () => {
    it('should convert buffer to base64 string', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
      expect(service.bufferToBase64(buffer)).toBe(btoa('Hello'));
    });
  });

  describe('calculateSHA256', () => {
    it('should calculate SHA-256 hash as hex', async () => {
      const hash = await service.calculateSHA256('hello', false);
      expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    it('should calculate SHA-256 hash as base64', async () => {
      const hash = await service.calculateSHA256('hello', true);
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
    });
  });

  describe('buildPEMString', () => {
    it('should build a PEM formatted string', () => {
      const base64 = 'AAAA';
      const result = service.buildPEMString(base64, 'CERTIFICATE');
      expect(result).toContain('-----BEGIN CERTIFICATE-----');
      expect(result).toContain('-----END CERTIFICATE-----');
      expect(result).toContain('AAAA');
    });

    it('should split long base64 into 64-char lines', () => {
      const base64 = 'A'.repeat(128);
      const result = service.buildPEMString(base64, 'KEY');
      const lines = result.split('\n');
      // First line is BEGIN, then two 64-char lines, then END, then empty
      expect(lines[1]).toHaveLength(64);
      expect(lines[2]).toHaveLength(64);
    });
  });

  describe('convertMinutesToHours', () => {
    it('should convert 90 minutes to "1h 30m"', () => {
      expect(service.convertMinutesToHours(90)).toBe('1h 30m');
    });

    it('should convert 60 minutes to "1h"', () => {
      expect(service.convertMinutesToHours(60)).toBe('1h');
    });

    it('should convert 120 minutes to "2h"', () => {
      expect(service.convertMinutesToHours(120)).toBe('2h');
    });
  });

  describe('convertMinutesToDays', () => {
    it('should convert 1500 minutes to days/hours/minutes', () => {
      const result = service.convertMinutesToDays(1500);
      expect(result).toBe('1d 1h 0m');
    });

    it('should convert 2880 minutes to "2d 0h 0m"', () => {
      expect(service.convertMinutesToDays(2880)).toBe('2d 0h 0m');
    });
  });

  describe('convertSecondsToHours', () => {
    it('should convert 90 seconds to "1m 30s"', () => {
      expect(service.convertSecondsToHours(90)).toBe('1m 30s');
    });

    it('should convert 120 seconds to "2m"', () => {
      expect(service.convertSecondsToHours(120)).toBe('2m');
    });

    it('should convert 0 seconds to "0m"', () => {
      expect(service.convertSecondsToHours(0)).toBe('0m');
    });
  });
});
