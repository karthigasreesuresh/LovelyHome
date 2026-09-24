import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Loading } from '../../components/Loading';
import { UserPlus, Heart, Phone, ShieldCheck } from 'lucide-react';

export const EldersPage: React.FC = () => {
  const [elders, setElders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', age: '', gender: 'Female', medicalHistory: '', preferredLanguage: 'English' });
  const [submitting, setSubmitting] = useState(false);

  const fetchElders = async () => {
    try {
      const res = await api.get('/elders');
      setElders(res.data.elders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElders();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/elders', formData);
      setIsModalOpen(false);
      setFormData({ name: '', age: '', gender: 'Female', medicalHistory: '', preferredLanguage: 'English' });
      fetchElders();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading label="Loading Elder Profiles..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Elder Profiles Management</h1>
          <p className="text-sm text-slate-500">Manage monitored family members and health preferences</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Add New Elder Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {elders.map((elder) => (
          <Card key={elder.id} className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{elder.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Age: <span className="font-semibold">{elder.age}</span> | Gender: {elder.gender || 'Not specified'}
                </p>
              </div>
              <Badge variant="info">{elder.preferredLanguage || 'English'}</Badge>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Medical Summary:</span>
                <span>{elder.medicalHistory || 'No major history'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Total Check-ins Logged:</span>
                <span>{elder._count?.checkIns || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Active Medications:</span>
                <span>{elder._count?.medicines || 0}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <ShieldCheck className="h-4 w-4" /> Guardian Monitored (Demo)
              </span>
              <span className="text-slate-400">ID: {elder.id.slice(0, 8)}...</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Elder Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Monitored Elder Profile"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Elder Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Grandma Mary"
            required
          />
          <Input
            label="Age"
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            placeholder="75"
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <Input
            label="Medical History / Conditions"
            value={formData.medicalHistory}
            onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
            placeholder="e.g. Diabetes, Arthritis"
          />
          <Input
            label="Preferred Language"
            value={formData.preferredLanguage}
            onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
            placeholder="English / Tamil / Hindi"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
