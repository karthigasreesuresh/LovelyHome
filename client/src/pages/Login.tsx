import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Heart, ShieldAlert } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('guardian@lovelyhome.demo');
  const [password, setPassword] = useState('Demo@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token, user);

      if (user.role === 'ELDER') {
        navigate('/elder');
      } else {
        navigate('/guardian');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoGuardian = () => {
    setEmail('guardian@lovelyhome.demo');
    setPassword('Demo@123');
  };

  const setDemoElder = () => {
    setEmail('lakshmi@lovelyhome.demo');
    setPassword('Demo@123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex bg-sky-600 text-white p-3 rounded-2xl shadow-lg mb-3">
            <Heart className="h-8 w-8 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to LovelyHome</h1>
          <p className="text-sm text-slate-500 mt-1">AI-Powered Elderly Wellness & Safety Companion</p>
        </div>

        <Card className="shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="guardian@lovelyhome.demo"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              Sign In
            </Button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 p-3 rounded-lg text-xs">
            <div className="flex items-center gap-1 text-slate-700 font-semibold mb-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span>Demo Quick-Fill Credentials:</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={setDemoGuardian}
                className="flex-1 py-1.5 px-2 bg-white border border-slate-200 rounded text-slate-700 hover:bg-sky-50 hover:border-sky-300 font-medium"
              >
                Guardian Demo
              </button>
              <button
                type="button"
                onClick={setDemoElder}
                className="flex-1 py-1.5 px-2 bg-white border border-slate-200 rounded text-slate-700 hover:bg-teal-50 hover:border-teal-300 font-medium"
              >
                Elder Demo
              </button>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-sky-600 font-semibold hover:underline">
              Create Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
