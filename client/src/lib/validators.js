/**
 * Form Validation Rules & Sanitization
 */

import { validateVerhoeff } from './verhoeff.js';

export function validateAadhaar(val) {
  if (!val) return { valid: false, message: 'ஆதார் எண் தேவை' };
  const clean = val.toString().replace(/\D/g, '');
  if (clean.length !== 12) {
    return { valid: false, message: 'ஆதார் எண் 12 இலக்கங்கள் கொண்டிருக்க வேண்டும்' };
  }
  if (!validateVerhoeff(clean)) {
    return { valid: false, message: 'செல்லுபடியாகாத ஆதார் எண் (சரிபார்ப்புத் தவறு)' };
  }
  return { valid: true, value: clean };
}

export function validatePhone(val) {
  if (!val) return { valid: false, message: 'தொலைபேசி எண் தேவை' };
  const clean = val.toString().replace(/\D/g, '');
  if (clean.length !== 10) {
    return { valid: false, message: 'தொலைபேசி எண் 10 இலக்கங்கள் கொண்டிருக்க வேண்டும்' };
  }
  if (!/^[6-9]\d{9}$/.test(clean)) {
    return { valid: false, message: 'தொலைபேசி எண் 6, 7, 8, அல்லது 9 இல் தொடங்க வேண்டும்' };
  }
  return { valid: true, value: clean };
}

export function validateBankAccount(val) {
  if (!val) return { valid: false, message: 'வங்கி கணக்கு எண் தேவை' };
  const clean = val.toString().replace(/\D/g, '');
  if (clean.length < 9 || clean.length > 18) {
    return { valid: false, message: 'வங்கி கணக்கு எண் 9 முதல் 18 இலக்கங்கள் கொண்டிருக்க வேண்டும்' };
  }
  return { valid: true, value: clean };
}

export function validateIFSC(val) {
  if (!val) return { valid: false, message: 'IFSC குறியீடு தேவை' };
  const clean = val.toString().trim().toUpperCase();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) {
    return { valid: false, message: 'செல்லுபடியாகாத IFSC குறியீடு (எ.கா: SBIN0001234)' };
  }
  return { valid: true, value: clean };
}

export function validatePIN(val) {
  if (!val) return { valid: false, message: 'அஞ்சல் குறியீடு தேவை' };
  const clean = val.toString().replace(/\D/g, '');
  if (clean.length !== 6) {
    return { valid: false, message: 'அஞ்சல் குறியீடு 6 இலக்கங்கள் இருக்க வேண்டும்' };
  }
  return { valid: true, value: clean };
}

export function validateIncome(val) {
  if (!val) return { valid: false, message: 'வருமானம் தேவை' };
  const clean = val.toString().replace(/[^0-9.]/g, '');
  const num = parseFloat(clean);
  if (isNaN(num) || num < 0) {
    return { valid: false, message: 'வருமானம் செல்லுபடியாகும் தொகையாக இருக்க வேண்டும்' };
  }
  return { valid: true, value: num };
}

export function validateAgeAndDOB(ageStr, dobStr) {
  if (!ageStr || !dobStr) return { valid: true };
  const age = parseInt(ageStr, 10);
  const dobYear = new Date(dobStr).getFullYear();
  const currentYear = new Date().getFullYear();
  if (!isNaN(age) && !isNaN(dobYear)) {
    const calculatedAge = currentYear - dobYear;
    if (Math.abs(calculatedAge - age) > 2) {
      return {
        valid: false,
        message: `வயது (${age}) மற்றும் பிறந்த தேதி ஆண்டு (${dobYear}) பொருந்தி வரவில்லை`
      };
    }
  }
  return { valid: true };
}

/**
 * Validate an entire form field values object against field schema definitions
 */
export function validateFormField(field, value) {
  if (field.required && (!value || value.toString().trim() === '')) {
    return { valid: false, message: `${field.labelTa} இன்னும் நிரப்பப்படவில்லை` };
  }
  if (!value) return { valid: true };

  const strVal = value.toString().trim();

  // Sensitive Field specific validation rules
  if (field.id === 'aadhaar' || field.isAadhaar) {
    return validateAadhaar(strVal);
  }
  if (field.id === 'phone' || field.isPhone) {
    return validatePhone(strVal);
  }
  if (field.id === 'bankAccount' || field.isBank) {
    return validateBankAccount(strVal);
  }
  if (field.id === 'ifsc' || field.isIFSC) {
    return validateIFSC(strVal);
  }
  if (field.id === 'pinCode' || field.isPIN) {
    return validatePIN(strVal);
  }
  if (field.id === 'income' || field.type === 'number') {
    return validateIncome(strVal);
  }

  return { valid: true };
}
