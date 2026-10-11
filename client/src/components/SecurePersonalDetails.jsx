import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Fingerprint,
  FileLock2,
  Landmark,
  LockKeyhole,
  Mail,
  Plus,
  ShieldCheck,
  Smartphone,
  Copy,
  X
} from 'lucide-react';
import ta from '../i18n/ta.js';
import en from '../i18n/en.js';

const API_URL = 'http://localhost:5000/api/personal-details';

const DETAIL_TYPES = [
  { id: 'aadhaar', label: 'detailAadhaar', icon: Fingerprint },
  { id: 'bank', label: 'detailBank', icon: Landmark },
  { id: 'ifsc', label: 'detailIfsc', icon: Landmark },
  { id: 'mobile', label: 'detailMobile', icon: Smartphone },
  { id: 'email', label: 'detailEmail', icon: Mail },
  { id: 'other', label: 'detailOther', icon: FileLock2 }
];

function getToken() {
  return localStorage.getItem('token');
}

async function apiRequest(path = '', options = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    cache: 'no-store'
  });

  const data = await response.json();
  return { response, data };
}

function DetailIcon({ type, className = 'w-5 h-5' }) {
  const Icon = DETAIL_TYPES.find(item => item.id === type)?.icon || FileLock2;
  return <Icon className={className} aria-hidden="true" />;
}

