/**
 * Server Prompts & Response Schemas for Gemini AI Integration
 */

export const DETECT_FIELDS_PROMPT = `
You are an expert form layout analyzer for Tamil government and educational forms.
Analyze the provided form title or text and return a JSON list of detected form fields.
Each field must have:
- id: unique camelCase string
- labelTa: Tamil field label
- labelEn: English field label
- type: 'text', 'number', 'date', 'sensitive'
- isSensitive: boolean (true for Aadhaar, Phone, Bank Account, IFSC, PIN)
- required: boolean

Return ONLY valid JSON matching this schema:
{
  "fields": [
    {
      "id": "fieldName",
      "labelTa": "புலத்தின் பெயர்",
      "labelEn": "Field Name",
      "type": "text",
      "isSensitive": false,
      "required": true
    }
  ]
}
`;

export const EXTRACT_VALUES_PROMPT = `
You are an assistant for Tamil-speaking users. Extract form values from the spoken input sentence.
Note: Sensitive numbers have been replaced by placeholders like [NUM1], [NUM2]. Do NOT alter placeholders!

Return ONLY valid JSON mapping field names/IDs to extracted values:
{
  "extracted": {
    "studentName": "extracted text",
    "income": "75000",
    "aadhaar": "[NUM1]"
  },
  "confidence": 0.95
}
`;

export const EXPLAIN_FIELD_PROMPT = `
You are a patient, friendly assistant helping a Tamil user understand a government form field.
Explain the requested field in 2-3 simple Tamil sentences that anyone can understand.
Avoid complex bureaucratic jargon.

Return ONLY valid JSON:
{
  "explanationTa": "இந்த புலத்தில் உங்களின் விவரங்களை எழுதுங்கள்...",
  "explanationEn": "Simple English explanation..."
}
`;
