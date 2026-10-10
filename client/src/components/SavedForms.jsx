import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  Clock,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import ta from '../i18n/ta.js';
import en from '../i18n/en.js';
import { decryptValue } from '../lib/crypto.js';

export default function SavedForms({ lang, user, onOpenAuthModal }) {
  const t = lang === 'ta' ? ta : en;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reveal Modal states
  const [revealModalRecord, setRevealModalRecord] = useState(null);
  const [revealModalField, setRevealModalField] = useState(null);
  const [authInput, setAuthInput] = useState('');
  const [revealedValue, setRevealedValue] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [authError, setAuthError] = useState('');
  const [isAccessLocked, setIsAccessLocked] = useState(false);

  // Fetch records on mount
  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  // Handle 10-second countdown for auto-masking revealed value
  useEffect(() => {
    let timer = null;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0 && revealedValue) {
      setRevealedValue(null);
      setRevealModalRecord(null);
      setAuthInput('');
    }
    return () => clearInterval(timer);
  }, [countdown, revealedValue]);

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/records', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records || []);
      } else {
        setErrorMsg(data.error || 'பதிவுகளைப் பெறுவதில் தோல்வி');
      }
    } catch (err) {
      setErrorMsg('பிழை: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Reveal Password Modal
  const handleOpenRevealModal = (rec, field) => {
    setRevealModalRecord(rec);
    setRevealModalField(field);
    setAuthInput('');
    setAuthError('');
    setRevealedValue(null);
  };

  // Verify Auth and Decrypt Sensitive Field
  const handleVerifyAndReveal = async () => {
    if (!authInput) return;

    setAuthError('');
    setIsAccessLocked(false);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/records/${revealModalRecord.id}/reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          password: authInput,
          pin: authInput,
          fieldName: revealModalField.field_name
        })
      });

      const data = await res.json();

      if (res.status === 429) {
        setIsAccessLocked(true);
        setAuthError(data.error);
        return;
      }

      if (!res.ok) {
        setAuthError(data.error || t.incorrectAuthMsg);
        return;
      }

      // Decrypt client-side using password
      const decrypted = await decryptValue(data.ciphertext, data.iv, data.salt, authInput);
      setRevealedValue(decrypted);
      setCountdown(10); // Start 10 second auto-mask timer
    } catch (err) {
      setAuthError('கடவுச்சொல் தவறானது அல்லது குறியாக்கம் திறக்க முடியவில்லை.');
    }
  };

  // Delete Record
  const handleDeleteRecord = async (recordId) => {
    if (!confirm(lang === 'ta' ? 'இந்த பதிவை நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to delete this record?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/records/${recordId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchRecords();
    } catch (err) {
      alert('நீக்குவதில் பிழை: ' + err.message);
    }
  };

  if (!user) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-md mx-auto">
        <FolderLock className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900">{t.savedRecordsTitle}</h3>
        <p className="text-sm text-slate-600">{lang === 'ta' ? 'சேமித்த படிவங்களைப் பார்க்க தயவுசெய்து உள்நுழையவும்.' : 'Please login to view saved form records.'}</p>
        <button
          onClick={onOpenAuthModal}
          className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm"
        >
          {t.btnLogin}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <FolderLock className="w-7 h-7 text-amber-600" />
          <span>{t.savedRecordsTitle}</span>
        </h2>
        <p className="text-sm text-slate-600">{t.maskedValueNotice}</p>
      </div>

      {loading && <div className="p-8 text-center text-slate-500 font-bold">{t.loading}</div>}

      {errorMsg && <div className="p-4 bg-red-50 text-red-700 font-bold rounded-xl">{errorMsg}</div>}

      {/* Empty State */}
      {!loading && records.length === 0 && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <FolderLock className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-slate-500 font-bold">{t.noSavedRecords}</p>
        </div>
      )}

      {/* Records Cards List */}
      <div className="space-y-6">
        {records.map((rec) => (
          <div key={rec.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">{rec.form_title}</h3>
                <span className="text-xs text-slate-400 font-semibold">
                  {new Date(rec.created_at).toLocaleString('ta-IN')}
                </span>
              </div>

              <button
                onClick={() => handleDeleteRecord(rec.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Non-sensitive data entries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(rec.non_sensitive_data || {}).map(([k, v]) => (
                <div key={k} className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-bold text-slate-500 block uppercase">{k}</span>
                  <span className="font-bold text-slate-900 text-sm">{v}</span>
                </div>
              ))}
            </div>

            {/* Encrypted sensitive fields entries */}
            {rec.sensitive_fields && rec.sensitive_fields.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-amber-800 uppercase flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{lang === 'ta' ? 'பாதுகாக்கப்பட்ட ரகசிய எண்கள்' : 'Encrypted Sensitive Fields'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rec.sensitive_fields.map((sf) => (
                    <div key={sf.id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-amber-900 block">{sf.field_name}</span>
                        <span className="font-mono font-bold text-slate-900 text-sm tracking-widest">{sf.masked_value}</span>
                      </div>

                      <button
                        onClick={() => handleOpenRevealModal(rec, sf)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1 touch-target"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.revealBtn}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Password / PIN Verification Reveal Modal */}
      {revealModalRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
                <KeyRound className="w-6 h-6 text-amber-600" />
                <span>{t.verifyPasswordModalTitle}</span>
              </h3>
              <p className="text-xs text-slate-600">{t.enterPasswordOrPin}</p>
            </div>

            {/* Revealed Value Display */}
            {revealedValue ? (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-center space-y-3">
                <span className="text-xs font-bold text-emerald-800 uppercase block">{revealModalField?.field_name}</span>
                <span className="text-2xl font-mono font-extrabold text-emerald-950 tracking-wider block">
                  {revealedValue}
                </span>
                <div className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span>{t.revealedTimer} ({countdown}s)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <input
                  type="password"
                  value={authInput}
                  onChange={(e) => setAuthInput(e.target.value)}
                  placeholder={lang === 'ta' ? 'கடவுச்சொல் அல்லது 6-இலக்க PIN' : 'Password or 6-digit PIN'}
                  disabled={isAccessLocked}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setRevealModalRecord(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleVerifyAndReveal}
                    disabled={isAccessLocked || !authInput}
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md"
                  >
                    {t.confirm}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
