import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Loader2, Calendar, User, AlertTriangle, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

const priColors = { Critical:'bg-red-500/15 text-red-400 border-red-500/20',High:'bg-orange-500/15 text-orange-400 border-orange-500/20',Medium:'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',Low:'bg-slate-500/15 text-slate-400 border-slate-500/20' };
const statusColors = { 'Todo':'bg-slate-500/15 text-slate-400','In Progress':'bg-blue-500/15 text-blue-400','In Review':'bg-purple-500/15 text-purple-400','Done':'bg-green-500/15 text-green-400' };

function TaskModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ title:'', description:'', status:'Todo', priority:'Medium', project:'', assignedTo:'', dueDate:'' });
  const [projects, setProjects] = useState([]); const [loading, setLoading] = useState(false);
  useEffect(()=>{ api.get('/projects').then(r=>setProjects(r.data)); },[]);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const r = await api.post('/tasks', {...form, assignedTo:form.assignedTo||null, dueDate:form.dueDate||null}); toast.success('Task created!'); onSaved(r.data); onClose(); }
    catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="glass-card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5"><h2 className="font-display font-bold text-white text-lg">New Task</h2><button onClick={onClose} className="text-slate-400"><X size={18}/></button></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></div>
          <div><label className="label">Project *</label><select className="input" value={form.project} onChange={e=>setForm({...form,project:e.target.value})} required><option value="">Select project...</option>{projects.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Status</label><select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{'Todo,In Progress,In Review,Done'.split(',').map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="label">Priority</label><select className="input" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{'Low,Medium,High,Critical'.split(',').map(p=><option key={p}>{p}</option>)}</select></div>
          </div>
          <div><label className="label">Due date</label><input type="date" className="input" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></div>
          <div className="flex gap-2"><button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button><button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading?<Loader2 size={16} className="animate-spin"/>:'Create'}</button></div>
        </form>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({ status:'', priority:'', overdue:'' });

  const fetchTasks = async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if(filters.status) p.append('status',filters.status);
    if(filters.priority) p.append('priority',filters.priority);
    if(filters.overdue) p.append('overdue','true');
    try { const r = await api.get(`/tasks?${p}`); setTasks(r.data); } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ fetchTasks(); },[filters]);

  const handleSaved = (saved) => setTasks(prev=>{ const i=prev.findIndex(t=>t._id===saved._id); if(i>=0){const u=[...prev];u[i]=saved;return u;}return [saved,...prev]; });
  const handleDelete = async (id,e) => { e.stopPropagation(); if(!confirm('Delete?'))return; try{ await api.delete(`/tasks/${id}`); setTasks(p=>p.filter(t=>t._id!==id)); toast.success('Deleted'); }catch(err){toast.error(err.response?.data?.message||'Failed');} };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {showModal && <TaskModal onClose={()=>setShowModal(false)} onSaved={handleSaved}/>}
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-2xl font-bold text-white">All Tasks</h1><p className="text-slate-500 text-sm mt-1">{tasks.length} tasks</p></div>
        <button onClick={()=>setShowModal(true)} className="btn-primary"><Plus size={16}/>New Task</button>
      </div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select className="input !w-auto text-xs py-1.5" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}><option value="">All Status</option>{'Todo,In Progress,In Review,Done'.split(',').map(s=><option key={s}>{s}</option>)}</select>
        <select className="input !w-auto text-xs py-1.5" value={filters.priority} onChange={e=>setFilters({...filters,priority:e.target.value})}><option value="">All Priority</option>{'Low,Medium,High,Critical'.split(',').map(p=><option key={p}>{p}</option>)}</select>
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer"><input type="checkbox" checked={filters.overdue==='true'} onChange={e=>setFilters({...filters,overdue:e.target.checked?'true':''})} className="accent-[#0ea5e9]"/>Overdue only</label>
        {(filters.status||filters.priority||filters.overdue)&&<button onClick={()=>setFilters({status:'',priority:'',overdue:''})} className="text-xs text-[#0ea5e9]">Clear</button>}
      </div>
      {loading ? <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-[#0ea5e9]" size={24}/></div> : tasks.length===0 ? <div className="glass-card p-16 text-center"><p className="text-slate-400">No tasks found</p></div> : (
        <div className="glass-card divide-y divide-[#1e2535]">
          {tasks.map(task=>(
            <div key={task._id} className="px-5 py-4 flex items-center gap-4 hover:bg-[#1a2030] cursor-pointer group" onClick={()=>setEditTask(task)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><p className={`text-sm font-medium truncate ${task.status==='Done'?'line-through text-slate-500':'text-slate-200'}`}>{task.title}</p>{task.isOverdue&&<AlertTriangle size={13} className="text-red-400 flex-shrink-0"/>}</div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  {task.project&&<span>{task.project.name}</span>}
                  {task.assignedTo&&<span className="flex items-center gap-1"><User size={11}/>{task.assignedTo.name}</span>}
                  {task.dueDate&&<span className={`flex items-center gap-1 ${task.isOverdue?'text-red-400':''}`}><Calendar size={11}/>{format(new Date(task.dueDate),'MMM d, yyyy')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`badge border hidden sm:inline-flex ${priColors[task.priority]}`}>{task.priority}</span>
                <span className={`badge ${statusColors[task.status]}`}>{task.status}</span>
                {user?.role==='Admin'&&<button onClick={e=>handleDelete(task._id,e)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-all"><Trash2 size={14}/></button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}