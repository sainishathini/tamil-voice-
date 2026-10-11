import React, { useState } from 'react';
import {
  FileCheck2,
  Volume2,
  Download,
  Mic,
  Save,
  Lock,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  X
} from 'lucide-react';
import ta from '../i18n/ta.js';
import en from '../i18n/en.js';
import { speakTamil } from '../lib/speech.js';
import { validateFormField, validateAgeAndDOB } from '../lib/validators.js';
import { encryptValue, maskSensitiveValue } from '../lib/crypto.js';
import { exportFormToPDF, downloadPDF } from '../lib/pdfExport.js';

export default function FormReview({
  lang,
  currentForm,
  user,
  setFormValues,
  onNavigateFilling,
  onRecordSaved,
  onClearForm,
  onOpenAuthModal
}) {
  const t = lang === 'ta' ? ta : en;

  const [passwordForSave, setPasswordForSave] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPdfOptionsModal, setShowPdfOptionsModal] = useState(false);
  const [isPrivacyExport, setIsPrivacyExport] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editingFieldValue, setEditingFieldValue] = useState('');
  const [editValidationError, setEditValidationError] = useState('');

  const fields = currentForm?.fields || [];
  const formValues = currentForm?.formValues || {};

  // Compute validation warnings & missing required fields
  const missingRequired = fields.filter(
    f => f.required && (!formValues[f.id] || String(formValues[f.id]).trim() === '')
  );

  const validationWarnings = [];

  // Cross-field checks
  const ageDobCheck = validateAgeAndDOB(formValues.age, formValues.dob);
  if (!ageDobCheck.valid) {
    validationWarnings.push(ageDobCheck.message);
  }

  // Field validation checks
  fields.forEach(f => {
    const val = formValues[f.id];
    if (val) {
      const res = validateFormField(f, val);
      if (!res.valid) {
        validationWarnings.push(`${f.labelTa}: ${res.message}`);
      }
    }
  });

  const completionPercentage = Math.round(
    ((fields.length - missingRequired.length) / Math.max(1, fields.length)) * 100
  );

  const startTextEdit = (field) => {
    setEditingFieldId(field.id);
    setEditingFieldValue(formValues[field.id] || '');
    setEditValidationError('');
  };

  const saveTextEdit = (field) => {
    const validation = validateFormField(field, editingFieldValue);
    if (!validation.valid) {
      setEditValidationError(validation.message);
      return;
    }

    setFormValues(values => ({ ...values, [field.id]: editingFieldValue }));
    setEditingFieldId(null);
    setEditingFieldValue('');
    setEditValidationError('');
  };

  // Review Form Aloud
  const handleReviewAloud = () => {
    let summaryText = `படிவம் ${currentForm.titleTa}. நிறைவு நிலை ${completionPercentage} சதவீதம். `;
    fields.forEach(f => {
      const val = formValues[f.id];
      if (val) {
        summaryText += `${f.labelTa}, ${val}. `;
      } else if (f.required) {
        summaryText += `${f.labelTa} இன்னும் நிரப்பப்படவில்லை. `;
      }
    });
    speakTamil(summaryText, 1.0, true);
  };

  // Secure Save Handler
  const handleSaveRecord = async () => {
    if (!user) {
      onOpenAuthModal();
      return;
    }
    if (!passwordForSave) return;

    setIsSaving(true);
    setSaveStatusMsg('');

    try {
      const nonSensitiveData = {};
      const sensitiveFields = [];

      for (const field of fields) {
        const val = formValues[field.id] || '';
        if (field.isSensitive && val) {
          // Encrypt client-side using password
          const encrypted = await encryptValue(val, passwordForSave);
          const masked = maskSensitiveValue(val, field.id);
          sensitiveFields.push({
            fieldName: field.id,
            maskedValue: masked,
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            salt: encrypted.salt
          });
        } else {
          nonSensitiveData[field.id] = val;
        }
      }

      // Send to server
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          formTitle: currentForm.titleTa || currentForm.title,
          formType: currentForm.id,
          nonSensitiveData,
          sensitiveFields
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSaveStatusMsg(lang === 'ta' ? 'படிவம் பாதுகாப்பாக சேமிக்கப்பட்டது!' : 'Form saved securely!');
        setShowPasswordModal(false);
        setPasswordForSave('');
        if (onRecordSaved) onRecordSaved();
      } else {
        setSaveStatusMsg(data.error || 'சேமிப்பதில் தோல்வி');
      }
    } catch (err) {
      setSaveStatusMsg('பிழை: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // PDF Export Handler
  const handleExportPDF = async () => {
    try {
      const pdfBytes = await exportFormToPDF(
        currentForm.titleTa || currentForm.title,
        fields,
        formValues,
        isPrivacyExport
      );
      downloadPDF(pdfBytes, `${currentForm.id}_summary.pdf`);
      setShowPdfOptionsModal(false);
    } catch (err) {
      alert('PDF உருவாக்கத்தில் பிழை: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Review Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
              <FileCheck2 className="w-7 h-7 text-blue-700" />
              <span>{t.reviewScreenTitle}</span>
            </h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              {currentForm.titleTa} ({currentForm.titleEn})
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReviewAloud}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl text-sm flex items-center space-x-2 transition-colors touch-target"
            >
              <Volume2 className="w-5 h-5 text-blue-700" />
              <span>{t.reviewAloudBtn}</span>
            </button>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>{t.completionPercentage}</span>
            <span className="text-blue-700 font-extrabold">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Warnings & Missing Fields Section */}
      {(missingRequired.length > 0 || validationWarnings.length > 0) && (
        <div className="space-y-3">
          
          {missingRequired.length > 0 && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 rounded-r-2xl space-y-1">
              <h4 className="font-extrabold text-sm flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>{t.missingRequiredNotice}</span>
              </h4>
              <p className="text-sm font-bold pl-7">
                {missingRequired.map(f => f.labelTa).join(', ')} ({missingRequired.map(f => f.labelEn).join(', ')})
              </p>
            </div>
          )}

          {validationWarnings.map((warn, idx) => (
            <div key={idx} className="p-4 bg-red-50 border-l-4 border-red-500 text-red-900 rounded-r-2xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="text-sm font-bold">{warn}</span>
            </div>
          ))}

        </div>
      )}

      {/* Field Review Table / Card List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-lg">{lang === 'ta' ? 'பூர்த்தி செய்த விவரங்கள்:' : 'Entered Details:'}</h3>

        <div className="divide-y divide-slate-100">
          {fields.map((f, idx) => {
            const val = formValues[f.id] || '';
            const isMissing = f.required && !val;
            return (
              <div key={f.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1 w-full">
                  <span className="text-xs font-bold text-slate-500 block">
                    {idx + 1}. {f.labelTa} ({f.labelEn})
                  </span>
                  {editingFieldId === f.id ? (
                    <div className="mt-2 space-y-2">
                      <input
                        autoFocus
                        type={f.isSensitive ? 'password' : f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                        value={editingFieldValue}
                        onChange={(event) => {
                          setEditingFieldValue(event.target.value);
                          setEditValidationError('');
                        }}
                        aria-label={`${t.editingText}: ${f.labelTa}`}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      {editValidationError && (
                        <p role="alert" className="text-sm font-semibold text-red-700">{editValidationError}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => saveTextEdit(f)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold touch-target"
                        >
                          <Save className="w-4 h-4" />
                          <span>{t.saveChanges}</span>
                        </button>
                        <button
                          onClick={() => { setEditingFieldId(null); setEditValidationError(''); }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold touch-target"
                        >
                          <X className="w-4 h-4" />
                          <span>{t.cancel}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      {val ? (
                        f.isSensitive ? maskSensitiveValue(val, f.id) : val
                      ) : (
                        <span className="text-amber-600 italic text-sm font-semibold">
                          {lang === 'ta' ? '[இன்னும் நிரப்பப்படவில்லை]' : '[Not completed]'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!editingFieldId && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      onClick={() => startTextEdit(f)}
                      className="px-3 py-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-xs font-bold flex items-center gap-1.5 touch-target"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>{t.editingText}</span>
                    </button>
                    <button
                      onClick={() => onNavigateFilling(f.id)}
                      className="px-3 py-2 text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors text-xs font-bold flex items-center gap-1.5 touch-target"
                    >
                      <Mic className="w-4 h-4" />
                      <span>{t.editingVoice}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Status Message */}
      {saveStatusMsg && (
        <div className="p-4 bg-emerald-100 text-emerald-900 font-bold rounded-2xl text-center">
          {saveStatusMsg}
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <button
          onClick={() => setShowPasswordModal(true)}
          className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-98 touch-target"
        >
          <Lock className="w-5 h-5" />
          <span>{t.saveSecurelyBtn}</span>
        </button>

        <button
          onClick={() => setShowPdfOptionsModal(true)}
          className="py-4 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-base rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-98 touch-target"
        >
          <Download className="w-5 h-5" />
          <span>{t.downloadPdfBtn}</span>
        </button>

        <button
          onClick={onClearForm}
          className="py-4 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-extrabold text-base rounded-2xl border border-slate-200 flex items-center justify-center space-x-2 transition-colors touch-target"
        >
          <Trash2 className="w-5 h-5" />
          <span>{t.clearAllBtn}</span>
        </button>

      </div>

      {/* Save Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <span>{lang === 'ta' ? 'கடவுச்சொல் உறுதிப்படுத்தல்' : 'Confirm Password for Encryption'}</span>
              </h3>
              <p className="text-xs text-slate-600">
                {lang === 'ta'
                  ? 'உங்கள் ரகசிய எண்கள் AES-GCM 256-bit மூலம் குறியாக்கம் செய்ய உங்களின் கணக்கு கடவுச்சொல்லை உள்ளிடவும்.'
                  : 'Enter your account password to client-side encrypt sensitive fields via AES-GCM 256-bit.'}
              </p>
            </div>

            <input
              type="password"
              value={passwordForSave}
              onChange={(e) => setPasswordForSave(e.target.value)}
              placeholder={t.passwordLabel}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveRecord}
                disabled={isSaving || !passwordForSave}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md"
              >
                {isSaving ? t.loading : t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Options Modal */}
      {showPdfOptionsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
                <Download className="w-6 h-6 text-blue-700" />
                <span>{lang === 'ta' ? 'PDF பதிவிறக்க விருப்பங்கள்' : 'PDF Export Options'}</span>
              </h3>
              <p className="text-xs text-slate-600">
                {lang === 'ta' ? 'அச்சிட விரும்புவதற்கேற்ப PDF வகையைத் தேர்ந்தெடுக்கவும்.' : 'Choose the PDF export format.'}
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start space-x-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  name="pdfOpt"
                  checked={!isPrivacyExport}
                  onChange={() => setIsPrivacyExport(false)}
                  className="mt-1"
                />
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {lang === 'ta' ? 'முழுமையான PDF (அனைத்து விவரங்களுடன்)' : 'Full PDF (Includes sensitive values)'}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {lang === 'ta' ? 'அனைத்து எண்களும் முழுமையாக அச்சிடப்படும்.' : 'Includes full Aadhaar & Phone numbers.'}
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  name="pdfOpt"
                  checked={isPrivacyExport}
                  onChange={() => setIsPrivacyExport(true)}
                  className="mt-1"
                />
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {lang === 'ta' ? 'தனியுரிமைப் பாதுகாப்பு PDF (மறைக்கப்பட்ட விவரங்கள்)' : 'Privacy-Preserving PDF (Sensitive values omitted)'}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {lang === 'ta' ? 'ரகசிய எண்கள் தவிர்க்கப்பட்டு அச்சிடப்படும்.' : 'Omits sensitive digits for public safety.'}
                  </span>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPdfOptionsModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm shadow-md"
              >
                {lang === 'ta' ? 'பதிவிறக்கு' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
