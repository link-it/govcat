import { describe, it, expect, beforeEach } from 'vitest';
import { PermessiService, PermessiMenu } from './permessi.service';

describe('PermessiService', () => {
  let service: PermessiService;

  const permessi: PermessiMenu = {
    soggetti: { lettura: ['gestore', 'coordinatore'], scrittura: ['gestore'] },
    organizzazioni: { lettura: ['gestore'], scrittura: ['gestore'] },
    generale: { lettura: ['coordinatore'], scrittura: [] }
  };

  beforeEach(() => {
    service = new PermessiService();
  });

  describe('verificaPermessi', () => {
    it('should return canRead true when user role is in lettura', () => {
      const result = service.verificaPermessi(['coordinatore'], 'soggetti', permessi);
      expect(result.canRead).toBe(true);
      expect(result.canWrite).toBe(false);
    });

    it('should return canWrite true when user role is in scrittura', () => {
      const result = service.verificaPermessi(['gestore'], 'soggetti', permessi);
      expect(result.canRead).toBe(true);
      expect(result.canWrite).toBe(true);
    });

    it('should return both false when user role has no permissions', () => {
      const result = service.verificaPermessi(['referente'], 'soggetti', permessi);
      expect(result.canRead).toBe(false);
      expect(result.canWrite).toBe(false);
    });

    it('should fallback to generale when menu not found', () => {
      const result = service.verificaPermessi(['coordinatore'], 'unknown_menu', permessi);
      expect(result.canRead).toBe(true);
      expect(result.canWrite).toBe(false);
    });

    it('should return false when menu not found and no generale fallback', () => {
      const noGenerale: PermessiMenu = { soggetti: { lettura: ['gestore'], scrittura: [] } };
      const result = service.verificaPermessi(['gestore'], 'unknown_menu', noGenerale);
      expect(result.canRead).toBe(false);
      expect(result.canWrite).toBe(false);
    });

    it('should handle multiple roles', () => {
      const result = service.verificaPermessi(['referente', 'coordinatore'], 'soggetti', permessi);
      expect(result.canRead).toBe(true);
    });

    it('should handle empty roles', () => {
      const result = service.verificaPermessi([], 'soggetti', permessi);
      expect(result.canRead).toBe(false);
      expect(result.canWrite).toBe(false);
    });
  });

  describe('getFallbackPermessi', () => {
    it('should use generale permissions', () => {
      const result = service.getFallbackPermessi(['coordinatore'], permessi);
      expect(result.canRead).toBe(true);
    });

    it('should return false when no generale key', () => {
      const result = service.getFallbackPermessi(['gestore'], { soggetti: { lettura: [], scrittura: [] } });
      expect(result.canRead).toBe(false);
      expect(result.canWrite).toBe(false);
    });
  });
});
