import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Loading } from '../../components/Loading';
import { ArrowLeft, AlertOctagon, CheckCircle2, ShieldAlert, X } from 'lucide-react';

export const ElderSos: React.FC = () => {
  const [elderId, setElderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<{
    lat?: number;
    lng?: number;
    locationUnavailable: boolean;
    statusText: string;
  }>({
    locationUnavailable: true,
    statusText: 'Locating position...',
  });

  useEffect(() => {
    const fetchElder = async () => {
      try {
        const res = await api.get('/dashboard/elder');
        setElderId(res.data.elder.id);
      } catch (err) {
        console.error('Failed to load elder profile for SOS', err);
      } finally {
        setLoading(false);
      }
    };
    fetchElder();

    // Query browser geolocation safely
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationState({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            locationUnavailable: false,
            statusText: `📍 GPS position obtained (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
          });
        },
        (err) => {
          console.warn('Geolocation unavailable or denied:', err.message);
          setLocationState({
            locationUnavailable: true,
            statusText: '📍 Location unavailable (Living Home fallback)',
          });
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      setLocationState({
        locationUnavailable: true,
        statusText: '📍 Location unavailable on this device',
      });
    }
  }, []);

  const executeSosTrigger = async () => {
    if (!elderId || triggering) return;
    setTriggering(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        elderId,
        locationUnavailable: locationState.locationUnavailable,
      };

      if (!locationState.locationUnavailable && locationState.lat !== undefined && locationState.lng !== undefined) {
        payload.latitude = locationState.lat;
        payload.longitude = locationState.lng;
        payload.address = `GPS: ${locationState.lat.toFixed(4)}, ${locationState.lng.toFixed(4)}`;
      } else {
        payload.address = 'Location unavailable (Living Home)';
      }

      await api.post('/sos/trigger', payload);
      setTriggered(true);
      setShowConfirmModal(false);
    } catch (err: any) {
      console.error('Failed to trigger SOS', err);
      setErrorMessage(
        err.response?.data?.error ||
          "We couldn't send the SOS right now. Please contact your caregiver or local emergency service directly if you need immediate help."
      );
    } finally {
      setTriggering(false);
    }
  };

  if (loading) return <Loading label="Loading SOS Emergency Button..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 sm:p-6 bg-slate-50 min-h-screen">
      <Link
        to="/elder"
        className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-300 rounded-2xl text-lg font-bold text-slate-700 hover:bg-slate-100 shadow-sm"
      >
        <ArrowLeft className="h-6 w-6" /> Back to Main Menu
      </Link>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border-4 border-red-500 shadow-2xl text-center space-y-6">
        <div className="inline-flex bg-red-100 p-6 rounded-full text-red-600 animate-pulse">
          <AlertOctagon className="h-20 w-20" />
        </div>

        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            🚨 EMERGENCY SOS
          </h1>
          <p className="text-xl text-slate-600 font-bold mt-3">
            Need immediate help from your caregiver?
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-100 border-2 border-red-400 text-red-800 rounded-2xl font-bold text-base text-left">
            ⚠️ {errorMessage}
          </div>
        )}

        {triggered ? (
          <div className="p-8 bg-emerald-700 text-white rounded-3xl space-y-4 shadow-xl">
            <CheckCircle2 className="h-20 w-20 mx-auto text-emerald-200" />
            <h2 className="text-3xl font-black tracking-tight">🚨 EMERGENCY ALERT SENT</h2>
            <p className="text-xl font-bold">
              Emergency alert sent to your LovelyHome caregiver.
            </p>
            {locationState.locationUnavailable ? (
              <p className="text-base bg-emerald-800/80 p-3 rounded-xl border border-emerald-500">
                Location could not be obtained. Your SOS was still sent.
              </p>
            ) : (
              <p className="text-base bg-emerald-800/80 p-3 rounded-xl border border-emerald-500">
                GPS Position attached to alert.
              </p>
            )}
            <p className="text-xs text-emerald-200 pt-2 border-t border-emerald-600">
              * Note: SOS alert created. Please contact local emergency services directly if immediate medical/police assistance is required.
            </p>
          </div>
        ) : (
          <button
            disabled={triggering}
            onClick={() => setShowConfirmModal(true)}
            className="w-full py-12 px-8 bg-gradient-to-r from-red-600 via-red-700 to-rose-800 text-white font-black text-3xl sm:text-4xl rounded-3xl shadow-2xl hover:scale-102 transition-all active:scale-95 border-4 border-white tracking-wider uppercase ring-8 ring-red-200 cursor-pointer disabled:opacity-50"
          >
            {triggering ? 'SENDING SOS...' : '🚨 SEND SOS 🚨'}
          </button>
        )}

        <div className="pt-4 border-t border-slate-200 text-base text-slate-600 font-bold">
          <p>{locationState.statusText}</p>
        </div>
      </div>

      {/* 2-STEP CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-8 rounded-3xl border-4 border-red-500 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-150">
            <div className="inline-flex p-4 bg-red-100 text-red-600 rounded-full">
              <ShieldAlert className="h-16 w-16" />
            </div>

            <div>
              <h3 className="text-3xl font-black text-slate-900">Confirm SOS Emergency</h3>
              <p className="text-lg text-slate-600 font-semibold mt-2">
                Are you sure you want to send an emergency alert? Your caregiver will be notified immediately.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                disabled={triggering}
                onClick={() => setShowConfirmModal(false)}
                className="py-4 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xl rounded-2xl transition-colors border-2 border-slate-400"
              >
                CANCEL
              </button>
              <button
                disabled={triggering}
                onClick={executeSosTrigger}
                className="py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-black text-xl rounded-2xl transition-colors border-2 border-red-800 shadow-lg"
              >
                {triggering ? 'SENDING...' : 'SEND SOS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
