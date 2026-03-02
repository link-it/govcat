import { describe, it, expect } from 'vitest';
import { FormControl } from '@angular/forms';
import { notOnlyWhitespace, noLeadingTrailingWhitespace } from './validator';

describe('notOnlyWhitespace', () => {
  it('should return null for normal text', () => {
    const control = new FormControl('hello');
    expect(notOnlyWhitespace(control)).toBeNull();
  });

  it('should return null for text with spaces', () => {
    const control = new FormControl('hello world');
    expect(notOnlyWhitespace(control)).toBeNull();
  });

  it('should return error for only spaces', () => {
    const control = new FormControl('   ');
    expect(notOnlyWhitespace(control)).toEqual({ notOnlyWhitespace: true });
  });

  it('should return error for tabs and newlines', () => {
    const control = new FormControl('\t\n  ');
    expect(notOnlyWhitespace(control)).toEqual({ notOnlyWhitespace: true });
  });

  it('should return null for empty string', () => {
    const control = new FormControl('');
    expect(notOnlyWhitespace(control)).toBeNull();
  });

  it('should return null for null value', () => {
    const control = new FormControl(null);
    expect(notOnlyWhitespace(control)).toBeNull();
  });

  it('should return null for undefined value', () => {
    const control = new FormControl(undefined);
    expect(notOnlyWhitespace(control)).toBeNull();
  });

  it('should handle non-string values', () => {
    const control = new FormControl(123);
    expect(notOnlyWhitespace(control)).toBeNull();
  });

  it('should return null for text with leading/trailing spaces', () => {
    const control = new FormControl('  hello  ');
    expect(notOnlyWhitespace(control)).toBeNull();
  });
});

describe('noLeadingTrailingWhitespace', () => {
  it('should return null for clean text', () => {
    const control = new FormControl('hello');
    expect(noLeadingTrailingWhitespace(control)).toBeNull();
  });

  it('should return error for leading spaces', () => {
    const control = new FormControl(' hello');
    expect(noLeadingTrailingWhitespace(control)).toEqual({ noLeadingTrailingWhitespace: true });
  });

  it('should return error for trailing spaces', () => {
    const control = new FormControl('hello ');
    expect(noLeadingTrailingWhitespace(control)).toEqual({ noLeadingTrailingWhitespace: true });
  });

  it('should return error for both leading and trailing spaces', () => {
    const control = new FormControl(' hello ');
    expect(noLeadingTrailingWhitespace(control)).toEqual({ noLeadingTrailingWhitespace: true });
  });

  it('should return null for internal spaces', () => {
    const control = new FormControl('hello world');
    expect(noLeadingTrailingWhitespace(control)).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('');
    expect(noLeadingTrailingWhitespace(control)).toBeNull();
  });

  it('should return null for null value', () => {
    const control = new FormControl(null);
    expect(noLeadingTrailingWhitespace(control)).toBeNull();
  });

  it('should handle non-string values', () => {
    const control = new FormControl(123);
    expect(noLeadingTrailingWhitespace(control)).toBeNull();
  });
});
