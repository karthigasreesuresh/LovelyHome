import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { ArrowLeft, Pill, Clock, CheckCircle2 } from 'lucide-react';

export const ElderMedicines: React.FC = () => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const fetchElderMedicines = async () => {
    try {
      const res = await api.get('/dashboard/elder');
      if (res.data.elder?.medicines) {
        setMedicines(res.data.elder.medicines);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElderMedicines();
  }, []);

  const handleAcknowledgeReminder = async (medicineId: string, logId?: string) => {
    setAcknowledgingId(medicineId);
    try {
      await api.post(`/medicines/${medicineId}/acknowledge`, { logId });
      fetchElderMedicines();
    } catch (err) {
      console.error(err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  if (loading) return <Loading label="Loading Today's Medication Reminders..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 sm:p-6 bg-slate-100 min-h-screen">
      <Link
        to="/elder"
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-300 rounded-2xl text-lg font-bold text-slate-700 hover:bg-slate-200"
      >
        <ArrowLeft className="h-6 w-6" /> Back to Home
      </Link>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border-4 border-slate-300 shadow-xl space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
          <div className="p-4 bg-sky-100 text-sky-800 rounded-2xl shrink-0">
            <Pill className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Today's Medicines</h1>
            <p className="text-base font-semibold text-slate-600 mt-1">
              Tap the button to confirm you received your medication reminder.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {medicines.length === 0 ? (
            <p className="text-xl text-slate-500 py-8 text-center font-bold">No medicines scheduled for today.</p>
          ) : (
            medicines.map((med) => {
              const latestLog = med.logs?.[0];
              const isAcknowledged = latestLog?.status === 'ACKNOWLEDGED';

              return (
                <div
                  key={med.id}
                  className={`p-6 rounded-3xl border-4 shadow-md space-y-4 transition-all ${
                    isAcknowledged
                      ? 'bg-emerald-50 border-emerald-500'
                      : 'bg-sky-50 border-sky-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-300 rounded-2xl text-xl font-extrabold text-slate-900 shadow-xs">
                      <Clock className="h-6 w-6 text-sky-600" />
                      <span>{med.scheduleTime}</span>
                    </div>

                    <span className="text-xs font-extrabold uppercase px-3 py-1 bg-white rounded-full border border-slate-300 text-slate-600">
                      {med.source === 'OCR' ? '📷 Prescription OCR' : '✍️ Scheduled'}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-3xl font-black text-slate-900">{med.name}</h2>
                    <p className="text-2xl font-extrabold text-sky-800 mt-1">
                      Dosage: {med.dosage}
                    </p>
                  </div>

                  {med.instructions && (
                    <p className="text-lg text-slate-700 font-bold bg-white/90 p-4 rounded-2xl border border-slate-200">
                      💡 {med.instructions}
                    </p>
                  )}

                  <div className="pt-2">
                    {isAcknowledged ? (
                      <div className="flex items-center justify-center gap-3 p-5 bg-emerald-600 text-white font-black text-2xl rounded-2xl shadow-lg border-2 border-emerald-700">
                        <CheckCircle2 className="h-8 w-8" />
                        Reminder acknowledged
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={acknowledgingId === med.id}
                        onClick={() => handleAcknowledgeReminder(med.id, latestLog?.id)}
                        className="w-full py-6 px-8 bg-sky-600 hover:bg-sky-700 text-white font-black text-2xl rounded-2xl shadow-xl transition-transform active:scale-98 border-4 border-sky-800 disabled:opacity-50"
                      >
                        {acknowledgingId === med.id ? 'Saving Acknowledgement...' : 'Acknowledge Reminder 👍'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-200 rounded-2xl text-center text-xs font-semibold text-slate-600 border border-slate-300">
        ℹ️ Acknowledging a reminder confirms you received the notification. Always follow your physician's instructions.
      </div>
    </div>
  );
};
