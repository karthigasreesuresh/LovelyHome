import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Loading } from '../../components/Loading';
import { Pill, Clock, Plus, CheckCircle, XCircle, Calendar, FileText } from 'lucide-react';

export const MedicinesPage: React.FC = () => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [elders, setElders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ elderId: '', name: '', dosage: '', scheduleTime: '08:00 AM', frequency: 'Daily', instructions: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [medRes, elderRes] = await Promise.all([
        api.get('/medicines'),
        api.get('/elders')
      ]);
      setMedicines(medRes.data.medicines);
      setElders(elderRes.data.elders);
      if (elderRes.data.elders.length > 0) {
        setFormData(prev => ({ ...prev, elderId: elderRes.data.elders[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/medicines', formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading label="Loading Medication Timetables & Adherence Logs..." />;

  // Flatten all logs into a single historical timeline view
  const allLogs: any[] = [];
  medicines.forEach((med) => {
    if (med.logs && med.logs.length > 0) {
      med.logs.forEach((log: any) => {
        allLogs.push({
          id: log.id,
          medicineName: med.name,
          dosage: med.dosage,
          scheduledTime: med.scheduleTime,
          status: log.status,
          date: new Date(log.scheduledFor),
          acknowledgedAt: log.acknowledgedAt ? new Date(log.acknowledgedAt) : null,
          source: med.source,
        });
      });
    }
  });

  allLogs.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medication Timetable & History</h1>
          <p className="text-sm text-slate-500">
            Monitor active medicine schedules and review past reminder acknowledgement logs.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Medication Schedule
        </Button>
      </div>

      {/* Active Schedules Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Pill className="h-5 w-5 text-emerald-600" /> Active Medication Schedules
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {medicines.map((med) => (
            <Card key={med.id} className="relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                    <Pill className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-lg">{med.name}</h3>
                      <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${med.source === 'OCR' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                        {med.source === 'OCR' ? 'OCR extracted — guardian confirmed' : 'Manual entry'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Dosage: <span className="font-semibold text-slate-800">{med.dosage}</span> | Frequency: {med.frequency}
                    </p>
                  </div>
                </div>
                <Badge variant={med.active ? 'success' : 'neutral'}>
                  {med.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Clock className="h-4 w-4 text-sky-600" />
                  <span>Scheduled Time: <strong className="text-slate-900">{med.scheduleTime}</strong></span>
                </div>
                {med.instructions && (
                  <span className="text-slate-500 truncate">Note: {med.instructions}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Structured Medicine History Logs */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-sky-600" /> Medicine Adherence History Logs
        </h2>

        <Card className="overflow-hidden p-0 border-slate-200">
          {allLogs.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-8">No medication history logs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Medicine</th>
                    <th className="px-4 py-3">Dosage</th>
                    <th className="px-4 py-3">Scheduled Time</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Reminder Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {log.date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{log.medicineName}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{log.dosage}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{log.scheduledTime}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-semibold">
                        {log.source === 'OCR' ? 'OCR extracted — guardian confirmed' : 'Manual'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          size="sm"
                          variant={
                            log.status === 'ACKNOWLEDGED'
                              ? 'success'
                              : log.status === 'MISSED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {log.status === 'ACKNOWLEDGED' ? 'Reminder Acknowledged' : log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Add Medication Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Medication Schedule"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Elder</label>
            <select
              value={formData.elderId}
              onChange={(e) => setFormData({ ...formData, elderId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              required
            >
              {elders.map(e => (
                <option key={e.id} value={e.id}>{e.name} (Age {e.age})</option>
              ))}
            </select>
          </div>

          <Input
            label="Medicine Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Metformin / Paracetamol"
            required
          />

          <Input
            label="Dosage"
            value={formData.dosage}
            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
            placeholder="e.g. 500mg / 1 tablet"
            required
          />

          <Input
            label="Scheduled Time"
            value={formData.scheduleTime}
            onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
            placeholder="e.g. 08:00 AM"
            required
          />

          <Input
            label="Instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            placeholder="e.g. Take after breakfast with water"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Add Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
