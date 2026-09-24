import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { Alert as AlertComponent } from '../../components/Alert';
import { Heart, HeartPulse, Pill, AlertOctagon, CheckCircle2, ShieldAlert, Clock, Calendar } from 'lucide-react';

export const ElderDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElderDashboard = async () => {
      try {
        const res = await api.get('/dashboard/elder');
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load Elder Home Screen');
      } finally {
        setLoading(false);
      }
    };
    fetchElderDashboard();
  }, []);

  if (loading) return <Loading label="Loading Elder Home Screen..." />;
  if (error) return <AlertComponent type="error" title="Error Loading Home" message={error} />;

  const { elder, todayCheckIn, medicinesCount, lastCheckIn, lastActivity } = data || {};

  // 1. Dynamic Greeting based on current local hour
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // 2. Dynamic Current Date Formatting (e.g. Wednesday, September 16, 2026)
  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // 3. Wellness Status Determination from DB
  const currentStatus = todayCheckIn?.status || lastCheckIn?.status || 'NORMAL';

  // 4. Last Interaction Time Format
  const interactionTime = lastCheckIn?.timestamp || lastActivity?.timestamp;
  let formattedLastInteraction = 'No recent interaction';
  if (interactionTime) {
    const dateObj = new Date(interactionTime);
    const isToday = new Date().toDateString() === dateObj.toDateString();
    const timeStr = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    formattedLastInteraction = isToday ? `Today, ${timeStr}` : `${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 bg-slate-100 min-h-screen">
      {/* Demo Accessibility Mode Banner */}
      <div className="bg-amber-400 text-slate-900 px-4 py-2.5 rounded-2xl text-center font-bold text-sm shadow-sm flex items-center justify-center gap-2 border-2 border-amber-500">
        <ShieldAlert className="h-5 w-5" />
        <span>Elder Interface — High Contrast & Accessible Assistive Mode</span>
      </div>

      {/* Greeting Header & Dynamic Date */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border-4 border-blue-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-2xl shrink-0">
              <Heart className="h-10 w-10 text-rose-300 fill-current" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {timeGreeting}, {elder?.name || 'Lakshmi'}! 👋
              </h1>
              <p className="text-lg text-blue-200 mt-1 font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-sky-400" />
                <span>{todayDateString}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Wellness Status & Last Interaction Indicators */}
        <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Wellness Badge */}
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 flex items-center justify-between">
            <span className="text-sm uppercase font-bold tracking-wider text-blue-200">Caregiver Awareness Status</span>
            {currentStatus === 'NORMAL' && (
              <span className="px-4 py-1.5 bg-emerald-500 text-white font-black text-base rounded-full shadow flex items-center gap-1.5">
                🟢 No new safety concerns
              </span>
            )}
            {currentStatus === 'ATTENTION' && (
              <span className="px-4 py-1.5 bg-amber-500 text-slate-900 font-black text-base rounded-full shadow flex items-center gap-1.5">
                🟡 Some attention may be needed
              </span>
            )}
            {currentStatus === 'URGENT' && (
              <span className="px-4 py-1.5 bg-red-600 text-white font-black text-base rounded-full shadow flex items-center gap-1.5">
                🔴 Urgent help signal detected
              </span>
            )}
          </div>

          {/* Last Interaction */}
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 flex items-center justify-between">
            <span className="text-sm uppercase font-bold tracking-wider text-blue-200">Last Interaction</span>
            <span className="text-base font-extrabold text-white flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-sky-300" />
              {formattedLastInteraction}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons (Big Touch Targets, Large Typography) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Daily Check-in */}
        <Link
          to="/elder/checkin"
          aria-label="Daily Check-in Button"
          className="group relative bg-white border-4 border-emerald-600 hover:border-emerald-700 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all flex flex-col items-center text-center justify-between min-h-[240px] focus:outline-none focus:ring-8 focus:ring-emerald-300"
        >
          <div className="bg-emerald-100 p-6 rounded-3xl text-emerald-800 group-hover:scale-110 transition-transform shadow-inner">
            <span className="text-5xl">🎙️</span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Daily Check-in</h2>
            <p className="text-base font-bold text-emerald-700 mt-1">
              {todayCheckIn ? (
                <span className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-5 w-5" /> Recorded Today
                </span>
              ) : (
                'Press to log how you feel'
              )}
            </p>
          </div>
        </Link>

        {/* 2. My Medicines */}
        <Link
          to="/elder/medicines"
          aria-label="My Medicines Button"
          className="group relative bg-white border-4 border-sky-600 hover:border-sky-700 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all flex flex-col items-center text-center justify-between min-h-[240px] focus:outline-none focus:ring-8 focus:ring-sky-300"
        >
          <div className="bg-sky-100 p-6 rounded-3xl text-sky-800 group-hover:scale-110 transition-transform shadow-inner">
            <span className="text-5xl">💊</span>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">My Medicines</h2>
            <p className="text-base font-bold text-sky-700 mt-1">
              {medicinesCount || 0} Scheduled Pills Today
            </p>
          </div>
        </Link>

        {/* 3. Emergency SOS */}
        <Link
          to="/elder/sos"
          aria-label="SOS Emergency Button"
          className="group relative bg-gradient-to-br from-red-600 via-red-700 to-rose-900 text-white rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all flex flex-col items-center text-center justify-between min-h-[240px] border-4 border-white ring-8 ring-red-200 focus:outline-none focus:ring-12 focus:ring-red-400"
        >
          <div className="bg-white/20 p-6 rounded-3xl text-white group-hover:scale-110 transition-transform shadow-inner">
            <span className="text-5xl animate-pulse">🚨</span>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-wider uppercase">SOS Emergency</h2>
            <p className="text-base font-bold text-red-100 mt-1">
              PRESS FOR IMMEDIATE HELP
            </p>
          </div>
        </Link>
      </div>

      {/* Simple Information Card */}
      <Card className="border-4 border-slate-300 p-6 rounded-3xl bg-white shadow-md space-y-3">
        <h3 className="text-xl font-bold text-slate-900">Caregiver & Safety Network</h3>
        <p className="text-base text-slate-700 font-semibold">
          Primary Guardian: <span className="text-sky-700 font-bold">Demo Guardian</span> (guardian@lovelyhome.demo)
        </p>
        <p className="text-sm text-slate-500 leading-relaxed font-medium">
          Your daily check-ins, medication acknowledgements, and emergency signals automatically notify your caregiver in real-time.
        </p>
        <div className="pt-3 border-t border-slate-200 text-xs text-slate-400 font-medium leading-normal">
          LovelyHome is a wellness and safety support tool. It does not diagnose medical conditions, prescribe medicines, or replace professional medical care. For emergencies, contact appropriate emergency or healthcare services.
        </div>
      </Card>
    </div>
  );
};
