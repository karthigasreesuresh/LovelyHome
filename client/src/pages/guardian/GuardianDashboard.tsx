import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Loading } from '../../components/Loading';
import { Alert as AlertComponent } from '../../components/Alert';
import { HeartPulse, Pill, Bell, AlertOctagon, Activity, Users, ArrowRight, MapPin, Radio, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GuardianDashboard: React.FC = () => {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [selectedElderId, setSelectedElderId] = useState<string | null>(null);
  const [elderDashboard, setElderDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<'connected' | 'error'>('connected');

  const selectedElderIdRef = useRef<string | null>(selectedElderId);
  useEffect(() => {
    selectedElderIdRef.current = selectedElderId;
  }, [selectedElderId]);

  const fetchGuardianData = async (isPoll = false) => {
    try {
      const res = await api.get('/dashboard/guardian');
      setSummaryData(res.data);
      setPollingStatus('connected');

      const currentElderId = selectedElderIdRef.current || (res.data.elders?.[0]?.id ?? null);
      if (currentElderId && !selectedElderIdRef.current) {
        setSelectedElderId(currentElderId);
      }

      if (currentElderId) {
        await fetchElderDetails(currentElderId, isPoll);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.warn('Dashboard fetch error:', err.message);
      setPollingStatus('error');
      if (!isPoll) {
        setError(err.response?.data?.error || 'Failed to load Guardian dashboard');
        setLoading(false);
      }
    }
  };

  const fetchElderDetails = async (elderId: string, isPoll = false) => {
    try {
      const res = await api.get(`/dashboard/${elderId}`);
      setElderDashboard(res.data);
    } catch (err: any) {
      console.error('Failed to load elder detail dashboard:', err);
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  // Initial load + 5-second Polling Loop
  useEffect(() => {
    fetchGuardianData(false);

    const intervalId = setInterval(() => {
      fetchGuardianData(true);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleSelectElder = (elderId: string) => {
    setSelectedElderId(elderId);
    setLoading(true);
    fetchElderDetails(elderId, false);
  };

  if (loading) return <Loading label="Loading LovelyHome Guardian Dashboard & Real-Time Telemetry..." />;
  if (error) return <AlertComponent type="error" title="Error Loading Dashboard" message={error} />;

  const { summary, elders = [], activeSosEvents = [] } = summaryData || {};
  const elder = elderDashboard?.elder;
  const latestCheckIn = elderDashboard?.latestCheckIn;
  const todayCheckInStatus = elderDashboard?.todayCheckInStatus || 'PENDING';
  const wellnessStatus = elderDashboard?.wellnessStatus || 'NORMAL';
  const medicineStats = elderDashboard?.medicineStats || {};
  const unresolvedAlerts = elderDashboard?.unresolvedAlerts || [];
  const recentActivities = elderDashboard?.recentActivities || [];
  const recentSos = elderDashboard?.recentSos;
  const lastInteractionTimestamp = elderDashboard?.lastInteractionTimestamp;

  const renderStatusBadge = (status: string) => {
    if (status === 'URGENT') {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 font-extrabold text-base rounded-2xl border-2 border-red-300 shadow-sm animate-pulse">
          🔴 URGENT
        </span>
      );
    } else if (status === 'ATTENTION') {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-900 font-extrabold text-base rounded-2xl border-2 border-amber-300 shadow-sm">
          🟡 ATTENTION NEEDED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-900 font-extrabold text-base rounded-2xl border-2 border-emerald-300 shadow-sm">
        🟢 NORMAL
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                LovelyHome Guardian Dashboard
              </h1>
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300 animate-pulse">
                <Radio className="h-3.5 w-3.5" /> Live 5s
              </span>
              {pollingStatus === 'error' && (
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  (Connection retry...)
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              AI-Powered Elderly Safety & Adherence Monitoring Platform
            </p>
          </div>

          {/* Elder Selector if multiple elders exist */}
          {elders.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-600">Select Elder:</span>
              <select
                value={selectedElderId || ''}
                onChange={(e) => handleSelectElder(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-sm bg-white font-bold text-slate-800"
              >
                {elders.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.name} (Age {e.age})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Monitored Elder Profile & Calculated Status */}
        {elder ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900">{elder.name}</h2>
                <span className="px-3 py-1 bg-sky-100 text-sky-800 text-sm font-extrabold rounded-xl border border-sky-200">
                  Age: {elder.age}
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Gender: {elder.gender}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Medical History: <span className="font-semibold text-slate-700">{elder.medicalHistory}</span>
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Caregiver Awareness Status</span>
              {renderStatusBadge(wellnessStatus)}
              <span className="text-[11px] text-slate-500 font-medium italic mt-1 max-w-xs text-right">
                Based on recent LovelyHome activity and safety signals. This is not a medical assessment.
              </span>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 py-4 text-center text-sm">No elder profiles linked to your account.</p>
        )}
      </div>

      {/* 🚨 HIGHLY VISIBLE EMERGENCY SOS BANNER */}
      {activeSosEvents.length > 0 && (
        <div className="bg-red-600 border-4 border-red-700 text-white p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4 animate-bounce duration-1000">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-white text-red-600 p-3.5 rounded-2xl shrink-0 shadow-md">
                <AlertOctagon className="h-10 w-10 animate-pulse" />
              </div>
              <div>
                <span className="px-3 py-1 bg-red-800 text-white font-black text-xs uppercase tracking-widest rounded-full border border-red-400">
                  CRITICAL EMERGENCY SOS
                </span>
                <h3 className="text-2xl font-black mt-1">
                  🚨 {activeSosEvents[0].elder?.name} has triggered an SOS!
                </h3>
                <p className="text-sm text-red-100 font-semibold mt-1">
                  Triggered at: {new Date(activeSosEvents[0].triggeredAt).toLocaleTimeString()} |{' '}
                  {activeSosEvents[0].locationUnavailable ? (
                    <span>📍 Location unavailable (Living Home fallback)</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold">
                      <MapPin className="h-4 w-4 text-red-200" /> Location: {activeSosEvents[0].address}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Link
              to="/guardian/alerts"
              className="px-6 py-3.5 bg-white hover:bg-slate-100 text-red-700 font-black text-base rounded-2xl shadow-xl border-2 border-white shrink-0 text-center"
            >
              View & Resolve Alert →
            </Link>
          </div>
        </div>
      )}

      {/* 5 CORE DASHBOARD METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Today's Check-in */}
        <Card className="flex flex-col justify-between p-5 border-l-4 border-l-sky-500 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Check-in</span>
            <HeartPulse className="h-5 w-5 text-sky-600" />
          </div>
          <div className="my-3">
            <p className="text-2xl font-black text-slate-900">
              {todayCheckInStatus === 'COMPLETED' ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-6 w-6" /> Completed
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <Clock className="h-6 w-6" /> Pending
                </span>
              )}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium truncate">
            {latestCheckIn ? `Last: ${new Date(latestCheckIn.timestamp).toLocaleTimeString()}` : 'No check-in yet today'}
          </p>
        </Card>

        {/* Card 2: Medicine Adherence */}
        <Card className="flex flex-col justify-between p-5 border-l-4 border-l-emerald-500 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Medicine Adherence</span>
            <Pill className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="my-3">
            <p className="text-2xl font-black text-slate-900">
              <span className="text-emerald-600">{medicineStats.acknowledgedCount || 0}</span> / {medicineStats.todayTotal || 0}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Ack: {medicineStats.acknowledgedCount || 0} | Pend: {medicineStats.pendingCount || 0} | Missed: {medicineStats.missedCount || 0}
          </p>
        </Card>

        {/* Card 3: Recent Activity */}
        <Card className="flex flex-col justify-between p-5 border-l-4 border-l-indigo-500 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Activity</span>
            <Activity className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="my-3">
            <p className="text-base font-bold text-slate-800 line-clamp-2">
              {recentActivities[0]?.action || 'No recent interactions'}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Last: {lastInteractionTimestamp ? new Date(lastInteractionTimestamp).toLocaleTimeString() : 'N/A'}
          </p>
        </Card>

        {/* Card 4: Unresolved Alerts */}
        <Card className="flex flex-col justify-between p-5 border-l-4 border-l-amber-500 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unresolved Alerts</span>
            <Bell className="h-5 w-5 text-amber-600" />
          </div>
          <div className="my-3">
            <p className="text-3xl font-black text-slate-900">{elderDashboard?.unresolvedAlertsCount || 0}</p>
          </div>
          <Link to="/guardian/alerts" className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1">
            View Alerts Feed <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>

        {/* Card 5: Recent SOS */}
        <Card className={`flex flex-col justify-between p-5 border-l-4 bg-white ${summary?.activeSosCount > 0 ? 'border-l-red-600 bg-red-50/40' : 'border-l-slate-300'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent SOS</span>
            <AlertOctagon className={`h-5 w-5 ${summary?.activeSosCount > 0 ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className="my-3">
            <Badge size="lg" variant={recentSos?.status === 'TRIGGERED' || recentSos?.status === 'ACKNOWLEDGED' ? 'danger' : 'neutral'}>
              {recentSos?.status || 'NONE'}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 font-medium truncate">
            {recentSos ? `Time: ${new Date(recentSos.triggeredAt).toLocaleTimeString()}` : 'No SOS recorded'}
          </p>
        </Card>
      </div>

      {/* Main Detail Grid */}
      {elder && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Latest Check-in & Today's Medicines */}
          <div className="lg:col-span-2 space-y-6">
            {/* Latest Check-in Detail */}
            <Card
              title="Latest Daily Wellness Check-in"
              subtitle={latestCheckIn ? `Logged at ${new Date(latestCheckIn.timestamp).toLocaleString()}` : 'No check-in recorded yet'}
              action={
                <Link to="/guardian/checkins" className="text-xs text-sky-600 font-bold hover:underline flex items-center gap-1">
                  Check-in History <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              {latestCheckIn ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Wellness Result</span>
                      <Badge
                        size="lg"
                        variant={
                          latestCheckIn.status === 'NORMAL'
                            ? 'success'
                            : latestCheckIn.status === 'ATTENTION'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {latestCheckIn.status}
                      </Badge>
                    </div>
                    {latestCheckIn.mood && (
                      <div className="text-right">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Reported Mood</span>
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold text-sm rounded-xl">
                          😊 {latestCheckIn.mood}
                        </span>
                      </div>
                    )}
                  </div>

                  {latestCheckIn.notes && (
                    <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100">
                      <span className="text-xs font-bold text-sky-800 block mb-1">Conversation Notes / Symptoms:</span>
                      <p className="text-sm text-slate-700 italic">"{latestCheckIn.notes}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic py-4 text-center">No check-in completed today.</p>
              )}
            </Card>

            {/* Today's Medicine Adherence */}
            <Card
              title="Today's Medicine Adherence"
              subtitle={`Pending: ${medicineStats.pendingCount || 0} | Acknowledged: ${medicineStats.acknowledgedCount || 0}`}
              action={
                <Link to="/guardian/medicines" className="text-xs text-sky-600 font-bold hover:underline flex items-center gap-1">
                  Manage Schedules <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              {medicineStats.medicines?.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No active medication schedules.</p>
              ) : (
                <div className="space-y-3">
                  {medicineStats.medicines?.map((med: any) => {
                    const latestLog = med.logs?.[0];
                    return (
                      <div key={med.id} className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{med.name} ({med.dosage})</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Scheduled: {med.scheduleTime} | {med.frequency}</p>
                        </div>
                        <Badge
                          variant={
                            latestLog?.status === 'ACKNOWLEDGED'
                              ? 'success'
                              : latestLog?.status === 'MISSED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {latestLog?.status || 'SCHEDULED'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Unresolved Alerts & Activity Stream */}
          <div className="space-y-6">
            {/* Unresolved Alerts */}
            <Card
              title="Unresolved Safety Alerts"
              action={
                <Link to="/guardian/alerts" className="text-xs text-sky-600 font-bold hover:underline flex items-center gap-1">
                  Alert Feed <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              {unresolvedAlerts.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No unresolved safety alerts for this elder.</p>
              ) : (
                <div className="space-y-3">
                  {unresolvedAlerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-2xl border text-xs ${
                        alert.severity === 'CRITICAL' || alert.type === 'SOS'
                          ? 'bg-red-50 border-red-200 text-red-900'
                          : alert.severity === 'HIGH'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-sky-50 border-sky-200 text-sky-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span>{alert.title}</span>
                        <Badge size="sm" variant={alert.severity === 'CRITICAL' || alert.type === 'SOS' ? 'danger' : 'warning'}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">{alert.message}</p>
                      <p className="text-[10px] opacity-60 mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Activity Log */}
            <Card title="Recent System Activity">
              {recentActivities.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No recent activity recorded.</p>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((act: any) => (
                    <div key={act.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-0">
                      <div className="flex items-center justify-between text-slate-700 font-semibold">
                        <span>{act.action}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {act.details && <p className="text-[11px] text-slate-500 mt-0.5">{act.details}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
