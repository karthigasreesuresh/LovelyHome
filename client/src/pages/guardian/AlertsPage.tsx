import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { Bell, CheckCircle2, ShieldAlert, Filter, AlertTriangle, Pill, HeartPulse, AlertOctagon } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterType !== 'ALL') params.type = filterType;
      if (filterSeverity !== 'ALL') params.severity = filterSeverity;
      if (filterStatus !== 'ALL') params.status = filterStatus;

      const res = await api.get('/alerts', { params });
      setAlerts(res.data.alerts);
    } catch (err) {
      console.error('Failed to fetch alerts feed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filterType, filterSeverity, filterStatus]);

  const handleResolveAlert = async (id: string) => {
    try {
      await api.post(`/alerts/${id}/resolve`);
      fetchAlerts();
    } catch (err) {
      console.error('Failed to resolve alert', err);
    }
  };

  const getAlertIcon = (type: string, severity: string) => {
    if (type === 'SOS' || severity === 'CRITICAL') {
      return <AlertOctagon className="h-5 w-5 text-red-600" />;
    } else if (type === 'MEDICINE_MISSED') {
      return <Pill className="h-5 w-5 text-amber-600" />;
    } else if (type === 'HEALTH_CONCERN') {
      return <HeartPulse className="h-5 w-5 text-rose-600" />;
    }
    return <ShieldAlert className="h-5 w-5 text-sky-600" />;
  };

  const getAlertBadgeLabel = (type: string) => {
    switch (type) {
      case 'SOS':
        return '🚨 SOS EMERGENCY';
      case 'HEALTH_CONCERN':
        return 'HEALTH CONCERN';
      case 'MEDICINE_MISSED':
        return 'MEDICINE REMINDER MISSED';
      case 'CHECKIN_MISSED':
        return 'CHECK-IN MISSED';
      default:
        return 'SAFETY ALERT';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Guardian Alert Center</h1>
          <p className="text-sm text-slate-500">
            Real-time safety signals from check-ins, medication adherence, and emergency SOS triggers
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1 text-slate-800 font-bold">
            <Filter className="h-4 w-4" /> Filters:
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span>Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
            >
              <option value="ALL">All Types</option>
              <option value="HEALTH_CONCERN">Health Concern</option>
              <option value="MEDICINE_MISSED">Medicine Missed</option>
              <option value="CHECKIN_MISSED">Check-in Missed</option>
              <option value="SOS">SOS Emergency</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <span>Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNREAD">Unread / Active</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Alerts Feed */}
      {loading ? (
        <Loading label="Filtering safety alerts..." />
      ) : alerts.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500 py-8 text-center font-medium">
            No alerts match the selected filter criteria.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`border-l-4 ${
                alert.severity === 'CRITICAL' || alert.type === 'SOS'
                  ? 'border-l-red-600 bg-red-50/40'
                  : alert.severity === 'HIGH'
                  ? 'border-l-amber-500 bg-amber-50/30'
                  : 'border-l-sky-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getAlertIcon(alert.type, alert.severity)}
                    <h3 className="font-bold text-slate-900 text-base">{alert.title}</h3>
                    <Badge
                      variant={
                        alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
                          ? 'danger'
                          : alert.severity === 'MEDIUM'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {getAlertBadgeLabel(alert.type)} ({alert.severity})
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{alert.message}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Elder: <span className="font-bold text-slate-700">{alert.elder?.name}</span> | Logged: {new Date(alert.createdAt).toLocaleString()}
                    {alert.resolvedAt && (
                      <span className="text-emerald-600 font-semibold ml-2">
                        • Resolved: {new Date(alert.resolvedAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {alert.status !== 'RESOLVED' ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      Resolve Alert
                    </Button>
                  ) : (
                    <Badge variant="success" size="lg" className="flex items-center gap-1 font-bold">
                      <CheckCircle2 className="h-4 w-4" /> Resolved
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
