import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Loading } from './components/Loading';

import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Guardian Pages
import { GuardianDashboard } from './pages/guardian/GuardianDashboard';
import { EldersPage } from './pages/guardian/EldersPage';
import { CheckInsPage } from './pages/guardian/CheckInsPage';
import { MedicinesPage } from './pages/guardian/MedicinesPage';
import { PrescriptionsPage } from './pages/guardian/PrescriptionsPage';
import { AlertsPage } from './pages/guardian/AlertsPage';
import { SettingsPage } from './pages/guardian/SettingsPage';
import { SosPage } from './pages/guardian/SosPage';

// Elder Pages
import { ElderDashboard } from './pages/elder/ElderDashboard';
import { ElderCheckIn } from './pages/elder/ElderCheckIn';
import { ElderMedicines } from './pages/elder/ElderMedicines';
import { ElderSos } from './pages/elder/ElderSos';

// Demo Page
import DemoPage from './pages/DemoPage';

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loading fullScreen label="Checking Authentication & Role Security..." />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'ELDER' ? '/elder' : '/guardian'} replace />;
  }

  return <Outlet />;
};

const GuardianLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const ElderLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Guardian Portal */}
          <Route element={<ProtectedRoute allowedRoles={['GUARDIAN']} />}>
            <Route element={<GuardianLayout />}>
              <Route path="/guardian" element={<GuardianDashboard />} />
              <Route path="/guardian/elders" element={<EldersPage />} />
              <Route path="/guardian/checkins" element={<CheckInsPage />} />
              <Route path="/guardian/medicines" element={<MedicinesPage />} />
              <Route path="/guardian/prescriptions" element={<PrescriptionsPage />} />
              <Route path="/guardian/prescription" element={<PrescriptionsPage />} />
              <Route path="/guardian/alerts" element={<AlertsPage />} />
              <Route path="/guardian/settings" element={<SettingsPage />} />
              <Route path="/guardian/sos" element={<SosPage />} />
              <Route path="/demo" element={<DemoPage />} />
            </Route>
          </Route>

          {/* Protected Elder Interface */}
          <Route element={<ProtectedRoute allowedRoles={['ELDER', 'GUARDIAN']} />}>
            <Route element={<ElderLayout />}>
              <Route path="/elder" element={<ElderDashboard />} />
              <Route path="/elder/checkin" element={<ElderCheckIn />} />
              <Route path="/elder/medicines" element={<ElderMedicines />} />
              <Route path="/elder/sos" element={<ElderSos />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
