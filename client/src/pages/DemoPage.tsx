import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Alert as AlertComponent } from '../components/Alert';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Clock,
  Siren,
  RotateCcw,
  ExternalLink,
  Wifi,
  Smartphone,
  Info
} from 'lucide-react';

export const DemoPage: React.FC = () => {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  const runScenario = async (scenario: string) => {
    setLoadingScenario(scenario);
    setFeedback(null);
    try {
      const res = await api.post('/demo/simulate', { scenario });
      setFeedback({
        type: 'success',
        title: 'Simulation Triggered Successfully',
        message: `${res.data.message} Monitored Elder: ${res.data.elderName || 'Lakshmi'}. Check the Guardian Dashboard or Alert feed to see updates live.`
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        title: 'Simulation Error',
        message: err.response?.data?.error || 'Failed to execute demo scenario. Make sure you are logged in.'
      });
    } finally {
      setLoadingScenario(null);
    }
  };

  const resetDemo = async () => {
    setLoadingScenario('RESET');
    setFeedback(null);
    try {
      const res = await api.post('/demo/reset');
      setFeedback({
        type: 'success',
        title: 'Demo Data Reset Complete',
        message: res.data.message
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        title: 'Reset Failed',
        message: err.response?.data?.error || 'Failed to reset demo simulation data.'
      });
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Prominent Demo Mode Header */}
      <div className="bg-amber-500 text-slate-950 p-6 rounded-3xl shadow-lg border-4 border-amber-600">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 text-amber-400 p-3.5 rounded-2xl shrink-0">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest font-black text-slate-900 bg-amber-300 px-2.5 py-0.5 rounded-full">
                Interactive Evaluator Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                DEMO MODE — SAMPLE DATA
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/guardian">
              <Button variant="secondary" className="bg-slate-900 text-white hover:bg-slate-800 border-none font-bold text-xs">
                Guardian View <ExternalLink className="h-3.5 w-3.5 ml-1 inline" />
              </Button>
            </Link>
            <Link to="/elder">
              <Button variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100 border-none font-bold text-xs">
                Elder View <ExternalLink className="h-3.5 w-3.5 ml-1 inline" />
              </Button>
            </Link>
          </div>
        </div>

        <p className="mt-4 text-sm font-bold text-slate-900 bg-amber-400/80 p-3 rounded-xl border border-amber-600/50">
          ⚠️ Demo simulation only — no real emergency notification is being dispatched.
        </p>
      </div>

      {/* Response Feedback Notice */}
      {feedback && (
        <AlertComponent
          type={feedback.type}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Demo Simulation Scenarios Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Info className="h-5 w-5 text-sky-600" />
            <span>Simulate Real Backend Scenarios</span>
          </h2>
          <Button
            variant="outline"
            onClick={resetDemo}
            isLoading={loadingScenario === 'RESET'}
            className="text-xs text-red-600 border-red-300 hover:bg-red-50 font-bold"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset Demo Data
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Normal Check-in */}
          <Card className="border-2 border-emerald-200 hover:border-emerald-400 p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-base mb-1">
                <CheckCircle2 className="h-5 w-5" />
                <span>1. Normal Check-in</span>
              </div>
              <p className="text-xs text-slate-600">
                Creates an actual check-in record in SQLite database with status <span className="font-bold text-emerald-700">NORMAL</span>.
              </p>
            </div>
            <Button
              onClick={() => runScenario('NORMAL_CHECKIN')}
              isLoading={loadingScenario === 'NORMAL_CHECKIN'}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              Simulate Normal Check-in
            </Button>
          </Card>

          {/* 2. Attention-Needed Check-in */}
          <Card className="border-2 border-amber-200 hover:border-amber-400 p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-amber-700 font-bold text-base mb-1">
                <AlertTriangle className="h-5 w-5" />
                <span>2. Attention Check-in</span>
              </div>
              <p className="text-xs text-slate-600">
                Creates a check-in with status <span className="font-bold text-amber-700">ATTENTION</span> and triggers a <span className="font-bold">HEALTH_CONCERN</span> alert in DB.
              </p>
            </div>
            <Button
              onClick={() => runScenario('ATTENTION_CHECKIN')}
              isLoading={loadingScenario === 'ATTENTION_CHECKIN'}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              Simulate Attention Check-in
            </Button>
          </Card>

          {/* 3. Missed Medicine */}
          <Card className="border-2 border-purple-200 hover:border-purple-400 p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-purple-700 font-bold text-base mb-1">
                <Pill className="h-5 w-5" />
                <span>3. Missed Medicine</span>
              </div>
              <p className="text-xs text-slate-600">
                Generates an actual <span className="font-bold text-purple-700">MEDICINE_MISSED</span> alert in the database for unacknowledged medicine.
              </p>
            </div>
            <Button
              onClick={() => runScenario('MISSED_MEDICINE')}
              isLoading={loadingScenario === 'MISSED_MEDICINE'}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            >
              Simulate Missed Medicine
            </Button>
          </Card>

          {/* 4. Missed Check-in */}
          <Card className="border-2 border-blue-200 hover:border-blue-400 p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-blue-700 font-bold text-base mb-1">
                <Clock className="h-5 w-5" />
                <span>4. Missed Check-in</span>
              </div>
              <p className="text-xs text-slate-600">
                Triggers a <span className="font-bold text-blue-700">CHECKIN_MISSED</span> alert when expected daily check-in window passes.
              </p>
            </div>
            <Button
              onClick={() => runScenario('MISSED_CHECKIN')}
              isLoading={loadingScenario === 'MISSED_CHECKIN'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              Simulate Missed Check-in
            </Button>
          </Card>

          {/* 5. Demo SOS Emergency */}
          <Card className="border-2 border-red-300 hover:border-red-500 bg-red-50/50 p-6 flex flex-col justify-between space-y-4 lg:col-span-2">
            <div>
              <div className="flex items-center gap-2 text-red-700 font-bold text-base mb-1">
                <Siren className="h-5 w-5 animate-pulse" />
                <span>5. Demo Emergency SOS</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Creates a clearly marked demo SOS event with location explicitly set to <span className="font-bold text-red-800">"Demo location — not a real emergency location"</span> and generates a <span className="font-bold text-red-800">CRITICAL SOS</span> alert in DB.
              </p>
            </div>
            <Button
              onClick={() => runScenario('DEMO_SOS')}
              isLoading={loadingScenario === 'DEMO_SOS'}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs tracking-wider uppercase"
            >
              Simulate Demo SOS Signal
            </Button>
          </Card>
        </div>
      </div>

      {/* PWA & Offline Capability Technical Guidance */}
      <Card className="border border-slate-200 p-6 rounded-2xl bg-white shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-sky-600" />
          <span>Progressive Web App (PWA) & Offline Boundary Guidance</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
            <h4 className="font-bold text-sky-900 mb-1 flex items-center gap-1.5">
              <Wifi className="h-4 w-4 text-sky-600" />
              <span>Cached App Shell (Offline Accessible)</span>
            </h4>
            <p className="leading-relaxed">
              The PWA service worker caches application HTML, styles, scripts, icons, and UI shell components so the app opens instantly on supported mobile/desktop browsers even without internet.
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>Live Network Boundary Requirements</span>
            </h4>
            <p className="leading-relaxed">
              Some app screens can remain available offline, but live health records, alerts, SOS transmission, and caregiver synchronization require an active internet connection.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DemoPage;
