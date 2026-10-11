import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  Mic,
  FolderLock,
  HelpCircle,
  History,
  ShieldAlert,
  LockKeyhole,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import ta from '../i18n/ta.js';
import en from '../i18n/en.js';

export default function Sidebar({ activeTab, setActiveTab, lang, user, onLogout }) {
  const t = lang === 'ta' ? ta : en;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'new-form', label: t.navNewForm, icon: FilePlus },
    { id: 'voice-filling', label: t.navVoiceFilling, icon: Mic },
    { id: 'saved-forms', label: t.navSavedForms, icon: FolderLock },
    { id: 'help-centre', label: t.navHelpCentre, icon: HelpCircle },
    { id: 'recent-access', label: t.navRecentAccess, icon: History },
    { id: 'privacy', label: t.navPrivacy, icon: ShieldAlert },
    { id: 'secure-details', label: t.navSecureDetails, icon: LockKeyhole },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  const handleSelect = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <Mic className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-sm">{navItems.find(n => n.id === activeTab)?.label}</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg touch-target"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`app-sidebar
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between
        transform transition-transform duration-200 ease-in-out lg:transform-none shadow-xl lg:shadow-none
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="sidebar-menu p-4 space-y-6 overflow-y-auto">
          <div className="sidebar-label px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {lang === 'ta' ? 'வழிசெலுத்தல்' : 'Navigation Menu'}
          </div>

          <nav className="sidebar-nav space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`sidebar-nav-item
                    w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all touch-target
                    ${isActive
                      ? 'bg-blue-700 text-white shadow-md shadow-blue-900/50 font-semibold'
                      : 'hover:bg-slate-800 hover:text-white text-slate-300'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User info */}
        {user && (
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors touch-target"
            >
              <LogOut className="w-5 h-5" />
              <span>{t.logout}</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
