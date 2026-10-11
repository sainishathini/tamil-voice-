import React from 'react';
import {
  FilePlus,
  Mic,
  FolderLock,
  HelpCircle,
  ShieldCheck,
  History,
  LockKeyhole,
  ArrowRight,
  CheckCircle2,
  Clock,
  Lock,
  Play
} from 'lucide-react';
import ta from '../i18n/ta.js';
import en from '../i18n/en.js';

export default function Dashboard({
  lang,
  setActiveTab,
  currentForm,
  savedRecordsCount,
  sessionCompletedCount,
  onStartNewForm,
  onContinueForm
}) {
  const t = lang === 'ta' ? ta : en;

  const completionPercentage = currentForm
    ? Math.round(
        (Object.keys(currentForm.formValues || {}).filter(
          k => currentForm.formValues[k] && String(currentForm.formValues[k]).trim() !== ''
        ).length /
          Math.max(1, currentForm.fields.length)) *
          100
      )
    : 0;

  const dashboardCards = [
    {
      id: 'new-form',
      title: t.cardNewFormTitle,
      desc: t.cardNewFormDesc,
      icon: FilePlus,
      color: 'bg-blue-600',
      badge: lang === 'ta' ? 'பதிவேற்றம் / மாதிரி' : 'Upload / Sample'
    },
    {
      id: 'voice-filling',
      title: t.cardVoiceTitle,
      desc: t.cardVoiceDesc,
      icon: Mic,
      color: 'bg-emerald-600',
      badge: lang === 'ta' ? 'குரல் வழி' : 'Voice Assisted'
    },
    {
      id: 'saved-forms',
      title: t.cardSavedTitle,
      desc: t.cardSavedDesc,
      icon: FolderLock,
      color: 'bg-amber-600',
      badge: lang === 'ta' ? 'மறைக்கப்பட்ட தரவு' : 'AES Encrypted'
    },
    {
      id: 'help-centre',
      title: t.cardHelpTitle,
      desc: t.cardHelpDesc,
      icon: HelpCircle,
      color: 'bg-indigo-600',
      badge: lang === 'ta' ? 'ஆவண வழிகாட்டி' : 'Doc Guidance'
    },
    {
      id: 'privacy',
      title: t.cardPrivacyTitle,
      desc: t.cardPrivacyDesc,
      icon: ShieldCheck,
      color: 'bg-teal-600',
      badge: lang === 'ta' ? 'உள்ளூர் குறியாக்கம்' : 'Local Security'
    },
    {
      id: 'recent-access',
      title: t.cardRecentTitle,
      desc: t.cardRecentDesc,
      icon: History,
      color: 'bg-purple-600',
      badge: lang === 'ta' ? 'செயல்பாட்டு ஏடு' : 'Activity Logs'
    },
    {
      id: 'secure-details',
      title: t.secureDetailsTitle,
      desc: t.secureDetailsCardDesc,
      icon: LockKeyhole,
      color: 'bg-indigo-600',
      badge: lang === 'ta' ? 'கடவுச்சொல் பாதுகாப்பு' : 'Password Protected'
    }
  ];

  return (
    <div className="dashboard-page space-y-8">
      
      {/* Welcome Banner */}
      <div className="dashboard-hero relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
        <div className="dashboard-hero-copy relative z-10 max-w-2xl space-y-4">
          <div className="dashboard-hero-mark" aria-hidden="true"><Mic /></div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {t.welcome}
          </h2>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            {t.welcomeSub}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onStartNewForm}
              className="inline-flex items-center space-x-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition-transform active:scale-95 touch-target"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{t.fillNewForm}</span>
            </button>
            {currentForm && (
              <button
                onClick={onContinueForm}
                className="inline-flex items-center space-x-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-md transition-colors touch-target"
              >
                <span>{t.btnContinueCurrent}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <div className="dashboard-hero-art" aria-hidden="true">
          <div className="hero-waveform"><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="hero-microphone"><Mic /></div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="dashboard-stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">{t.totalSavedForms}</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{savedRecordsCount}</p>
          </div>
          <div className="stat-icon stat-icon-blue w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <FolderLock className="w-6 h-6" />
          </div>
        </div>

        <div className="stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">{t.formsCompletedSession}</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{sessionCompletedCount}</p>
          </div>
          <div className="stat-icon stat-icon-green w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">{t.completionRate}</p>
            <p className="text-3xl font-extrabold text-blue-700 mt-1">{completionPercentage}%</p>
          </div>
          <div className="stat-icon stat-icon-purple w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Mic className="w-6 h-6" />
          </div>
        </div>

        <div className="stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="overflow-hidden pr-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">{t.recentFormUsed}</p>
            <p className="text-sm font-bold text-slate-900 truncate mt-1">
              {currentForm ? (lang === 'ta' ? currentForm.titleTa || currentForm.title : currentForm.titleEn || currentForm.title) : t.noRecentForm}
            </p>
          </div>
          <div className="stat-icon stat-icon-purple w-12 h-12 shrink-0 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Dashboard Feature Cards */}
      <div className="dashboard-features space-y-4">
        <h3 className="features-heading text-xl font-bold text-slate-900 flex items-center space-x-2">
          <span>{lang === 'ta' ? 'முக்கிய வசதிகள்' : 'Main Features'}</span>
        </h3>

        <div className="feature-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => setActiveTab(card.id)}
                className="feature-card group bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`feature-icon w-12 h-12 rounded-xl ${card.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                      {card.badge}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end text-sm font-bold text-blue-700 group-hover:translate-x-1 transition-transform">
                  <span>{lang === 'ta' ? 'தொடங்குக' : 'Open'}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 shadow-lg">
        <h4 className="text-lg font-bold flex items-center space-x-2">
          <span>{t.quickActions}</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={onStartNewForm}
            className="p-3.5 bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm rounded-xl transition-colors text-center touch-target"
          >
            {t.btnStartNew}
          </button>
          <button
            onClick={() => setActiveTab('voice-filling')}
            className="p-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl transition-colors text-center touch-target"
          >
            {t.btnContinueCurrent}
          </button>
          <button
            onClick={() => setActiveTab('saved-forms')}
            className="p-3.5 bg-amber-700 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl transition-colors text-center touch-target"
          >
            {t.btnViewSaved}
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className="p-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl transition-colors text-center touch-target"
          >
            {t.btnPrivacySettings}
          </button>
        </div>
      </div>

    </div>
  );
}
