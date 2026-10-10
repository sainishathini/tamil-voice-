import React, { useState } from 'react';
import { HelpCircle, FileText, MapPin, Building, AlertCircle } from 'lucide-react';
import ta from '../i18n/ta.js';
import en from '../i18n/en.js';

export default function HelpCentre({ lang, activeHelpField, onCloseModal }) {
  const t = lang === 'ta' ? ta : en;

  const [selectedDocId, setSelectedDocId] = useState('income_certificate');
  const [guideData, setGuideData] = useState(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    fetchGuide(selectedDocId);
  }, [selectedDocId]);

  const fetchGuide = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/guide/${id}`);
      const data = await res.json();
      setGuideData(data);
    } catch (err) {
      console.warn('Guide fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const docsList = [
    { id: 'income_certificate', title: lang === 'ta' ? 'வருமானச் சான்றிதழ்' : 'Income Certificate' },
    { id: 'caste_certificate', title: lang === 'ta' ? 'சாதிச் சான்றிதழ்' : 'Caste Certificate' },
    { id: 'ration_card', title: lang === 'ta' ? 'குடும்ப அட்டை (ரேஷன் கார்டு)' : 'Ration Card' },
    { id: 'aadhaar_card', title: lang === 'ta' ? 'ஆதார் அட்டை' : 'Aadhaar Card' },
    { id: 'unverified_doc', title: lang === 'ta' ? 'மற்ற ஆவணங்கள் (Unverified)' : 'Other Documents' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <HelpCircle className="w-7 h-7 text-indigo-600" />
          <span>{t.cardHelpTitle}</span>
        </h2>
        <p className="text-sm text-slate-600">{t.cardHelpDesc}</p>
      </div>

      {/* Field Modal Callout if triggered from field */}
      {activeHelpField && (
        <div className="bg-indigo-900 text-white p-6 rounded-3xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase">{t.fieldExplanationTitle}</span>
            {onCloseModal && (
              <button onClick={onCloseModal} className="text-xs bg-indigo-800 px-3 py-1 rounded-full">{t.close}</button>
            )}
          </div>
          <h3 className="text-xl font-bold">{activeHelpField.labelTa} ({activeHelpField.labelEn})</h3>
          <p className="text-sm text-indigo-100 leading-relaxed">
            {lang === 'ta'
              ? `${activeHelpField.labelTa} என்பது உங்களின் அதிகாரப்பூர்வ ஆவணத்தில் உள்ளவாறு சரியாகப் பூர்த்தி செய்யப்பட வேண்டும்.`
              : `Please enter details exactly as they appear on your official document.`}
          </p>
        </div>
      )}

      {/* Document Selection Tabs */}
      <div className="flex flex-wrap gap-2">
        {docsList.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelectedDocId(doc.id)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all touch-target ${
              selectedDocId === doc.id
                ? 'bg-indigo-700 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {doc.title}
          </button>
        ))}
      </div>

      {/* Document Details Card */}
      {guideData && !guideData.error ? (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{t.docGuideTitle}</span>
            <h3 className="text-2xl font-extrabold text-slate-900">
              {lang === 'ta' ? guideData.titleTa : guideData.titleEn}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>{t.whereToFind}</span>
                </span>
                <p className="font-bold text-slate-900 text-sm leading-relaxed">
                  {lang === 'ta' ? guideData.locationTa : guideData.locationEn}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center space-x-1">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span>{lang === 'ta' ? 'வழங்கும் துறை / அலுவலகம்' : 'Issuing Authority'}</span>
                </span>
                <p className="font-bold text-slate-900 text-sm leading-relaxed">
                  {lang === 'ta' ? guideData.authorityTa : guideData.authorityEn}
                </p>
              </div>
            </div>

            {/* SVG Visual Sample Image */}
            <div className="space-y-2 text-center">
              <div
                className="rounded-2xl overflow-hidden border border-slate-200 shadow-md inline-block"
                dangerouslySetInnerHTML={{ __html: guideData.sampleImage }}
              />
              <p className="text-[11px] font-bold text-slate-400">{t.fictionalSampleNotice}</p>
            </div>

          </div>

        </div>
      ) : (
        /* Fallback for Unverified Documents */
        <div className="bg-amber-50 border border-amber-200 p-8 rounded-3xl space-y-4 text-center max-w-xl mx-auto">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
          <p className="font-bold text-amber-950 text-base leading-relaxed">
            {t.guideNotFoundMsg}
          </p>
        </div>
      )}

    </div>
  );
}
