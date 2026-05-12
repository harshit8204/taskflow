import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader2, Crown, User } from 'lucide-react';

export default function Team() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(()=>{ api.get('/users').then(r=>setUsers(r.data)).catch(()=>toast.error('Failed')).finally(()=>setLoading(false)); },[]);
  const handleRole = async (userId, role) => {
    if(userId===user._id) return toast.error("Can't change your own role.");
    try { const r=await api.put(`/users/${userId}/role`,{role}); setUsers(p=>p.map(u=>u._id===userId?r.data:u)); toast.success('Role updated!'); }
    catch(err) { toast.error(err.response?.data?.message||'Failed'); }
  };
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0ea5e9]" size={28}/></div>;
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8"><h1 className="font-display text-2xl font-bold text-white">Team</h1><p className="text-slate-500 text-sm mt-1">{users.length} members</p></div>
      <div className="glass-card divide-y divide-[#1e2535]">
        {users.map(u=>(
          <div key={u._id} className="px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#0ea5e9]/20 border border-[#0ea5e9]/30 flex items-center justify-center text-[#0ea5e9] font-semibold flex-shrink-0">{u.name?.[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><p className="text-sm font-medium text-slate-200">{u.name}</p>{u._id===user._id&&<span className="text-[10px] text-[#0ea5e9] bg-[#0ea5e9]/10 px-1.5 py-0.5 rounded-full">You</span>}</div>
              <p className="text-xs text-slate-500">{u.email}</p>
            </div>
            <div className="flex items-center gap-3">
              {u.role==='Admin' ? <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg"><Crown size={12}/>Admin</div> : <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-500/10 border border-slate-500/20 px-2.5 py-1.5 rounded-lg"><User size={12}/>Member</div>}
              {user?.role==='Admin'&&u._id!==user._id&&<select value={u.role} onChange={e=>handleRole(u._id,e.target.value)} className="input !w-auto text-xs py-1.5"><option value="Member">Member</option><option value="Admin">Admin</option></select>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
