import React from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import ta from '../i18n/ta.js';
import en from '../i18n/en.js';

export default function PrivacyCenter({ lang }) {
  const t = lang === 'ta' ? ta : en;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <ShieldCheck className="w-7 h-7 text-teal-600" />
          <span>{t.privacyCenterTitle}</span>
        </h2>
        <p className="text-sm text-slate-600">{t.cardPrivacyDesc}</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-extrabold text-slate-900 text-lg flex items-center space-x-2">
          <Lock className="w-5 h-5 text-teal-600" />
          <span>{lang === 'ta' ? '10 முக்கிய தனியுரிமை கொள்கைகள்' : '10 Core Privacy Commitments'}</span>
        </h3>

        <div className="space-y-4">
          {t.privacyPoints.map((point, idx) => (
            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <p className="font-bold text-slate-800 text-sm leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
