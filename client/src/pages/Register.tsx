import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Heart } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'GUARDIAN' | 'ELDER'>('GUARDIAN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { token, user } = response.data;
      login(token, user);

      if (user.role === 'ELDER') {
        navigate('/elder');
      } else {
        navigate('/guardian');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex bg-sky-600 text-white p-3 rounded-2xl shadow-lg mb-3">
            <Heart className="h-8 w-8 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create LovelyHome Account</h1>
          <p className="text-sm text-slate-500 mt-1">Join as a Caregiver Guardian or Elder User</p>
        </div>

        <Card className="shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ramesh@example.com"
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('GUARDIAN')}
                  className={`p-3 rounded-lg border text-sm font-semibold transition-colors ${
                    role === 'GUARDIAN'
                      ? 'border-sky-600 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Guardian / Caregiver
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ELDER')}
                  className={`p-3 rounded-lg border text-sm font-semibold transition-colors ${
                    role === 'ELDER'
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Elder Member
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              Register Account
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-sky-600 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
