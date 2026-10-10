import React, { useState } from 'react';
import { User, Lock, KeyRound, ShieldCheck, X } from 'lucide-react';
import ta from '../i18n/ta.js';
import en from '../i18n/en.js';
import { generateRecoveryCode } from '../lib/crypto.js';

export default function AuthModal({ lang, isOpen, onClose, onAuthSuccess }) {
  const t = lang === 'ta' ? ta : en;

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'recovery'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [generatedRecoveryCode, setGeneratedRecoveryCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignupInit = () => {
    const code = generateRecoveryCode();
    setGeneratedRecoveryCode(code);
    setRecoveryCode(code);
    setMode('signup');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const endpoint = mode === 'signup'
      ? '/api/auth/signup'
      : mode === 'recover'
      ? '/api/auth/recover'
      : '/api/auth/login';

    const payload = mode === 'signup'
      ? { username, password, pin, recoveryCode: generatedRecoveryCode }
      : mode === 'recover'
      ? { username, recoveryCode, newPassword: password }
      : { username, password };

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        onAuthSuccess(data.user || { username });
        onClose();
      } else {
        setErrorMsg(data.error || 'தோல்வி');
      }
    } catch (err) {
      setErrorMsg('பிழை: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <h3 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
            <User className="w-6 h-6 text-blue-700" />
            <span>{mode === 'signup' ? t.signupTitle : t.loginTitle}</span>
          </h3>
          <p className="text-xs text-slate-500">
            {lang === 'ta' ? 'பாதுகாப்பான உலாவி வழி தரவுச் சேமிப்பு' : 'Secured Browser-Encrypted Storage'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl">{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">{t.usernameLabel}</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              {mode === 'recover' ? (lang === 'ta' ? 'புதிய கடவுச்சொல்' : 'New Password') : t.passwordLabel}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{t.pinLabel}</label>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Generated Recovery Code Alert */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-amber-900 block">{t.saveRecoveryCodeNotice}</span>
                <span className="text-xl font-mono font-extrabold text-amber-950 tracking-widest block">
                  {generatedRecoveryCode}
                </span>
              </div>
            </>
          )}

          {mode === 'recover' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">{t.recoveryCodeLabel}</label>
              <input
                type="text"
                required
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-colors touch-target"
          >
            {loading ? t.loading : mode === 'signup' ? t.btnSignup : t.btnLogin}
          </button>
        </form>

        <div className="pt-2 text-center text-xs font-bold">
          {mode === 'login' ? (
            <button onClick={handleSignupInit} className="text-blue-700 hover:underline">
              {t.noAccount}
            </button>
          ) : (
            <button onClick={() => setMode('login')} className="text-blue-700 hover:underline">
              {t.hasAccount}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
