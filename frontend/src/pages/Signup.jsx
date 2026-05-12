import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Member' });
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await signup(form.name, form.email, form.password, form.role); toast.success('Account created!'); navigate('/dashboard'); }
    catch (err) { toast.error(err.response?.data?.message || 'Signup failed'); }
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
          <h1 className="font-display text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-slate-500 text-sm mb-6">Start managing your team's work</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Full name</label><input type="text" className="input" placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><label className="label">Email</label><input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
            <div><label className="label">Password</label><input type="password" className="input" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required /></div>
            <div><label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">First user automatically becomes Admin.</p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create account'}
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm mt-6">Already have an account? <Link to="/login" className="text-[#0ea5e9] font-medium">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}