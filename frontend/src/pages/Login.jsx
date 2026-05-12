import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await login(form.email, form.password); toast.success('Welcome back!'); navigate('/dashboard'); }
    catch (err) { toast.error(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-[#0ea5e9] rounded-xl flex items-center justify-center"><Zap size={20} className="text-white" /></div>
          <span className="font-display font-bold text-2xl text-white">TaskFlow</span>
        </div>
        <div className="glass-card p-8">
          <h1 className="font-display text-2xl font-bold text-white mb-1">Sign in</h1>
          <p className="text-slate-500 text-sm mb-6">Welcome back to your workspace</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Email</label><input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
            <div><label className="label">Password</label><input type="password" className="input" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required /></div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm mt-6">Don't have an account? <Link to="/signup" className="text-[#0ea5e9] font-medium">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
}