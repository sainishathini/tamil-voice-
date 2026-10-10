import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import ta from '../i18n/ta.js';
import en from '../i18n/en.js';

export default function RecentAccess({ lang, user }) {
  const t = lang === 'ta' ? ta : en;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLogs(data.logs || []);
    } catch (err) {
      console.warn('Logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <History className="w-7 h-7 text-purple-600" />
          <span>{t.cardRecentTitle}</span>
        </h2>
        <p className="text-sm text-slate-600">{t.cardRecentDesc}</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold">{t.loading}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-bold">
            {lang === 'ta' ? 'சமீபத்திய செயல்பாட்டுப் பதிவுகள் எதுவும் இல்லை.' : 'No recent activity logs found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-4">{lang === 'ta' ? 'செயல்பாடு' : 'Action'}</th>
                  <th className="p-4">{lang === 'ta' ? 'புலம்' : 'Field'}</th>
                  <th className="p-4">{lang === 'ta' ? 'நேரம்' : 'Timestamp'}</th>
                  <th className="p-4">{lang === 'ta' ? 'நிலை' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{log.action}</td>
                    <td className="p-4 font-mono text-xs text-slate-600">{log.field_name || '—'}</td>
                    <td className="p-4 text-xs text-slate-500">{new Date(log.timestamp).toLocaleString('ta-IN')}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status === 'SUCCESS' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{log.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
