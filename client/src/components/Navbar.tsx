import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  Menu,
  X,
  LayoutDashboard,
  Users,
  HeartPulse,
  Pill,
  FileText,
  Bell,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const guardianNavItems = [
    { label: 'Dashboard', path: '/guardian', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Elder Profile', path: '/guardian/elders', icon: <Users className="h-4 w-4" /> },
    { label: 'Check-ins', path: '/guardian/checkins', icon: <HeartPulse className="h-4 w-4" /> },
    { label: 'Medicines', path: '/guardian/medicines', icon: <Pill className="h-4 w-4" /> },
    { label: 'Prescription OCR', path: '/guardian/prescriptions', icon: <FileText className="h-4 w-4" /> },
    { label: 'Alerts', path: '/guardian/alerts', icon: <Bell className="h-4 w-4" /> },
    { label: 'Demo Evaluator', path: '/demo', icon: <ShieldCheck className="h-4 w-4 text-amber-500" /> },
    { label: 'Settings', path: '/guardian/settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Demo Data Banner */}
      <div className="bg-amber-500 text-slate-950 text-xs py-1 px-4 text-center font-bold flex items-center justify-center gap-1">
        <ShieldAlert className="h-3.5 w-3.5" />
        <span>LovelyHome Award MVP Demo Mode — Powered by Live Seeded Backend</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button for Guardian Role */}
          {user && user.role === 'GUARDIAN' && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Drawer"
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-lg"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}

          <Link to={user?.role === 'ELDER' ? '/elder' : '/guardian'} className="flex items-center gap-2">
            <div className="bg-sky-600 text-white p-2 rounded-xl shadow-md">
              <Heart className="h-6 w-6 fill-current" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Lovely<span className="text-sky-600">Home</span></span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 -mt-1">Elder Wellness & Safety</span>
            </div>
          </Link>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700">
              <UserIcon className="h-4 w-4 text-sky-600" />
              <span>{user.name}</span>
              <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 uppercase border border-slate-200">
                {user.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              aria-label="Log Out"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Responsive Mobile Drawer Navigation */}
      {mobileMenuOpen && user?.role === 'GUARDIAN' && (
        <div className="md:hidden fixed inset-0 top-[88px] z-40 bg-slate-900/50 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-xs bg-white h-full p-4 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Guardian Navigation
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {guardianNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/guardian'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-sky-50 text-sky-700 font-semibold border-l-4 border-sky-600'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <Link
                to="/elder"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Switch to Elder View 👵</span>
              </Link>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
};