export default function SecurePersonalDetails({ lang, user, onOpenAuth, onBack }) {
  const t = lang === 'ta' ? ta : en;
  const [details, setDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [value, setValue] = useState('');
  const [type, setType] = useState('aadhaar');
  const [label, setLabel] = useState('');
  const [revealedDetail, setRevealedDetail] = useState(null);
  const [showRevealedValue, setShowRevealedValue] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const revealTimer = useRef(null);
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);

  const clearReveal = useCallback(() => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = null;
    setRevealedDetail(null);
    setShowRevealedValue(false);
  }, []);

  const closeDialog = useCallback(() => {
    clearReveal();
    setDialog(null);
    setPassword('');
    setShowPassword(false);
    setValue('');
    setLabel('');
    setErrorMessage('');
    setIsSubmitting(false);
  }, [clearReveal]);

  const loadDetails = useCallback(async () => {
    if (!user) {
      setDetails([]);
      return;
    }

    setIsLoading(true);
    setPageError('');
    try {
      const { response, data } = await apiRequest();
      if (!response.ok) {
        setPageError(response.status === 401 || response.status === 403 ? t.detailsLoginRequired : t.detailsLoadError);
        return;
      }
      if (!Array.isArray(data.details)) {
        throw new Error('Invalid secure personal details response.');
      }
      setDetails(data.details);
    } catch {
      setPageError(t.detailsLoadError);
    } finally {
      setIsLoading(false);
    }
  }, [user, t.detailsLoginRequired, t.detailsLoadError]);

  useEffect(() => {
    loadDetails();
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, [loadDetails]);

  useEffect(() => {
    if (!dialog) {
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
      returnFocusRef.current = null;
      return undefined;
    }

    const dialogElement = dialogRef.current;
    if (!dialogElement) return undefined;

    const getFocusableElements = () => Array.from(dialogElement.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => element.getClientRects().length > 0);
    getFocusableElements()[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        closeDialog();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const focusIsOutsideDialog = !dialogElement.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === firstElement || focusIsOutsideDialog)) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (document.activeElement === lastElement || focusIsOutsideDialog)) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog, isSubmitting, closeDialog]);

  const openRevealDialog = (detail) => {
    clearReveal();
    returnFocusRef.current = document.activeElement;
    setPassword('');
    setErrorMessage('');
    setDialog({ mode: 'reveal', detail });
  };

  const openAddDialog = (initialType = 'aadhaar') => {
    clearReveal();
    returnFocusRef.current = document.activeElement;
    setType(initialType);
    setValue('');
    setLabel('');
    setPassword('');
    setErrorMessage('');
    setDialog({ mode: 'add' });
  };

  const openEditDialog = (detail) => {
    clearReveal();
    returnFocusRef.current = document.activeElement;
    setType(detail.type);
    setValue('');
    setLabel('');
    setPassword('');
    setErrorMessage('');
    setDialog({ mode: 'edit', detail });
  };

  const openDeleteDialog = (detail) => {
    clearReveal();
    returnFocusRef.current = document.activeElement;
    setPassword('');
    setErrorMessage('');
    setDialog({ mode: 'delete', detail });
  };

  const getApiError = (response, data) => {
    if (data.code === 'INCORRECT_PASSWORD') return t.incorrectDetailsPassword;
    if (data.code === 'TEMPORARILY_LOCKED' || response.status === 429) return t.detailsLocked;
    return data.error || t.detailsActionError;
  };

  const handleVerifyAndReveal = async (event) => {
    event.preventDefault();
    if (!dialog?.detail || !password) {
      setErrorMessage(t.passwordRequired);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const { response, data } = await apiRequest(`/${dialog.detail.id}/reveal`, {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      if (!response.ok) {
        setErrorMessage(getApiError(response, data));
        return;
      }

      setPassword('');
      setRevealedDetail(data);
      setShowRevealedValue(true);
      revealTimer.current = setTimeout(() => {
        setRevealedDetail(null);
        setShowRevealedValue(false);
        setErrorMessage(t.revealExpired);
      }, 60_000);
    } catch {
      setErrorMessage(t.detailsActionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDetail = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const body = JSON.stringify({ type, value, label, password });
    try {
      const path = dialog.mode === 'edit' ? `/${dialog.detail.id}` : '';
      const method = dialog.mode === 'edit' ? 'PATCH' : 'POST';
      const { response, data } = await apiRequest(path, { method, body });
      if (!response.ok) {
        setErrorMessage(getApiError(response, data));
        return;
      }

      closeDialog();
      setNotice(dialog.mode === 'edit' ? t.detailUpdated : t.detailSaved);
      await loadDetails();
    } catch {
      setErrorMessage(t.detailsActionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDetail = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const { response, data } = await apiRequest(`/${dialog.detail.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ password })
      });
      if (!response.ok) {
        setErrorMessage(getApiError(response, data));
        return;
      }

      closeDialog();
      setNotice(t.detailDeleted);
      await loadDetails();
    } catch {
      setErrorMessage(t.detailsActionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!revealedDetail?.value) return;
    try {
      await navigator.clipboard.writeText(revealedDetail.value);
      setNotice(t.detailCopied);
    } catch {
      setErrorMessage(t.copyFailed);
    }
  };

  const getTypeLabel = (detail) => {
    if (detail.type === 'other') return detail.label || t.detailOther;
    return t[DETAIL_TYPES.find(item => item.id === detail.type)?.label] || t.detailOther;
  };

  const modalTitle = dialog?.mode === 'reveal'
    ? `${t.viewDetails}: ${getTypeLabel(dialog.detail)}`
    : dialog?.mode === 'add'
    ? t.addDetailTitle
    : dialog?.mode === 'edit'
    ? `${t.editDetailTitle}: ${getTypeLabel(dialog.detail)}`
    : t.deleteDetailTitle;

  const closeAndReturnToReview = () => {
    closeDialog();
    onBack();
  };

  const displayDetails = DETAIL_TYPES.flatMap(({ id }) => {
    const matches = details.filter(detail => detail.type === id);
    return matches.length > 0
      ? matches
      : [{ id: `empty-${id}`, type: id, maskedValue: '', isEmpty: true }];
  });

  return (
    <section className="secure-details-page mx-auto max-w-6xl space-y-6" aria-labelledby="secure-details-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={closeAndReturnToReview}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-blue-50 hover:text-blue-700"
            aria-label={t.backToDashboard}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 id="secure-details-title" className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
              <ShieldCheck className="h-7 w-7 text-indigo-700" />
              {t.secureDetailsTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{t.secureDetailsDescription}</p>
          </div>
        </div>
        {user && (
          <button
            onClick={openAddDialog}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 font-bold text-white shadow-md transition hover:bg-blue-800"
          >
            <Plus className="h-5 w-5" />
            {t.addDetails}
          </button>
        )}
      </div>

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-semibold text-emerald-800">
          {notice}
          <button className="float-right" aria-label={t.close} onClick={() => setNotice('')}><X className="h-5 w-5" /></button>
        </div>
      )}

      {pageError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-800">
          {pageError}
        </div>
      )}

      {!user ? (
        <div className="rounded-2xl border border-blue-200 bg-white p-8 text-center shadow-sm">
          <LockKeyhole className="mx-auto h-10 w-10 text-indigo-600" />
          <p className="mt-3 font-semibold text-slate-700">{t.detailsLoginRequired}</p>
          <button
            onClick={onOpenAuth}
            className="mt-5 min-h-11 rounded-xl bg-blue-700 px-5 py-2.5 font-bold text-white hover:bg-blue-800"
          >
            {t.btnLogin}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-900">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <p>{t.secureDetailsPrivacyNote}</p>
          </div>

          {isLoading ? (
            <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-semibold text-slate-600">
              {t.loading}
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {displayDetails.map((detail) => (
                <article
                  key={detail.id}
                  className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                >
                  <button
                    onClick={() => !detail.isEmpty && openRevealDialog(detail)}
                    disabled={detail.isEmpty}
                    className="group w-full text-left disabled:cursor-default"
                    aria-label={`${t.viewDetails}: ${getTypeLabel(detail)}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
                        <DetailIcon type={detail.type} />
                      </span>
                      <span className="font-bold text-slate-800">{getTypeLabel(detail)}</span>
                    </div>
                    <span className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 font-mono text-sm font-bold tracking-wide text-blue-900 group-hover:bg-blue-50">
                      <span>{detail.maskedValue || t.noDetailSaved}</span>
                      {detail.isEmpty
                        ? <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" />
                        : <Eye className="h-4 w-4 shrink-0 text-indigo-600" />}
                    </span>
                    <span className="sr-only">{t.viewDetails}</span>
                  </button>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    {detail.isEmpty ? (
                      <button
                        onClick={() => openAddDialog(detail.type)}
                        className="text-sm font-bold text-indigo-700 hover:text-indigo-900"
                      >
                        {t.addDetails}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openRevealDialog(detail)}
                          className="text-sm font-bold text-indigo-700 hover:text-indigo-900"
                        >
                          {t.viewDetails}
                        </button>
                        <div className="flex gap-3">
                          <button onClick={() => openEditDialog(detail)} className="text-sm font-semibold text-slate-600 hover:text-blue-700">
                            {t.edit}
                          </button>
                          <button onClick={() => openDeleteDialog(detail)} className="text-sm font-semibold text-red-600 hover:text-red-800">
                            {t.delete}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {details.length === 0 && (
              <div className="rounded-2xl border border-dashed border-blue-300 bg-white/70 p-5 text-center text-sm text-slate-600">
                {t.noSecureDetails} {t.addSecureDetailsHint}
              </div>
            )}
            </>
          )}
        </>
      )}

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) closeDialog(); }}
        >
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="secure-details-dialog-title"
            className="my-auto w-full max-w-lg rounded-3xl border border-blue-100 bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 id="secure-details-dialog-title" className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                  <LockKeyhole className="h-6 w-6 shrink-0 text-indigo-700" />
                  {modalTitle}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {dialog.mode === 'reveal' ? t.passwordToViewDetails
                    : dialog.mode === 'delete' ? t.passwordToDeleteDetails
                    : t.passwordToSaveDetails}
                </p>
              </div>
              <button
                onClick={closeDialog}
                disabled={isSubmitting}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                aria-label={t.close}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {dialog.mode === 'reveal' && revealedDetail ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">{getTypeLabel(revealedDetail)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="min-w-0 flex-1 break-all font-mono text-lg font-bold text-slate-900">
                      {showRevealedValue ? revealedDetail.value : dialog.detail.maskedValue}
                    </p>
                    <button
                      onClick={() => setShowRevealedValue(current => !current)}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-indigo-700 hover:bg-indigo-100"
                      aria-label={showRevealedValue ? t.hideDetails : t.showDetails}
                    >
                      {showRevealedValue ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-3">
                  <button onClick={handleCopy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 font-bold text-white hover:bg-blue-800">
                    <Copy className="h-4 w-4" />
                    {t.copy}
                  </button>
                  <button onClick={closeDialog} className="min-h-11 rounded-xl bg-slate-100 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-200">
                    {t.close}
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={dialog.mode === 'reveal' ? handleVerifyAndReveal
                  : dialog.mode === 'delete' ? handleDeleteDetail
                  : handleSaveDetail}
                className="space-y-4"
              >
                {(dialog.mode === 'add' || dialog.mode === 'edit') && (
                  <>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-bold text-slate-700">{t.detailType}</span>
                      <select
                        value={type}
                        onChange={(event) => { setType(event.target.value); setErrorMessage(''); }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {DETAIL_TYPES.map(item => <option key={item.id} value={item.id}>{t[item.label]}</option>)}
                      </select>
                    </label>
                    {type === 'other' && (
                      <label className="block space-y-1.5">
                        <span className="text-sm font-bold text-slate-700">{t.detailLabel}</span>
                        <input
                          value={label}
                          onChange={(event) => setLabel(event.target.value)}
                          maxLength={80}
                          required
                          autoComplete="off"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </label>
                    )}
                    <label className="block space-y-1.5">
                      <span className="text-sm font-bold text-slate-700">{t.detailValue}</span>
                      <input
                        value={value}
                        onChange={(event) => { setValue(event.target.value); setErrorMessage(''); }}
                        type={['aadhaar', 'bank', 'mobile'].includes(type) ? 'tel' : 'text'}
                        inputMode={['aadhaar', 'bank', 'mobile'].includes(type) ? 'numeric' : undefined}
                        autoComplete="off"
                        required
                        maxLength={1000}
                        placeholder={dialog.mode === 'edit' ? t.enterReplacementValue : ''}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                  </>
                )}

                {dialog.mode === 'delete' && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <p className="text-sm font-semibold text-red-800">{t.deleteDetailConfirm}</p>
                    <p className="mt-1 font-mono font-bold text-red-900">{dialog.detail.maskedValue}</p>
                  </div>
                )}

                <label className="block space-y-1.5">
                  <span className="text-sm font-bold text-slate-700">{t.password}</span>
                  <span className="relative block">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => { setPassword(event.target.value); setErrorMessage(''); }}
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-12 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(current => !current)}
                      className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 hover:text-indigo-700"
                      aria-label={showPassword ? t.hidePassword : t.showPassword}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </span>
                </label>

                {errorMessage && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{errorMessage}</p>}

                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={isSubmitting}
                    className="min-h-11 rounded-xl bg-slate-100 px-5 py-2.5 font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`min-h-11 rounded-xl px-5 py-2.5 font-bold text-white shadow-sm disabled:opacity-60 ${
                      dialog.mode === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-700 hover:bg-blue-800'
                    }`}
                  >
                    {isSubmitting ? t.loading
                      : dialog.mode === 'reveal' ? t.verify
                      : dialog.mode === 'delete' ? t.delete
                      : dialog.mode === 'edit' ? t.saveChanges
                      : t.save}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
