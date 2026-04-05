import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RegistrazioneService } from './registrazione.service';

describe('RegistrazioneService', () => {
  let service: RegistrazioneService;
  let mockApiClient: any;
  let mockTranslate: any;

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn().mockReturnValue(of({})),
      post: vi.fn().mockReturnValue(of({}))
    };
    mockTranslate = {
      instant: vi.fn().mockImplementation((key: string) => key)
    };
    service = new RegistrazioneService(mockApiClient, mockTranslate);
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

    it('should start countdown', () => {
      service.startCountdown(60);
      expect(service.getCountdownValue()).toBe(60);
      expect(service.isCountdownActive()).toBe(true);
      service.stopCountdown();
    });

    it('should stop countdown', () => {
      service.startCountdown(60);
      service.stopCountdown();
      expect(service.getCountdownValue()).toBe(0);
      expect(service.isCountdownActive()).toBe(false);
    });

    it('should format countdown correctly', () => {
      expect(service.formatCountdown(90)).toBe('01:30');
      expect(service.formatCountdown(0)).toBe('00:00');
      expect(service.formatCountdown(300)).toBe('05:00');
    });
  });

  describe('getStato', () => {
    it('should GET /registrazione/stato', () => {
      mockApiClient.get.mockReturnValue(of({ stato: 'email_da_verificare' }));
      service.getStato().subscribe(result => {
        expect(result.stato).toBe('email_da_verificare');
      });
      expect(mockApiClient.get).toHaveBeenCalledWith('/registrazione/stato');
    });
  });

  describe('confermaEmail', () => {
    it('should POST to /registrazione/conferma-email', () => {
      mockApiClient.post.mockReturnValue(of({ scadenza_secondi: 180 }));
      service.confermaEmail().subscribe();
      expect(mockApiClient.post).toHaveBeenCalledWith('/registrazione/conferma-email', {});
    });

    it('should start countdown when scadenza_secondi is present', () => {
      mockApiClient.post.mockReturnValue(of({ scadenza_secondi: 120 }));
      service.confermaEmail().subscribe();
      expect(service.getCountdownValue()).toBe(120);
    });
  });

  describe('modificaEmail', () => {
    it('should POST to /registrazione/modifica-email with email body', () => {
      mockApiClient.post.mockReturnValue(of({ scadenza_secondi: 300 }));
      service.modificaEmail('new@example.com').subscribe();
      expect(mockApiClient.post).toHaveBeenCalledWith('/registrazione/modifica-email', { email: 'new@example.com' });
    });

    it('should start countdown from response', () => {
      mockApiClient.post.mockReturnValue(of({ scadenza_secondi: 200 }));
      service.modificaEmail('new@example.com').subscribe();
      expect(service.getCountdownValue()).toBe(200);
    });

    it('should use default scadenza when not provided', () => {
      mockApiClient.post.mockReturnValue(of({}));
      service.modificaEmail('new@example.com').subscribe();
      expect(service.getCountdownValue()).toBe(300);
    });
  });

  describe('inviaCodice', () => {
    it('should POST to /registrazione/invia-codice', () => {
      mockApiClient.post.mockReturnValue(of({ scadenza_secondi: 300 }));
      service.inviaCodice().subscribe();
      expect(mockApiClient.post).toHaveBeenCalledWith('/registrazione/invia-codice', {});
    });

    it('should start countdown', () => {
      mockApiClient.post.mockReturnValue(of({ scadenza_secondi: 150 }));
      service.inviaCodice().subscribe();
      expect(service.getCountdownValue()).toBe(150);
    });
  });

  describe('verificaCodice', () => {
    it('should POST to /registrazione/verifica-codice', () => {
      mockApiClient.post.mockReturnValue(of({ esito: true }));
      service.verificaCodice('123456').subscribe();
      expect(mockApiClient.post).toHaveBeenCalledWith('/registrazione/verifica-codice', { codice: '123456' });
    });

    it('should stop countdown on success', () => {
      service.startCountdown(60);
      mockApiClient.post.mockReturnValue(of({ esito: true }));
      service.verificaCodice('123456').subscribe();
      expect(service.getCountdownValue()).toBe(0);
    });

    it('should not stop countdown on failure', () => {
      service.startCountdown(60);
      mockApiClient.post.mockReturnValue(of({ esito: false }));
      service.verificaCodice('wrong').subscribe();
      // Countdown should still be active
      expect(service.isCountdownActive()).toBe(true);
      service.stopCountdown();
    });
  });

  describe('completaRegistrazione', () => {
    it('should POST to /registrazione/completa', () => {
      mockApiClient.post.mockReturnValue(of({}));
      service.completaRegistrazione().subscribe();
      expect(mockApiClient.post).toHaveBeenCalledWith('/registrazione/completa', {});
    });

    it('should stop countdown on completion', () => {
      service.startCountdown(60);
      mockApiClient.post.mockReturnValue(of({}));
      service.completaRegistrazione().subscribe();
      expect(service.getCountdownValue()).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle error with detail code', () => {
      const httpError = new HttpErrorResponse({
        error: { detail: 'REG.400.NO.EMAIL.JWT' },
        status: 400
      });
      mockApiClient.get.mockReturnValue(throwError(() => httpError));

      service.getStato().subscribe({
        error: err => {
          expect(err.status).toBe(400);
          expect(err.message).toBe('REG.400.NO.EMAIL.JWT');
        }
      });
    });

    it('should handle error with translated detail code', () => {
      const httpError = new HttpErrorResponse({
        error: { detail: 'REG.410.EXPIRED' },
        status: 410
      });
      mockApiClient.get.mockReturnValue(throwError(() => httpError));
      mockTranslate.instant.mockImplementation((key: string) => {
        if (key === 'APP.MESSAGE.ERROR.REG.410.EXPIRED') return 'Codice scaduto';
        return key;
      });

      service.getStato().subscribe({
        error: err => {
          expect(err.message).toBe('Codice scaduto');
        }
      });
    });

    it('should handle error without detail (status fallback)', () => {
      const httpError = new HttpErrorResponse({
        error: {},
        status: 409
      });
      mockApiClient.get.mockReturnValue(throwError(() => httpError));

      service.getStato().subscribe({
        error: err => {
          expect(err.status).toBe(409);
        }
      });
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop countdown on destroy', () => {
      service.startCountdown(60);
      service.ngOnDestroy();
      expect(service.getCountdownValue()).toBe(0);
    });
  });
});
