import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Loading } from '../../components/Loading';
import { Alert as AlertComponent } from '../../components/Alert';
import { HeartPulse, Calendar, Smile, AlertTriangle, Activity, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const CheckInsPage: React.FC = () => {
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        const res = await api.get('/checkins');
        setCheckIns(res.data.checkIns);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCheckIns();
  }, []);

  if (loading) return <Loading label="Loading Daily Wellness History & Analytics..." />;

  // Transform check-ins for Recharts visualization
  // Numeric mapping for chart visualization: NORMAL = 1, ATTENTION = 2, URGENT = 3
  const chartData = [...checkIns]
    .reverse()
    .slice(-14)
    .map((ci) => {
      const dateStr = new Date(ci.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      let numericVal = 1;
      if (ci.status === 'ATTENTION') numericVal = 2;
      if (ci.status === 'URGENT') numericVal = 3;

      return {
        date: dateStr,
        concernValue: numericVal,
        status: ci.status,
        mood: ci.mood || 'Good',
        notes: ci.notes || 'Routine check-in',
      };
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Wellness Check-in History</h1>
        <p className="text-sm text-slate-500">
          Historical overview of elder self-reported daily wellness, mood indicators, and concern levels.
        </p>
      </div>

      <AlertComponent
        type="info"
        title="Non-Clinical Safety Notice"
        message="This history records daily check-in responses and self-reported comfort. The chart below summarizes self-reported/app-generated safety signals. It is not a medical measurement."
      />

      {/* Historical Chart Section */}
      <Card title="Wellness Activity History" subtitle="Recent check-in trends and self-reported concern signals">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 mt-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <span className="font-bold text-slate-800">Signal Legend:</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Normal activity signal
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Attention signal
          </span>
          <span className="inline-flex items-center gap-1.5 text-red-700">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span> Urgent safety signal
          </span>
        </div>

        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConcern" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis
                  domain={[0, 3]}
                  ticks={[1, 2, 3]}
                  tickFormatter={(val) => (val === 3 ? 'URGENT' : val === 2 ? 'ATTENTION' : 'NORMAL')}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${item.payload.status}`,
                    'App Safety Signal',
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                  itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="concernValue" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorConcern)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-20">No trend data available yet.</p>
          )}
        </div>
      </Card>

      {/* Check-in History List / Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Check-in Logs ({checkIns.length})</h2>

        {checkIns.map((ci) => (
          <Card key={ci.id} className="border-l-4 border-l-sky-600">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{ci.elder?.name || 'Elder Member'}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(ci.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(ci.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  size="lg"
                  variant={
                    ci.status === 'NORMAL'
                      ? 'success'
                      : ci.status === 'ATTENTION'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {ci.status}
                </Badge>
                {ci.mood && (
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Smile className="h-3.5 w-3.5 text-amber-500" />
                    {ci.mood}
                  </span>
                )}
              </div>
            </div>

            {ci.notes ? (
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                "{ci.notes}"
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">No additional notes provided.</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
