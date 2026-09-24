import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { Button } from './Button';
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  Pill,
  FileText,
  Bell,
  Settings,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/guardian', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Elder', path: '/guardian/elders', icon: <Users className="h-4 w-4" /> },
    { label: 'Check-ins', path: '/guardian/checkins', icon: <HeartPulse className="h-4 w-4" /> },
    { label: 'Medicines', path: '/guardian/medicines', icon: <Pill className="h-4 w-4" /> },
    { label: 'Prescription OCR', path: '/guardian/prescriptions', icon: <FileText className="h-4 w-4" /> },
    { label: 'Alerts', path: '/guardian/alerts', icon: <Bell className="h-4 w-4" /> },
    { label: 'Demo Evaluator', path: '/demo', icon: <ShieldCheck className="h-4 w-4 text-amber-500" /> },
    { label: 'Settings', path: '/guardian/settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 hidden md:flex flex-col justify-between">
      <div>
        <div className="mb-4 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Guardian Portal
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/guardian'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold shadow-xs border-l-4 border-sky-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
        <NavLink
          to="/elder"
          className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Elder Mode View 👵</span>
        </NavLink>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Sign Out"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Log Out Now
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to sign out of the LovelyHome Guardian Portal? You will need to log in again to access safety monitors.
        </p>
      </Modal>
    </aside>
  );
};
