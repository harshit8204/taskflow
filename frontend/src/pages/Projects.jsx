import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, AlertTriangle, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899'];

function Modal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', description:'', deadline:'', color:'#0ea5e9' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const r = await api.post('/projects', form); toast.success('Project created!'); onCreated(r.data); onClose(); }
    catch (err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="glass-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5"><h2 className="font-display font-bold text-white text-lg">New Project</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
          <div><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
          <div><label className="label">Deadline</label><input type="date" className="input" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} /></div>
          <div><label className="label">Color</label><div className="flex gap-2">{COLORS.map(c=><button key={c} type="button" onClick={()=>setForm({...form,color:c})} className={`w-7 h-7 rounded-full border-2 ${form.color===c?'border-white':'border-transparent'}`} style={{backgroundColor:c}} />)}</div></div>
          <div className="flex gap-2"><button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button><button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading?<Loader2 size={16} className="animate-spin"/>:'Create'}</button></div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  useEffect(() => { api.get('/projects').then(r=>setProjects(r.data)).finally(()=>setLoading(false)); }, []);
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0ea5e9]" size={28} /></div>;
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {showModal && <Modal onClose={()=>setShowModal(false)} onCreated={p=>setProjects(prev=>[p,...prev])} />}
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="font-display text-2xl font-bold text-white">Projects</h1><p className="text-slate-500 text-sm mt-1">{projects.length} projects</p></div>
        {user?.role==='Admin' && <button onClick={()=>setShowModal(true)} className="btn-primary"><Plus size={16}/>New Project</button>}
      </div>
      {projects.length===0 ? <div className="glass-card p-16 text-center"><FolderKanban size={48} className="mx-auto mb-3 text-slate-700"/><p className="text-slate-400">No projects yet</p></div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const prog = p.taskCount>0?Math.round((p.completedCount/p.taskCount)*100):0;
            return (
              <Link key={p._id} to={`/projects/${p._id}`}>
                <div className="glass-card p-5 hover:border-[#0ea5e9]/30 transition-all cursor-pointer h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-2"><div className="w-4 h-4 rounded-full" style={{backgroundColor:p.color||'#6366f1'}}/><h3 className="font-medium text-slate-200 text-sm truncate">{p.name}</h3></div>
                  {p.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{p.description}</p>}
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{p.completedCount}/{p.taskCount} tasks</span><span>{prog}%</span></div>
                    <div className="h-1.5 bg-[#1a2030] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${prog}%`,backgroundColor:p.color||'#6366f1'}}/></div>
                    {p.overdueCount>0 && <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><AlertTriangle size={11}/>{p.overdueCount} overdue</p>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}