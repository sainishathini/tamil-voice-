import React, { useState } from 'react';
import {
  FileUp,
  FileText,
  AlertTriangle,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Sparkles,
  CheckCircle2,
  Play,
  Eye,
  Edit3
} from 'lucide-react';
import ta from '../i18n/ta.js';
import en from '../i18n/en.js';
import { SAMPLE_FORMS } from '../lib/sampleForms.js';

export default function NewForm({ lang, onFormCreated, setActiveTab }) {
  const t = lang === 'ta' ? ta : en;

  const [selectedSource, setSelectedSource] = useState('sample'); // 'sample' | 'upload'
  const [selectedSample, setSelectedSample] = useState(SAMPLE_FORMS[0]);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const [customFields, setCustomFields] = useState([...SAMPLE_FORMS[0].fields]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newIsSensitive, setNewIsSensitive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // Handle Sample selection
  const handleSelectSample = (sample) => {
    setSelectedSample(sample);
    setCustomFields([...sample.fields]);
  };

  // Handle File Upload
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (uploadedFile.size > 10 * 1024 * 1024) {
      setFileError(lang === 'ta' ? 'கோப்பின் அளவு 10MB க்குள் இருக்க வேண்டும்.' : 'File size must be under 10MB.');
      return;
    }

    setFileError('');
    setFile(uploadedFile);

    if (uploadedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (evt) => setFilePreview(evt.target.result);
      reader.readAsDataURL(uploadedFile);
    } else {
      setFilePreview(null);
    }
  };

  // Trigger Field Detection from Backend
  const handleDetectFields = async () => {
    setIsDetecting(true);
    try {
      const res = await fetch('http://localhost:5000/api/detect-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file ? file.name : 'Uploaded Form',
          text: 'Blank form scan document text'
        })
      });
      const data = await res.json();
      if (data.fields && data.fields.length > 0) {
        setCustomFields(data.fields);
      }
    } catch (err) {
      console.warn('Backend field detection error, keeping defaults:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  // Field Reordering & Editing
  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    const newField = {
      id: 'custom_' + Date.now(),
      labelTa: newFieldName,
      labelEn: newFieldName,
      type: newFieldType,
      isSensitive: newIsSensitive,
      required: true
    };
    setCustomFields([...customFields, newField]);
    setNewFieldName('');
  };

  const handleRemoveField = (id) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  const handleMoveField = (index, direction) => {
    const newArr = [...customFields];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newArr.length) return;
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setCustomFields(newArr);
  };

  // Start Form Filling Workflow
  const handleStartFilling = () => {
    const formConfig = {
      id: selectedSource === 'sample' ? selectedSample.id : 'uploaded_' + Date.now(),
      title: selectedSource === 'sample' ? selectedSample.titleTa : file?.name || 'காலியான படிவம்',
      titleTa: selectedSource === 'sample' ? selectedSample.titleTa : file?.name || 'காலியான படிவம்',
      titleEn: selectedSource === 'sample' ? selectedSample.titleEn : file?.name || 'Blank Form',
      fields: customFields,
      formValues: {},
      createdAt: new Date().toISOString()
    };

    onFormCreated(formConfig);
    setActiveTab('voice-filling');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <FileText className="w-6 h-6 text-blue-700" />
          <span>{t.cardNewFormTitle}</span>
        </h2>
        <p className="text-slate-600 text-sm">
          {t.cardNewFormDesc}
        </p>
      </div>

      {/* Mode Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <button
          onClick={() => { setSelectedSource('sample'); setCustomFields([...selectedSample.fields]); }}
          className={`p-5 rounded-2xl border-2 text-left transition-all flex items-start space-x-4 touch-target ${
            selectedSource === 'sample'
              ? 'border-blue-600 bg-blue-50/50 shadow-md'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className={`p-3 rounded-xl ${selectedSource === 'sample' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">{t.builtinSampleForms}</h4>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'ta' ? 'கல்வி உதவித்தொகை அல்லது குடும்ப அட்டை மாதிரி படிவம்' : 'Scholarship or Ration card sample forms'}
            </p>
          </div>
        </button>

        <button
          onClick={() => setSelectedSource('upload')}
          className={`p-5 rounded-2xl border-2 text-left transition-all flex items-start space-x-4 touch-target ${
            selectedSource === 'upload'
              ? 'border-blue-600 bg-blue-50/50 shadow-md'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className={`p-3 rounded-xl ${selectedSource === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <FileUp className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">{t.uploadBlankForm}</h4>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'ta' ? 'உங்கள் காலியான படிவக் கோப்பைப் (PDF, JPG) பதிவேற்றுங்கள்' : 'Upload your blank form file (PDF, JPG)'}
            </p>
          </div>
        </button>

      </div>

      {/* Source A: Built-in Sample Forms Selection */}
      {selectedSource === 'sample' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">{t.selectFormType}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SAMPLE_FORMS.map((sf) => (
              <div
                key={sf.id}
                onClick={() => handleSelectSample(sf)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedSample.id === sf.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">
                    {lang === 'ta' ? sf.titleTa : sf.titleEn}
                  </h4>
                  {selectedSample.id === sf.id && <CheckCircle2 className="w-5 h-5 text-blue-700" />}
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  {lang === 'ta' ? sf.descTa : sf.descEn}
                </p>
                <div className="mt-3 text-xs font-semibold text-blue-800">
                  {sf.fields.length} {lang === 'ta' ? 'புலங்கள்' : 'fields'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source B: Blank Form File Upload */}
      {selectedSource === 'upload' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          
          {/* Warning Banner */}
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 rounded-r-xl flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm font-semibold">
              {t.uploadWarning}
            </div>
          </div>

          {/* File Dropzone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center bg-slate-50 transition-colors relative">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-3 pointer-events-none">
              <FileUp className="w-10 h-10 text-blue-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                {t.dragDropOrClick}
              </p>
              {file && (
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>

          {fileError && <p className="text-sm font-semibold text-red-600">{fileError}</p>}

          {/* Image / File Preview */}
          {filePreview && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase">{lang === 'ta' ? 'முன்னோட்டம்' : 'Preview'}</p>
              <img src={filePreview} alt="Uploaded form" className="max-h-60 rounded-xl border border-slate-200 mx-auto" />
            </div>
          )}

          <button
            onClick={handleDetectFields}
            disabled={isDetecting}
            className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-colors touch-target"
          >
            <Sparkles className="w-5 h-5" />
            <span>{isDetecting ? t.loading : (lang === 'ta' ? 'AI மூலம் புலங்களைக் கண்டறிக' : 'Detect Fields via AI')}</span>
          </button>
        </div>
      )}

      {/* Field Editor & Preview Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-blue-700" />
            <span>{t.editDetectedFields}</span>
          </h3>
          <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            {customFields.length} {lang === 'ta' ? 'புலங்கள்' : 'fields'}
          </span>
        </div>

        {/* Existing Fields List */}
        <div className="space-y-3">
          {customFields.map((field, idx) => (
            <div
              key={field.id}
              className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/80 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {field.labelTa || field.label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {field.labelEn} • <span className="font-semibold">{field.type}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {field.isSensitive && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                    {lang === 'ta' ? 'ரகசிய எண்' : 'Sensitive'}
                  </span>
                )}
                <button
                  onClick={() => handleMoveField(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  title="Move Up"
                >
                  <MoveUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveField(idx, 1)}
                  disabled={idx === customFields.length - 1}
                  className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  title="Move Down"
                >
                  <MoveDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemoveField(field.id)}
                  className="p-1.5 text-red-400 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Custom Field Inputs */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1">{t.fieldName}</label>
            <input
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="எ.கா: மாற்றுத்திறனாளி விவரம்"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">{t.fieldType}</label>
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="text">Text / உரை</option>
              <option value="number">Number / எண்</option>
              <option value="date">Date / தேதி</option>
            </select>
          </div>

          <button
            onClick={handleAddField}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-1 touch-target"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addField}</span>
          </button>
        </div>

        {/* Action Button: Start Voice Filling */}
        <div className="pt-4">
          <button
            onClick={handleStartFilling}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-lg rounded-2xl shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-3 transition-transform active:scale-98 touch-target"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>{t.startFillingBtn}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
