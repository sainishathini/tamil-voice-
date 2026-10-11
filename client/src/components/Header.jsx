import React from 'react';
import { Mic, Globe, ShieldCheck, User, LogOut, HardDrive } from 'lucide-react';
import ta from '../i18n/ta.js';
import en from '../i18n/en.js';

export default function Header({ lang, setLang, user, onOpenAuth, onLogout }) {
  const t = lang === 'ta' ? ta : en;

  return (
    <header className="site-header bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="site-header-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo & Title */}
        <div className="site-brand flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="site-logo w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-900/20">
            <Mic className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                குரல் படிவம்
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                {t.offlineReady}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Privacy Status Indicator */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{t.privacySecured}</span>
          </div>

          {/* Language Toggle Button */}
          <button
            onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-blue-50 text-blue-900 font-semibold rounded-lg border border-slate-200 transition-colors touch-target"
            title="Switch Interface Language"
          >
            <Globe className="w-4 h-4 text-blue-700" />
            <span className="text-sm font-bold">{t.langToggle}</span>
          </button>

          {/* Profile / Auth Menu */}
          {user ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm font-medium">
                <User className="w-4 h-4 text-blue-700" />
                <span className="font-semibold max-w-[100px] truncate">{user.username}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-target"
                title={t.logout}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors touch-target"
            >
              <User className="w-4 h-4" />
              <span>{t.btnLogin}</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
