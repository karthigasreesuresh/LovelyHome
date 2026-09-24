import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { User, Bell, Globe, Shield, Save, CheckCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  // Form states initialized from authenticated user
  const [guardianName, setGuardianName] = useState(user?.name || 'Demo Guardian');
  const [email] = useState(user?.email || 'guardian@lovelyhome.demo');
  const [elderName, setElderName] = useState('Lakshmi');
  const [preferredLanguage, setPreferredLanguage] = useState('English');

  // Notification toggles
  const [healthAlerts, setHealthAlerts] = useState(true);
  const [medicineAlerts, setMedicineAlerts] = useState(true);
  const [sosAlerts, setSosAlerts] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Guardian Account & System Settings</h1>
        <p className="text-sm text-slate-500">Configure profile, notification thresholds, and elder care preferences</p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2 font-semibold">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Account Information */}
        <Card title="Account Profile">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Guardian Name
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-600 rounded-lg text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs">
              <span className="text-slate-500">Account Role:</span>
              <Badge variant="info">{user?.role || 'GUARDIAN'}</Badge>
            </div>
          </div>
        </Card>

        {/* Elder Preferences */}
        <Card title="Monitored Elder Preferences">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Primary Elder Name
                </label>
                <input
                  type="text"
                  value={elderName}
                  onChange={(e) => setElderName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Interface Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card title="Notification & Push Alert Preferences">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Health & Wellness Check-in Flags</h4>
                <p className="text-xs text-slate-500">Receive alerts when check-in status is ATTENTION or URGENT</p>
              </div>
              <input
                type="checkbox"
                checked={healthAlerts}
                onChange={(e) => setHealthAlerts(e.target.checked)}
                className="h-5 w-5 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Medication Adherence Reminders</h4>
                <p className="text-xs text-slate-500">Receive alerts when scheduled medication is missed or unacknowledged</p>
              </div>
              <input
                type="checkbox"
                checked={medicineAlerts}
                onChange={(e) => setMedicineAlerts(e.target.checked)}
                className="h-5 w-5 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div>
                <h4 className="text-sm font-bold text-red-900">Emergency SOS Immediate Notifications</h4>
                <p className="text-xs text-red-700">Immediate high-priority alert when emergency panic button is triggered</p>
              </div>
              <input
                type="checkbox"
                checked={sosAlerts}
                onChange={(e) => setSosAlerts(e.target.checked)}
                className="h-5 w-5 text-red-600 rounded focus:ring-red-500 cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* PWA & Connectivity Info */}
        <Card title="Progressive Web App (PWA) & Offline Info">
          <div className="space-y-3 text-xs text-slate-600">
            <p className="leading-relaxed">
              LovelyHome can be installed as an application on supported mobile and desktop devices.
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium">
              ⚠️ <strong>Offline Capability Notice:</strong> Static screens and app assets remain available offline, but live health records, caregiver alerts, SOS emergency signals, and database synchronization strictly require an internet connection.
            </div>
          </div>
        </Card>

        {/* Universal Safety Notice */}
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-500 leading-relaxed space-y-1">
          <p className="font-semibold text-slate-700">Safety & Medical Disclaimer:</p>
          <p>
            LovelyHome is a wellness and safety support tool. It does not diagnose medical conditions, prescribe medicines, or replace professional medical care. For emergencies, contact appropriate emergency or healthcare services.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" className="flex items-center gap-2">
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
