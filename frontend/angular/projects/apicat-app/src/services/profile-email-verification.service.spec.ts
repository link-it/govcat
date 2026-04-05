import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ProfileEmailVerificationService } from './profile-email-verification.service';

describe('ProfileEmailVerificationService', () => {
  let service: ProfileEmailVerificationService;
  let mockApiClient: any;
  let mockTranslate: any;

  beforeEach(() => {
    mockApiClient = {
      post: vi.fn().mockReturnValue(of({}))
    };
    mockTranslate = {
      instant: vi.fn().mockImplementation((key: string) => key)
    };
    service = new ProfileEmailVerificationService(mockApiClient, mockTranslate);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('countdown management', () => {
    it('should start with countdown at 0', () => {
      expect(service.getCountdownValue()).toBe(0);
    });

    it('should report countdown as not active initially', () => {
      expect(service.isCountdownActive()).toBe(false);
    });

    it('should start countdown and set value', () => {
      service.startCountdown(60);
      expect(service.getCountdownValue()).toBe(60);
      expect(service.isCountdownActive()).toBe(true);
      service.stopCountdown();
    });

    it('should stop countdown and reset to 0', () => {
      service.startCountdown(60);
      service.stopCountdown();
      expect(service.getCountdownValue()).toBe(0);
      expect(service.isCountdownActive()).toBe(false);
    });

    it('should format countdown correctly', () => {
      expect(service.formatCountdown(65)).toBe('01:05');
      expect(service.formatCountdown(0)).toBe('00:00');
      expect(service.formatCountdown(300)).toBe('05:00');
      expect(service.formatCountdown(3599)).toBe('59:59');
    });
  });

  describe('resetState', () => {
    it('should stop countdown and reset tentativi', () => {
      service.startCountdown(60);
      service.resetState();
      expect(service.getCountdownValue()).toBe(0);
    });
  });

  describe('inviaCodice', () => {
    it('should POST to /profilo/email/invia-codice with email field', () => {
      mockApiClient.post.mockReturnValue(of({ scadenza_secondi: 120 }));
      service.inviaCodice('email', 'test@example.com').subscribe();
      expect(mockApiClient.post).toHaveBeenCalledWith('/profilo/email/invia-codice', { email: 'test@example.com' });
    });

    it('should POST with email_aziendale field', () => {
      mockApiClient.post.mockReturnValue(of({ scadenza_secondi: 120 }));
      service.inviaCodice('email_aziendale', 'biz@example.com').subscribe();
      expect(mockApiClient.post).toHaveBeenCalledWith('/profilo/email/invia-codice', { email_aziendale: 'biz@example.com' });
    });

    it('should start countdown after successful response', () => {
      mockApiClient.post.mockReturnValue(of({ scadenza_secondi: 180 }));
      service.inviaCodice('email', 'test@example.com').subscribe();
      expect(service.getCountdownValue()).toBe(180);
    });

    it('should use default scadenza when not provided', () => {
      mockApiClient.post.mockReturnValue(of({}));
      service.inviaCodice('email', 'test@example.com').subscribe();
      // Default is 300 seconds
      expect(service.getCountdownValue()).toBe(300);
    });
  });

  describe('verificaCodice', () => {
    it('should POST to /profilo/email/verifica-codice', () => {
      mockApiClient.post.mockReturnValue(of({ esito: true }));
      service.verificaCodice('123456').subscribe();
      expect(mockApiClient.post).toHaveBeenCalledWith('/profilo/email/verifica-codice', { codice: '123456' });
    });

    it('should stop countdown on success', () => {
      service.startCountdown(60);
      mockApiClient.post.mockReturnValue(of({ esito: true }));
      service.verificaCodice('123456').subscribe();
      expect(service.getCountdownValue()).toBe(0);
    });

    it('should update tentativi on failed verification', () => {
      mockApiClient.post.mockReturnValue(of({ esito: false, tentativi_rimanenti: 2 }));
      let tentativiValue: number | null = null;
      service.tentativiRimanenti$.subscribe(val => tentativiValue = val);
      service.verificaCodice('wrong').subscribe();
      expect(tentativiValue).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle server error with detail', () => {
      const httpError = new HttpErrorResponse({
        error: { detail: 'PRF.400.INVALID' },
        status: 400
      });
      mockApiClient.post.mockReturnValue(throwError(() => httpError));
      // When translation returns the same key, the detail is used as-is
      mockTranslate.instant.mockImplementation((key: string) => key);

      service.inviaCodice('email', 'test@example.com').subscribe({
        error: err => {
          expect(err.status).toBe(400);
          expect(err.message).toBe('PRF.400.INVALID');
        }
      });
    });

    it('should handle server error without detail (status 429)', () => {
      const httpError = new HttpErrorResponse({
        error: {},
        status: 429
      });
      mockApiClient.post.mockReturnValue(throwError(() => httpError));
      mockTranslate.instant.mockReturnValue('translated');

      service.inviaCodice('email', 'test@example.com').subscribe({
        error: err => {
          expect(err.status).toBe(429);
        }
      });
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop countdown', () => {
      service.startCountdown(60);
      service.ngOnDestroy();
      expect(service.getCountdownValue()).toBe(0);
    });
  });
});
