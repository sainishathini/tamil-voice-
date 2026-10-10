import React, { useState } from 'react';
import { Settings, Globe, Volume2, Type, KeyRound, Trash2, ShieldAlert } from 'lucide-react';
import ta from '../i18n/ta.js';
import en from '../i18n/en.js';

export default function SettingsPage({
  lang,
  setLang,
  user,
  onClearForm,
  onLogout
}) {
  const t = lang === 'ta' ? ta : en;

  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voicePromptsEnabled, setVoicePromptsEnabled] = useState(true);
  const [textSize, setTextSize] = useState('normal');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMsg(lang === 'ta' ? 'கடவுச்சொல் மாறும் வெற்றி!' : 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPwdMsg(data.error || 'தோல்வி');
      }
    } catch (err) {
      setPwdMsg('பிழை: ' + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(lang === 'ta' ? 'கணக்கை நிரந்தரமாக நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to delete your account permanently?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/auth/account', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      onLogout();
    } catch (err) {
      alert('நீக்குவதில் பிழை: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <Settings className="w-7 h-7 text-slate-700" />
          <span>{t.settingsTitle}</span>
        </h2>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Language Selection */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <Globe className="w-5 h-5 text-blue-700" />
            <div>
              <p className="font-bold text-slate-900 text-sm">{lang === 'ta' ? 'செயலி மொழி' : 'Interface Language'}</p>
              <p className="text-xs text-slate-500">{t.currentLang}</p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
            className="px-4 py-2 bg-blue-50 text-blue-800 font-bold rounded-xl text-sm border border-blue-200 touch-target"
          >
            {t.langToggle}
          </button>
        </div>

        {/* Voice Controls */}
        <div className="space-y-4 py-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <Volume2 className="w-5 h-5 text-blue-700" />
            <span className="font-bold text-slate-900 text-sm">{t.voiceSpeedLabel} ({voiceSpeed}x)</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={voiceSpeed}
            onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
            className="w-full"
          />

          <label className="flex items-center justify-between cursor-pointer pt-2">
            <span className="font-bold text-slate-900 text-sm">{t.voicePromptToggle}</span>
            <input
              type="checkbox"
              checked={voicePromptsEnabled}
              onChange={(e) => setVoicePromptsEnabled(e.target.checked)}
              className="w-5 h-5"
            />
          </label>
        </div>

        {/* Change Password */}
        {user && (
          <div className="space-y-4 py-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-slate-900 text-sm">{t.changePasswordBtn}</span>
            </div>

            {pwdMsg && <p className="text-xs font-bold text-emerald-700">{pwdMsg}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="password"
                placeholder={lang === 'ta' ? 'தற்போதைய கடவுச்சொல்' : 'Current Password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              />
              <input
                type="password"
                placeholder={lang === 'ta' ? 'புதிய கடவுச்சொல்' : 'New Password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </div>

            <button
              onClick={handleChangePassword}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm"
            >
              {t.changePasswordBtn}
            </button>
          </div>
        )}

        {/* Destructive Actions */}
        <div className="space-y-3 pt-4">
          <button
            onClick={onClearForm}
            className="w-full py-3 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold rounded-xl text-sm border border-slate-200"
          >
            {t.clearCurrentFormBtn}
          </button>

          {user && (
            <button
              onClick={handleDeleteAccount}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md"
            >
              {t.deleteAccountBtn}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
