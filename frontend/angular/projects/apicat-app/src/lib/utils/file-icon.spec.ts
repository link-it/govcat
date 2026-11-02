import { describe, it, expect } from 'vitest';
import { iconaPerFile, ICONA_FILE_GENERICA } from './file-icon';

describe('iconaPerFile', () => {
  it('should follow the MIME type, ignoring parameters', () => {
    expect(iconaPerFile('application/yaml')).toBe('bi-filetype-yml');
    expect(iconaPerFile('application/json; charset=UTF-8')).toBe('bi-filetype-json');
    expect(iconaPerFile('application/pdf')).toBe('bi-filetype-pdf');
    expect(iconaPerFile('application/problem+json')).toBe('bi-filetype-json');
  });

  it('should fall back to the file extension, then to the generic icons', () => {
    expect(iconaPerFile('application/octet-stream', 'servizio.wsdl')).toBe('bi-filetype-xml');
    expect(iconaPerFile(null, 'openapi.yml')).toBe('bi-filetype-yml');
    expect(iconaPerFile('image/webp', 'logo')).toBe('bi-file-earmark-image');
    expect(iconaPerFile('application/octet-stream', 'senza-estensione')).toBe(ICONA_FILE_GENERICA);
  });
});
