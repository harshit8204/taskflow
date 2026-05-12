import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Loader2, ChevronLeft, Trash2, Calendar, User, AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';

const COLS = ['Todo','In Progress','In Review','Done'];
const colColors = { 'Todo':'border-t-slate-500','In Progress':'border-t-blue-500','In Review':'border-t-purple-500','Done':'border-t-green-500' };
const priColors = { Critical:'bg-red-500/15 text-red-400 border-red-500/20',High:'bg-orange-500/15 text-orange-400 border-orange-500/20',Medium:'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',Low:'bg-slate-500/15 text-slate-400 border-slate-500/20' };

function TaskModal({ task, projectId, members, isAdmin, onClose, onSaved }) {
  const [form, setForm] = useState({ title:task?.title||'', description:task?.description||'', status:task?.status||'Todo', priority:task?.priority||'Medium', assignedTo:task?.assignedTo?._id||'', dueDate:task?.dueDate?task.dueDate.substring(0,10):'' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = { ...form, project: projectId, assignedTo: form.assignedTo||null, dueDate: form.dueDate||null };
      const r = task?._id ? await api.put(`/tasks/${task._id}`, payload) : await api.post('/tasks', payload);
      toast.success(task?._id?'Task updated!':'Task created!'); onSaved(r.data); onClose();
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="glass-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5"><h2 className="font-display font-bold text-white text-lg">{task?'Edit Task':'New Task'}</h2><button onClick={onClose} className="text-slate-400"><X size={18}/></button></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required disabled={!isAdmin&&task}/></div>
          <div><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} disabled={!isAdmin&&task}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Status</label><select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{COLS.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="label">Priority</label><select className="input" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} disabled={!isAdmin&&task}>{['Low','Medium','High','Critical'].map(p=><option key={p}>{p}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Assign to</label><select className="input" value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})} disabled={!isAdmin&&task}><option value="">Unassigned</option>{members.map(m=><option key={m._id} value={m._id}>{m.name}</option>)}</select></div>
            <div><label className="label">Due date</label><input type="date" className="input" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} disabled={!isAdmin&&task}/></div>
          </div>
          <div className="flex gap-2"><button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button><button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading?<Loader2 size={16} className="animate-spin"/>:task?'Update':'Create'}</button></div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams(); const navigate = useNavigate(); const { user } = useAuth();
  const [project, setProject] = useState(null); const [tasks, setTasks] = useState([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); const [editTask, setEditTask] = useState(null);
  const isAdmin = user?.role==='Admin' || project?.owner?._id===user?._id || project?.members?.find(m=>m.user?._id===user?._id)?.role==='Admin';
  const members = project ? [project.owner, ...project.members.map(m=>m.user)].filter(Boolean) : [];

  useEffect(() => {
    Promise.all([api.get(`/projects/${id}`), api.get(`/tasks?project=${id}`)])
      .then(([p,t])=>{ setProject(p.data); setTasks(t.data); })
      .catch(()=>{ toast.error('Failed to load'); navigate('/projects'); })
      .finally(()=>setLoading(false));
  }, [id]);

  const handleSaved = (saved) => setTasks(prev => { const i=prev.findIndex(t=>t._id===saved._id); if(i>=0){const u=[...prev];u[i]=saved;return u;}return [saved,...prev]; });
  const handleDeleteTask = async (taskId) => { if(!confirm('Delete task?'))return; try{ await api.delete(`/tasks/${taskId}`); setTasks(p=>p.filter(t=>t._id!==taskId)); toast.success('Deleted'); }catch(err){toast.error(err.response?.data?.message||'Failed');} };
  const handleDeleteProject = async () => { if(!confirm('Delete project and all tasks?'))return; try{ await api.delete(`/projects/${id}`); toast.success('Project deleted'); navigate('/projects'); }catch(err){toast.error(err.response?.data?.message||'Failed');} };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0ea5e9]" size={28}/></div>;
  const byStatus = COLS.reduce((a,s)=>({...a,[s]:tasks.filter(t=>t.status===s)}),{});

  return (
    <div className="p-6 lg:p-8">
      {(showModal||editTask) && <TaskModal task={editTask} projectId={id} members={members} isAdmin={isAdmin} onClose={()=>{setShowModal(false);setEditTask(null);}} onSaved={handleSaved}/>}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={()=>navigate('/projects')} className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm mb-2"><ChevronLeft size={16}/>Projects</button>
          <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full" style={{backgroundColor:project?.color||'#6366f1'}}/><h1 className="font-display text-2xl font-bold text-white">{project?.name}</h1></div>
          <div className="flex gap-4 mt-1 text-xs text-slate-600"><span>{tasks.length} tasks</span><span>{tasks.filter(t=>t.status==='Done').length} done</span>{tasks.filter(t=>t.isOverdue).length>0&&<span className="text-red-400">{tasks.filter(t=>t.isOverdue).length} overdue</span>}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setShowModal(true)} className="btn-primary"><Plus size={16}/>Add Task</button>
          {isAdmin && <button onClick={handleDeleteProject} className="btn-danger"><Trash2 size={15}/></button>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLS.map(status => (
          <div key={status} className={`glass-card border-t-2 ${colColors[status]} flex flex-col min-h-96`}>
            <div className="px-4 py-3 border-b border-[#1e2535] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300">{status}</h3>
              <span className="text-xs text-slate-600 bg-[#1a2030] px-2 py-0.5 rounded-full">{byStatus[status].length}</span>
            </div>
            <div className="flex-1 p-3 space-y-2">
              {byStatus[status].map(task => (
                <div key={task._id} className="bg-[#0f1117] p-3 rounded-lg border border-[#1e2535] hover:border-[#0ea5e9]/30 cursor-pointer group" onClick={()=>setEditTask(task)}>
                  <p className="text-sm font-medium text-slate-200 mb-2 line-clamp-2">{task.title}</p>
                  <div className="flex items-center gap-1.5 mb-2"><span className={`badge border text-[10px] ${priColors[task.priority]}`}>{task.priority}</span>{task.isOverdue&&<span className="badge bg-red-500/15 text-red-400 text-[10px]"><AlertTriangle size={9}/>Overdue</span>}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 text-xs text-slate-600">
                      {task.dueDate&&<span className={`flex items-center gap-0.5 ${task.isOverdue?'text-red-400':''}`}><Calendar size={10}/>{format(new Date(task.dueDate),'MMM d')}</span>}
                      {task.assignedTo&&<span className="flex items-center gap-0.5"><User size={10}/>{task.assignedTo.name?.split(' ')[0]}</span>}
                    </div>
                    {isAdmin&&<button onClick={e=>{e.stopPropagation();handleDeleteTask(task._id);}} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"><Trash2 size={12}/></button>}
                  </div>
                </div>
              ))}
              {byStatus[status].length===0&&<div className="text-center py-8 text-slate-700 text-sm">No tasks</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}