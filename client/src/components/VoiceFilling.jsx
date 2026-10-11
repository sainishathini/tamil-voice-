import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Check,
  RotateCcw,
  SkipForward,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ListOrdered,
  Layers,
  ArrowRight
} from 'lucide-react';
import ta from '../i18n/ta.js';
import en from '../i18n/en.js';
import { speakTamil, stopSpeaking, startTamilListening, stopTamilListening } from '../lib/speech.js';
import { parseSpokenDigits, replaceSensitivePlaceholders, restorePlaceholders, stripFillerWords } from '../lib/digitParser.js';
import { validateFormField, validateAadhaar, validatePhone, validateBankAccount, validateIFSC, validatePIN } from '../lib/validators.js';
import { DEMO_SENTENCES } from '../lib/sampleForms.js';

export default function VoiceFilling({
  lang,
  currentForm,
  initialFieldId,
  setFormValues,
  onOpenFieldHelp,
  onNavigateReview,
  onFinishFieldEdit
}) {
  const t = lang === 'ta' ? ta : en;
  const isSingleFieldEdit = Boolean(initialFieldId);

  const [mode, setMode] = useState('guided'); // 'guided' | 'all-at-once'
  const [currentFieldIndex, setCurrentFieldIndex] = useState(() => {
    const index = currentForm?.fields?.findIndex(field => field.id === initialFieldId) ?? -1;
    return index >= 0 ? index : 0;
  });
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [validationError, setValidationError] = useState('');

  // All-at-once mode states
  const [paragraphInput, setParagraphInput] = useState('');
  const [extractedValues, setExtractedValues] = useState({});
  const [isExtracting, setIsExtracting] = useState(false);

  const fields = currentForm?.fields || [];
  const activeField = fields[currentFieldIndex];
  const formValues = currentForm?.formValues || {};

  // Sync editing value when current field changes
  useEffect(() => {
    if (activeField) {
      const existingVal = formValues[activeField.id] || '';
      setEditingValue(existingVal);
      setTranscript(existingVal);
      setValidationError('');
      setIsConfirmStep(false);

      // Auto read question aloud in guided mode
      if (mode === 'guided') {
        const questionText = `${activeField.labelTa} என்ன?`;
        speakTamil(questionText, 1.0, true);
      }
    }
  }, [currentFieldIndex, mode, currentForm]);

  if (!currentForm || fields.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 max-w-xl mx-auto">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900">{t.noRecentForm}</h3>
        <p className="text-sm text-slate-600">{lang === 'ta' ? 'முதலில் ஒரு புதிய படிவத்தைத் தொடங்குங்கள்.' : 'Please start a new form first.'}</p>
      </div>
    );
  }

  // Handle Speech Recognition for Guided Mode
  const toggleListening = () => {
    if (isListening) {
      stopTamilListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      startTamilListening({
        lang: 'ta-IN',
        onResult: (text, isFinal) => {
          setTranscript(text);
          setEditingValue(text);
          if (isFinal) {
            setIsListening(false);
            handleSpokenResult(text);
          }
        },
        onError: (err) => {
          setIsListening(false);
          setValidationError('பேச்சு அங்கீகாரப் பிழை: ' + err);
        },
        onEnd: () => setIsListening(false)
      });
    }
  };

  // Process Spoken Result
  const handleSpokenResult = (spokenText) => {
    const parsed = parseSpokenDigits(spokenText);
    const cleaned = stripFillerWords(parsed);
    setEditingValue(cleaned);

    // Validate
    const validation = validateFormField(activeField, cleaned);
    if (!validation.valid) {
      setValidationError(validation.message);
      speakTamil(validation.message, 1.0, true);
    } else {
      setValidationError('');
      setIsConfirmStep(true);
      speakTamil(`${cleaned}. சரியா?`, 1.0, true);
    }
  };

  // Confirm current field value
  const handleConfirmValue = (valToConfirm = editingValue) => {
    const finalVal = valToConfirm || editingValue;
    const validation = validateFormField(activeField, finalVal);

    if (!validation.valid) {
      setValidationError(validation.message);
      speakTamil(validation.message, 1.0, true);
      return;
    }

    setFormValues({ ...formValues, [activeField.id]: finalVal });
    setIsConfirmStep(false);
    setValidationError('');

    if (isSingleFieldEdit) {
      onFinishFieldEdit();
      return;
    }

    // Advance to next field if available
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1);
    } else {
      speakTamil('அனைத்து புலங்களும் பூர்த்தி செய்யப்பட்டன.', 1.0, true);
    }
  };

  // Repeat question aloud
  const handleRepeatQuestion = () => {
    stopSpeaking();
    speakTamil(`${activeField.labelTa} என்ன?`, 1.0, true);
  };

  // Process All-at-once Spoken Paragraph
  const handleProcessParagraph = async (textToProcess = paragraphInput) => {
    if (!textToProcess.trim()) return;

    setIsExtracting(true);
    setValidationError('');

    // Step 1: Replace sensitive numeric sequences with placeholders [NUM1] client-side!
    const { sanitizedText, numericMap } = replaceSensitivePlaceholders(textToProcess);

    try {
      // Step 2: Send sanitized text (NEVER sensitive numbers) to backend
      const res = await fetch('http://localhost:5000/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: sanitizedText,
          fields: fields.map(f => ({ id: f.id, labelTa: f.labelTa, labelEn: f.labelEn, isSensitive: f.isSensitive }))
        })
      });

      const data = await res.json();
      let extracted = data.extracted || {};

      // Step 3: Restore placeholders with original values
      const restored = {};
      for (const [k, v] of Object.entries(extracted)) {
        restored[k] = restorePlaceholders(v, numericMap);
      }

      setExtractedValues(restored);

      // Merge into form values
      const newValues = { ...formValues, ...restored };
      setFormValues(newValues);

      speakTamil('தகவல்கள் எடுக்கப்பட்டன. சரிபார்த்து உறுதிசெய்யவும்.', 1.0, true);
    } catch (err) {
      console.warn('Extraction API failed, using client digit parser fallback:', err);

      // Client Fallback extraction
      const fallbackExtracted = {};
      for (const field of fields) {
        if (field.isSensitive) {
          const numbers = Object.values(numericMap);
          if (numbers.length > 0) {
            fallbackExtracted[field.id] = numbers[0];
          }
        }
      }
      setExtractedValues(fallbackExtracted);
      setFormValues({ ...formValues, ...fallbackExtracted });
    } finally {
      setIsExtracting(false);
    }
  };

  // Run Demo Sentence Flow
  const handleRunDemo = (demo) => {
    if (demo.parsedMap) {
      setParagraphInput(demo.textTa);
      setFormValues({ ...formValues, ...demo.parsedMap });
      setExtractedValues(demo.parsedMap);
      speakTamil('மாதிரி வாக்கியம் வெற்றிகரமாகச் சேர்க்கப்பட்டது.', 1.0, true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Mode Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Mic className="w-6 h-6 text-blue-700" />
            <span>{currentForm.titleTa || currentForm.title}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSingleFieldEdit ? t.editingSingleField : t.chooseFillingMode}
          </p>
        </div>

        {isSingleFieldEdit ? (
          <button
            onClick={onFinishFieldEdit}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm touch-target"
          >
            {t.cancel}
          </button>
        ) : (
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setMode('guided')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-bold text-xs transition-all touch-target ${
              mode === 'guided' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>{t.guidedModeTitle.split(' ')[0]}</span>
          </button>
          <button
            onClick={() => setMode('all-at-once')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-bold text-xs transition-all touch-target ${
              mode === 'all-at-once' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.allAtOnceTitle.split(' ')[0]}</span>
          </button>
        </div>
        )}
      </div>

      {/* Sensitive Data Protection Notice Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs font-semibold flex items-center space-x-3">
        <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
        <span>{t.sensitiveNotice}</span>
      </div>

      {/* MODE A: GUIDED VOICE FILLING (FIELD-BY-FIELD) */}
      {mode === 'guided' && activeField && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg space-y-6">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-100 pb-4">
            <span>
              {lang === 'ta' ? `புலம் ${currentFieldIndex + 1} / ${fields.length}` : `Field ${currentFieldIndex + 1} of ${fields.length}`}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenFieldHelp(activeField)}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-semibold"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{t.whatIsThis}</span>
              </button>
            </div>
          </div>

          {/* Question Display Card */}
          <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-3 relative overflow-hidden shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {activeField.labelEn}
              </span>
              {activeField.isSensitive && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-amber-500 text-slate-950 rounded-full">
                  {lang === 'ta' ? 'ரகசிய புலம்' : 'Sensitive Field'}
                </span>
              )}
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {activeField.labelTa}?
            </h3>

            <p className="text-slate-400 text-xs sm:text-sm">
              {lang === 'ta' ? 'பதிலைக் கூற கீழே உள்ள மைக்ரோஃபோன் பொத்தானை அழுத்தவும்.' : 'Click mic button below to answer.'}
            </p>
          </div>

          {/* Validation Warning */}
          {validationError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Speech Result Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase">{t.spokeText}</label>
            <div className="text-xl font-bold text-slate-900 min-h-[40px] flex items-center">
              {editingValue || <span className="text-slate-400 italic text-base">{lang === 'ta' ? 'இன்னும் பேசப்படவில்லை...' : 'Not spoken yet...'}</span>}
            </div>
          </div>

          {/* Confirmation Question */}
          {isConfirmStep && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span className="font-extrabold text-lg">{t.isThisCorrect}</span>
              </div>
              <button
                onClick={() => handleConfirmValue()}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95"
              >
                {t.btnConfirm}
              </button>
            </div>
          )}

          {/* Mic Button & Speech Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
            <button
              onClick={toggleListening}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center space-x-3 shadow-xl transition-all active:scale-95 touch-target ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse shadow-red-900/40'
                  : 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-900/30'
              }`}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              <span>{isListening ? t.btnListening : t.btnStartMic}</span>
            </button>

            <button
              onClick={handleRepeatQuestion}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center space-x-2 text-sm touch-target"
            >
              <Volume2 className="w-5 h-5 text-blue-700" />
              <span>{t.btnRepeat}</span>
            </button>
          </div>

          {/* Typed Input Fallback */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-slate-500">{t.typedInputFallback}</label>
            <div className="flex gap-2">
              <input
                type={activeField.type === 'number' ? 'number' : activeField.type === 'date' ? 'date' : 'text'}
                value={editingValue}
                onChange={(e) => { setEditingValue(e.target.value); setIsConfirmStep(false); }}
                placeholder={`${activeField.labelTa} தட்டச்சு செய்க`}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={() => handleConfirmValue()}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm touch-target"
              >
                {t.btnConfirm}
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          {!isSingleFieldEdit && <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentFieldIndex(Math.max(0, currentFieldIndex - 1))}
              disabled={currentFieldIndex === 0}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center space-x-1 disabled:opacity-40 touch-target"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t.btnPrevious}</span>
            </button>

            <span className="text-xs font-bold text-slate-400">
              {currentFieldIndex + 1} / {fields.length}
            </span>

            <button
              onClick={() => setCurrentFieldIndex(Math.min(fields.length - 1, currentFieldIndex + 1))}
              disabled={currentFieldIndex === fields.length - 1}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center space-x-1 disabled:opacity-40 touch-target"
            >
              <span>{t.btnNext}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>}

        </div>
      )}

      {/* MODE B: SPEAK EVERYTHING AT ONCE (FULL SENTENCE) */}
      {!isSingleFieldEdit && mode === 'all-at-once' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">{t.allAtOnceTitle}</h3>
            <p className="text-sm text-slate-600">{t.allAtOnceDesc}</p>
          </div>

          {/* Spoken Text Area */}
          <div className="space-y-2">
            <textarea
              rows={4}
              value={paragraphInput}
              onChange={(e) => setParagraphInput(e.target.value)}
              placeholder="எ.கா: என் பெயர் மாதிரி செல்வன். வயது 20. எனது ஆதார் 236589741258. போன் 9876543210..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Speech Mic & Extraction Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={toggleListening}
              className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm touch-target ${
                isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <Mic className="w-5 h-5 text-blue-700" />
              <span>{isListening ? t.btnListening : t.btnStartMic}</span>
            </button>

            <button
              onClick={() => handleProcessParagraph()}
              disabled={isExtracting || !paragraphInput.trim()}
              className="flex-1 py-3.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center space-x-2 text-sm shadow-md touch-target"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>{isExtracting ? t.loading : (lang === 'ta' ? 'தகவல்களைப் பிரித்தெடு' : 'Extract Form Values')}</span>
            </button>
          </div>

          {/* Extracted Values Review Grid */}
          {Object.keys(formValues).length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-base">{lang === 'ta' ? 'பிரித்தெடுக்கப்பட்ட விவரங்கள்:' : 'Extracted Details:'}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map((f) => {
                  const val = formValues[f.id] || '';
                  const validation = validateFormField(f, val);
                  return (
                    <div
                      key={f.id}
                      className={`p-3.5 rounded-xl border ${
                        !val
                          ? 'bg-amber-50/50 border-amber-200'
                          : validation.valid
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-red-50/50 border-red-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-500 block">{f.labelTa} ({f.labelEn})</span>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setFormValues({ ...formValues, [f.id]: e.target.value })}
                        placeholder="இன்னும் பெறப்படவில்லை"
                        className="w-full bg-transparent font-bold text-slate-900 text-sm focus:outline-none mt-1"
                      />
                      {!validation.valid && <span className="text-[10px] text-red-600 font-bold block mt-1">{validation.message}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* DEMO MODE: CLICKABLE TAMIL SAMPLE SENTENCES */}
      {!isSingleFieldEdit && <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-lg">
        <div>
          <h3 className="text-lg font-bold flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{t.demoSentencesTitle}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">{t.demoSentencesDesc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEMO_SENTENCES.map((demo) => (
            <div
              key={demo.id}
              onClick={() => handleRunDemo(demo)}
              className="p-4 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-2xl cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">
                  {lang === 'ta' ? demo.titleTa : demo.titleEn}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-300 line-clamp-2 italic font-mono bg-slate-950/50 p-2 rounded-lg">
                "{demo.textTa}"
              </p>
            </div>
          ))}
        </div>
      </div>
      }

      {/* Bottom CTA to Form Review */}
      {!isSingleFieldEdit && <div className="flex justify-end">
        <button
          onClick={onNavigateReview}
          className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-lg rounded-2xl shadow-lg flex items-center space-x-2 transition-transform active:scale-95 touch-target"
        >
          <span>{lang === 'ta' ? 'படிவச் சரிபார்ப்பிற்குச் செல்க' : 'Proceed to Form Review'}</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>}

    </div>
  );
}
