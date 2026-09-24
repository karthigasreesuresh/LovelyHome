import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { AlertOctagon, MapPin, CheckCircle2, ShieldAlert } from 'lucide-react';

export const SosPage: React.FC = () => {
  const [sosEvents, setSosEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSos = async () => {
    try {
      const res = await api.get('/sos');
      setSosEvents(res.data.sosEvents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSos();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/sos/${id}/status`, { status });
      fetchSos();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loading label="Loading Emergency SOS Events..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Emergency SOS Response</h1>
          <p className="text-sm text-slate-500">Live emergency panic events and location coordinates</p>
        </div>
      </div>

      <div className="space-y-4">
        {sosEvents.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500 py-6 text-center">No SOS events recorded.</p>
          </Card>
        ) : (
          sosEvents.map((sos) => (
            <Card
              key={sos.id}
              className={`border-l-4 ${
                sos.status === 'TRIGGERED'
                  ? 'border-l-red-600 bg-red-50'
                  : sos.status === 'ACKNOWLEDGED'
                  ? 'border-l-amber-500 bg-amber-50'
                  : 'border-l-emerald-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertOctagon className="h-6 w-6 text-red-600 animate-pulse" />
                    <h3 className="font-bold text-slate-900 text-lg">
                      SOS Triggered by {sos.elder?.name || 'Elder'}
                    </h3>
                    <Badge
                      size="lg"
                      variant={
                        sos.status === 'TRIGGERED'
                          ? 'danger'
                          : sos.status === 'ACKNOWLEDGED'
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {sos.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-slate-700">
                    <p className="flex items-center gap-1 font-medium">
                      <MapPin className="h-4 w-4 text-red-500" />
                      Location: {sos.address || 'GPS Location Attached'}
                    </p>
                    {sos.latitude && sos.longitude && (
                      <p className="text-slate-500 pl-5">
                        Coordinates: Latitude {sos.latitude}, Longitude {sos.longitude}
                      </p>
                    )}
                    <p className="text-slate-400 pl-5">
                      Triggered At: {new Date(sos.triggeredAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {sos.status === 'TRIGGERED' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleUpdateStatus(sos.id, 'ACKNOWLEDGED')}
                    >
                      Acknowledge Emergency
                    </Button>
                  )}
                  {sos.status !== 'RESOLVED' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleUpdateStatus(sos.id, 'RESOLVED')}
                    >
                      Mark Resolved
                    </Button>
                  )}
                  {sos.status === 'RESOLVED' && (
                    <Badge variant="success" size="lg" className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Resolved
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
