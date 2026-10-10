import { describe, it, expect } from 'vitest';
import { validateVerhoeff, generateVerhoeff } from './verhoeff.js';
import {
  parseSpokenDigits,
  convertTamilNumerals,
  replaceSensitivePlaceholders,
  restorePlaceholders,
  stripFillerWords
} from './digitParser.js';
import {
  validateAadhaar,
  validatePhone,
  validateBankAccount,
  validateIFSC,
  validatePIN
} from './validators.js';

describe('Verhoeff Algorithm Tests', () => {
  it('should validate correct Verhoeff checksums', () => {
    const validCheckDigit = generateVerhoeff('23658974125');
    const validAadhaar = '23658974125' + validCheckDigit;
    expect(validateVerhoeff(validAadhaar)).toBe(true);
    expect(validateVerhoeff('123456789012')).toBe(false); // Invalid checksum
  });

  it('should reject non-numeric or empty strings', () => {
    expect(validateVerhoeff('')).toBe(false);
    expect(validateVerhoeff('abc')).toBe(false);
  });
});

describe('Digit Parser Tests', () => {
  it('should parse Tamil digit words correctly', () => {
    const input = 'ஒன்று இரண்டு மூன்று நான்கு ஐந்து ஆறு ஏழு எட்டு ஒன்பது பூஜ்ஜியம்';
    expect(parseSpokenDigits(input)).toBe('1234567890');
  });

  it('should parse English digit words correctly', () => {
    const input = 'nine eight seven six five four three two one zero';
    expect(parseSpokenDigits(input)).toBe('9876543210');
  });

  it('should handle mixed digit input', () => {
    const input = 'ஆதார் 9 8 ஏழு ஆறு 5 4';
    expect(parseSpokenDigits(input)).toBe('ஆதார் 987654');
  });

  it('should handle double and triple repetition', () => {
    expect(parseSpokenDigits('இரட்டை ஒன்பது')).toBe('99');
    expect(parseSpokenDigits('double five')).toBe('55');
    expect(parseSpokenDigits('triple zero')).toBe('000');
    expect(parseSpokenDigits('முப்படை ஆறு')).toBe('666');
  });

  it('should convert Tamil numerals', () => {
    expect(convertTamilNumerals('ஆதார் ௨௩௬௫௮௯')).toBe('ஆதார் 236589');
  });

  it('should strip filler words', () => {
    const input = 'எனது ஆதார் எண் 236589741258 ஆகும்';
    expect(stripFillerWords(input)).toBe('236589741258');
  });

  it('should replace sensitive numeric runs with placeholders', () => {
    const text = 'ஆதார் எண் 236589741258 மற்றும் போன் 9876543210';
    const { sanitizedText, numericMap } = replaceSensitivePlaceholders(text);

    expect(sanitizedText).not.toContain('236589741258');
    expect(sanitizedText).not.toContain('9876543210');
    expect(sanitizedText).toContain('[NUM1]');
    expect(sanitizedText).toContain('[NUM2]');
    expect(numericMap['[NUM1]']).toBe('236589741258');
    expect(numericMap['[NUM2]']).toBe('9876543210');
  });

  it('should restore placeholders accurately', () => {
    const text = 'ஆதார் [NUM1] போன் [NUM2]';
    const map = { '[NUM1]': '236589741258', '[NUM2]': '9876543210' };
    expect(restorePlaceholders(text, map)).toBe('ஆதார் 236589741258 போன் 9876543210');
  });
});

describe('Validation Rules Tests', () => {
  it('should validate phone numbers correctly', () => {
    expect(validatePhone('9876543210').valid).toBe(true);
    expect(validatePhone('1234567890').valid).toBe(false); // Invalid start digit
    expect(validatePhone('98765').valid).toBe(false); // Short
  });

  it('should validate bank account numbers correctly', () => {
    expect(validateBankAccount('12345678901').valid).toBe(true);
    expect(validateBankAccount('1234').valid).toBe(false);
  });

  it('should validate IFSC codes correctly', () => {
    expect(validateIFSC('SBIN0001234').valid).toBe(true);
    expect(validateIFSC('sbin0001234').valid).toBe(true); // Should normalize
    expect(validateIFSC('INVALID_IFSC').valid).toBe(false);
  });

  it('should validate PIN codes correctly', () => {
    expect(validatePIN('600001').valid).toBe(true);
    expect(validatePIN('60001').valid).toBe(false);
  });
});
