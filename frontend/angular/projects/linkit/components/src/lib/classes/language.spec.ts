import { Language } from './language';

describe('Language', () => {
  it('should create an instance with default values', () => {
    const lang = new Language();
    expect(lang).toBeTruthy();
    expect(lang.language).toBe('Italiano');
    expect(lang.alpha2Code).toBe('it');
    expect(lang.alpha3Code).toBe('ita');
    expect(lang.defaultLanguage).toBe(false);
  });

  it('should create an instance with provided values', () => {
    const lang = new Language({ language: 'English', alpha2Code: 'EN', alpha3Code: 'ENG', defaultLanguage: true });
    expect(lang).toBeTruthy();
    expect(lang.language).toBe('English');
    expect(lang.alpha2Code).toBe('en');
    expect(lang.alpha3Code).toBe('eng');
    expect(lang.defaultLanguage).toBe(true);
  });

  it('should ignore extra properties', () => {
    const lang = new Language({ language: 'English', alpha2Code: 'EN', alpha3Code: 'ENG', defaultLanguage: true, extra: 'extra' });
    expect((lang as any).extra).toBeUndefined();
  });

  it('should handle alpha3Code longer than 3 characters', () => {
    const lang = new Language({ alpha3Code: 'ENGG' });
    expect(lang.alpha3Code).toBe('eng');
  });

  it('should handle null and undefined values', () => {
    const lang = new Language({ language: null, alpha2Code: undefined });
    expect(lang.language).toBe('Italiano');
    expect(lang.alpha2Code).toBe('it');
  });
});