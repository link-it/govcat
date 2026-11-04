import { describe, it, expect, beforeAll } from 'vitest';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import localeEnGb from '@angular/common/locales/en-GB';
import { LocaleNumberPipe, localeDaLingua } from './locale-number.pipe';

describe('LocaleNumberPipe', () => {
  beforeAll(() => {
    registerLocaleData(localeIt, 'it');
    registerLocaleData(localeEnGb, 'en-gb');
  });

  const pipe = (lingua: string) => new LocaleNumberPipe({ currentLang: lingua, getDefaultLang: () => 'it' } as any);

  it('should format the numbers with the current language', () => {
    expect(pipe('it').transform(1000)).toBe('1.000');
    expect(pipe('en').transform(1000)).toBe('1,000');
    expect(pipe('it').transform('2500')).toBe('2.500');
  });

  it('should return null for missing values', () => {
    expect(pipe('it').transform(null)).toBeNull();
    expect(pipe('it').transform(undefined)).toBeNull();
    expect(pipe('it').transform('')).toBeNull();
  });

  it('should map the languages to the registered locales', () => {
    expect(localeDaLingua('en')).toBe('en-gb');
    expect(localeDaLingua('fr')).toBe('fr');
    expect(localeDaLingua('it')).toBe('it');
    expect(localeDaLingua(null)).toBe('it');
  });
});
