/**
 * Tamil & English Spoken Digit Parser & Sensitive Redaction Module
 */

// Tamil numerals mapping
const TAMIL_NUMERALS_MAP = {
  '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4',
  '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9'
};

// Spoken digit to single character digit mapping (Tamil & English)
const DIGIT_WORDS = {
  // Tamil single digits
  'பூஜ்ஜியம்': '0', 'சைபர்': '0', 'சுழி': '0', 'ஸீரோ': '0',
  'ஒன்று': '1', 'ஒன்னு': '1', 'ஒன்னும்': '1', 'ஒரு': '1',
  'இரண்டு': '2', 'ரெண்டு': '2', 'ரண்டு': '2', 'இரு': '2',
  'மூன்று': '3', 'மூனு': '3', 'முன்னு': '3',
  'நான்கு': '4', 'நாலு': '4',
  'ஐந்து': '5', 'அஞ்சு': '5',
  'ஆறு': '6',
  'ஏழு': '7',
  'எட்டு': '8',
  'ஒன்பது': '9',

  // English single digits
  'zero': '0', 'oh': '0',
  'one': '1',
  'two': '2',
  'three': '3',
  'four': '4',
  'five': '5',
  'six': '6',
  'seven': '7',
  'eight': '8',
  'nine': '9'
};

// Larger number words in Tamil (tens/hundreds/thousands)
const NUMBER_WORDS_MAP = {
  'பத்து': 10, 'இருபது': 20, 'முப்பது': 30, 'நாற்பது': 40,
  'ஐம்பது': 50, 'அறுபது': 60, 'எழுபது': 70, 'எண்பது': 80,
  'தொண்ணூறு': 90, 'நூறு': 100, 'ஆயிரம்': 1000, 'லட்சம்': 100000,
  'கோடி': 10000000,
  'ten': 10, 'twenty': 20, 'thirty': 30, 'forty': 40,
  'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80,
  'ninety': 90, 'hundred': 100, 'thousand': 1000, 'lakh': 100000
};

// Common filler words to clean up
const FILLER_WORDS = [
  'எனது', 'என்னுடைய', 'என்', 'ஆதார்', 'எண்', 'தொலைபேசி', 'போன்', 'நம்பர்',
  'வங்கி', 'கணக்கு', 'அஞ்சல்', 'குறியீடு', 'வந்து', 'ஆகும்', 'ஆகும', 'இருக்கிறது',
  'சார்', 'வணக்கம்', 'my', 'is', 'the', 'aadhaar', 'phone', 'number', 'account',
  'bank', 'pin', 'code', 'and', 'please'
];

/**
 * Replace Tamil numerals (௦-௯) with ASCII digits (0-9)
 */
export function convertTamilNumerals(text) {
  if (!text) return '';
  return text.replace(/[௦-௯]/g, (m) => TAMIL_NUMERALS_MAP[m] || m);
}

/**
 * Parse a spoken sentence containing digits/words into standardized text with digit sequences
 */
export function parseSpokenDigits(input) {
  if (!input) return '';

  // 1. Convert Tamil numerals first
  let text = convertTamilNumerals(input.toString());

  // Normalize lower case and clean spaces
  text = text.trim();

  // Split into tokens
  const tokens = text.split(/\s+/);
  const resultTokens = [];

  let i = 0;
  while (i < tokens.length) {
    let token = tokens[i].toLowerCase().replace(/[.,;:!?]/g, '');

    // Check for double repetition (இரட்டை / ரெட்டை / double)
    if (['இரட்டை', 'ரெட்டை', 'டபுள்', 'double'].includes(token)) {
      if (i + 1 < tokens.length) {
        const nextToken = tokens[i + 1].toLowerCase().replace(/[.,;:!?]/g, '');
        const digitChar = DIGIT_WORDS[nextToken] || (nextToken.match(/^\d$/) ? nextToken : null);
        if (digitChar) {
          resultTokens.push(digitChar + digitChar);
          i += 2;
          continue;
        }
      }
    }

    // Check for triple repetition (மூன்று முறை / முப்படை / திரிபிள் / triple)
    if (['முப்படை', 'திரிபிள்', 'triple'].includes(token) ||
        (token === 'மூன்று' && i + 1 < tokens.length && tokens[i + 1].toLowerCase() === 'முறை')) {
      const skipCount = (token === 'மூன்று') ? 2 : 1;
      if (i + skipCount < tokens.length) {
        const targetToken = tokens[i + skipCount].toLowerCase().replace(/[.,;:!?]/g, '');
        const digitChar = DIGIT_WORDS[targetToken] || (targetToken.match(/^\d$/) ? targetToken : null);
        if (digitChar) {
          resultTokens.push(digitChar + digitChar + digitChar);
          i += skipCount + 1;
          continue;
        }
      }
    }

    // Single digit words
    if (DIGIT_WORDS[token]) {
      resultTokens.push(DIGIT_WORDS[token]);
      i++;
      continue;
    }

    // Keep token as is
    resultTokens.push(tokens[i]);
    i++;
  }

  // Join adjacent single digits together (e.g. ["1", "2", "3", "4"] -> "1234")
  let joined = '';
  let currentDigitBuffer = '';

  const finalTokens = [];
  for (const tok of resultTokens) {
    // If token is purely digits
    if (/^\d+$/.test(tok)) {
      currentDigitBuffer += tok;
    } else {
      if (currentDigitBuffer) {
        finalTokens.push(currentDigitBuffer);
        currentDigitBuffer = '';
      }
      finalTokens.push(tok);
    }
  }
  if (currentDigitBuffer) {
    finalTokens.push(currentDigitBuffer);
  }

  return finalTokens.join(' ');
}

/**
 * Replace sensitive numeric runs (>=6 digits or specific patterns) with placeholders [NUM1], [NUM2]
 * Ensures sensitive data is NEVER sent to backend Gemini API.
 */
export function replaceSensitivePlaceholders(text) {
  if (!text) return { sanitizedText: '', numericMap: {} };

  // First parse spoken digits to capture spoken Aadhaar/Phone
  const parsedText = parseSpokenDigits(text);
  const numericMap = {};
  let counter = 1;

  // Regex matches digit sequences of 6 or more digits, or IFSC-like formats
  const sanitizedText = parsedText.replace(/\b\d{6,18}\b/g, (match) => {
    const placeholder = `[NUM${counter}]`;
    numericMap[placeholder] = match;
    counter++;
    return placeholder;
  });

  return { sanitizedText, numericMap };
}

/**
 * Restore placeholders [NUM1], [NUM2] with their original numeric values
 */
export function restorePlaceholders(text, numericMap) {
  if (!text || !numericMap) return text || '';
  let result = text;
  for (const [placeholder, val] of Object.entries(numericMap)) {
    result = result.replace(placeholder, val);
  }
  return result;
}

/**
 * Remove filler words from transcript
 */
export function stripFillerWords(text) {
  if (!text) return '';
  const words = text.split(/\s+/);
  return words
    .filter(w => !FILLER_WORDS.includes(w.toLowerCase().replace(/[.,;:!?]/g, '')))
    .join(' ');
}
