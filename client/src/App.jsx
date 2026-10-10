import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import NewForm from './components/NewForm.jsx';
import VoiceFilling from './components/VoiceFilling.jsx';
import FormReview from './components/FormReview.jsx';
import SavedForms from './components/SavedForms.jsx';
import HelpCentre from './components/HelpCentre.jsx';
import RecentAccess from './components/RecentAccess.jsx';
import PrivacyCenter from './components/PrivacyCenter.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import AuthModal from './components/AuthModal.jsx';
import { SAMPLE_FORMS } from './lib/sampleForms.js';

export default function App() {
  const [lang, setLang] = useState('ta'); // Default language: Tamil
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active form in-memory state
  const [currentForm, setCurrentForm] = useState(null);
  const [savedRecordsCount, setSavedRecordsCount] = useState(0);
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);
  const [activeHelpField, setActiveHelpField] = useState(null);

  // Initialize session & user check on mount
  useEffect(() => {
    checkCurrentUser();
    // Default load first sample form for seamless instant demo
    const defaultSample = {
      id: SAMPLE_FORMS[0].id,
      title: SAMPLE_FORMS[0].titleTa,
      titleTa: SAMPLE_FORMS[0].titleTa,
      titleEn: SAMPLE_FORMS[0].titleEn,
      fields: SAMPLE_FORMS[0].fields,
      formValues: {}
    };
    setCurrentForm(defaultSample);
  }, []);

  const checkCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
          fetchSavedRecordsCount(token);
        }
      } catch (err) {
        console.warn('Auth verification failed:', err);
      }
    }
  };

  const fetchSavedRecordsCount = async (token) => {
    try {
      const res = await fetch('http://localhost:5000/api/records', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.records) {
        setSavedRecordsCount(data.records.length);
      }
    } catch (err) {}
  };

  // Form Value State Mutator
  const handleSetFormValues = (newValues) => {
    setCurrentForm(prev => ({
      ...prev,
      formValues: newValues
    }));
  };

  const handleStartNewForm = () => {
    setActiveTab('new-form');
  };

  const handleContinueForm = () => {
    setActiveTab('voice-filling');
  };

  const handleClearForm = () => {
    if (confirm(lang === 'ta' ? 'அனைத்து விவரங்களையும் அழிக்க விரும்புகிறீர்களா?' : 'Are you sure you want to clear all form values?')) {
      setCurrentForm(prev => prev ? { ...prev, formValues: {} } : null);
    }
  };

  const handleRecordSaved = () => {
    setSessionCompletedCount(c => c + 1);
    fetchSavedRecordsCount(localStorage.getItem('token'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        lang={lang}
        setLang={setLang}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Layout Grid */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lang={lang}
          user={user}
          onLogout={handleLogout}
        />

        {/* Dynamic Content View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              lang={lang}
              setActiveTab={setActiveTab}
              currentForm={currentForm}
              savedRecordsCount={savedRecordsCount}
              sessionCompletedCount={sessionCompletedCount}
              onStartNewForm={handleStartNewForm}
              onContinueForm={handleContinueForm}
            />
          )}

          {activeTab === 'new-form' && (
            <NewForm
              lang={lang}
              onFormCreated={(form) => { setCurrentForm(form); setActiveTab('voice-filling'); }}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'voice-filling' && (
            <VoiceFilling
              lang={lang}
              currentForm={currentForm}
              setFormValues={handleSetFormValues}
              onOpenFieldHelp={(field) => { setActiveHelpField(field); setActiveTab('help-centre'); }}
              onNavigateReview={() => setActiveTab('review')}
            />
          )}

          {activeTab === 'review' && (
            <FormReview
              lang={lang}
              currentForm={currentForm}
              user={user}
              setFormValues={handleSetFormValues}
              onNavigateFilling={() => setActiveTab('voice-filling')}
              onRecordSaved={handleRecordSaved}
              onClearForm={handleClearForm}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'saved-forms' && (
            <SavedForms
              lang={lang}
              user={user}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'help-centre' && (
            <HelpCentre
              lang={lang}
              activeHelpField={activeHelpField}
              onCloseModal={() => setActiveHelpField(null)}
            />
          )}

          {activeTab === 'recent-access' && (
            <RecentAccess
              lang={lang}
              user={user}
            />
          )}

          {activeTab === 'privacy' && (
            <PrivacyCenter
              lang={lang}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              lang={lang}
              setLang={setLang}
              user={user}
              onClearForm={handleClearForm}
              onLogout={handleLogout}
            />
          )}
        </main>

      </div>

      {/* Auth Modal (Login / Signup) */}
      <AuthModal
        lang={lang}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(u) => { setUser(u); fetchSavedRecordsCount(localStorage.getItem('token')); }}
      />

    </div>
  );
}
